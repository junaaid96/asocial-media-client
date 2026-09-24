import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { Coffee, Leaf } from "lucide-react";
import { type ReactNode, useState } from "react";
import { errorMessage } from "../lib/api";
import type { Page, Post } from "../lib/types";
import { BreatheDialog } from "./BreatheDialog";
import { PostCard } from "./PostCard";
import { Button } from "./ui/Button";
import { EmptyState, PostSkeleton } from "./ui/misc";

// After this many posts we gently suggest a pause instead of scrolling forever.
const MINDFUL_PAUSE_EVERY = 20;

export function FeedList({
  query,
  empty,
}: {
  query: UseInfiniteQueryResult<InfiniteData<Page<Post>>>;
  empty: ReactNode;
}) {
  const [breathing, setBreathing] = useState(false);

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="card">
        <EmptyState icon="🍃" title="The feed drifted away">
          {errorMessage(query.error)}
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
              Try again
            </Button>
          </div>
        </EmptyState>
      </div>
    );
  }

  const posts = query.data.pages.flatMap((page) => page.items);
  if (!posts.length) return <div className="card">{empty}</div>;

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div key={post.id} className="space-y-4">
          <PostCard post={post} />
          {(index + 1) % MINDFUL_PAUSE_EVERY === 0 && index + 1 < posts.length + (query.hasNextPage ? 1 : 0) ? (
            <div className="card flex flex-col items-center gap-3 bg-accent-soft/50 px-6 py-7 text-center sm:flex-row sm:text-left">
              <Coffee className="size-8 shrink-0 text-accent" />
              <div className="flex-1">
                <p className="font-serif text-lg font-semibold">You've been reading for a while</p>
                <p className="text-sm text-muted">It's okay to step away. Everything will still be here later.</p>
              </div>
              <Button variant="soft" onClick={() => setBreathing(true)}>
                Take a breath
              </Button>
            </div>
          ) : null}
        </div>
      ))}

      <div className="flex justify-center py-6">
        {query.hasNextPage ? (
          // A deliberate button instead of infinite scroll: you choose when to read more.
          <Button variant="secondary" onClick={() => query.fetchNextPage()} loading={query.isFetchingNextPage}>
            Show a few more
          </Button>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm text-muted">
            <Leaf className="size-4 text-accent" /> You're all caught up. Go enjoy the quiet.
          </p>
        )}
      </div>
      <BreatheDialog open={breathing} onClose={() => setBreathing(false)} />
    </div>
  );
}

export function defaultEmpty(title: string, text: ReactNode, icon: ReactNode = "🌱") {
  return (
    <EmptyState icon={icon} title={title}>
      {text}
    </EmptyState>
  );
}
