import { Suspense } from "react";
import { requireUser } from "@/server/auth";
import { getOrCreateDay } from "@/server/services/day.service";
import { getDebtByCategory, getTotalDebt } from "@/server/services/debt.service";
import { formatDate, todayDateOnly } from "@/lib/date";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardBoard } from "@/features/dashboard/components/dashboard-board";
import { DebtBanner } from "@/features/dashboard/components/debt-banner";
import { EndOfDayReminder } from "@/features/review/components/end-of-day-reminder";

export const dynamic = "force-dynamic";

async function DashboardContent() {
  const user = await requireUser();
  const day = await getOrCreateDay(user.id);
  const [totalDebt, debtByCategory] = await Promise.all([
    getTotalDebt(user.id),
    getDebtByCategory(user.id),
  ]);

  const remaining = day.tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
  ).length;
  const activeFocus = day.focusSessions.filter((f) => f.status === "ACTIVE").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{formatDate(todayDateOnly())}</h1>
        <p className="text-sm text-muted-foreground">
          {day.isClosed ? "Day closed — reviewed." : "Let's execute. One task at a time."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard icon="Flame" label="Streak" value={`${user.currentStreak}d`} accent="text-orange-500" hint={`Longest ${user.longestStreak}d`} />
        <StatCard icon="CalendarCheck" label="Daily Score" value={`${day.score}%`} accent="text-green-500" hint={`${day.completedTasks}/${day.totalTasks} done`} />
        <StatCard icon="ListTodo" label="Remaining" value={remaining} accent="text-blue-500" />
        <StatCard icon="Timer" label="Focus" value={`${day.focusMinutes}m`} accent="text-fuchsia-500" hint={`${activeFocus} active`} />
        <StatCard icon="Activity" label="Debt" value={totalDebt} accent="text-destructive" />
      </div>

      <DebtBanner total={totalDebt} byCategory={debtByCategory} />

      <DashboardBoard dayId={day.id} tasks={day.tasks} />

      <EndOfDayReminder
        dayId={day.id}
        endOfDayHour={21}
        isClosed={day.isClosed}
        openTasks={remaining}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
