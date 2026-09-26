import { type InfiniteData, type QueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./auth";
import type { DailyPrompt, Mood, Page, PersonSummary, Post, ProfileResponse } from "./types";

// Every list of posts lives under the "posts" key so a single post can be
// updated everywhere it appears.
export const keys = {
  feed: (feed: string, mood?: Mood) => ["posts", "feed", feed, mood ?? "all"] as const,
  userPosts: (username: string) => ["posts", "user", username] as const,
  bookmarks: ["posts", "bookmarks"] as const,
  resonating: ["posts", "resonating"] as const,
  search: (q: string) => ["posts", "search", q] as const,
  post: (id: string) => ["post", id] as const,
  comments: (id: string) => ["comments", id] as const,
  profile: (username: string) => ["profile", username] as const,
};

function infinitePosts(key: readonly unknown[], path: string, query: Record<string, string | undefined> = {}, enabled = true) {
  return {
    queryKey: key,
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      api<Page<Post>>(path, { query: { ...query, cursor: pageParam ?? undefined } }),
    initialPageParam: null as string | null,
    getNextPageParam: (last: Page<Post>) => last.nextCursor,
    enabled,
  };
}

export function useFeed(feed: "latest" | "following" | "prompt", mood?: Mood) {
  const { me } = useAuth();
  return useInfiniteQuery(infinitePosts(keys.feed(feed, mood), "/posts", { feed, mood }, feed !== "following" || !!me));
}

export function useUserPosts(username: string) {
  return useInfiniteQuery(infinitePosts(keys.userPosts(username), `/users/${username}/posts`));
}

export function useBookmarks() {
  return useInfiniteQuery(infinitePosts(keys.bookmarks, "/bookmarks"));
}

export function useResonating() {
  return useQuery({
    queryKey: keys.resonating,
    queryFn: () => api<{ items: Post[] }>("/posts/resonating"),
    staleTime: 5 * 60_000,
  });
}

export function usePrompt() {
  return useQuery({ queryKey: ["prompt"], queryFn: () => api<DailyPrompt>("/prompt"), staleTime: 10 * 60_000 });
}

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: () => api<{ users: number }>("/stats"), staleTime: 5 * 60_000 });
}

export function useProfile(username: string) {
  return useQuery({ queryKey: keys.profile(username), queryFn: () => api<ProfileResponse>(`/users/${username}`) });
}

export function useSuggested() {
  const { me } = useAuth();
  return useQuery({
    queryKey: ["suggested"],
    queryFn: () => api<{ items: PersonSummary[] }>("/users/suggested"),
    enabled: !!me,
    staleTime: 10 * 60_000,
  });
}

export function useSummary() {
  const { me } = useAuth();
  return useQuery({
    queryKey: ["summary"],
    queryFn: () => api<{ unread: number; letters: number }>("/notifications/summary"),
    enabled: !!me,
    // Calm, not real-time: check in once a minute while the tab is open.
    refetchInterval: 60_000,
  });
}

type PostContainer =
  | InfiniteData<Page<Post>>
  | { items: Post[] }
  | { posts: Post[]; people: unknown[] }
  | { post: Post }
  | undefined;

function mapContainer(data: PostContainer, fn: (post: Post) => Post | null): PostContainer {
  if (!data) return data;
  const mapList = (items: Post[]) => items.flatMap((p) => {
    const next = fn(p);
    return next ? [next] : [];
  });
  if ("pages" in data) return { ...data, pages: data.pages.map((page) => ({ ...page, items: mapList(page.items) })) };
  if ("posts" in data) return { ...data, posts: mapList(data.posts) };
  if ("items" in data) return { ...data, items: mapList(data.items) };
  if ("post" in data) {
    const next = fn(data.post);
    return next ? { post: next } : data;
  }
  return data;
}

export function updatePostEverywhere(client: QueryClient, post: Post) {
  const replace = (p: Post) => (p.id === post.id ? post : p);
  client.setQueriesData<PostContainer>({ queryKey: ["posts"] }, (data) => mapContainer(data, replace));
  client.setQueryData<PostContainer>(keys.post(post.id), (data) => mapContainer(data, replace));
}

export function patchPostEverywhere(client: QueryClient, id: string, patch: Partial<Post>) {
  const apply = (p: Post) => (p.id === id ? { ...p, ...patch } : p);
  client.setQueriesData<PostContainer>({ queryKey: ["posts"] }, (data) => mapContainer(data, apply));
  client.setQueryData<PostContainer>(keys.post(id), (data) => mapContainer(data, apply));
}

export function removePostEverywhere(client: QueryClient, id: string) {
  client.setQueriesData<PostContainer>({ queryKey: ["posts"] }, (data) => mapContainer(data, (p) => (p.id === id ? null : p)));
  client.removeQueries({ queryKey: keys.post(id) });
}
