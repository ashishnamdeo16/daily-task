"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getOrCreateDay, recomputeDayMetrics } from "@/server/services/day.service";
import { CATEGORIES } from "@/lib/constants";
import type { ActionResult, TemplateItem } from "@/lib/types";
import type { TaskTemplate } from "@prisma/client";

const categoryEnum = z.enum([
  "JOB_APPLICATION", "DSA", "OPEN_SOURCE", "AI_PROJECT",
  "NETWORKING", "FITNESS", "LEARNING", "CONTENT", "OTHER",
]);
const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

const itemSchema = z.object({
  title: z.string().min(1).max(200),
  category: categoryEnum,
  priority: priorityEnum.default("MEDIUM"),
  targetCount: z.coerce.number().int().min(0).optional(),
  unit: z.string().max(40).optional(),
  estimatedMinutes: z.coerce.number().int().min(0).optional(),
});

const templateSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  type: z.enum(["WORK_DAY", "WEEKEND", "CUSTOM"]).default("CUSTOM"),
  icon: z.string().max(40).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  items: z.array(itemSchema).min(1),
});

export async function createTemplate(
  input: z.input<typeof templateSchema>
): Promise<ActionResult<TaskTemplate>> {
  try {
    const user = await requireUser();
    const data = templateSchema.parse(input);

    const template = await prisma.taskTemplate.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description,
        type: data.type,
        icon: data.icon,
        daysOfWeek: data.daysOfWeek,
        items: data.items as unknown as object[],
      },
    });
    revalidatePath("/templates");
    return { success: true, data: template };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function updateTemplate(
  templateId: string,
  input: z.input<typeof templateSchema>
): Promise<ActionResult<TaskTemplate>> {
  try {
    const user = await requireUser();
    const data = templateSchema.parse(input);
    const existing = await prisma.taskTemplate.findFirst({
      where: { id: templateId, userId: user.id },
    });
    if (!existing) return { success: false, error: "Template not found" };

    const template = await prisma.taskTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        icon: data.icon,
        daysOfWeek: data.daysOfWeek,
        items: data.items as unknown as object[],
      },
    });
    revalidatePath("/templates");
    return { success: true, data: template };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function deleteTemplate(templateId: string): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    const existing = await prisma.taskTemplate.findFirst({
      where: { id: templateId, userId: user.id },
    });
    if (!existing) return { success: false, error: "Template not found" };
    await prisma.taskTemplate.delete({ where: { id: templateId } });
    revalidatePath("/templates");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

/** Apply a template's items to today's board (in addition to existing tasks). */
export async function applyTemplateToToday(
  templateId: string
): Promise<ActionResult<{ added: number }>> {
  try {
    const user = await requireUser();
    const template = await prisma.taskTemplate.findFirst({
      where: { id: templateId, userId: user.id },
    });
    if (!template) return { success: false, error: "Template not found" };

    const day = await getOrCreateDay(user.id);
    const items = (template.items as unknown as TemplateItem[]) ?? [];
    const max = await prisma.task.aggregate({
      where: { dayId: day.id, status: "TODO" },
      _max: { position: true },
    });
    let pos = (max._max.position ?? -1) + 1;

    if (items.length === 0) {
      return { success: false, error: "Template has no tasks" };
    }

    await prisma.task.createMany({
      data: items.map((item) => ({
        userId: user.id,
        dayId: day.id,
        title: item.title,
        category: item.category,
        priority: item.priority,
        status: "TODO" as const,
        position: pos++,
        targetCount: item.targetCount ?? null,
        unit: item.unit ?? null,
        xpValue: item.xpValue ?? CATEGORIES[item.category].defaultXp,
        estimatedMinutes: item.estimatedMinutes ?? null,
      })),
    });

    await recomputeDayMetrics(day.id);
    revalidatePath("/dashboard");
    revalidatePath("/templates");
    return { success: true, data: { added: items.length } };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function setDefaultTemplate(templateId: string | null): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await prisma.settings.update({
      where: { userId: user.id },
      data: { defaultTemplateId: templateId },
    });
    revalidatePath("/templates");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

function msg(err: unknown): string {
  if (err instanceof z.ZodError) return err.issues[0]?.message ?? "Invalid input";
  if (err instanceof Error) return err.message;
  console.error(err);
  return "Something went wrong";
}
