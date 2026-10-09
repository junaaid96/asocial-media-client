import clsx from "clsx";
import { ShieldAlert, Timer } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { formatClock, formatDuration, localDay, reminderStep, useUsage } from "../lib/usage";
import { useShell } from "./AppShell";

const WARNED_KEY = "asocial.limitNudge";

/** A gentle, once-a-day nudge when today's time passes the limit the person chose. */
export function UsageNudge() {
  const { available, today, dailyLimitMinutes } = useUsage();
  const { openBreathe } = useShell();
  const reached = available && !!dailyLimitMinutes && today >= dailyLimitMinutes * 60;

  useEffect(() => {
    if (!reached || !dailyLimitMinutes) return;
    const day = localDay();
    try {
      if (localStorage.getItem(WARNED_KEY) === day) return;
      localStorage.setItem(WARNED_KEY, day);
    } catch {
      // storage unavailable: still nudge, at worst more than once a day
    }
    toast("You've reached your daily time", {
      description: `About ${formatDuration(today)} here today; you set ${formatDuration(dailyLimitMinutes * 60)}. Maybe a good moment to step away?`,
      duration: 15_000,
      action: { label: "Take a breath", onClick: openBreathe },
    });
  }, [reached, dailyLimitMinutes, today, openBreathe]);

  return null;
}

const REMINDED_KEY = "asocial.sessionReminded";

/** A soft note each time this session passes the reminder interval the person picked. */
export function SessionReminder() {
  const { available, session, sessionStartedAt, sessionReminderMinutes } = useUsage();
  const { openBreathe } = useShell();
  const step = available ? reminderStep(session, sessionReminderMinutes) : 0;

  useEffect(() => {
    if (!step || !sessionReminderMinutes || !sessionStartedAt) return;
    // Remember per session which reminder we've shown, so reloads don't repeat it.
    const mark = `${sessionStartedAt}:${step}`;
    try {
      if (sessionStorage.getItem(REMINDED_KEY) === mark) return;
      sessionStorage.setItem(REMINDED_KEY, mark);
    } catch {
      // storage unavailable: at worst the note repeats after a reload
    }
    toast(`You've been here ${formatDuration(session)}`, {
      description: "Just a gentle check-in. Stretch, sip some water, or take a breath before you carry on.",
      duration: 12_000,
      action: { label: "Take a breath", onClick: openBreathe },
    });
  }, [step, sessionReminderMinutes, sessionStartedAt]);

  return null;
}

/** Active time this session, always in view. Links to the time settings. */
export function SessionTimer({ compact = false }: { compact?: boolean }) {
  const { available, session, today, dailyLimitMinutes } = useUsage();
  if (!available) return null;
  const over = !!dailyLimitMinutes && today >= dailyLimitMinutes * 60;
  const label = `This session: ${formatDuration(session)} active. Today: ${formatDuration(today)}${
    dailyLimitMinutes ? ` of your ${formatDuration(dailyLimitMinutes * 60)} limit` : ""
  }. Open time settings.`;
  return (
    <Link
      to="/settings#time"
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
        compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
        over ? "bg-clay-soft text-clay hover:bg-clay-soft/80" : "text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      <Timer className={compact ? "size-3.5" : "size-4"} aria-hidden />
      <span aria-hidden>{formatClock(session)}</span>
    </Link>
  );
}

export function SuspendedBanner() {
  const { me } = useAuth();
  if (!me?.suspended) return null;
  return (
    <div role="alert" className="border-b border-clay/30 bg-clay-soft px-4 py-3 text-sm text-ink">
      <p className="mx-auto flex max-w-7xl items-start gap-2">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden />
        <span>
          <span className="font-semibold">Your account is suspended.</span> You can read, but posting, replying and messaging are paused while our moderators
          review it.
        </span>
      </p>
    </div>
  );
}
