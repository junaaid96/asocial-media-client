import clsx from "clsx";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx("animate-spin", className ?? "size-5")} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-16 text-muted" role="status" aria-label="Loading">
      <Spinner className="size-6" />
    </div>
  );
}
