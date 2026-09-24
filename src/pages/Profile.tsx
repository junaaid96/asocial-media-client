import { useQuery } from "@tanstack/react-query";
import { addDays, format, startOfDay, subDays } from "date-fns";
import { Bookmark, CalendarDays, Feather, GraduationCap, MapPin, Settings } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useShell } from "../components/AppShell";
import { FeedList, defaultEmpty } from "../components/FeedList";
import { FollowButton } from "../components/FollowButton";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { BatteryBadge, EmptyState, SectionTitle } from "../components/ui/misc";
import { PageSpinner } from "../components/ui/Spinner";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { MOODS } from "../lib/meta";
import { useProfile, useUserPosts } from "../lib/queries";
import type { Mood, PersonSummary } from "../lib/types";

function hue(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function Profile() {
  const { username = "" } = useParams();
  const { me } = useAuth();
  const { openLetter } = useShell();
  const profile = useProfile(username);
  const posts = useUserPosts(username);
  const [connections, setConnections] = useState<"followers" | "following" | null>(null);

  if (profile.isPending) return <PageSpinner />;
  if (profile.isError) {
    return (
      <div className="card">
        <EmptyState icon="🌫️" title="No one here">
          {errorMessage(profile.error)}
        </EmptyState>
      </div>
    );
  }

  const { user, isMe, isFollowing, followsMe, stats } = profile.data;
  const h = hue(user.username);
  const canLetter = !isMe && user.lettersFrom !== "nobody" && (user.lettersFrom === "everyone" || followsMe);

  return (
    <div className="space-y-5">
      <section className="card overflow-hidden">
        <div
          className="h-28 sm:h-36"
          style={{
            background: `radial-gradient(120% 140% at 10% 0%, oklch(0.84 0.07 ${h}) 0%, transparent 55%), radial-gradient(120% 140% at 100% 100%, oklch(0.82 0.06 ${(h + 60) % 360}) 0%, transparent 60%), var(--surface-2)`,
          }}
        />
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-12 flex items-end justify-between gap-3 sm:-mt-14">
            <Avatar user={user} size="xl" showBattery className="rounded-full ring-4 ring-surface" />
            <div className="flex flex-wrap justify-end gap-2 pb-1">
              {isMe ? (
                <>
                  <Link to="/saved" className="lg:hidden">
                    <Button variant="secondary" size="icon" aria-label="Saved posts">
                      <Bookmark className="size-4" />
                    </Button>
                  </Link>
                  <Link to="/settings">
                    <Button variant="secondary">
                      <Settings className="size-4" /> Edit profile
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {canLetter ? (
                    <Button variant="secondary" onClick={() => (me ? openLetter({ to: user.username }) : undefined)} disabled={!me}>
                      <Feather className="size-4" /> Letter
                    </Button>
                  ) : null}
                  <FollowButton key={String(isFollowing)} username={user.username} following={isFollowing} />
                </>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-semibold tracking-tight">{user.displayName}</h1>
              {followsMe && !isMe ? <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">Follows you</span> : null}
            </div>
            <p className="text-muted">@{user.username}</p>
            <div className="mt-3">
              <BatteryBadge battery={user.battery} withHint />
            </div>
            {user.bio ? <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">{user.bio}</p> : null}
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {user.institute ? (
                <li className="inline-flex items-center gap-1.5">
                  <GraduationCap className="size-4" /> {user.institute}
                </li>
              ) : null}
              {user.location ? (
                <li className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {user.location}
                </li>
              ) : null}
              <li className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" /> Joined {format(new Date(user.joinedAt), "MMMM yyyy")}
              </li>
            </ul>
            <div className="mt-4 flex gap-5 text-sm">
              <span>
                <span className="font-semibold">{stats.posts}</span> <span className="text-muted">{stats.posts === 1 ? "post" : "posts"}</span>
              </span>
              {isMe ? (
                <>
                  <button onClick={() => setConnections("followers")} className="hover:underline">
                    <span className="font-semibold">{stats.followers}</span> <span className="text-muted">followers</span>
                  </button>
                  <button onClick={() => setConnections("following")} className="hover:underline">
                    <span className="font-semibold">{stats.following}</span> <span className="text-muted">following</span>
                  </button>
                </>
              ) : null}
            </div>
            {isMe ? <p className="mt-2 text-xs text-muted">Only you can see your follower counts.</p> : null}
          </div>
        </div>
      </section>

      {isMe ? <MoodGarden /> : null}

      <FeedList
        query={posts}
        empty={defaultEmpty(isMe ? "Your page is still blank" : "Nothing shared yet", isMe ? "Your first post will appear here." : `${user.displayName} hasn't written anything public yet.`, "📝")}
      />

      {isMe ? <ConnectionsDialog username={user.username} kind={connections} onClose={() => setConnections(null)} /> : null}
    </div>
  );
}

/** Five weeks of the moods you've written in: a gentle, private journal view. */
function MoodGarden() {
  const moods = useQuery({
    queryKey: ["my-moods"],
    queryFn: () => api<{ items: { createdAt: string; mood: Mood | null }[] }>("/me/moods").then((r) => r.items),
  });
  if (!moods.data) return null;

  // Bucket by the viewer's local day: day -> mood -> count.
  const byDay = new Map<string, Map<Mood | null, number>>();
  const counts = new Map<Mood, number>();
  for (const item of moods.data) {
    const key = format(new Date(item.createdAt), "yyyy-MM-dd");
    const day = byDay.get(key) ?? new Map<Mood | null, number>();
    day.set(item.mood, (day.get(item.mood) ?? 0) + 1);
    byDay.set(key, day);
    if (item.mood) counts.set(item.mood, (counts.get(item.mood) ?? 0) + 1);
  }
  const start = subDays(startOfDay(new Date()), 34);
  const days = Array.from({ length: 35 }, (_, i) => addDays(start, i));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="card p-5">
      <SectionTitle>Your mood garden · last 5 weeks</SectionTitle>
      <div className="grid max-w-md grid-cols-7 gap-1.5 sm:gap-2" role="img" aria-label="Moods you've posted in over the last five weeks">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const entries = [...(byDay.get(key) ?? new Map()).entries()];
          const main = entries.filter(([mood]) => mood).sort((a, b) => b[1] - a[1])[0]?.[0] as Mood | undefined;
          const color = main ? MOODS[main].color : entries.length ? "var(--muted)" : undefined;
          return (
            <div
              key={key}
              title={`${format(day, "EEE, MMM d")}${main ? ` · ${MOODS[main].label}` : entries.length ? " · posted" : ""}`}
              className="grid aspect-square place-items-center rounded-lg text-sm sm:text-base"
              style={{ background: color ? `color-mix(in oklab, ${color} 28%, transparent)` : "var(--surface-2)" }}
            >
              {main ? <span aria-hidden>{MOODS[main].emoji}</span> : null}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">
        {top ? (
          <>
            Lately you've mostly felt <span className="font-medium" style={{ color: MOODS[top[0]].color }}>{MOODS[top[0]].label.toLowerCase()}</span>. Every
            feeling is welcome here.
          </>
        ) : (
          "Tag your posts with a mood and watch your garden grow. Only you can see it."
        )}
      </p>
    </section>
  );
}

function ConnectionsDialog({ username, kind, onClose }: { username: string; kind: "followers" | "following" | null; onClose: () => void }) {
  const list = useQuery({
    queryKey: ["connections", username, kind],
    queryFn: () => api<{ items: PersonSummary[] }>(`/users/${username}/connections`, { query: { kind: kind ?? undefined } }).then((r) => r.items),
    enabled: !!kind,
  });
  return (
    <Dialog open={!!kind} onClose={onClose} title={kind === "following" ? "People you follow" : "Your followers"}>
      {list.isPending ? (
        <PageSpinner />
      ) : !list.data?.length ? (
        <p className="py-6 text-center text-sm text-muted">No one yet — and that's perfectly okay.</p>
      ) : (
        <ul className="divide-y divide-line">
          {list.data.map((person) => (
            <li key={person.username}>
              <Link to={`/u/${person.username}`} onClick={onClose} className="flex items-center gap-3 py-3">
                <Avatar user={person} showBattery />
                <span className="min-w-0">
                  <span className="block font-semibold">{person.displayName}</span>
                  <span className="block truncate text-sm text-muted">@{person.username}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
