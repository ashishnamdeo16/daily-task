import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { EventsClient } from "@/features/events/components/events-client";
import type { EventRow } from "@/features/events/components/events-client";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await requireUser();
  const rows = await prisma.upcomingEvent.findMany({
    where: { userId: user.id },
    orderBy: { eventAt: "asc" },
  });

  const events: EventRow[] = rows.map((e) => ({
    id: e.id,
    title: e.title,
    link: e.link,
    notes: e.notes,
    eventAt: e.eventAt.toISOString(),
    allDay: e.allDay,
  }));

  return <EventsClient events={events} />;
}
