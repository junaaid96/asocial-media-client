import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";

// Box breathing: four equal phases of four seconds.
const PHASES = [
  { label: "Breathe in", scale: 1 },
  { label: "Hold", scale: 1 },
  { label: "Breathe out", scale: 0.55 },
  { label: "Hold", scale: 0.55 },
] as const;
const PHASE_MS = 4000;
const ROUNDS = 4;

export function BreatheDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!open) {
      setStep(-1);
      return;
    }
    if (step < 0 || step >= ROUNDS * PHASES.length) return;
    const timer = setTimeout(() => setStep((s) => s + 1), PHASE_MS);
    return () => clearTimeout(timer);
  }, [open, step]);

  const running = step >= 0 && step < ROUNDS * PHASES.length;
  const done = step >= ROUNDS * PHASES.length;
  const phase = PHASES[Math.max(0, step) % PHASES.length]!;

  return (
    <Dialog open={open} onClose={onClose} title="A one-minute pause">
      <div className="flex flex-col items-center pb-2 text-center">
        <p className="max-w-xs text-sm text-muted">Follow the circle. Four seconds in, hold, out, hold. Four gentle rounds.</p>
        <div className="relative my-8 grid size-56 place-items-center">
          <div className="absolute inset-0 rounded-full bg-accent-soft" />
          <div
            className="absolute inset-4 rounded-full bg-accent/25 transition-transform ease-in-out"
            style={{ transform: `scale(${running ? phase.scale : 0.55})`, transitionDuration: `${PHASE_MS}ms` }}
          />
          <div
            className="absolute inset-12 rounded-full bg-accent/60 transition-transform ease-in-out"
            style={{ transform: `scale(${running ? phase.scale : 0.55})`, transitionDuration: `${PHASE_MS}ms` }}
          />
          <span className="relative font-serif text-xl font-semibold text-ink" aria-live="polite">
            {done ? "Well done" : running ? phase.label : "Ready?"}
          </span>
        </div>
        {running ? (
          <p className="text-sm text-muted">
            Round {Math.floor(step / PHASES.length) + 1} of {ROUNDS}
          </p>
        ) : (
          <Button onClick={() => setStep(0)}>{done ? "Once more" : "Begin"}</Button>
        )}
      </div>
    </Dialog>
  );
}
