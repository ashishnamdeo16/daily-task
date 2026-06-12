import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDay } from "@/server/services/day.service";
import { FocusClient } from "@/features/focus/components/focus-client";

export const dynamic = "force-dynamic";

export default async function FocusPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const user = await requireUser();
  const { taskId } = await searchParams;

  const [activeSession, day] = await Promise.all([
    prisma.focusSession.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
    }),
    getOrCreateDay(user.id),
  ]);

  const tasks = day.tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "SKIPPED");
  const validTaskId =
    taskId && tasks.some((t) => t.id === taskId) ? taskId : undefined;

  return (
    <FocusClient
      activeSession={activeSession}
      tasks={tasks}
      initialTaskId={validTaskId}
    />
  );
}
