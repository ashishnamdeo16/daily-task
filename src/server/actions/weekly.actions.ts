"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { weekStart } from "@/lib/date";
import type { ActionResult } from "@/lib/types";
import type { WeeklyGoal } from "@prisma/client";

const categoryEnum = z.enum([
  "JOB_APPLICATION", "DSA", "OPEN_SOURCE", "AI_PROJECT",
  "NETWORKING", "FITNESS", "LEARNING", "CONTENT", "OTHER",
]);

const createSchema = z.object({
  title: z.string().min(1).max(160),
  category: categoryEnum.default("OTHER"),
  targetValue: z.coerce.number().int().min(1).default(1),
  rank: z.coerce.number().int().min(1).max(3).default(1),
});

export async function createWeeklyGoal(
  input: z.input<typeof createSchema>
): Promise<ActionResult<WeeklyGoal>> {
  try {
    const user = await requireUser();
    const data = createSchema.parse(input);
    const goal = await prisma.weeklyGoal.create({
      data: { ...data, userId: user.id, weekStart: weekStart() },
    });
    revalidatePath("/weekly");
    return { success: true, data: goal };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function updateWeeklyGoalProgress(
  id: string,
  currentValue: number
): Promise<ActionResult<WeeklyGoal>> {
  try {
    const user = await requireUser();
    const existing = await prisma.weeklyGoal.findFirst({ where: { id, userId: user.id } });
    if (!existing) return { success: false, error: "Goal not found" };
    const value = Math.max(0, currentValue);
    const goal = await prisma.weeklyGoal.update({
      where: { id },
      data: {
        currentValue: value,
        status: value >= existing.targetValue ? "COMPLETED" : "ACTIVE",
      },
    });
    revalidatePath("/weekly");
    return { success: true, data: goal };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function deleteWeeklyGoal(id: string): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await prisma.weeklyGoal.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/weekly");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

function msg(err: unknown): string {
  if (err instanceof z.ZodError) return err.issues[0]?.message ?? "Invalid input";
  console.error(err);
  return "Something went wrong";
}
