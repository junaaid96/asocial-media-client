import { ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { formatDuration, localDay, useUsage } from "../lib/usage";
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
