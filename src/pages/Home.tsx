import clsx from "clsx";
import { BatteryMedium, EyeOff, Feather, HeartHandshake, Leaf, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Composer } from "../components/Composer";
import { FeedList, defaultEmpty } from "../components/FeedList";
import { PromptCard } from "../components/Rail";
import { Button } from "../components/ui/Button";
import { MoodChip } from "../components/ui/misc";
import { useAuth } from "../lib/auth";
import { greeting } from "../lib/format";
import { MOOD_KEYS, MOODS } from "../lib/meta";
import { useFeed } from "../lib/queries";
import type { Mood } from "../lib/types";

type Feed = "latest" | "following" | "prompt";

const TABS: { id: Feed; label: string; short?: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "following", label: "Following" },
  { id: "prompt", label: "Today's prompt", short: "Prompt" },
];

export function Home() {
  const { me } = useAuth();
  const [params, setParams] = useSearchParams();
  const requested = params.get("feed") as Feed | null;
  const feed: Feed = requested && TABS.some((t) => t.id === requested) && (requested !== "following" || me) ? requested : "latest";
  const mood = (MOOD_KEYS as string[]).includes(params.get("mood") ?? "") ? (params.get("mood") as Mood) : undefined;
  const answering = params.get("answer") === "1";
  const query = useFeed(feed, mood);

  const update = (next: { feed?: Feed; mood?: Mood | null }) => {
    const sp = new URLSearchParams(params);
    sp.delete("answer");
    if (next.feed !== undefined) {
      if (next.feed === "latest") sp.delete("feed");
      else sp.set("feed", next.feed);
    }
    if (next.mood !== undefined) {
      if (next.mood) sp.set("mood", next.mood);
      else sp.delete("mood");
    }
    setParams(sp, { replace: true });
  };

  return (
    <div className="space-y-5">
      {me ? (
        <div className="px-1">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {greeting()}, {me.displayName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-[15px] text-muted">Write slowly. Read gently. Leave whenever you like.</p>
        </div>
      ) : (
        <Landing />
      )}

      {me ? <Composer answeringPrompt={answering} /> : null}
      <div className="xl:hidden">
        <PromptCard />
      </div>

      <div className="sticky top-[57px] z-20 -mx-3 space-y-3 bg-bg/90 px-3 py-2 backdrop-blur-md sm:mx-0 sm:px-0 lg:top-0">
        <div role="tablist" aria-label="Feeds" className="flex gap-1 rounded-full border border-line bg-surface p-1">
          {TABS.filter((tab) => tab.id !== "following" || me).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={feed === tab.id}
              onClick={() => update({ feed: tab.id })}
              className={clsx(
                "flex-1 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                feed === tab.id ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {tab.short ? (
                <>
                  <span className="sm:hidden">{tab.short}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </>
              ) : (
                tab.label
              )}
            </button>
          ))}
        </div>
        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] sm:mx-0 sm:px-0" aria-label="Filter by mood">
          {MOOD_KEYS.map((m) => (
            <MoodChip key={m} mood={m} size="md" active={mood === m} onClick={() => update({ mood: mood === m ? null : m })} />
          ))}
        </div>
      </div>

      <FeedList
        query={query}
        empty={
          feed === "following"
            ? defaultEmpty("It's quiet here", "Follow a few kindred spirits and their posts will gather here.", "🕯️")
            : feed === "prompt"
              ? defaultEmpty("No answers yet", "Today's prompt is waiting for its first reply. Maybe it's yours?", "✨")
              : mood
                ? defaultEmpty(`Nothing ${MOODS[mood].label.toLowerCase()} yet`, "Try another mood, or share how you feel.", MOODS[mood].emoji)
                : defaultEmpty("A blank page", "Be the first to write something today.")
        }
      />
    </div>
  );
}

const FEATURES = [
  { icon: Feather, title: "Letters that take their time", text: "Pen-pal messages that arrive after 15 minutes to 12 hours. No typing bubbles, no read receipts." },
  { icon: BatteryMedium, title: "Social battery", text: "Let people know how much energy you have. Recharging hushes every notification." },
  { icon: HeartHandshake, title: "Gentle reactions, quiet counts", text: "Felt this, a hug, insight, relate — and totals only you can see." },
  { icon: Sparkles, title: "A daily prompt", text: "One soft question each day, answered together at your own pace." },
  { icon: EyeOff, title: "Anonymous when you need it", text: "Share a heavy thought without your name attached. Add content notes for others." },
  { icon: Leaf, title: "A feed with an ending", text: "No infinite scroll. You choose when to read more, and we'll remind you to take a breath." },
];

function Landing() {
  return (
    <section className="space-y-6">
      <div className="card relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-64 rounded-full bg-clay/15 blur-3xl" />
        <p className="relative text-xs font-semibold tracking-[0.16em] text-accent uppercase">Social media for quiet people</p>
        <h1 className="relative mt-3 font-serif text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl">
          A calm corner of the internet, <em className="font-normal text-accent">made for introverts.</em>
        </h1>
        <p className="relative mt-4 max-w-lg text-[17px] leading-relaxed text-ink-soft">
          Share your thoughts without the noise. No follower counts on display, no infinite scroll, no pressure to reply right away.
        </p>
        <div className="relative mt-7 flex flex-wrap gap-3">
          <Link to="/join">
            <Button size="lg">Find your quiet corner</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              I have an account
            </Button>
          </Link>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="card p-5">
            <feature.icon className="size-5 text-accent" />
            <h2 className="mt-3 font-semibold">{feature.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{feature.text}</p>
          </li>
        ))}
      </ul>
      <h2 className="px-1 pt-2 font-serif text-2xl font-semibold">A glimpse inside</h2>
    </section>
  );
}
