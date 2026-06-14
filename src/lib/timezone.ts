/** User-facing timezone (Pacific — handles PST/PDT automatically). */
export const APP_TIMEZONE = "America/Los_Angeles";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour") % 24,
    minute: pick("minute"),
  };
}

/** Convert a calendar date + clock time in APP_TIMEZONE to a UTC Date. */
export function zonedInputToUtc(date: string, time: string, allDay = false): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = allDay ? [0, 0] : time.split(":").map(Number);

  let utcMs = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 4; i++) {
    const zoned = getZonedParts(new Date(utcMs), APP_TIMEZONE);
    const targetMs = Date.UTC(year, month - 1, day, hour, minute);
    const actualMs = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute);
    utcMs += targetMs - actualMs;
  }

  return new Date(utcMs);
}

/** Today's calendar date in APP_TIMEZONE (YYYY-MM-DD). */
export function todayDateInAppTz(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addCalendarDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const next = new Date(utc);
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

/** UTC range for one calendar day in APP_TIMEZONE (end is exclusive). */
export function getAppTzDayUtcRange(date = todayDateInAppTz()): {
  start: Date;
  endExclusive: Date;
} {
  return {
    start: zonedInputToUtc(date, "00:00", true),
    endExclusive: zonedInputToUtc(addCalendarDays(date, 1), "00:00", true),
  };
}

/** Split a UTC instant into date/time inputs for APP_TIMEZONE. */
export function utcToZonedInput(iso: string): { date: string; time: string; allDay: boolean } {
  const parts = getZonedParts(new Date(iso), APP_TIMEZONE);
  const date = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const time = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
  return { date, time, allDay: false };
}

export function formatEventTime(iso: string, allDay: boolean): string {
  if (allDay) return "All day";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function formatEventDateTime(iso: string, allDay: boolean): string {
  const date = new Date(iso);
  if (allDay) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIMEZONE,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function formatTodayHeading(now = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
}

export function eventRelativeLabel(iso: string): string {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diffMs = target - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) return "Past";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.round(diffDays / 7)} wk`;
  return `In ${Math.round(diffDays / 30)} mo`;
}
