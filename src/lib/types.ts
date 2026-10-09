export type Battery = "full" | "half" | "low" | "recharging";
export type Mood = "calm" | "reflective" | "joyful" | "grateful" | "tired" | "anxious" | "curious" | "melancholy";
export type ReactionKind = "felt" | "hug" | "insight" | "relate";
export type LettersFrom = "everyone" | "following" | "nobody";
export type Pace = "breeze" | "afternoon" | "overnight";
export type Visibility = "public" | "followers" | "private";
export type Role = "user" | "admin";

export interface PublicUser {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  battery: Battery;
}

export interface PersonSummary extends PublicUser {
  bio: string;
  sharedMoods?: boolean;
}

export interface Profile extends PublicUser {
  bio: string;
  institute: string;
  location: string;
  lettersFrom: LettersFrom;
  joinedAt: string;
  online?: boolean;
  lastSeenAt?: string | null;
}

export interface Me extends Profile {
  id: string;
  email: string;
  showCounts: boolean;
  role: Role;
  suspended: boolean;
  dailyLimitMinutes: number | null;
  /** Older servers don't send this. */
  sessionReminderMinutes?: number | null;
}

export interface ProfileResponse {
  user: Profile;
  isMe: boolean;
  canMessage: boolean;
  suspended: boolean;
  isFollowing: boolean;
  followsMe: boolean;
  stats: { posts: number; followers: number | null; following: number | null };
}

export interface Post {
  id: string;
  body: string;
  imageUrl: string | null;
  mood: Mood | null;
  contentWarning: string | null;
  isAnonymous: boolean;
  promptDate: string | null;
  prompt: { date: string; text: string } | null;
  visibility: Visibility;
  hiddenByModerators: boolean;
  createdAt: string;
  editedAt: string | null;
  author: PublicUser | null;
  isMine: boolean;
  myReaction: ReactionKind | null;
  bookmarked: boolean;
  commentCount: number;
  reactionCounts: Partial<Record<ReactionKind, number>> | null;
  reactionTotal: number | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  isMine: boolean;
  isOriginalPoster: boolean;
  author: PublicUser | null;
  myReaction: ReactionKind | null;
  reactionCounts: Partial<Record<ReactionKind, number>> | null;
  reactionTotal: number | null;
}

export interface Letter {
  id: string;
  direction: "sent" | "received";
  from: PublicUser;
  to: PublicUser;
  body: string;
  replyTo: { id: string; excerpt: string | null } | null;
  sentAt: string;
  deliverAt: string;
  arrived: boolean;
  readAt: string | null;
}

export interface Notification {
  id: string;
  type: "reaction" | "comment" | "follow" | "letter" | "mention" | "comment_reaction" | "report_update" | "moderation";
  createdAt: string;
  read: boolean;
  actor: PublicUser | null;
  postId: string | null;
  postExcerpt: string | null;
  letterId: string | null;
  commentId: string | null;
  commentExcerpt: string | null;
  reaction: ReactionKind | null;
  /** Text of system notices (report outcomes, moderation). */
  body?: string | null;
}

export interface DailyPrompt {
  date: string;
  text: string;
  answers: number;
}

export interface ChatUser extends PublicUser {
  online: boolean;
  lastSeenAt: string | null;
}

export interface Conversation {
  id: string;
  other: ChatUser;
  lastMessage: { body: string; createdAt: string; fromMe: boolean } | null;
  unread: number;
  canMessage: boolean;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: string;
  body: string;
  clientId: string | null;
  createdAt: string;
  readAt: string | null;
  /** Client-only: still sending, or failed to send. */
  pending?: "sending" | "failed";
}

export type ReportReason = "spam" | "harassment" | "hate" | "self_harm" | "sexual" | "violence" | "misinformation" | "impersonation" | "other";

export type ReportTarget =
  | { targetType: "user"; username: string }
  | { targetType: "post"; postId: string }
  | { targetType: "message"; messageId: string };
