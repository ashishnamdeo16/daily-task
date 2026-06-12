import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { AiBuilderClient } from "@/features/modes/components/ai-builder-client";

export const dynamic = "force-dynamic";

export default async function AiBuilderPage() {
  const user = await requireUser();

  const [goals, tasksCompleted, focusAgg] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: user.id, category: "AI_PROJECT" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.count({ where: { userId: user.id, category: "AI_PROJECT", status: "COMPLETED" } }),
    prisma.focusSession.aggregate({
      where: { userId: user.id, status: "COMPLETED", task: { category: "AI_PROJECT" } },
      _sum: { actualMinutes: true },
    }),
  ]);

  const focusHours = Math.round(((focusAgg._sum.actualMinutes ?? 0) / 60) * 10) / 10;

  return <AiBuilderClient goals={goals} tasksCompleted={tasksCompleted} focusHours={focusHours} />;
}
