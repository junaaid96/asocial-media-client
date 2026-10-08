import { useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_URL, tokenStore } from "./api";
import { useAuth } from "./auth";
import { type MessageCache, receiveMessage } from "./chat";
import { keys } from "./queries";
import type { Message } from "./types";

// WebSockets need a long-running server. Where the API runs serverless (e.g. Vercel) the socket
// simply never connects, `status` stays "offline" and the chat screens fall back to polling.
export const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? `${API_URL.replace(/^http/, "ws")}/ws`;

type Status = "connecting" | "open" | "offline";

type ServerEvent =
  | { type: "ready"; userId: string }
  | { type: "message"; conversationId: string; message: Message }
  | { type: "read"; conversationId: string; readerUsername: string; readAt: string }
  | { type: "typing"; conversationId: string; username: string; typing: boolean }
  | { type: "presence"; username: string; online: boolean; lastSeenAt: string | null }
  | { type: "pong" };

interface RealtimeValue {
  status: Status;
  presence: Record<string, { online: boolean; lastSeenAt: string | null }>;
  typing: Record<string, number>;
  sendTyping: (conversationId: string, typing: boolean) => void;
}

const RealtimeContext = createContext<RealtimeValue>({ status: "offline", presence: {}, typing: {}, sendTyping: () => undefined });

const TYPING_TTL = 6_000;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("offline");
  const [presence, setPresence] = useState<RealtimeValue["presence"]>({});
  const [typing, setTyping] = useState<Record<string, number>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const username = me?.username;

  useEffect(() => {
    if (!username || typeof WebSocket === "undefined") return;
    let stopped = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    const handle = (event: ServerEvent) => {
      switch (event.type) {
        case "ready":
          attempt = 0;
          setStatus("open");
          // Catch up on anything that happened while we were away.
          void queryClient.invalidateQueries({ queryKey: keys.conversations });
          void queryClient.invalidateQueries({ queryKey: ["messages"] });
          void queryClient.invalidateQueries({ queryKey: ["summary"] });
          break;
        case "message":
          receiveMessage(queryClient, event.conversationId, event.message, username);
          if (event.message.sender !== username) {
            setTyping((t) => ({ ...t, [event.conversationId]: 0 }));
            void queryClient.invalidateQueries({ queryKey: ["summary"] });
          }
          break;
        case "read":
          queryClient.setQueryData<MessageCache>(keys.messages(event.conversationId), (cache) =>
            cache
              ? { ...cache, items: cache.items.map((m) => (m.sender === username && !m.readAt && !m.pending ? { ...m, readAt: event.readAt } : m)) }
              : cache,
          );
          break;
        case "typing":
          setTyping((t) => ({ ...t, [event.conversationId]: event.typing ? Date.now() + TYPING_TTL : 0 }));
          break;
        case "presence":
          setPresence((p) => ({ ...p, [event.username]: { online: event.online, lastSeenAt: event.lastSeenAt } }));
          break;
      }
    };

    const connect = () => {
      const token = tokenStore.get();
      if (stopped || !token) return;
      setStatus("connecting");
      let socket: WebSocket;
      try {
        socket = new WebSocket(WS_URL);
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
      socket.onclose = (e) => {
        if (socketRef.current === socket) socketRef.current = null;
        setStatus("offline");
        // 4401: the token was rejected; the regular session handling takes it from here.
        if (!stopped && e.code !== 4401) scheduleRetry();
      };
    };

    const scheduleRetry = () => {
      clearTimeout(retryTimer);
      // Exponential backoff with jitter: ~1s, 2s, 4s … capped at 30s.
      const delay = Math.min(30_000, 1000 * 2 ** attempt) * (0.75 + Math.random() * 0.5);
      attempt++;
      retryTimer = setTimeout(connect, delay);
    };

    const reconnectNow = () => {
      if (socketRef.current || stopped) return;
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
      setStatus("offline");
    };
  }, [username, queryClient]);

  // Expire stale typing indicators (e.g. if the "stopped typing" event never arrives).
  useEffect(() => {
    const active = Object.values(typing).some((until) => until > Date.now());
    if (!active) return;
    const timer = setInterval(() => setTyping((t) => ({ ...t })), 1500);
    return () => clearInterval(timer);
  }, [typing]);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "typing", conversationId, typing: isTyping }));
  }, []);

  const value = useMemo(() => ({ status, presence, typing, sendTyping }), [status, presence, typing, sendTyping]);
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
