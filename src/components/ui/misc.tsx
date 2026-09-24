import clsx from "clsx";
import type { ReactNode } from "react";
import { BATTERY, MOODS, tint } from "../../lib/meta";
import type { Battery, Mood } from "../../lib/types";

export function MoodChip({ mood, size = "sm", active, onClick }: { mood: Mood; size?: "sm" | "md"; active?: boolean; onClick?: () => void }) {
  const meta = MOODS[mood];
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? !!active : undefined}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap transition-all",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm",
        onClick && "hover:brightness-95 active:scale-95",
      )}
      style={{
        background: tint(meta.color, active ? 28 : 13),
        color: meta.color,
        boxShadow: active ? `inset 0 0 0 1.5px ${meta.color}` : undefined,
      }}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </Tag>
  );
}

export function BatteryBadge({ battery, withHint }: { battery: Battery; withHint?: boolean }) {
  const meta = BATTERY[battery];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: tint(meta.color, 14), color: meta.color }}
      title={meta.hint}
    >
      <BatteryIcon level={meta.level} />
      {meta.label}
      {withHint ? <span className="font-normal opacity-80">· {meta.hint}</span> : null}
    </span>
  );
}

export function BatteryIcon({ level, className }: { level: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 14" className={clsx("h-3 w-5", className)} aria-hidden>
      <rect x="0.75" y="0.75" width="19.5" height="12.5" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="21" y="4.5" width="2.25" height="5" rx="1" fill="currentColor" />
      {level === 0 ? (
        <path d="M11.5 3 7.5 7.5h3L9.5 11l4-4.5h-3z" fill="currentColor" />
      ) : (
        Array.from({ length: Math.min(level, 4) }, (_, i) => <rect key={i} x={3 + i * 4.2} y="3.5" width="3.2" height="7" rx="1" fill="currentColor" />)
      )}
    </svg>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-accent-soft text-2xl text-accent">{icon}</div>
      <h3 className="font-serif text-lg font-semibold">{title}</h3>
      {children ? <div className="mt-1.5 max-w-sm text-sm text-muted">{children}</div> : null}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span>
        <span className="block text-[15px] font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-sm text-muted">{hint}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function PostSkeleton() {
  return (
    <div className="card animate-pulse p-5" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-full bg-surface-2" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-surface-2" />
          <div className="h-2.5 w-20 rounded bg-surface-2" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="h-3 w-full rounded bg-surface-2" />
        <div className="h-3 w-11/12 rounded bg-surface-2" />
        <div className="h-3 w-2/3 rounded bg-surface-2" />
      </div>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">{children}</h2>
      {action}
    </div>
  );
}
