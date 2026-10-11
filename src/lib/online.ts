import type { Conversation } from "./types";

type Presence = Record<string, { online: boolean; lastSeenAt: string | null }>;

/**
 * Chat contacts who are online right now: people the user has a conversation with and can still
 * message (blocked/suspended/closed DMs are left out). Live Ably presence wins over the API snapshot.
 */
export function onlineContacts(conversations: Conversation[], presence: Presence): Conversation[] {
  const seen = new Set<string>();
  return conversations.filter((c) => {
    if (!c.canMessage || seen.has(c.other.username)) return false;
    const live = presence[c.other.username];
    const online = live ? live.online : !!c.other.online;
    if (online) seen.add(c.other.username);
    return online;
  });
}
