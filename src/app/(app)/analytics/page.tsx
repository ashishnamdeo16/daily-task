import { requireUser } from "@/server/auth";
import { getAnalytics } from "@/server/services/analytics.service";
import { StatCard } from "@/components/shared/stat-card";
import { AnalyticsCharts } from "@/features/analytics/components/analytics-charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getAnalytics(user.id, 30);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Your execution over the last 30 days.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="CalendarCheck" label="Completion" value={`${data.totals.completionPct}%`} accent="text-green-500" />
        <StatCard icon="Timer" label="Focus hours" value={data.totals.focusHours} accent="text-fuchsia-500" />
        <StatCard icon="ListTodo" label="Tasks done" value={data.totals.tasksCompleted} accent="text-blue-500" />
        <StatCard icon="Zap" label="XP earned" value={data.totals.xpEarned} accent="text-primary" />
      </div>

      <AnalyticsCharts data={data} />
    </div>
  );
}
