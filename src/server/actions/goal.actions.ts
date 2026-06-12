"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import type { ActionResult } from "@/lib/types";
import type { Goal } from "@prisma/client";

const categoryEnum = z.enum([
  "JOB_APPLICATION", "DSA", "OPEN_SOURCE", "AI_PROJECT",
  "NETWORKING", "FITNESS", "LEARNING", "CONTENT", "OTHER",
]);

const createSchema = z.object({
  title: z.string().min(1).max(160),
  category: categoryEnum.default("OTHER"),
  targetValue: z.coerce.number().int().min(1).default(1),
  unit: z.string().max(40).optional(),
});

export async function createGoal(
  input: z.input<typeof createSchema>
): Promise<ActionResult<Goal>> {
  try {
    const user = await requireUser();
    const data = createSchema.parse(input);
    const goal = await prisma.goal.create({ data: { ...data, userId: user.id } });
    revalidatePath("/modes/ai-builder");
    return { success: true, data: goal };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function adjustGoalProgress(
  id: string,
  delta: number
): Promise<ActionResult<Goal>> {
  try {
    const user = await requireUser();
    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } });
    if (!existing) return { success: false, error: "Goal not found" };
    const value = Math.max(0, existing.currentValue + delta);
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        currentValue: value,
        status: value >= existing.targetValue ? "COMPLETED" : "ACTIVE",
      },
    });
    revalidatePath("/modes/ai-builder");
    return { success: true, data: goal };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function deleteGoal(id: string): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await prisma.goal.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/modes/ai-builder");
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
