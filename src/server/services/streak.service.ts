import { prisma } from "@/lib/prisma";
import { toDateOnly, differenceInCalendarDays } from "@/lib/date";

/**
 * A day "counts" for the streak when it is closed/completed with a passing score.
 * Completing the day maintains the streak; missing a day breaks it.
 */
export const STREAK_THRESHOLD = 60; // score >= 60 maintains the streak

interface StreakResult {
  current: number;
  longest: number;
  maintained: boolean;
}

/**
 * Recompute and persist the user's streak based on their day history.
 * Called whenever a day's score changes or a day is closed.
 */
export async function recomputeStreak(userId: string): Promise<StreakResult> {
  const days = await prisma.day.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    select: { date: true, score: true, streakMaintained: true },
  });

  const today = toDateOnly();
  let current = 0;
  let cursor = today;
  let started = false;

  for (const day of days) {
    const d = toDateOnly(day.date);
    const gap = differenceInCalendarDays(cursor, d);
    const counts = day.score >= STREAK_THRESHOLD || day.streakMaintained;

    if (!started) {
      // Allow the streak to "start" from either today or yesterday.
      if (gap > 1) break;
      if (!counts) {
        // today not yet completed — skip it but let yesterday continue the streak
        if (gap === 0) {
          cursor = d;
          continue;
        }
        break;
      }
      started = true;
      current = 1;
      cursor = d;
      continue;
    }

    if (gap === 1 && counts) {
      current += 1;
      cursor = d;
    } else {
      break;
    }
  }

  // longest streak across all history
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  const asc = [...days].reverse();
  for (const day of asc) {
    const counts = day.score >= STREAK_THRESHOLD || day.streakMaintained;
    const d = toDateOnly(day.date);
    if (!counts) {
      run = 0;
      prev = d;
      continue;
    }
    if (prev && differenceInCalendarDays(d, prev) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }
  longest = Math.max(longest, current);

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak: current, longestStreak: longest, lastActiveDate: new Date() },
  });

  return { current, longest, maintained: current > 0 };
}

export interface CompletionStats {
  monthlyPct: number;
  yearlyPct: number;
  daysActiveThisMonth: number;
  daysActiveThisYear: number;
  totalDaysTracked: number;
}

export async function getCompletionStats(userId: string): Promise<CompletionStats> {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [monthDays, yearDays, total] = await Promise.all([
    prisma.day.findMany({
      where: { userId, date: { gte: startOfMonth } },
      select: { score: true, streakMaintained: true },
    }),
    prisma.day.findMany({
      where: { userId, date: { gte: startOfYear } },
      select: { score: true, streakMaintained: true },
    }),
    prisma.day.count({ where: { userId } }),
  ]);

  const counts = (d: { score: number; streakMaintained: boolean }) =>
    d.score >= STREAK_THRESHOLD || d.streakMaintained;

  const dayOfMonth = now.getUTCDate();
  const dayOfYear =
    Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000) + 1;

  const monthActive = monthDays.filter(counts).length;
  const yearActive = yearDays.filter(counts).length;

  return {
    monthlyPct: Math.round((monthActive / Math.max(1, dayOfMonth)) * 100),
    yearlyPct: Math.round((yearActive / Math.max(1, dayOfYear)) * 100),
    daysActiveThisMonth: monthActive,
    daysActiveThisYear: yearActive,
    totalDaysTracked: total,
  };
}

export interface HeatmapCell {
  date: string; // yyyy-MM-dd
  score: number;
  level: 0 | 1 | 2 | 3 | 4; // intensity buckets
}

export async function getHeatmap(userId: string, from: Date, to: Date): Promise<HeatmapCell[]> {
  const days = await prisma.day.findMany({
    where: { userId, date: { gte: from, lte: to } },
    select: { date: true, score: true },
  });

  return days.map((d) => {
    const score = d.score;
    let level: HeatmapCell["level"] = 0;
    if (score >= 90) level = 4;
    else if (score >= 70) level = 3;
    else if (score >= 40) level = 2;
    else if (score > 0) level = 1;
    return { date: d.date.toISOString().slice(0, 10), score, level };
  });
}
