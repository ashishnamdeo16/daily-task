import {
  startOfDay,
  startOfWeek,
  endOfWeek,
  format,
  addDays,
  subDays,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";

/**
 * Normalize a date to UTC midnight so it matches Prisma `@db.Date` columns
 * consistently regardless of the server's local timezone.
 */
export function toDateOnly(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function todayDateOnly(): Date {
  return toDateOnly(new Date());
}

/** Sunday-based week start, normalized to date-only. */
export function weekStart(date: Date = new Date()): Date {
  return toDateOnly(startOfWeek(date, { weekStartsOn: 0 }));
}

export function weekEnd(date: Date = new Date()): Date {
  return toDateOnly(endOfWeek(date, { weekStartsOn: 0 }));
}

export function formatDate(date: Date, fmt = "EEEE, MMMM d"): string {
  return format(date, fmt);
}

export function formatISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function isToday(date: Date): boolean {
  return isSameDay(toDateOnly(date), todayDateOnly());
}

export function daysBetween(a: Date, b: Date): number {
  return Math.abs(differenceInCalendarDays(a, b));
}

export {
  startOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isSameDay,
  format,
  differenceInCalendarDays,
};
