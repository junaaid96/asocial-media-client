import clsx from "clsx";
import { Globe, Lock, Users } from "lucide-react";
import type { Visibility } from "../lib/types";

export const VISIBILITY: Record<Visibility, { label: string; hint: string; icon: typeof Globe }> = {
  public: { label: "Public", hint: "Anyone on aSocial", icon: Globe },
  followers: { label: "Followers", hint: "Only people who follow you", icon: Users },
  private: { label: "Only me", hint: "A private note to yourself", icon: Lock },
};

const KEYS = Object.keys(VISIBILITY) as Visibility[];

/** Radio group for who can see a post. */
export function VisibilityPicker({ value, onChange, name }: { value: Visibility; onChange: (v: Visibility) => void; name: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-muted">Who can see this?</legend>
      <div className="flex flex-wrap gap-1.5">
        {KEYS.map((key) => {
          const meta = VISIBILITY[key];
          const checked = value === key;
          return (
            <label
              key={key}
              title={meta.hint}
              className={clsx(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                checked ? "bg-accent-soft font-medium text-accent-strong ring-1 ring-accent/40" : "bg-surface-2 text-ink-soft hover:text-ink",
              )}
            >
              <input type="radio" name={name} value={key} checked={checked} onChange={() => onChange(key)} className="sr-only" />
              <meta.icon className="size-3.5" aria-hidden />
              {meta.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Labelled badge on your own posts showing who can see them. */
export function VisibilityBadge({ visibility }: { visibility: Visibility | null | undefined }) {
  // Unknown or missing (e.g. an older API) means the server didn't say: show nothing rather than guess.
  const meta = visibility ? VISIBILITY[visibility] : undefined;
  if (!meta) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1",
        visibility === "public" ? "bg-surface-2 text-ink-soft ring-line" : "bg-accent-soft text-accent-strong ring-accent/30",
      )}
      title={`Who can see this: ${meta.label}. ${meta.hint}`}
    >
      <meta.icon className="size-3.5" aria-hidden />
      <span className="sr-only">Visible to: </span>
      {meta.label}
    </span>
  );
}
