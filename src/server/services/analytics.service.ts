import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { addDays, format, toDateOnly } from "@/lib/date";
import type { Category } from "@prisma/client";

export interface DailyPoint {
  date: string;
  score: number;
  focusHours: number;
  completed: number;
  total: number;
  xp: number;
}

export interface CategoryPoint {
  category: string;
  label: string;
  completed: number;
}

export interface AnalyticsData {
  daily: DailyPoint[];
  categoryPerformance: CategoryPoint[];
  debtByCategory: { label: string; amount: number }[];
  totals: {
    completionPct: number;
    focusHours: number;
    tasksCompleted: number;
    xpEarned: number;
  };
}

export async function getAnalytics(userId: string, days = 30): Promise<AnalyticsData> {
  const to = toDateOnly();
  const from = toDateOnly(addDays(to, -(days - 1)));

  const [dayRecords, completedByCategory, debt, xpAgg] = await Promise.all([
    prisma.day.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    }),
    prisma.task.groupBy({
      by: ["category"],
      where: { userId, status: "COMPLETED" },
      _count: { _all: true },
    }),
    prisma.debtRecord.groupBy({
      by: ["category"],
      where: { userId, resolved: false },
      _sum: { amount: true },
    }),
    prisma.xPLog.aggregate({
      where: { userId, createdAt: { gte: from } },
      _sum: { amount: true },
    }),
  ]);

  // Fill every day in range (even those without a Day record).
  const byDate = new Map(dayRecords.map((d) => [format(toDateOnly(d.date), "yyyy-MM-dd"), d]));
  const daily: DailyPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = toDateOnly(addDays(from, i));
    const key = format(d, "yyyy-MM-dd");
    const rec = byDate.get(key);
    daily.push({
      date: format(d, "MMM d"),
      score: rec?.score ?? 0,
      focusHours: rec ? Math.round((rec.focusMinutes / 60) * 10) / 10 : 0,
      completed: rec?.completedTasks ?? 0,
      total: rec?.totalTasks ?? 0,
      xp: rec?.xpEarned ?? 0,
    });
  }

  const categoryPerformance: CategoryPoint[] = completedByCategory.map((c) => ({
    category: c.category,
    label: CATEGORIES[c.category as Category].label,
    completed: c._count._all,
  }));

  const debtByCategory = debt
    .map((d) => ({ label: CATEGORIES[d.category as Category].label, amount: d._sum.amount ?? 0 }))
    .filter((d) => d.amount > 0);

  const totalCompleted = daily.reduce((s, d) => s + d.completed, 0);
  const totalTasks = daily.reduce((s, d) => s + d.total, 0);
  const focusHours = Math.round(daily.reduce((s, d) => s + d.focusHours, 0) * 10) / 10;

  return {
    daily,
    categoryPerformance,
    debtByCategory,
    totals: {
      completionPct: totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0,
      focusHours,
      tasksCompleted: totalCompleted,
      xpEarned: xpAgg._sum.amount ?? 0,
    },
  };
}
