"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import type { ActionResult } from "@/lib/types";

const schema = z.object({
  enableNotifications: z.boolean().optional(),
  enableAlarmSound: z.boolean().optional(),
  autoCarryDebt: z.boolean().optional(),
  endOfDayHour: z.coerce.number().int().min(0).max(23).optional(),
  pomodoroMinutes: z.coerce.number().int().min(1).max(120).optional(),
});

export async function updateSettings(
  input: z.input<typeof schema>
): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    const data = schema.parse(input);
    await prisma.settings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
    revalidatePath("/settings");
    return { success: true, data: null };
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0]?.message ?? "Invalid input" };
    console.error(err);
    return { success: false, error: "Something went wrong" };
  }
}
