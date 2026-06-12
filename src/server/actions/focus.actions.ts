"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getOrCreateDay, recomputeDayMetrics } from "@/server/services/day.service";
import { awardXp } from "@/server/services/xp.service";
import { checkAchievements } from "@/server/services/achievement.service";
import { XP_REWARDS } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";
import type { FocusSession } from "@prisma/client";

const startSchema = z.object({
  taskId: z.string().optional(),
  label: z.string().max(120).optional(),
  type: z.enum(["POMODORO", "CUSTOM", "DEEP_WORK"]).default("CUSTOM"),
  minutes: z.coerce.number().int().min(1).max(600),
});

export async function startFocusSession(
  input: z.input<typeof startSchema>
): Promise<ActionResult<FocusSession>> {
  try {
    const user = await requireUser();
    const data = startSchema.parse(input);

    // Only one active session at a time — abandon any stragglers.
    await prisma.focusSession.updateMany({
      where: { userId: user.id, status: "ACTIVE" },
      data: { status: "ABANDONED", endedAt: new Date() },
    });

    const day = await getOrCreateDay(user.id);
    const now = new Date();
    const expectedEndAt = new Date(now.getTime() + data.minutes * 60_000);

    let label = data.label;
    if (data.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: data.taskId, userId: user.id },
      });
      if (task) {
        label = label ?? task.title;
        if (task.status === "TODO") {
          await prisma.task.update({ where: { id: task.id }, data: { status: "IN_PROGRESS" } });
        }
      }
    }

    const session = await prisma.focusSession.create({
      data: {
        userId: user.id,
        dayId: day.id,
        taskId: data.taskId || null,
        type: data.type,
        label,
        plannedMinutes: data.minutes,
        startedAt: now,
        expectedEndAt,
      },
    });

    revalidatePath("/focus");
    revalidatePath("/dashboard");
    return { success: true, data: session };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function completeFocusSession(
  sessionId: string
): Promise<ActionResult<{ minutes: number; xp: number }>> {
  try {
    const user = await requireUser();
    const session = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) return { success: false, error: "Session not found" };
    if (session.status === "COMPLETED")
      return { success: true, data: { minutes: session.actualMinutes ?? 0, xp: 0 } };

    const now = new Date();
    const actualMinutes = Math.max(
      1,
      Math.round((now.getTime() - session.startedAt.getTime()) / 60_000)
    );

    await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        endedAt: now,
        actualMinutes,
        alarmTriggered: true,
        alarmDismissed: true,
      },
    });

    // XP scales with focused time (5 XP per 25 min block, min 5).
    const xp = Math.max(XP_REWARDS.FOCUS_SESSION_25, Math.round((actualMinutes / 25) * XP_REWARDS.FOCUS_SESSION_25));
    await awardXp({
      userId: user.id,
      amount: xp,
      reason: `Focus session (${actualMinutes}m)`,
      source: "focus",
      refId: sessionId,
    });

    if (session.dayId) await recomputeDayMetrics(session.dayId);
    await checkAchievements(user.id);

    revalidatePath("/focus");
    revalidatePath("/dashboard");
    return { success: true, data: { minutes: actualMinutes, xp } };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function snoozeFocusSession(
  sessionId: string,
  minutes = 5
): Promise<ActionResult<FocusSession>> {
  try {
    const user = await requireUser();
    const session = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) return { success: false, error: "Session not found" };

    const expectedEndAt = new Date(Date.now() + minutes * 60_000);
    const updated = await prisma.focusSession.update({
      where: { id: sessionId },
      data: { expectedEndAt, snoozeCount: { increment: 1 }, alarmTriggered: false },
    });
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function abandonFocusSession(sessionId: string): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await prisma.focusSession.updateMany({
      where: { id: sessionId, userId: user.id, status: "ACTIVE" },
      data: { status: "ABANDONED", endedAt: new Date() },
    });
    revalidatePath("/focus");
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
