import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import { REACTIONS, REACTION_KEYS } from "../lib/meta";
import type { ReactionKind } from "../lib/types";

/**
 * Total reactions (summed across kinds) with a breakdown on hover, focus or tap.
 * Every viewer sees the total and the per-reaction breakdown (tap or hover for details).
 */
export function ReactionSummary({
  counts,
  total,
  size = "md",
}: {
  counts: Partial<Record<ReactionKind, number>> | null;
  total: number | null;
  isMine?: boolean;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  // A click/tap pins the breakdown open (hover alone shows it while the pointer is there).
  const pinned = useRef(false);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      pinned.current = false;
      setOpen(false);
    };
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (total == null || total <= 0 || !counts) return null;
  const { kinds, label } = reactionBreakdown(counts, total);

  return (
    <div className="relative" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => !pinned.current && setOpen(false)}>
      <button
        type="button"
        onClick={() => {
          pinned.current = !pinned.current;
          setOpen(pinned.current);
        }}
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        className={clsx(
          "inline-flex items-center gap-1 rounded-full whitespace-nowrap text-muted transition-colors hover:bg-surface-2 hover:text-ink",
          size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-xs",
        )}
      >
        <span className="flex -space-x-1" aria-hidden>
          {kinds.slice(0, 3).map((k) => (
            <span key={k} className="grid size-5 place-items-center rounded-full bg-surface text-[12px] ring-2 ring-surface">
              {REACTIONS[k].emoji}
            </span>
          ))}
        </span>
        <span className="font-medium tabular-nums text-ink-soft">{total}</span>
        {size === "md" ? <span className="hidden sm:inline">{total === 1 ? "person" : "people"}</span> : null}
      </button>
      {open ? (
        <div id={id} role="tooltip" className="absolute right-0 bottom-full z-20 pb-2">
          <div className="card min-w-44 animate-rise p-2.5 text-sm">
            <p className="mb-1.5 px-1 text-xs font-medium text-muted">
              {total} {total === 1 ? "reaction" : "reactions"}
            </p>
            <ul className="space-y-0.5">
              {kinds.map((k) => (
                <li key={k} className="flex items-center gap-2 rounded-lg px-1 py-0.5">
                  <span aria-hidden>{REACTIONS[k].emoji}</span>
                  <span className="flex-1 text-ink-soft">{REACTIONS[k].label}</span>
                  <span className="font-medium tabular-nums">{counts[k]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Reaction kinds by count (most first) and a spoken summary, e.g. "3 reactions: 2 Hug, 1 Felt this". */
export function reactionBreakdown(counts: Partial<Record<ReactionKind, number>>, total: number) {
  const kinds = REACTION_KEYS.filter((k) => counts[k]).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
  const label = `${total} ${total === 1 ? "reaction" : "reactions"}: ${kinds.map((k) => `${counts[k]} ${REACTIONS[k].label}`).join(", ")}`;
  return { kinds, label };
}
