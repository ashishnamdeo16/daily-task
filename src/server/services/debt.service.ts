import { prisma } from "@/lib/prisma";
import type { Category, Day, Task } from "@prisma/client";

/**
 * The Debt System.
 *
 * Quantitative tasks (those with a `targetCount`) generate debt when the day's
 * work is not finished. The outstanding amount for a task is:
 *
 *     shortfall = (targetCount + debtCount) - completedCount
 *
 * When a new day is created, the previous day's shortfalls are carried forward
 * as DebtRecords keyed by category, and folded into matching tasks on the new
 * day (raising their effective target).
 *
 * Example: target 20 job applications, completed 10 -> 10 debt carried.
 * Next day's task: target 20 + debt 10 = 30 total required.
 */

export function taskShortfall(task: Pick<Task, "targetCount" | "debtCount" | "completedCount">): number {
  if (task.targetCount == null) return 0;
  const required = task.targetCount + task.debtCount;
  return Math.max(0, required - task.completedCount);
}

/**
 * Compute outstanding debt per category from a day's tasks.
 */
export function debtFromDay(tasks: Task[]): Map<Category, number> {
  const map = new Map<Category, number>();
  for (const t of tasks) {
    const short = taskShortfall(t);
    if (short > 0) {
      map.set(t.category, (map.get(t.category) ?? 0) + short);
    }
  }
  return map;
}

/**
 * Carry debt from the previous day into the new day. Creates DebtRecords and
 * returns a per-category debt map that the template applier can fold into tasks.
 */
export async function carryDebtForward(
  userId: string,
  newDay: Day,
  previousDay: (Day & { tasks: Task[] }) | null
): Promise<Map<Category, number>> {
  const debtMap = new Map<Category, number>();
  if (!previousDay) return debtMap;

  const fromPrev = debtFromDay(previousDay.tasks);

  for (const [category, amount] of fromPrev) {
    if (amount <= 0) continue;
    debtMap.set(category, amount);

    // Title for the debt record (use the originating task title if unique)
    const sample = previousDay.tasks.find(
      (t) => t.category === category && taskShortfall(t) > 0
    );

    await prisma.debtRecord.create({
      data: {
        userId,
        dayId: newDay.id,
        category,
        title: sample?.title ?? `${category} debt`,
        amount,
        originalDate: previousDay.date,
      },
    });
  }

  return debtMap;
}

/**
 * Total unresolved debt for the user (count of outstanding units).
 */
export async function getTotalDebt(userId: string): Promise<number> {
  const result = await prisma.debtRecord.aggregate({
    where: { userId, resolved: false },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function getDebtByCategory(userId: string) {
  const records = await prisma.debtRecord.groupBy({
    by: ["category"],
    where: { userId, resolved: false },
    _sum: { amount: true },
  });
  return records
    .map((r) => ({ category: r.category, amount: r._sum.amount ?? 0 }))
    .filter((r) => r.amount > 0);
}

/**
 * Resolve debt records tied to a task once it is fully completed.
 */
export async function resolveTaskDebt(task: Task): Promise<void> {
  if (taskShortfall(task) > 0) return;
  await prisma.debtRecord.updateMany({
    where: { taskId: task.id, resolved: false },
    data: { resolved: true, resolvedAt: new Date() },
  });
}
