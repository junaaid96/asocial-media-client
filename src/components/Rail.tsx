import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../lib/auth";
import { usePrompt, useResonating, useSuggested } from "../lib/queries";
import { FollowButton } from "./FollowButton";
import { plainText } from "./RichText";
import { Avatar } from "./ui/Avatar";
import { MoodChip, SectionTitle } from "./ui/misc";

export function SearchBox({ autoFocus }: { autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) navigate(`/explore?q=${encodeURIComponent(q.trim())}`);
      }}
      className="relative"
    >
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search people and posts"
        aria-label="Search people and posts"
        autoFocus={autoFocus}
        className="field rounded-full pl-10"
      />
    </form>
  );
}

export function PromptCard() {
  const { me } = useAuth();
  const prompt = usePrompt();
  if (!prompt.data) return null;
  return (
    <section className="card relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent/10 blur-2xl" />
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-accent uppercase">
        <Sparkles className="size-3.5" /> Today's prompt
      </p>
      <p className="mt-2.5 font-serif text-lg leading-snug">{prompt.data.text}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <Link to={`/prompt/${prompt.data.date}`} className="text-muted hover:text-ink">
          {prompt.data.answers ? `${prompt.data.answers} ${prompt.data.answers === 1 ? "answer" : "answers"}` : "No answers yet"}
        </Link>
        <Link to={me ? "/?answer=1" : "/join"} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
          Write yours <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

export function Resonating() {
  const resonating = useResonating();
  const items = resonating.data?.items ?? [];
  if (!items.length) return null;
  return (
    <section className="card p-5">
      <SectionTitle>Quietly resonating</SectionTitle>
      <ol className="space-y-4">
        {items.map((post) => (
          <li key={post.id}>
            <Link to={`/post/${post.id}`} className="group block">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Avatar user={post.author} size="xs" />
                <span className="truncate">{post.author?.displayName ?? "A quiet soul"}</span>
                {post.mood ? <MoodChip mood={post.mood} /> : null}
              </div>
              <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-soft group-hover:text-ink">
                {plainText(post.body) || "Shared a photo"}
              </p>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted">Chosen by gentle reactions. No numbers, no leaderboard.</p>
    </section>
  );
}

export function KindredSpirits() {
  const suggested = useSuggested();
  const items = suggested.data?.items ?? [];
  if (!items.length) return null;
  return (
    <section className="card p-5">
      <SectionTitle>Kindred spirits</SectionTitle>
      <ul className="space-y-3.5">
        {items.map((person) => (
          <li key={person.username} className="flex items-center gap-3">
            <Link to={`/u/${person.username}`}>
              <Avatar user={person} size="sm" showBattery />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/u/${person.username}`} className="block truncate text-sm font-semibold hover:underline">
                {person.displayName}
              </Link>
              <p className="truncate text-xs text-muted">{person.sharedMoods ? "Writes in moods like yours" : `@${person.username}`}</p>
            </div>
            <FollowButton username={person.username} following={false} size="sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}
