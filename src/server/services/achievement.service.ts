import { prisma } from "@/lib/prisma";
import type { AchievementCategory } from "@prisma/client";
import { awardXp } from "./xp.service";

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  xpReward: number;
  /** Returns true when the achievement condition is met. */
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  currentStreak: number;
  longestStreak: number;
  totalApplications: number;
  mergedPRs: number;
  firstPR: boolean;
  dsaCompleted: number;
  totalXp: number;
  focusSessions: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "streak_7", name: "Consistency", description: "Maintain a 7 day streak", icon: "Flame", category: "STREAK", xpReward: 50, check: (c) => c.longestStreak >= 7 },
  { key: "streak_30", name: "Unstoppable", description: "Maintain a 30 day streak", icon: "Flame", category: "STREAK", xpReward: 200, check: (c) => c.longestStreak >= 30 },
  { key: "streak_100", name: "Machine", description: "Maintain a 100 day streak", icon: "Flame", category: "STREAK", xpReward: 1000, check: (c) => c.longestStreak >= 100 },
  { key: "apps_100", name: "Hustler", description: "Send 100 job applications", icon: "Briefcase", category: "JOB_SEARCH", xpReward: 150, check: (c) => c.totalApplications >= 100 },
  { key: "apps_500", name: "Relentless", description: "Send 500 job applications", icon: "Briefcase", category: "JOB_SEARCH", xpReward: 500, check: (c) => c.totalApplications >= 500 },
  { key: "dsa_50", name: "Problem Solver", description: "Complete 50 LeetCode problems", icon: "Code2", category: "DSA", xpReward: 100, check: (c) => c.dsaCompleted >= 50 },
  { key: "dsa_100", name: "Algorithmist", description: "Complete 100 LeetCode problems", icon: "Code2", category: "DSA", xpReward: 250, check: (c) => c.dsaCompleted >= 100 },
  { key: "pr_first", name: "Open Sourcer", description: "Open your first PR", icon: "GitPullRequest", category: "OPEN_SOURCE", xpReward: 50, check: (c) => c.firstPR },
  { key: "pr_merged_10", name: "Contributor", description: "Get 10 PRs merged", icon: "GitMerge", category: "OPEN_SOURCE", xpReward: 300, check: (c) => c.mergedPRs >= 10 },
  { key: "focus_50", name: "Deep Worker", description: "Complete 50 focus sessions", icon: "Timer", category: "FOCUS", xpReward: 150, check: (c) => c.focusSessions >= 50 },
  { key: "xp_1000", name: "Level Grinder", description: "Earn 1,000 total XP", icon: "Zap", category: "XP", xpReward: 100, check: (c) => c.totalXp >= 1000 },
];

async function buildContext(userId: string): Promise<AchievementContext> {
  const [user, totalApplications, mergedPRs, anyPR, dsaCompleted, focusSessions] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.applicationTracker.count({ where: { userId } }),
      prisma.openSourceTracker.count({ where: { userId, prMerged: true } }),
      prisma.openSourceTracker.count({ where: { userId, prCreated: true } }),
      prisma.task.count({ where: { userId, category: "DSA", status: "COMPLETED" } }),
      prisma.focusSession.count({ where: { userId, status: "COMPLETED" } }),
    ]);

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalApplications,
    mergedPRs,
    firstPR: anyPR > 0,
    dsaCompleted,
    totalXp: user.xp,
    focusSessions,
  };
}

/**
 * Evaluate all achievement rules and unlock any newly-earned ones.
 * Returns the list of newly unlocked achievements.
 */
export async function checkAchievements(userId: string) {
  const [ctx, unlocked] = await Promise.all([
    buildContext(userId),
    prisma.achievement.findMany({ where: { userId }, select: { key: true } }),
  ]);
  const unlockedKeys = new Set(unlocked.map((a) => a.key));

  const newlyUnlocked: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (unlockedKeys.has(def.key)) continue;
    if (def.check(ctx)) newlyUnlocked.push(def);
  }

  for (const def of newlyUnlocked) {
    await prisma.achievement.create({
      data: {
        userId,
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        xpReward: def.xpReward,
      },
    });
    if (def.xpReward > 0) {
      await awardXp({
        userId,
        amount: def.xpReward,
        reason: `Achievement: ${def.name}`,
        source: "achievement",
        refId: def.key,
      });
    }
  }

  return newlyUnlocked;
}
