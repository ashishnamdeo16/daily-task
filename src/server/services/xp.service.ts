import { prisma } from "@/lib/prisma";
import { levelForXp } from "@/lib/xp";

interface AwardXpInput {
  userId: string;
  amount: number;
  reason: string;
  source: string; // "task" | "achievement" | "streak" | "focus"
  refId?: string;
}

export interface AwardXpResult {
  totalXp: number;
  level: number;
  leveledUp: boolean;
  previousLevel: number;
}

export async function awardXp({
  userId,
  amount,
  reason,
  source,
  refId,
}: AwardXpInput): Promise<AwardXpResult> {
  if (amount === 0) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { totalXp: user.xp, level: user.level, leveledUp: false, previousLevel: user.level };
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const previousLevel = user.level;
    const totalXp = Math.max(0, user.xp + amount);
    const level = levelForXp(totalXp);

    await tx.user.update({
      where: { id: userId },
      data: { xp: totalXp, level },
    });

    await tx.xPLog.create({
      data: { userId, amount, reason, source, refId },
    });

    return { totalXp, level, leveledUp: level > previousLevel, previousLevel };
  });

  return result;
}
