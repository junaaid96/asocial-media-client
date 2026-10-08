import type { QueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { keys } from "./queries";
import type { Conversation, Message } from "./types";

export interface MessageCache {
  items: Message[];
  hasMore: boolean;
}

const byTime = (a: Message, b: Message) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

/** Merge messages into a conversation's cache, de-duplicating by id and by clientId (optimistic sends). */
export function mergeMessages(cache: MessageCache | undefined, incoming: Message[], hasMore?: boolean): MessageCache {
  const items = [...(cache?.items ?? [])];
  for (const message of incoming) {
    const index = items.findIndex((m) => m.id === message.id || (message.clientId && m.clientId === message.clientId));
    if (index >= 0) items[index] = { ...message, pending: undefined };
    else items.push(message);
  }
  const confirmed = items.filter((m) => !m.pending).sort(byTime);
  const pending = items.filter((m) => m.pending);
  return { items: [...confirmed, ...pending], hasMore: hasMore ?? cache?.hasMore ?? false };
}

/**
 * Loads a conversation: the latest page the first time, then only what's new since the last
 * confirmed message (used after reconnecting and by the polling fallback).
 */
export async function loadMessages(client: QueryClient, conversationId: string): Promise<MessageCache> {
  const cache = client.getQueryData<MessageCache>(keys.messages(conversationId));
  const lastConfirmed = cache?.items.filter((m) => !m.pending).at(-1);
  if (!lastConfirmed) return api<MessageCache>(`/conversations/${conversationId}/messages`);
  const fresh = await api<MessageCache>(`/conversations/${conversationId}/messages`, { query: { after: lastConfirmed.id, limit: "100" } });
  // Too far behind to stitch together: start over from the latest page.
  if (fresh.hasMore) return api<MessageCache>(`/conversations/${conversationId}/messages`);
  // Pick up read receipts for our own recent messages too.
  return mergeMessages(cache, fresh.items);
}

export function receiveMessage(client: QueryClient, conversationId: string, message: Message, me: string) {
  client.setQueryData<MessageCache>(keys.messages(conversationId), (cache) => (cache ? mergeMessages(cache, [message]) : cache));
  let known = false;
  client.setQueryData<{ items: Conversation[] }>(keys.conversations, (data) => {
    if (!data) return data;
    const current = data.items.find((c) => c.id === conversationId);
    if (!current) return data;
    known = true;
    const fromMe = message.sender === me;
    const updated: Conversation = {
      ...current,
      lastMessage: { body: message.body.slice(0, 160), createdAt: message.createdAt, fromMe },
      unread: fromMe ? current.unread : current.unread + 1,
      updatedAt: message.createdAt,
    };
    return { items: [updated, ...data.items.filter((c) => c.id !== conversationId)] };
  });
  if (!known) void client.invalidateQueries({ queryKey: keys.conversations });
}

export function newClientId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
