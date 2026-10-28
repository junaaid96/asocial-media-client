import clsx from "clsx";
import { BadgeCheck } from "lucide-react";
import type { PublicUser } from "../lib/types";

const SIZES = { xs: "size-3.5", sm: "size-4", md: "size-5" };

/** A quiet check mark shown next to verified members' names. Renders nothing otherwise. */
export function VerifiedBadge({
  user,
  size = "sm",
  className,
}: {
  user: Pick<PublicUser, "verified" | "verifiedLabel"> | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (!user?.verified) return null;
  const title = user.verifiedLabel ? `Verified · ${user.verifiedLabel}` : "Verified member";
  return (
    <span className={clsx("inline-flex shrink-0 items-center", className)} title={title} aria-label={title} role="img">
      <BadgeCheck className={clsx(SIZES[size], "text-accent")} aria-hidden />
    </span>
  );
}
