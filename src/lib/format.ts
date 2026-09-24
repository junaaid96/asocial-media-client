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
