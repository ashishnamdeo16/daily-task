import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bootstrapDefaultTemplates } from "@/lib/bootstrap";

/**
 * Wipes all progress and tracker data for a user, zeros gamification stats,
 * and re-provisions default Work Day / Weekend templates.
 */
export async function resetAllUserData(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.focusSession.deleteMany({ where: { userId } }),
    prisma.debtRecord.deleteMany({ where: { userId } }),
    prisma.task.deleteMany({ where: { userId } }),
    prisma.dailyReview.deleteMany({ where: { userId } }),
    prisma.day.deleteMany({ where: { userId } }),
    prisma.taskTemplate.deleteMany({ where: { userId } }),
    prisma.weeklyGoal.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.achievement.deleteMany({ where: { userId } }),
    prisma.xPLog.deleteMany({ where: { userId } }),
    prisma.activityLog.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.applicationTracker.deleteMany({ where: { userId } }),
    prisma.openSourceTracker.deleteMany({ where: { userId } }),
    prisma.upcomingEvent.deleteMany({ where: { userId } }),
    prisma.settings.updateMany({
      where: { userId },
      data: {
        defaultTemplateId: null,
        pushSubscription: Prisma.JsonNull,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
      },
    }),
  ]);

  await bootstrapDefaultTemplates(userId, { force: true });
}
