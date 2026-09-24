export type Battery = "full" | "half" | "low" | "recharging";
export type Mood = "calm" | "reflective" | "joyful" | "grateful" | "tired" | "anxious" | "curious" | "melancholy";
export type ReactionKind = "felt" | "hug" | "insight" | "relate";
export type LettersFrom = "everyone" | "following" | "nobody";
export type Pace = "breeze" | "afternoon" | "overnight";

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
}

export interface Me extends Profile {
  id: string;
  email: string;
  showCounts: boolean;
}

export interface ProfileResponse {
  user: Profile;
  isMe: boolean;
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
  type: "reaction" | "comment" | "follow" | "letter";
  createdAt: string;
  read: boolean;
  actor: PublicUser | null;
  postId: string | null;
  postExcerpt: string | null;
  letterId: string | null;
  reaction: ReactionKind | null;
}

export interface DailyPrompt {
  date: string;
  text: string;
  answers: number;
}
