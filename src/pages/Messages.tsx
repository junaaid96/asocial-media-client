import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowLeft, Flag, MoreHorizontal, RotateCw, Send, WifiOff } from "lucide-react";
import { type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ReportDialog } from "../components/ReportDialog";
import { RichEditor } from "../components/RichEditor";
import { RichText, plainText } from "../components/RichText";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Menu, MenuItem } from "../components/ui/Menu";
import { EmptyState } from "../components/ui/misc";
import { Spinner } from "../components/ui/Spinner";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { type MessageCache, loadMessages, mergeMessages, newClientId } from "../lib/chat";
import { fullDate, timeAgo } from "../lib/format";
import { keys } from "../lib/queries";
import { useIsTyping, usePresence, useRealtime } from "../lib/realtime";
import type { ChatUser, Conversation, Message, ReportTarget } from "../lib/types";

const POLL_LIST_MS = 15_000;
const POLL_THREAD_MS = 5_000;

export function Messages() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const to = params.get("to");

  // /messages?to=username opens (or creates) the conversation with that person.
  const open = useMutation({
    mutationFn: (username: string) => api<{ conversation: Conversation }>("/conversations", { method: "POST", body: { username } }),
    onSuccess: ({ conversation }) => {
      queryClient.setQueryData(["conversation", conversation.id], { conversation });
      navigate(`/messages/${conversation.id}`, { replace: true });
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setParams({}, { replace: true });
    },
  });
  const started = useRef<string | null>(null);
  useEffect(() => {
    if (to && started.current !== to) {
      started.current = to;
      open.mutate(to);
    }
  }, [to, open]);

  return (
    <div className="card flex h-[calc(100dvh-9.5rem)] min-h-[26rem] overflow-hidden lg:h-[calc(100dvh-5rem)]">
      <ConversationList activeId={id} className={clsx("w-full md:flex md:w-64 md:shrink-0 md:border-r md:border-line", id ? "hidden" : "flex")} />
      <section className={clsx("min-w-0 flex-1 flex-col", id ? "flex" : "hidden md:flex")} aria-label="Conversation">
        {id ? (
          <Thread key={id} id={id} />
        ) : (
          <div className="grid flex-1 place-items-center">
            <EmptyState icon="💬" title="Your messages">
              Pick a conversation, or start one from someone's profile.
            </EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}

function ConversationList({ activeId, className }: { activeId?: string; className?: string }) {
  const { status } = useRealtime();
  const conversations = useQuery({
    queryKey: keys.conversations,
    queryFn: () => api<{ items: Conversation[] }>("/conversations"),
    refetchInterval: status === "open" ? false : POLL_LIST_MS,
  });
  const items = conversations.data?.items ?? [];

  return (
    <nav aria-label="Conversations" className={clsx("min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
        <h1 className="font-serif text-xl font-semibold">Messages</h1>
        <ConnectionDot />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.isPending ? (
          <div className="flex justify-center py-8 text-muted">
            <Spinner className="size-5" />
          </div>
        ) : items.length ? (
          <ul className="p-1.5">
            {items.map((c) => (
              <li key={c.id}>
                <ConversationRow conversation={c} active={c.id === activeId} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-sm text-muted">
            No conversations yet. Visit someone's profile and tap <span className="font-medium text-ink-soft">Message</span> to say hello.
          </p>
        )}
      </div>
    </nav>
  );
}

function ConversationRow({ conversation: c, active }: { conversation: Conversation; active: boolean }) {
  const presence = usePresence(c.other);
  const typing = useIsTyping(c.id);
  return (
    <Link
      to={`/messages/${c.id}`}
      aria-current={active ? "page" : undefined}
      className={clsx("flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors", active ? "bg-accent-soft" : "hover:bg-surface-2")}
    >
      <PresenceAvatar user={c.other} online={presence.online} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={clsx("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.other.displayName}</span>
          {c.lastMessage ? <span className="ml-auto shrink-0 text-[11px] text-muted">{timeAgo(c.lastMessage.createdAt)}</span> : null}
        </span>
        <span className="flex items-center gap-2">
          <span className={clsx("truncate text-xs", c.unread ? "text-ink" : "text-muted")}>
            {typing ? <em className="text-accent">typing…</em> : c.lastMessage ? `${c.lastMessage.fromMe ? "You: " : ""}${plainText(c.lastMessage.body)}` : "Say hello"}
          </span>
          {c.unread ? (
            <span className="ml-auto grid min-w-5 shrink-0 place-items-center rounded-full bg-clay px-1.5 text-[11px] font-semibold text-white">
              <span className="sr-only">Unread messages: </span>
              {c.unread > 9 ? "9+" : c.unread}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}

function PresenceAvatar({ user, online, size = "sm" }: { user: ChatUser; online: boolean; size?: "sm" | "md" }) {
  return (
    <span className="relative shrink-0">
      <Avatar user={user} size={size} />
      {online ? (
        <span className="absolute right-0 bottom-0 size-3 rounded-full bg-emerald-500 ring-2 ring-surface" aria-label="Online" role="img" />
      ) : null}
    </span>
  );
}

function ConnectionDot() {
  const { status } = useRealtime();
  // Polling is the normal mode where live updates aren't available; nothing to flag.
  if (status === "polling") return null;
  if (status === "open") return <span className="size-2 rounded-full bg-emerald-500" title="Live" aria-label="Connected" role="img" />;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted" title="Live updates are paused; checking every few seconds instead">
      <WifiOff className="size-3.5" aria-hidden /> {status === "connecting" ? "Connecting…" : "Polling"}
    </span>
  );
}

function presenceLabel(online: boolean, lastSeenAt: string | null) {
  if (online) return "Active now";
  if (lastSeenAt) return `Active ${timeAgo(lastSeenAt)}`;
  return "Offline";
}

function Thread({ id }: { id: string }) {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const { status, sendTyping } = useRealtime();
  const [draft, setDraft] = useState("");
  const [report, setReport] = useState<ReportTarget | null>(null);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const preserveFrom = useRef<number | null>(null);
  const typingSent = useRef(0);
  const typingStop = useRef<ReturnType<typeof setTimeout>>(undefined);

  const conversation = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => api<{ conversation: Conversation }>(`/conversations/${id}`),
    select: (r) => r.conversation,
  });
  const messages = useQuery({
    queryKey: keys.messages(id),
    queryFn: () => loadMessages(queryClient, id),
    refetchInterval: status === "open" ? false : POLL_THREAD_MS,
  });
  const other = conversation.data?.other;
  const presence = usePresence(other);
  const typing = useIsTyping(id);
  const items = messages.data?.items ?? [];
  const lastIncoming = [...items].reverse().find((m) => m.sender !== me?.username && !m.readAt);

  // Mark as read whenever something new from them arrives while we're looking.
  useEffect(() => {
    if (!lastIncoming || document.visibilityState !== "visible") return;
    void api(`/conversations/${id}/read`, { method: "POST" }).then(() => {
      queryClient.setQueryData<{ items: Conversation[] }>(keys.conversations, (data) =>
        data ? { items: data.items.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) } : data,
      );
      queryClient.setQueryData<MessageCache>(keys.messages(id), (cache) =>
        cache ? { ...cache, items: cache.items.map((m) => (m.sender !== me?.username && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)) } : cache,
      );
      void queryClient.invalidateQueries({ queryKey: ["summary"] });
    });
  }, [lastIncoming?.id, id, me?.username, queryClient]);

  // Keep the view pinned to the newest message, but don't yank someone reading history.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (preserveFrom.current !== null) {
      el.scrollTop = el.scrollHeight - preserveFrom.current;
      preserveFrom.current = null;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [items.length, typing]);

  const loadEarlier = async () => {
    const first = items.find((m) => !m.pending);
    if (!first || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const older = await api<MessageCache>(`/conversations/${id}/messages`, { query: { before: first.id } });
      preserveFrom.current = (scroller.current?.scrollHeight ?? 0) - (scroller.current?.scrollTop ?? 0);
      queryClient.setQueryData<MessageCache>(keys.messages(id), (cache) => ({ ...mergeMessages(cache, older.items), hasMore: older.hasMore }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingEarlier(false);
    }
  };

  const deliver = async (message: Message) => {
    try {
      const res = await api<{ message: Message }>(`/conversations/${id}/messages`, { method: "POST", body: { body: message.body, clientId: message.clientId } });
      queryClient.setQueryData<MessageCache>(keys.messages(id), (cache) => mergeMessages(cache, [res.message]));
      void queryClient.invalidateQueries({ queryKey: keys.conversations });
    } catch (error) {
      queryClient.setQueryData<MessageCache>(keys.messages(id), (cache) =>
        cache ? { ...cache, items: cache.items.map((m) => (m.clientId === message.clientId ? { ...m, pending: "failed" } : m)) } : cache,
      );
      toast.error(errorMessage(error));
    }
  };

  const send = () => {
    const body = draft.trim();
    if (!body || !me) return;
    const clientId = newClientId();
    const optimistic: Message = {
      id: `local-${clientId}`,
      conversationId: id,
      sender: me.username,
      body,
      clientId,
      createdAt: new Date().toISOString(),
      readAt: null,
      pending: "sending",
    };
    queryClient.setQueryData<MessageCache>(keys.messages(id), (cache) => mergeMessages(cache, [optimistic]));
    stickToBottom.current = true;
    setDraft("");
    clearTimeout(typingStop.current);
    typingSent.current = 0;
    sendTyping(id, false);
    void deliver(optimistic);
  };

  const retry = (message: Message) => {
    queryClient.setQueryData<MessageCache>(keys.messages(id), (cache) =>
      cache ? { ...cache, items: cache.items.map((m) => (m.clientId === message.clientId ? { ...m, pending: "sending" } : m)) } : cache,
    );
    void deliver(message);
  };

  const onDraft = (value: string) => {
    setDraft(value);
    const now = Date.now();
    if (value && now - typingSent.current > 3000) {
      typingSent.current = now;
      sendTyping(id, true);
    }
    clearTimeout(typingStop.current);
    typingStop.current = setTimeout(() => {
      typingSent.current = 0;
      sendTyping(id, false);
    }, 4000);
  };
  useEffect(() => () => clearTimeout(typingStop.current), []);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  if (conversation.isError) {
    return (
      <div className="grid flex-1 place-items-center">
        <EmptyState icon="🕊️" title="Conversation not found">
          <Link to="/messages" className="text-accent hover:underline">
            Back to messages
          </Link>
        </EmptyState>
      </div>
    );
  }

  const lastMine = [...items].reverse().find((m) => m.sender === me?.username);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-line px-3 py-2.5 sm:px-4">
        <Link to="/messages" className="-ml-1 rounded-full p-2 text-muted hover:bg-surface-2 md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-5" />
        </Link>
        {other ? (
          <>
            <Link to={`/u/${other.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <PresenceAvatar user={other} online={presence.online} />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{other.displayName}</span>
                <span className="block truncate text-xs text-muted" aria-live="polite">
                  {typing ? <span className="text-accent">typing…</span> : presenceLabel(presence.online, presence.lastSeenAt)}
                </span>
              </span>
            </Link>
            <Menu label="Conversation options" trigger={<MoreHorizontal className="size-5" />}>
              {(close) => (
                <MenuItem onClick={() => (setReport({ targetType: "user", username: other.username }), close())}>
                  <Flag className="size-4" /> Report {other.displayName}
                </MenuItem>
              )}
            </Menu>
          </>
        ) : (
          <span className="flex-1" />
        )}
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5"
        role="log"
        aria-live="polite"
        aria-label={other ? `Messages with ${other.displayName}` : "Messages"}
      >
        {messages.isPending ? (
          <div className="flex justify-center py-8 text-muted">
            <Spinner className="size-5" />
          </div>
        ) : (
          <>
            {messages.data?.hasMore ? (
              <div className="mb-4 flex justify-center">
                <Button size="sm" variant="secondary" onClick={loadEarlier} loading={loadingEarlier}>
                  Load earlier messages
                </Button>
              </div>
            ) : items.length ? (
              <p className="mb-4 text-center text-xs text-muted">This is the beginning of your conversation.</p>
            ) : (
              <p className="mt-10 text-center text-sm text-muted">No messages yet. A gentle hello goes a long way.</p>
            )}
            <ol className="space-y-1.5">
              {items.map((m, i) => {
                const mine = m.sender === me?.username;
                const grouped = items[i - 1]?.sender === m.sender;
                return (
                  <li key={m.clientId ?? m.id} className={clsx("group flex items-end gap-1.5", mine ? "justify-end" : "justify-start", !grouped && i > 0 && "pt-2")}>
                    {!mine && !m.pending ? (
                      <button
                        onClick={() => setReport({ targetType: "message", messageId: m.id })}
                        className="order-2 rounded-full p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-clay"
                        aria-label="Report this message"
                        title="Report"
                      >
                        <Flag className="size-3.5" />
                      </button>
                    ) : null}
                    <div className={clsx("max-w-[80%] sm:max-w-[70%]", mine && "text-right")}>
                      <div
                        title={fullDate(m.createdAt)}
                        className={clsx(
                          "inline-block rounded-2xl px-3.5 py-2 text-left text-[15px] leading-relaxed",
                          mine ? "rounded-br-md bg-accent text-on-accent [&_a]:text-on-accent [&_code]:bg-black/15 [&_code]:text-on-accent" : "rounded-bl-md bg-surface-2 text-ink",
                          m.pending === "sending" && "opacity-70",
                          m.pending === "failed" && "ring-2 ring-clay",
                        )}
                      >
                        <RichText text={m.body} compact />
                      </div>
                      {m.pending === "failed" ? (
                        <button onClick={() => retry(m)} className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-clay hover:underline">
                          <RotateCw className="size-3" /> Not sent. Tap to retry
                        </button>
                      ) : mine && m === lastMine ? (
                        <p className="mt-0.5 text-[11px] text-muted">{m.pending ? "Sending…" : m.readAt ? `Seen ${timeAgo(m.readAt)}` : "Sent"}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
            {typing ? (
              <div className="mt-2 flex items-center gap-1 px-1" aria-label={`${other?.displayName ?? "They"} is typing`}>
                <span className="inline-flex gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-3 py-2.5">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </span>
              </div>
            ) : null}
          </>
        )}
      </div>

      {conversation.data && !conversation.data.canMessage ? (
        <p className="border-t border-line px-4 py-3 text-center text-sm text-muted">They aren't receiving messages from you right now.</p>
      ) : (
        <form
          className="flex items-end gap-2 border-t border-line px-3 py-3 sm:px-4"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <RichEditor
            label="Write a message"
            value={draft}
            onChange={onDraft}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            placeholder="Write a message…"
            wrapperClassName="min-w-0 flex-1"
            className="field max-h-40 min-h-10 resize-none py-2 [field-sizing:content]"
          />
          <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </form>
      )}
      {status === "offline" ? (
        <p className="sr-only" role="status">
          Live updates are paused. New messages are checked every few seconds.
        </p>
      ) : null}
      <ReportDialog target={report} onClose={() => setReport(null)} />
    </>
  );
}

