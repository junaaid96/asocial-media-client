import clsx from "clsx";
import { type ReactNode, useEffect, useRef, useState } from "react";

export function Menu({
  trigger,
  label,
  children,
  align = "right",
  direction = "down",
  triggerClassName,
}: {
  trigger: ReactNode;
  label: string;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  /** "up" opens above the trigger, for menus near the bottom of the screen. */
  direction?: "down" | "up";
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName ?? "rounded-full p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink"}
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={clsx(
            "card absolute z-30 min-w-44 animate-rise p-1.5",
            direction === "up" ? "bottom-full mb-1" : "mt-1",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({ onClick, children, danger }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2",
        danger ? "text-clay" : "text-ink-soft",
      )}
    >
      {children}
    </button>
  );
}
