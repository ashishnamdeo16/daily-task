import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, weekStart } from "@/lib/date";
import { WeeklyClient } from "@/features/weekly/components/weekly-client";

export const dynamic = "force-dynamic";

export default async function WeeklyPage() {
  const user = await requireUser();
  const ws = weekStart();

  const goals = await prisma.weeklyGoal.findMany({
    where: { userId: user.id, weekStart: ws },
    orderBy: { rank: "asc" },
  });

  return <WeeklyClient goals={goals} weekLabel={formatDate(ws, "MMMM d, yyyy")} />;
}
