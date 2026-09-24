import clsx from "clsx";
import { Moon } from "lucide-react";
import { assetUrl } from "../../lib/api";
import { BATTERY } from "../../lib/meta";
import type { PublicUser } from "../../lib/types";

const SIZES = { xs: "size-7 text-[11px]", sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg", xl: "size-24 text-2xl sm:size-28" };

// A soft, stable colour per person for avatar placeholders.
function hue(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function Avatar({
  user,
  size = "md",
  showBattery = false,
  className,
}: {
  user: PublicUser | null;
  size?: keyof typeof SIZES;
  showBattery?: boolean;
  className?: string;
}) {
  const src = assetUrl(user?.avatarUrl);
  const initials = user?.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const h = hue(user?.username ?? "anon");
  const battery = user ? BATTERY[user.battery] : null;

  return (
    <span className={clsx("relative inline-flex shrink-0", className)}>
      <span
        className={clsx("inline-flex items-center justify-center overflow-hidden rounded-full font-semibold", SIZES[size])}
        style={
          user
            ? { background: `oklch(0.86 0.05 ${h})`, color: `oklch(0.35 0.06 ${h})` }
            : { background: "var(--surface-2)", color: "var(--muted)" }
        }
      >
        {src ? (
          <img src={src} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
        ) : user ? (
          initials
        ) : (
          <Moon className="size-1/2" aria-hidden />
        )}
      </span>
      {showBattery && battery ? (
        <span
          className={clsx(
            "absolute right-0 bottom-0 rounded-full ring-2 ring-surface",
            size === "xl" || size === "lg" ? "size-4" : "size-2.5",
          )}
          style={{ background: battery.color }}
          title={battery.label}
          aria-label={battery.label}
        />
      ) : null}
    </span>
  );
}
