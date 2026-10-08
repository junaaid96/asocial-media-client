import { useQuery } from "@tanstack/react-query";
import { Hash, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { PageHeader } from "../components/AppShell";
import { PostCard } from "../components/PostCard";
import { KindredSpirits, Resonating } from "../components/Rail";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState, SectionTitle } from "../components/ui/misc";
import { PageSpinner } from "../components/ui/Spinner";
import { api } from "../lib/api";
import { MOOD_KEYS, MOODS, tint } from "../lib/meta";
import { useTrendingTags } from "../lib/queries";
import type { PersonSummary, Post } from "../lib/types";

export function Explore() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [text, setText] = useState(q);

  useEffect(() => setText(q), [q]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim() !== q) setParams(text.trim() ? { q: text.trim() } : {}, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [text, q, setParams]);

  const results = useQuery({
    queryKey: ["posts", "search", q],
    queryFn: () => api<{ people: PersonSummary[]; posts: Post[] }>("/search", { query: { q } }),
    enabled: q.length >= 2,
  });

  return (
    <div>
      <PageHeader title="Explore" subtitle="Find kindred spirits and words that feel familiar." />
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search people, thoughts, feelings…"
          aria-label="Search"
          className="field h-12 rounded-full pl-12 text-base"
          autoFocus
        />
      </div>

      {q.length >= 2 ? (
        results.isPending ? (
          <PageSpinner />
        ) : results.data && (results.data.people.length || results.data.posts.length) ? (
          <div className="space-y-6">
            {results.data.people.length ? (
              <section className="card p-4">
                <SectionTitle>People</SectionTitle>
                <ul className="divide-y divide-line">
                  {results.data.people.map((person) => (
                    <li key={person.username} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Link to={`/u/${person.username}`}>
                        <Avatar user={person} showBattery />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/u/${person.username}`} className="font-semibold hover:underline">
                          {person.displayName}
                        </Link>
                        <p className="truncate text-sm text-muted">{person.bio || `@${person.username}`}</p>
                      </div>
                      <Link to={`/u/${person.username}`} className="text-sm font-medium text-accent hover:underline">
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {results.data.posts.length ? (
              <section className="space-y-4">
                <SectionTitle>Posts</SectionTitle>
                {results.data.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </section>
            ) : null}
          </div>
        ) : (
          <div className="card">
            <EmptyState icon="🔍" title="Nothing found">
              No one has written about “{q}” yet. Maybe you'll be the first.
            </EmptyState>
          </div>
        )
      ) : (
        <div className="space-y-6">
          <TrendingTags />
          <section>
            <SectionTitle>Browse by mood</SectionTitle>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MOOD_KEYS.map((mood) => (
                <li key={mood}>
                  <Link
                    to={`/?mood=${mood}`}
                    className="flex h-24 flex-col justify-between rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
                    style={{ background: tint(MOODS[mood].color, 16), color: MOODS[mood].color }}
                  >
                    <span className="text-2xl" aria-hidden>
                      {MOODS[mood].emoji}
                    </span>
                    <span className="font-semibold">{MOODS[mood].label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <div className="space-y-4 xl:hidden">
            <KindredSpirits />
            <Resonating />
          </div>
        </div>
      )}
    </div>
  );
}


function TrendingTags() {
  const tags = useTrendingTags();
  if (!tags.data?.length) return null;
  return (
    <section>
      <SectionTitle>Gently trending</SectionTitle>
      <ul className="flex flex-wrap gap-2">
        {tags.data.map(({ tag, posts }) => (
          <li key={tag}>
            <Link
              to={`/tag/${tag}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium ring-1 ring-line transition-colors hover:bg-accent-soft hover:text-accent-strong"
            >
              <Hash className="size-3.5 text-accent" aria-hidden />
              {tag}
              <span className="text-xs font-normal text-muted">{posts}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
