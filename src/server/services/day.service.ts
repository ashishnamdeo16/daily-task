import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { toDateOnly, todayDateOnly } from "@/lib/date";
import type { TemplateItem } from "@/lib/types";
import type { Category, Day, TaskStatus } from "@prisma/client";
import { carryDebtForward } from "./debt.service";

/**
 * Get the Day record for the given date, creating it on first access.
 * On creation, applies the appropriate template and folds in carried debt.
 */
export async function getOrCreateDay(userId: string, date: Date = todayDateOnly()) {
  const day = toDateOnly(date);

  const existing = await prisma.day.findUnique({
    where: { userId_date: { userId, date: day } },
    include: {
      tasks: { orderBy: { position: "asc" } },
      focusSessions: true,
      review: true,
    },
  });

  const settings = await prisma.settings.findUnique({ where: { userId } });

  if (existing) {
    // Day can exist with zero tasks if template application failed earlier (e.g. DB blip).
    if (existing.tasks.length === 0) {
      const templateId =
        existing.templateId ??
        settings?.defaultTemplateId ??
        (await resolveWeekdayTemplateId(userId, day));

      if (templateId) {
        await applyTemplate(userId, existing.id, templateId, new Map<Category, number>());
        await recomputeDayMetrics(existing.id);
        return prisma.day.findUniqueOrThrow({
          where: { id: existing.id },
          include: {
            tasks: { orderBy: { position: "asc" } },
            focusSessions: true,
            review: true,
          },
        });
      }
    }
    return existing;
  }

  // Determine template: explicit default in settings, else weekday template.
  let templateId = settings?.defaultTemplateId ?? null;
  if (!templateId) {
    templateId = await resolveWeekdayTemplateId(userId, day);
  }

  const previousDay = await prisma.day.findFirst({
    where: { userId, date: { lt: day } },
    orderBy: { date: "desc" },
    include: { tasks: true },
  });

  const created = await prisma.day.create({
    data: { userId, date: day, templateId },
  });

  // Carry debt forward (creates DebtRecords) and get per-category totals.
  const debtMap =
    settings?.autoCarryDebt !== false
      ? await carryDebtForward(userId, created, previousDay)
      : new Map<Category, number>();

  // Apply template items as tasks.
  if (templateId) {
    await applyTemplate(userId, created.id, templateId, debtMap);
  } else if (debtMap.size > 0) {
    // No template, but there is debt — still surface it as tasks.
    await createDebtOnlyTasks(userId, created.id, debtMap);
  }

  await recomputeDayMetrics(created.id);

  return prisma.day.findUniqueOrThrow({
    where: { id: created.id },
    include: {
      tasks: { orderBy: { position: "asc" } },
      focusSessions: true,
      review: true,
    },
  });
}

async function resolveWeekdayTemplateId(userId: string, day: Date): Promise<string | null> {
  const weekday = day.getUTCDay();
  const weekdayTemplate = await prisma.taskTemplate.findFirst({
    where: { userId, daysOfWeek: { has: weekday } },
    orderBy: { isDefault: "desc" },
  });
  return weekdayTemplate?.id ?? null;
}

async function applyTemplate(
  userId: string,
  dayId: string,
  templateId: string,
  debtMap: Map<Category, number>
) {
  const template = await prisma.taskTemplate.findUnique({ where: { id: templateId } });
  if (!template) return;

  const items = (template.items as unknown as TemplateItem[]) ?? [];
  const usedDebt = new Set<Category>();

  const tasks = items.map((item, index) => {
    const debt = debtMap.get(item.category) ?? 0;
    if (debt > 0) usedDebt.add(item.category);
    return {
      userId,
      dayId,
      title: item.title,
      category: item.category,
      priority: item.priority,
      status: "TODO" as TaskStatus,
      position: index,
      targetCount: item.targetCount ?? null,
      unit: item.unit ?? null,
      debtCount: item.targetCount != null ? debt : 0,
      xpValue: item.xpValue ?? CATEGORIES[item.category].defaultXp,
      estimatedMinutes: item.estimatedMinutes ?? null,
    };
  });

  if (tasks.length > 0) {
    await prisma.task.createMany({ data: tasks });
  }

  // Any debt categories not covered by a template item become their own tasks.
  const leftover = new Map<Category, number>();
  for (const [cat, amount] of debtMap) {
    if (!usedDebt.has(cat) && amount > 0) leftover.set(cat, amount);
  }
  if (leftover.size > 0) {
    await createDebtOnlyTasks(userId, dayId, leftover, tasks.length);
  }
}

async function createDebtOnlyTasks(
  userId: string,
  dayId: string,
  debtMap: Map<Category, number>,
  startPosition = 0
) {
  let pos = startPosition;
  const tasks = [...debtMap.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => ({
      userId,
      dayId,
      title: `${CATEGORIES[category].label} (carried debt)`,
      category,
      priority: "HIGH" as const,
      status: "TODO" as TaskStatus,
      position: pos++,
      targetCount: 0,
      debtCount: amount,
      xpValue: CATEGORIES[category].defaultXp,
    }));
  if (tasks.length > 0) {
    await prisma.task.createMany({ data: tasks });
  }
}

/**
 * Recompute denormalized metrics for a day (score, counts, xp, focus minutes).
 */
export async function recomputeDayMetrics(dayId: string): Promise<Day> {
  const tasks = await prisma.task.findMany({ where: { dayId } });
  const focus = await prisma.focusSession.aggregate({
    where: { dayId, status: "COMPLETED" },
    _sum: { actualMinutes: true },
  });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const skipped = tasks.filter((t) => t.status === "SKIPPED").length;
  const xpEarned = tasks
    .filter((t) => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.xpValue, 0);

  // Score: weighted completion. Skipped tasks count partially against you.
  const denom = total === 0 ? 1 : total;
  const score = Math.round((completed / denom) * 100);

  return prisma.day.update({
    where: { id: dayId },
    data: {
      totalTasks: total,
      completedTasks: completed,
      skippedTasks: skipped,
      xpEarned,
      focusMinutes: focus._sum.actualMinutes ?? 0,
      score,
      streakMaintained: score >= 60,
    },
  });
}
