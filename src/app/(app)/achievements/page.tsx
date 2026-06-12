import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/server/services/achievement.service";
import { getLevelProgress } from "@/lib/xp";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await requireUser();
  const unlocked = await prisma.achievement.findMany({ where: { userId: user.id } });
  const unlockedMap = new Map(unlocked.map((a) => [a.key, a]));
  const lvl = getLevelProgress(user.xp ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        <p className="text-sm text-muted-foreground">
          {unlocked.length}/{ACHIEVEMENTS.length} unlocked · Level {lvl.level}
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 bg-gradient-to-br from-primary/10 to-fuchsia-500/5 py-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-3xl font-extrabold text-primary-foreground">
            {lvl.level}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold">Level {lvl.level}</span>
              <span className="text-sm text-muted-foreground">{(user.xp ?? 0).toLocaleString()} XP total</span>
            </div>
            <Progress value={lvl.progress} className="my-2 h-3" />
            <p className="text-xs text-muted-foreground">
              {lvl.xpIntoLevel}/{lvl.xpForThisLevel} XP to level {lvl.level + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const earned = unlockedMap.get(a.key);
          return (
            <Card key={a.key} className={cn(!earned && "opacity-60")}>
              <CardContent className="flex items-center gap-4 py-5">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    earned ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon name={a.icon} className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{a.name}</p>
                    <span className="shrink-0 text-xs font-medium text-primary">+{a.xpReward} XP</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  {earned && (
                    <p className="mt-1 text-xs text-green-500">
                      Unlocked {new Date(earned.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
