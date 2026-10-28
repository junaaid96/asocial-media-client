import clsx from "clsx";
import { BadgeCheck } from "lucide-react";
import { useId } from "react";
import type { PublicUser } from "../lib/types";

const SIZES = { xs: "size-3.5", sm: "size-4", md: "size-5" };

/**
 * A quiet check mark shown next to verified members' names. Hovering or
 * focusing it reveals who the badge is from. Renders nothing otherwise.
 */
export function VerifiedBadge({
  user,
  size = "sm",
  className,
}: {
  user: Pick<PublicUser, "verified" | "verifiedLabel"> | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const tipId = useId();
  if (!user?.verified) return null;
  const label = user.verifiedLabel ? `Verified member of aSocial · ${user.verifiedLabel}` : "Verified member of aSocial";
  return (
    <span
      className={clsx("group/verified relative inline-flex shrink-0 items-center rounded-full", className)}
      tabIndex={0}
      role="img"
      aria-label={label}
      aria-describedby={tipId}
    >
      <BadgeCheck className={clsx(SIZES[size], "text-accent")} aria-hidden />
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-30 mt-1.5 -translate-x-1/2 scale-95 rounded-lg bg-ink px-2.5 py-1 text-center text-xs font-medium whitespace-nowrap text-bg opacity-0 shadow-lg transition-all duration-150 group-focus-within/verified:scale-100 group-focus-within/verified:opacity-100 group-hover/verified:scale-100 group-hover/verified:opacity-100"
      >
        Verified member of aSocial
        {user.verifiedLabel ? <span className="opacity-70"> · {user.verifiedLabel}</span> : null}
      </span>
    </span>
  );
}
