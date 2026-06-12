"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { recomputeDayMetrics } from "@/server/services/day.service";
import { recomputeStreak, STREAK_THRESHOLD } from "@/server/services/streak.service";
import { awardXp } from "@/server/services/xp.service";
import { checkAchievements } from "@/server/services/achievement.service";
import { XP_REWARDS } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

const reviewSchema = z.object({
  dayId: z.string().min(1),
  notes: z.string().max(4000).optional(),
  wins: z.string().max(4000).optional(),
  failures: z.string().max(4000).optional(),
  lessons: z.string().max(4000).optional(),
  mood: z.coerce.number().int().min(1).max(5).optional(),
});

export async function closeDay(
  input: z.input<typeof reviewSchema>
): Promise<ActionResult<{ score: number; streak: number }>> {
  try {
    const user = await requireUser();
    const data = reviewSchema.parse(input);

    const day = await prisma.day.findFirst({
      where: { id: data.dayId, userId: user.id },
    });
    if (!day) return { success: false, error: "Day not found" };

    await prisma.dailyReview.upsert({
      where: { dayId: day.id },
      create: {
        userId: user.id,
        dayId: day.id,
        notes: data.notes,
        wins: data.wins,
        failures: data.failures,
        lessons: data.lessons,
        mood: data.mood,
      },
      update: {
        notes: data.notes,
        wins: data.wins,
        failures: data.failures,
        lessons: data.lessons,
        mood: data.mood,
      },
    });

    const metrics = await recomputeDayMetrics(day.id);
    const maintained = metrics.score >= STREAK_THRESHOLD;

    await prisma.day.update({
      where: { id: day.id },
      data: { isClosed: true, streakMaintained: maintained },
    });

    if (!day.isClosed) {
      await awardXp({
        userId: user.id,
        amount: XP_REWARDS.DAY_COMPLETE,
        reason: "Closed the day",
        source: "day",
        refId: day.id,
      });
    }

    const streak = await recomputeStreak(user.id);
    await checkAchievements(user.id);

    revalidatePath("/dashboard");
    revalidatePath("/streaks");
    return { success: true, data: { score: metrics.score, streak: streak.current } };
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0]?.message ?? "Invalid input" };
    console.error(err);
    return { success: false, error: "Something went wrong" };
  }
}
