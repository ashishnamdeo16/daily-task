import { prisma } from "@/lib/prisma";
import { getAppTzDayUtcRange, todayDateInAppTz } from "@/lib/timezone";

export type TodayEvent = {
  id: string;
  title: string;
  link: string | null;
  notes: string | null;
  eventAt: string;
  allDay: boolean;
};

export async function getTodayEvents(userId: string): Promise<TodayEvent[]> {
  const { start, endExclusive } = getAppTzDayUtcRange(todayDateInAppTz());

  const rows = await prisma.upcomingEvent.findMany({
    where: {
      userId,
      eventAt: { gte: start, lt: endExclusive },
    },
    orderBy: [{ allDay: "desc" }, { eventAt: "asc" }],
  });

  return rows.map((e) => ({
    id: e.id,
    title: e.title,
    link: e.link,
    notes: e.notes,
    eventAt: e.eventAt.toISOString(),
    allDay: e.allDay,
  }));
}
