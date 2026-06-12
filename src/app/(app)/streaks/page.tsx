import { requireUser } from "@/server/auth";
import {
  getCompletionStats,
  getHeatmap,
} from "@/server/services/streak.service";
import { getDebtByCategory, getTotalDebt } from "@/server/services/debt.service";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heatmap } from "@/features/streaks/components/heatmap";
import { DebtBanner } from "@/features/dashboard/components/debt-banner";
import { formatISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function StreaksPage() {
  const user = await requireUser();

  const to = new Date();
  const from = new Date(to);
  from.setUTCFullYear(from.getUTCFullYear() - 1);

  const [stats, cells, totalDebt, debtByCategory] = await Promise.all([
    getCompletionStats(user.id),
    getHeatmap(user.id, from, to),
    getTotalDebt(user.id),
    getDebtByCategory(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Streaks</h1>
        <p className="text-sm text-muted-foreground">
          Complete each day to keep the chain alive. Miss a day and it breaks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="Flame" label="Current Streak" value={`${user.currentStreak}d`} accent="text-orange-500" />
        <StatCard icon="Trophy" label="Longest Streak" value={`${user.longestStreak}d`} accent="text-amber-500" />
        <StatCard icon="CalendarCheck" label="Monthly" value={`${stats.monthlyPct}%`} accent="text-green-500" hint={`${stats.daysActiveThisMonth} active days`} />
        <StatCard icon="TrendingUp" label="Yearly" value={`${stats.yearlyPct}%`} accent="text-blue-500" hint={`${stats.daysActiveThisYear} active days`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap cells={cells} from={formatISODate(from)} to={formatISODate(to)} />
        </CardContent>
      </Card>

      <DebtBanner total={totalDebt} byCategory={debtByCategory} />
    </div>
  );
}
