import { differenceInMinutes, format, formatDistanceToNowStrict, isThisYear } from "date-fns";

export function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (differenceInMinutes(new Date(), date) < 1) return "just now";
  const days = (Date.now() - date.getTime()) / 86_400_000;
  if (days > 7) return format(date, isThisYear(date) ? "MMM d" : "MMM d, yyyy");
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function fullDate(iso: string): string {
  return format(new Date(iso), "EEEE, MMMM d, yyyy 'at' h:mm a");
}

export function timeUntil(iso: string): string {
  const minutes = Math.max(1, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest && hours < 6 ? `${hours}h ${rest}m` : `${hours}h`;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Quiet night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Quiet night";
}

// ---------- Chat timestamps: the reader's own locale and time zone (Intl) ----------

const locale = () => (typeof navigator !== "undefined" ? navigator.languages?.[0] ?? navigator.language : undefined);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
/** Whole calendar days between two instants in the local time zone (DST-safe). */
export function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86_400_000);
}
export function sameDay(a: string, b: string): boolean {
  return dayDiff(new Date(a), new Date(b)) === 0;
}

/** "3:42 PM" (or "15:42", per locale). */
export function clockTime(iso: string, lang = locale()): string {
  return new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** Day separator: "Today", "Yesterday", or "Oct 9, 2026". */
export function dayLabel(iso: string, now = new Date(), lang = locale()): string {
  const diff = dayDiff(new Date(iso), now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Intl.DateTimeFormat(lang, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

/** Tooltip: "Friday, October 9, 2026 at 3:42 PM GMT+6". */
export function fullDateTime(iso: string, lang = locale()): string {
  return new Intl.DateTimeFormat(lang, { dateStyle: "full", timeStyle: "short" }).format(new Date(iso)) +
    " " + (new Intl.DateTimeFormat(lang, { timeZoneName: "short" }).formatToParts(new Date(iso)).find((p) => p.type === "timeZoneName")?.value ?? "");
}

/** "Seen 3:45 PM" today, otherwise "Seen Yesterday, 3:45 PM" / "Seen Oct 9, 2026, 3:45 PM". */
export function stampLabel(iso: string, now = new Date(), lang = locale()): string {
  const day = dayLabel(iso, now, lang);
  return day === "Today" ? clockTime(iso, lang) : `${day}, ${clockTime(iso, lang)}`;
}

/** Compact conversation-list time: "now", "2m", "3h", "Yesterday", "Mon", "Oct 9", "Oct 9, 2025". */
export function shortAgo(iso: string, now = new Date(), lang = locale()): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  const diff = dayDiff(date, now);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (diff === 0) return `${Math.floor(minutes / 60)}h`;
  if (diff === 1) return "Yesterday";
  if (diff < 7) return new Intl.DateTimeFormat(lang, { weekday: "short" }).format(date);
  return new Intl.DateTimeFormat(lang, date.getFullYear() === now.getFullYear() ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }).format(date);
}

/** Messages from one sender within 5 minutes on the same day share one timestamp. */
export function sameGroup(a: { sender: string; createdAt: string } | undefined, b: { sender: string; createdAt: string } | undefined): boolean {
  if (!a || !b || a.sender !== b.sender || !sameDay(a.createdAt, b.createdAt)) return false;
  return Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < 5 * 60_000;
}
