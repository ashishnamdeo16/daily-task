import Link from "next/link";
import { Bell, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEventTime, formatTodayHeading } from "@/lib/timezone";
import type { TodayEvent } from "@/server/services/event.service";

export function TodayEventsBox({ events }: { events: TodayEvent[] }) {
  if (events.length === 0) return null;

  return (
    <Card className="mx-4 mt-4 border-blue-500/30 bg-blue-500/5 md:mx-6">
      <CardContent className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Today&apos;s events</p>
              <p className="text-xs text-muted-foreground">
                {formatTodayHeading()} · Pacific time
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/events">
              <Calendar className="h-4 w-4" />
              All events
            </Link>
          </Button>
        </div>

        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border bg-background/80 px-3 py-2.5"
            >
              <span className="w-24 shrink-0 text-xs font-medium tabular-nums text-blue-600 dark:text-blue-400">
                {formatEventTime(event.eventAt, event.allDay)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{event.title}</p>
                {event.notes && (
                  <p className="truncate text-xs text-muted-foreground">{event.notes}</p>
                )}
              </div>
              {event.link && (
                <Button asChild size="sm" variant="ghost" className="shrink-0">
                  <a href={event.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </a>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
