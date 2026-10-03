import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

/** Local calendar date key, e.g. "2026-10-03". */
export function toDateKey(date: Date | number = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function fromDateKey(key: string): Date {
  return parseISO(key);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function daysBetweenKeys(a: string, b: string): number {
  return differenceInCalendarDays(fromDateKey(b), fromDateKey(a));
}

export function shiftDateKey(key: string, days: number): string {
  return toDateKey(addDays(fromDateKey(key), days));
}

/** "00:42:18" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** "42 min" / "1 h 05 min" */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (!totalSeconds || totalSeconds < 60) return totalSeconds ? "<1 min" : "0 min";
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
