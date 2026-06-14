import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getTotalDebt } from "@/server/services/debt.service";
import { getTodayEvents } from "@/server/services/event.service";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TodayEventsBox } from "@/features/events/components/today-events-box";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [debt, todayEvents] = await Promise.all([
    getTotalDebt(user.id),
    getTodayEvents(user.id),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header streak={user.currentStreak} xp={user.xp} debt={debt} />
        <TodayEventsBox events={todayEvents} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
