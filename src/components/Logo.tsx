/** compact: on narrow screens show only the mark (the wordmark stays for screen readers). */
export function Logo({ small, compact }: { small?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className={small ? "size-8" : "size-9"} aria-hidden>
        <rect width="64" height="64" rx="18" fill="var(--accent)" />
        <path d="M40.5 18.5a15 15 0 1 0 5 25.2A12 12 0 0 1 40.5 18.5Z" fill="var(--bg)" />
        <circle cx="44" cy="22" r="2.5" fill="var(--bg)" />
      </svg>
      <span
        className={`${small ? "font-serif text-xl font-semibold tracking-tight" : "font-serif text-2xl font-semibold tracking-tight"}${compact ? " max-[459px]:sr-only" : ""}`}
      >
        aSocial
      </span>
    </span>
  );
}
