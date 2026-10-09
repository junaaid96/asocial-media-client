import { useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_URL, api, tokenStore } from "./api";
import { useAuth } from "./auth";
import { type MessageCache, markRead, mergeMessages, receiveMessage } from "./chat";
import { keys } from "./queries";
import type { Message } from "./types";

// Live chat events, in order of preference:
// 1. Ably (managed pub/sub). The API hands out short-lived, subscribe-only tokens at POST /realtime/token
//    (ably-js renews them through authCallback); no Ably key ever reaches the browser.
// 2. If Ably isn't configured on the API or can't be reached: a WebSocket at <API>/ws.
// 3. If neither works: polling (the REST API is always the source of truth).
//
// WebSocket fallback details:
// - VITE_WS_URL set to an empty string: polling only, no socket is ever opened.
// - VITE_WS_URL unset: derived from VITE_API_URL.
// - If the socket never manages to connect, we stop trying after a few attempts and keep polling.
// - Vercel closes sockets when a Function reaches its max duration; we just reconnect.
export function resolveWsUrl(apiUrl: string = API_URL, configured = import.meta.env.VITE_WS_URL as string | undefined): string | null {
  if (configured !== undefined) return configured.trim() || null;
  try {
    const url = new URL(apiUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/ws`;
    return url.toString();
  } catch {
    return null;
  }
}

export const WS_URL = resolveWsUrl();

/** Failed attempts in a row (without ever reaching "ready") before we settle for polling. */
const GIVE_UP_BEFORE_FIRST_CONNECT = 3;
/** Failed attempts in a row after a working connection dropped. */
const GIVE_UP_AFTER_DROP = 8;

/**
 * Failures are remembered per tab (sessionStorage), so reloads and route changes count toward giving up,
 * and after giving up we skip the socket on reloads for a while instead of failing again.
 */
const FAILURES_KEY = "asocial.wsFailures";
const GAVE_UP_FOR_MS = 15 * 60_000;

function readFailures(): { count: number; at: number } {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(FAILURES_KEY) ?? "null") as { count?: unknown; at?: unknown } | null;
    const count = typeof parsed?.count === "number" ? parsed.count : 0;
    const at = typeof parsed?.at === "number" ? parsed.at : 0;
    // Old failures expire, so a long-lived tab tries again eventually.
    return Date.now() - at < GAVE_UP_FOR_MS ? { count, at } : { count: 0, at: 0 };
  } catch {
    return { count: 0, at: 0 };
  }
}

function writeFailures(count: number) {
  try {
    if (count > 0) sessionStorage.setItem(FAILURES_KEY, JSON.stringify({ count, at: Date.now() }));
    else sessionStorage.removeItem(FAILURES_KEY);
  } catch {
    // storage unavailable: counting stays per page load
  }
}

const recentlyGaveUp = () => readFailures().count >= GIVE_UP_BEFORE_FIRST_CONNECT;

/** "polling": live updates are unavailable here, so the app polls instead (quietly, by design). */
type Status = "connecting" | "open" | "offline" | "polling";

type ServerEvent =
  | { type: "ready"; userId: string }
  | { type: "message"; conversationId: string; message: Message }
  | { type: "read"; conversationId: string; readerUsername: string; readAt: string }
  | { type: "typing"; conversationId: string; username: string; typing: boolean }
  | { type: "presence"; username: string; online: boolean; lastSeenAt: string | null }
  | { type: "pong" }
  // The server may have missed events for us (e.g. its listener reconnected): refetch.
  | { type: "resync" };

type Transport = "ably" | "ws" | null;

/** Turns server events into cache updates. Shared by the Ably and WebSocket transports. */
function eventHandler(
  queryClient: ReturnType<typeof useQueryClient>,
  username: string,
  setTyping: (fn: (t: Record<string, number>) => Record<string, number>) => void,
  setPresence: (fn: (p: RealtimeValue["presence"]) => RealtimeValue["presence"]) => void,
) {
  const catchUp = () => {
    void queryClient.invalidateQueries({ queryKey: keys.conversations });
    void queryClient.invalidateQueries({ queryKey: ["messages"] });
    void queryClient.invalidateQueries({ queryKey: ["summary"] });
  };
  const handle = (event: ServerEvent) => {
    switch (event.type) {
      case "resync":
        catchUp();
        break;
      case "message":
        receiveMessage(queryClient, event.conversationId, event.message, username);
        if (event.message.sender !== username) {
          setTyping((t) => ({ ...t, [event.conversationId]: 0 }));
          void queryClient.invalidateQueries({ queryKey: ["summary"] });
        }
        break;
      case "read":
        markRead(event.conversationId, event.readerUsername, event.readAt);
        queryClient.setQueryData<MessageCache>(keys.messages(event.conversationId), (cache) => (cache ? mergeMessages(cache, []) : cache));
        break;
      case "typing":
        setTyping((t) => ({ ...t, [event.conversationId]: event.typing ? Date.now() + TYPING_TTL : 0 }));
        break;
      case "presence":
        setPresence((p) => ({ ...p, [event.username]: { online: event.online, lastSeenAt: event.lastSeenAt } }));
        break;
    }
  };
  return { handle, catchUp };
}

/** What POST /realtime/token returns. */
export interface RealtimeToken {
  tokenRequest: import("ably").TokenRequest;
  channels: {
    inbox: string;
    presence: string;
    partners: { userId: string; username: string; conversationId: string; presence: string }[];
  };
}

/** How many conversation partners' presence channels one connection watches (most recent first). */
export const MAX_WATCHED_PARTNERS = 50;

/** Partners we aren't watching yet, most recent first, within the watch limit. */
export function partnersToWatch(watched: ReadonlySet<string>, partners: RealtimeToken["channels"]["partners"], limit = MAX_WATCHED_PARTNERS) {
  const room = Math.max(0, limit - watched.size);
  return partners.filter((p) => !watched.has(p.userId)).slice(0, room);
}

interface RealtimeValue {
  status: Status;
  /** Which live transport is in use, if any. */
  transport: Transport;
  presence: Record<string, { online: boolean; lastSeenAt: string | null }>;
  typing: Record<string, number>;
  sendTyping: (conversationId: string, typing: boolean) => void;
}

const RealtimeContext = createContext<RealtimeValue>({ status: "offline", transport: null, presence: {}, typing: {}, sendTyping: () => undefined });

const TYPING_TTL = 6_000;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("offline");
  const [transport, setTransport] = useState<Transport>(null);
  const [presence, setPresence] = useState<RealtimeValue["presence"]>({});
  const [typing, setTyping] = useState<Record<string, number>>({});
  const socketRef = useRef<WebSocket | null>(null);
  // The user for whom Ably turned out to be unavailable: they get the WebSocket fallback.
  const [wsFallbackFor, setWsFallbackFor] = useState<string | null>(null);
  const username = me?.username;

  // 1. Ably.
  useEffect(() => {
    if (!username) return;
    let stopped = false;
    let realtime: import("ably").Realtime | undefined;
    const { handle, catchUp } = eventHandler(queryClient, username, setTyping, setPresence);
    const watched = new Set<string>();
    const conversations = new Set<string>();
    let refreshing = false;

    const fallBack = () => {
      if (stopped) return;
      stopped = true;
      realtime?.close();
      setTransport(null);
      setWsFallbackFor(username);
    };
    const fetchToken = () => api<RealtimeToken>("/realtime/token", { method: "POST" });

    const watchPartners = (channels: RealtimeToken["channels"]) => {
      for (const p of channels.partners) conversations.add(p.conversationId);
      if (!realtime) return;
      for (const partner of partnersToWatch(watched, channels.partners)) {
        watched.add(partner.userId);
        const channel = realtime.channels.get(partner.presence);
        const setOnline = (online: boolean) =>
          setPresence((p) => ({ ...p, [partner.username]: { online, lastSeenAt: online ? null : new Date().toISOString() } }));
        // Only Ably presence turns someone online here; if they're absent we keep what the API said
        // (they may be using the app over polling).
        void channel.presence.subscribe((member) => {
          if (member.action === "leave") {
            void channel.presence.get().then((members) => members.length === 0 && setOnline(false), () => undefined);
          } else {
            setOnline(true);
          }
        }).catch(() => undefined);
        void channel.presence.get().then((members) => members.length > 0 && setOnline(true), () => undefined);
      }
    };

    // A message in a conversation we didn't know about: fetch a fresh token so we can see that person's presence.
    const refreshCapabilities = () => {
      if (refreshing || !realtime) return;
      refreshing = true;
      void realtime.auth.authorize().catch(() => undefined).finally(() => (refreshing = false));
    };

    void (async () => {
      setStatus("connecting");
      let first: RealtimeToken;
      let Ably: typeof import("ably");
      try {
        [first, Ably] = await Promise.all([fetchToken(), import("ably")]);
      } catch {
        // Not configured on this API (503), an older API (404), or offline: use the fallback.
        return fallBack();
      }
      if (stopped) return;
      let pending: RealtimeToken | null = first;
      let everConnected = false;
      realtime = new Ably.Realtime({
        authCallback: (_params, callback) => {
          const use = (token: RealtimeToken) => {
            watchPartners(token.channels);
            callback(null, token.tokenRequest);
          };
          if (pending) {
            const token = pending;
            pending = null;
            return use(token);
          }
          fetchToken().then(use, (error: unknown) => callback(error instanceof Error ? error.message : String(error), null));
        },
        closeOnUnload: true,
      });
      realtime.connection.on((change) => {
        if (stopped) return;
        switch (change.current) {
          case "connected":
            everConnected = true;
            setTransport("ably");
            setStatus("open");
            catchUp();
            break;
          case "connecting":
          case "disconnected":
            setStatus(everConnected ? "offline" : "connecting");
            break;
          case "suspended":
          case "failed":
            // Never got through (blocked network, bad config): try the WebSocket fallback.
            // After a working connection, Ably keeps retrying on its own; poll meanwhile.
            if (!everConnected) return fallBack();
            setStatus("offline");
            break;
        }
      });
      const inbox = realtime.channels.get(first.channels.inbox);
      void inbox
        .subscribe((message) => {
          const event = message.data as ServerEvent;
          if (event?.type === "message" && !conversations.has(event.conversationId)) {
            conversations.add(event.conversationId);
            refreshCapabilities();
          }
          if (event?.type) handle(event);
        })
        .catch(() => undefined);
      void realtime.channels.get(first.channels.presence).presence.enter().catch(() => undefined);
    })();

    return () => {
      stopped = true;
      realtime?.close();
      setTransport(null);
      setStatus("offline");
    };
  }, [username, queryClient]);

  // 2. WebSocket fallback, only when Ably is unavailable.
  useEffect(() => {
    const url = WS_URL;
    if (!username || wsFallbackFor !== username) return;
    if (!url || typeof WebSocket === "undefined" || recentlyGaveUp()) {
      setStatus("polling");
      return;
    }
    let stopped = false;
    let gaveUp = false;
    let everReady = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    const { handle: handleShared, catchUp } = eventHandler(queryClient, username, setTyping, setPresence);
    const handle = (event: ServerEvent) => {
      if (event.type === "ready") {
        attempt = 0;
        everReady = true;
        writeFailures(0);
        setTransport("ws");
        setStatus("open");
        catchUp();
        return;
      }
      handleShared(event);
    };

    const connect = () => {
      const token = tokenStore.get();
      if (stopped || gaveUp || !token) return;
      setStatus("connecting");
      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
      } catch {
        return scheduleRetry();
      }
      socketRef.current = socket;
      socket.onopen = () => socket.send(JSON.stringify({ type: "auth", token }));
      socket.onmessage = (e) => {
        try {
          handle(JSON.parse(String(e.data)) as ServerEvent);
        } catch {
          // ignore malformed frames
        }
      };
      let opened = false;
      socket.addEventListener("open", () => (opened = true));
      socket.onclose = (e) => {
        if (socketRef.current === socket) socketRef.current = null;
        setStatus("offline");
        // 4401: the token was rejected; the regular session handling takes it from here.
        if (stopped || e.code === 4401) return;
        // A healthy socket that the host closed (e.g. the Function hit its max duration):
        // reconnect promptly instead of counting it as a failure.
        if (everReady && opened && attempt === 0) {
          clearTimeout(retryTimer);
          retryTimer = setTimeout(connect, 500 + Math.random() * 1000);
          attempt = 1;
          return;
        }
        scheduleRetry();
      };
    };

    const scheduleRetry = () => {
      clearTimeout(retryTimer);
      // Before the first successful connection, failures count across reloads in this tab.
      const failures = everReady ? attempt + 1 : readFailures().count + 1;
      if (!everReady) writeFailures(failures);
      if (failures >= (everReady ? GIVE_UP_AFTER_DROP : GIVE_UP_BEFORE_FIRST_CONNECT)) {
        // Live updates aren't reachable from here; poll quietly instead of retrying forever.
        gaveUp = true;
        setStatus("polling");
        return;
      }
      // Exponential backoff with jitter: ~1s, 2s, 4s … capped at 30s.
      const delay = Math.min(30_000, 1000 * 2 ** attempt) * (0.75 + Math.random() * 0.5);
      attempt++;
      retryTimer = setTimeout(connect, delay);
    };

    const reconnectNow = () => {
      if (socketRef.current || stopped || gaveUp) return;
      attempt = 0;
      clearTimeout(retryTimer);
      connect();
    };
    const onVisible = () => document.visibilityState === "visible" && reconnectNow();

    connect();
    pingTimer = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: "ping" }));
    }, 25_000);
    window.addEventListener("online", reconnectNow);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      clearInterval(pingTimer);
      window.removeEventListener("online", reconnectNow);
      document.removeEventListener("visibilitychange", onVisible);
      socketRef.current?.close(1000, "bye");
      socketRef.current = null;
      setTransport(null);
      setStatus("offline");
    };
  }, [username, queryClient, wsFallbackFor]);

  // Expire stale typing indicators (e.g. if the "stopped typing" event never arrives).
  useEffect(() => {
    const active = Object.values(typing).some((until) => until > Date.now());
    if (!active) return;
    const timer = setInterval(() => setTyping((t) => ({ ...t })), 1500);
    return () => clearInterval(timer);
  }, [typing]);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "typing", conversationId, typing: isTyping }));
      return;
    }
    // Ably tokens are subscribe-only, so typing goes through the API, which relays it.
    void api(`/conversations/${conversationId}/typing`, { method: "POST", body: { typing: isTyping } }).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ status, transport, presence, typing, sendTyping }), [status, transport, presence, typing, sendTyping]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function useIsTyping(conversationId: string | undefined) {
  const { typing } = useRealtime();
  return !!conversationId && (typing[conversationId] ?? 0) > Date.now();
}

/** Live presence when we've heard about it over the socket, otherwise what the API said. */
export function usePresence<T extends { username: string; online?: boolean; lastSeenAt?: string | null }>(user: T | null | undefined) {
  const { presence } = useRealtime();
  if (!user) return { online: false, lastSeenAt: null };
  return presence[user.username] ?? { online: !!user.online, lastSeenAt: user.lastSeenAt ?? null };
}
