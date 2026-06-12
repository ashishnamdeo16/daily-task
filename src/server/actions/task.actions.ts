"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { CATEGORIES } from "@/lib/constants";
import { recomputeDayMetrics } from "@/server/services/day.service";
import { recomputeStreak } from "@/server/services/streak.service";
import { awardXp } from "@/server/services/xp.service";
import { checkAchievements } from "@/server/services/achievement.service";
import { resolveTaskDebt, taskShortfall } from "@/server/services/debt.service";
import type { ActionResult } from "@/lib/types";
import type { Task } from "@prisma/client";

const categoryEnum = z.enum([
  "JOB_APPLICATION", "DSA", "OPEN_SOURCE", "AI_PROJECT",
  "NETWORKING", "FITNESS", "LEARNING", "CONTENT", "OTHER",
]);
const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const statusEnum = z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "SKIPPED", "RESCHEDULED"]);

const createSchema = z.object({
  dayId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: categoryEnum.default("OTHER"),
  priority: priorityEnum.default("MEDIUM"),
  targetCount: z.coerce.number().int().min(0).optional(),
  unit: z.string().max(40).optional(),
  estimatedMinutes: z.coerce.number().int().min(0).optional(),
  weeklyGoalId: z.string().optional(),
});

async function logActivity(userId: string, action: string, entityId: string, metadata?: object) {
  await prisma.activityLog.create({
    data: { userId, action, entity: "task", entityId, metadata: metadata ?? undefined },
  });
}

async function afterMutation(userId: string, dayId: string) {
  await recomputeDayMetrics(dayId);
  await recomputeStreak(userId);
  revalidatePath("/dashboard");
}

export async function createTask(input: z.input<typeof createSchema>): Promise<ActionResult<Task>> {
  try {
    const user = await requireUser();
    const data = createSchema.parse(input);

    const max = await prisma.task.aggregate({
      where: { dayId: data.dayId, status: "TODO" },
      _max: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        dayId: data.dayId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        targetCount: data.targetCount ?? null,
        unit: data.unit ?? null,
        estimatedMinutes: data.estimatedMinutes ?? null,
        xpValue: CATEGORIES[data.category].defaultXp,
        position: (max._max.position ?? -1) + 1,
        weeklyGoalId: data.weeklyGoalId || null,
      },
    });

    await logActivity(user.id, "task.created", task.id, { title: task.title });
    await afterMutation(user.id, data.dayId);
    return { success: true, data: task };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

const moveSchema = z.object({
  taskId: z.string().min(1),
  status: statusEnum,
  position: z.coerce.number().int().min(0),
});

export async function moveTask(input: z.input<typeof moveSchema>): Promise<ActionResult<Task>> {
  try {
    const user = await requireUser();
    const { taskId, status, position } = moveSchema.parse(input);

    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!existing) return { success: false, error: "Task not found" };

    const updated = await transitionTask(existing, status, { position });
    await afterMutation(user.id, existing.dayId);
    if (status === "COMPLETED") await checkAchievements(user.id);
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

const updateSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: categoryEnum.optional(),
  priority: priorityEnum.optional(),
  targetCount: z.coerce.number().int().min(0).nullable().optional(),
  unit: z.string().max(40).nullable().optional(),
  estimatedMinutes: z.coerce.number().int().min(0).nullable().optional(),
  weeklyGoalId: z.string().nullable().optional(),
});

export async function updateTask(input: z.input<typeof updateSchema>): Promise<ActionResult<Task>> {
  try {
    const user = await requireUser();
    const { taskId, ...rest } = updateSchema.parse(input);

    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!existing) return { success: false, error: "Task not found" };

    const updated = await prisma.task.update({ where: { id: taskId }, data: rest });
    await afterMutation(user.id, existing.dayId);
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

const countSchema = z.object({
  taskId: z.string().min(1),
  delta: z.coerce.number().int(),
});

/** Increment / decrement progress on a quantitative task. */
export async function adjustTaskCount(input: z.input<typeof countSchema>): Promise<ActionResult<Task>> {
  try {
    const user = await requireUser();
    const { taskId, delta } = countSchema.parse(input);

    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!existing) return { success: false, error: "Task not found" };

    const newCount = Math.max(0, existing.completedCount + delta);
    const required = (existing.targetCount ?? 0) + existing.debtCount;
    const willComplete = existing.targetCount != null && newCount >= required && required > 0;

    let updated = await prisma.task.update({
      where: { id: taskId },
      data: { completedCount: newCount },
    });

    if (willComplete && existing.status !== "COMPLETED") {
      updated = await transitionTask(updated, "COMPLETED");
      await checkAchievements(user.id);
    } else {
      await afterMutation(user.id, existing.dayId);
    }
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!existing) return { success: false, error: "Task not found" };

    await prisma.task.delete({ where: { id: taskId } });
    await afterMutation(user.id, existing.dayId);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}

/**
 * Shared task status transition. Handles XP grant/revoke, completedAt, debt
 * resolution and quantitative auto-fill.
 */
async function transitionTask(
  task: Task,
  status: Task["status"],
  extra: { position?: number } = {}
): Promise<Task> {
  const wasCompleted = task.status === "COMPLETED";
  const nowCompleted = status === "COMPLETED";

  const data: Record<string, unknown> = { status };
  if (extra.position != null) data.position = extra.position;

  if (nowCompleted) {
    data.completedAt = new Date();
    if (task.targetCount != null) {
      const required = task.targetCount + task.debtCount;
      data.completedCount = Math.max(task.completedCount, required);
    }
  } else if (wasCompleted) {
    data.completedAt = null;
  }

  const updated = await prisma.task.update({ where: { id: task.id }, data });

  if (nowCompleted && !wasCompleted) {
    await awardXp({
      userId: task.userId,
      amount: task.xpValue,
      reason: `Completed: ${task.title}`,
      source: "task",
      refId: task.id,
    });
    await resolveTaskDebt(updated);
    await logActivity(task.userId, "task.completed", task.id, { xp: task.xpValue });
  } else if (!nowCompleted && wasCompleted) {
    await awardXp({
      userId: task.userId,
      amount: -task.xpValue,
      reason: `Reverted: ${task.title}`,
      source: "task",
      refId: task.id,
    });
  }

  return updated;
}

function errorMessage(err: unknown): string {
  if (err instanceof z.ZodError) return err.issues[0]?.message ?? "Invalid input";
  if (err instanceof Error && err.message === "UNAUTHORIZED") return "You must be signed in";
  console.error(err);
  return "Something went wrong";
}

export { taskShortfall };
