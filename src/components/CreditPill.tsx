import clsx from "clsx";
import { ArrowUpRight, Code } from "lucide-react";

/** "Developed by <CodeJBorg />" credit link, styled with aSocial's accent token. */
export function CreditPill({ className }: { className?: string }) {
  return (
    <a
      href="https://junaidul.pro.bd/codejborg"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Developed by CodeJBorg — visit developer website"
      className={clsx(
        "group inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 py-1.5 pr-3 pl-1.5 font-mono text-[11px] tracking-wide text-muted transition-colors duration-300",
        "hover:border-accent/45 hover:bg-accent/10 hover:text-ink focus-visible:border-accent/45 focus-visible:bg-accent/10 focus-visible:text-ink",
        className,
      )}
    >
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
        <Code className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span>Developed by</span>
      <span className="font-semibold text-ink">
        <span className="text-accent">&lt;</span>CodeJBorg<span className="text-accent"> /&gt;</span>
      </span>
      <span aria-hidden="true" className="inline-block h-3.5 w-0.5 bg-accent motion-safe:animate-credit-blink" />
      <ArrowUpRight
        aria-hidden="true"
        className="size-3.5 opacity-40 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:opacity-100"
      />
    </a>
  );
}
