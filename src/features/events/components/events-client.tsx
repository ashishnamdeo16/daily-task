"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/shared/stat-card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addEvent, deleteEvent, updateEvent } from "@/server/actions/event.actions";
import { APP_TIMEZONE, eventRelativeLabel, formatEventDateTime, utcToZonedInput } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export type EventRow = {
  id: string;
  title: string;
  link: string | null;
  notes: string | null;
  eventAt: string;
  allDay: boolean;
};

type FormState = {
  title: string;
  link: string;
  notes: string;
  date: string;
  time: string;
  allDay: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  link: "",
  notes: "",
  date: "",
  time: "09:00",
  allDay: false,
};

function defaultDate(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

export function EventsClient({ events }: { events: EventRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, date: defaultDate() });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);

  const now = Date.now();
  const { upcoming, past } = useMemo(() => {
    const up: EventRow[] = [];
    const pa: EventRow[] = [];
    for (const e of events) {
      if (new Date(e.eventAt).getTime() >= now) up.push(e);
      else pa.push(e);
    }
    pa.sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime());
    return { upcoming: up, past: pa };
  }, [events, now]);

  const thisWeek = upcoming.filter((e) => {
    const diff = new Date(e.eventAt).getTime() - now;
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: defaultDate() });
    setEditorOpen(true);
  }

  function openEdit(event: EventRow) {
    const { date, time } = utcToZonedInput(event.eventAt);
    setEditing(event);
    setForm({
      title: event.title,
      link: event.link ?? "",
      notes: event.notes ?? "",
      date,
      time: event.allDay ? "09:00" : time,
      allDay: event.allDay,
    });
    setEditorOpen(true);
  }

  function save() {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.date) return toast.error("Date is required");

    start(async () => {
      const payload = {
        title: form.title.trim(),
        link: form.link.trim(),
        notes: form.notes.trim(),
        date: form.date,
        time: form.allDay ? undefined : form.time,
        allDay: form.allDay,
      };

      const res = editing
        ? await updateEvent(editing.id, payload)
        : await addEvent(payload);

      if (res.success) {
        toast.success(editing ? "Event updated" : "Event added");
        setEditorOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove(event: EventRow) {
    start(async () => {
      const res = await deleteEvent(event.id);
      if (res.success) {
        toast.success("Event deleted");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="text-sm text-muted-foreground">
            Track interviews, deadlines, and meetups. Times shown in Pacific (PST/PDT).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add event
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon="Calendar" label="Upcoming" value={upcoming.length} accent="text-blue-500" />
        <StatCard icon="Clock" label="This week" value={thisWeek} accent="text-violet-500" />
        <StatCard icon="CalendarCheck" label="Past" value={past.length} accent="text-muted-foreground" />
        <StatCard icon="Pin" label="Timezone" value="Pacific" accent="text-primary" hint="PST / PDT" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap">
          <Input
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="min-w-[180px] flex-1"
          />
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full sm:w-40"
          />
          {!form.allDay && (
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="w-full sm:w-32"
            />
          )}
          <Input
            placeholder="Link (optional)"
            value={form.link}
            onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            className="min-w-[180px] flex-1"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))}
              className="rounded border-input"
            />
            All day
          </label>
          <Button
            onClick={save}
            disabled={pending}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" /> Quick add
          </Button>
        </CardContent>
      </Card>

      <EventSection title="Upcoming" events={upcoming} onEdit={openEdit} onRemove={remove} pending={pending} />
      {past.length > 0 && (
        <EventSection title="Past" events={past} onEdit={openEdit} onRemove={remove} pending={pending} muted />
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-date">Date (Pacific)</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              {!form.allDay && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-time">Time (Pacific)</Label>
                  <Input
                    id="event-time"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))}
                className="rounded border-input"
              />
              All-day event
            </label>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-link">Link</Label>
              <Input
                id="event-link"
                placeholder="https://..."
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-notes">Notes</Label>
              <Input
                id="event-notes"
                placeholder="Optional details"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {editing ? "Save changes" : "Add event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventSection({
  title,
  events,
  onEdit,
  onRemove,
  pending,
  muted = false,
}: {
  title: string;
  events: EventRow[];
  onEdit: (e: EventRow) => void;
  onRemove: (e: EventRow) => void;
  pending: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className={cn("text-sm font-semibold uppercase tracking-wide", muted && "text-muted-foreground")}>
        {title}
      </h2>
      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No {title.toLowerCase()} events.</p>
      ) : (
        events.map((e) => (
          <Card key={e.id} className={cn(muted && "opacity-70")}>
            <CardContent className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{e.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      eventRelativeLabel(e.eventAt) === "Past"
                        ? "bg-muted text-muted-foreground"
                        : eventRelativeLabel(e.eventAt) === "Today"
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {eventRelativeLabel(e.eventAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{formatEventDateTime(e.eventAt, e.allDay)}</p>
                {e.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.notes}</p>}
              </div>
              {e.link && (
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <a href={e.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Open
                  </a>
                </Button>
              )}
              <Button size="icon" variant="ghost" className="shrink-0" onClick={() => onEdit(e)} disabled={pending}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-destructive"
                onClick={() => onRemove(e)}
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
