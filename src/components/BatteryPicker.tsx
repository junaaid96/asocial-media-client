import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { BATTERY, BATTERY_KEYS } from "../lib/meta";
import type { Battery, Me } from "../lib/types";
import { BatteryIcon } from "./ui/misc";

export function useSetBattery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (battery: Battery) => api<{ user: Me }>("/me", { method: "PATCH", body: { battery } }),
    onMutate: (battery) => {
      const previous = queryClient.getQueryData<Me>(["me"]);
      if (previous) queryClient.setQueryData<Me>(["me"], { ...previous, battery });
      return { previous };
    },
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["me"], user);
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
      toast(`Social battery: ${BATTERY[user.battery].label.toLowerCase()}`, { description: BATTERY[user.battery].hint });
    },
    onError: (error, _b, context) => {
      if (context?.previous) queryClient.setQueryData(["me"], context.previous);
      toast.error(errorMessage(error));
    },
  });
}

/** Lets people signal how much social energy they have today. */
export function BatteryPicker({ compact = false, direction = "down" }: { compact?: boolean; direction?: "up" | "down" }) {
  const { me } = useAuth();
  const setBattery = useSetBattery();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!me) return null;
  const current = BATTERY[me.battery];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Social battery: ${current.label}. Change`}
        className={clsx(
          "flex items-center gap-2.5 rounded-2xl text-left transition-colors hover:bg-surface-2",
          compact ? "p-2" : "w-full border border-line px-3 py-2.5",
        )}
        style={{ color: current.color }}
      >
        <BatteryIcon level={current.level} className="h-3.5 w-6" />
        {!compact ? (
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium tracking-wide text-muted uppercase">Social battery</span>
            <span className="block truncate text-sm font-medium text-ink">{current.label}</span>
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Choose your social battery"
          className={clsx(
            "card absolute z-40 w-72 animate-rise p-1.5",
            direction === "up" ? "bottom-full mb-2 left-0" : "top-full right-0 mt-2",
          )}
        >
          {BATTERY_KEYS.map((key) => {
            const meta = BATTERY[key];
            return (
              <button
                key={key}
                role="option"
                aria-selected={me.battery === key}
                onClick={() => {
                  setOpen(false);
                  if (key !== me.battery) setBattery.mutate(key);
                }}
                className={clsx("flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2", me.battery === key && "bg-surface-2")}
              >
                <span style={{ color: meta.color }} className="mt-1">
                  <BatteryIcon level={meta.level} className="h-3.5 w-6" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{meta.label}</span>
                  <span className="block text-xs text-muted">{meta.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
