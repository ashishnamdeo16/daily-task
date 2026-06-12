"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Play, Square, Timer } from "lucide-react";
import type { FocusSession, Task } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFocusStore } from "../use-focus-store";
import { AlarmModal } from "./alarm-modal";
import {
  abandonFocusSession,
  startFocusSession,
} from "@/server/actions/focus.actions";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Pomodoro", minutes: 25, type: "POMODORO" as const },
  { label: "Short", minutes: 50, type: "DEEP_WORK" as const },
  { label: "Deep Work", minutes: 90, type: "DEEP_WORK" as const },
];

function fmt(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${totalSeconds < 0 ? "+" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FocusClient({
  activeSession,
  tasks,
  initialTaskId,
}: {
  activeSession: FocusSession | null;
  tasks: Task[];
  initialTaskId?: string;
}) {
  const { session, expectedEndAt, alarmActive, setSession, triggerAlarm, reset } =
    useFocusStore();
  const [pending, start] = useTransition();
  const [now, setNow] = useState(() => Date.now());

  const defaultTaskId =
    initialTaskId && tasks.some((t) => t.id === initialTaskId) ? initialTaskId : "none";

  const [taskId, setTaskId] = useState<string>(defaultTaskId);
  const [minutes, setMinutes] = useState(25);
  const [type, setType] = useState<(typeof PRESETS)[number]["type"]>("POMODORO");

  useEffect(() => {
    if (initialTaskId && tasks.some((t) => t.id === initialTaskId)) {
      setTaskId(initialTaskId);
    }
  }, [initialTaskId, tasks]);

  // Seed store from server-provided active session.
  useEffect(() => {
    setSession(activeSession);
  }, [activeSession, setSession]);

  // Tick every second.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    if (!expectedEndAt) return null;
    return Math.round((expectedEndAt - now) / 1000);
  }, [expectedEndAt, now]);

  // Fire the alarm when the countdown elapses.
  useEffect(() => {
    if (session && remaining !== null && remaining <= 0 && !alarmActive) {
      triggerAlarm();
    }
  }, [session, remaining, alarmActive, triggerAlarm]);

  function handleStart() {
    start(async () => {
      const res = await startFocusSession({
        taskId: taskId === "none" ? undefined : taskId,
        minutes,
        type,
      });
      if (res.success) {
        setSession(res.data);
        toast.success("Focus session started");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleStop() {
    if (!session) return;
    start(async () => {
      await abandonFocusSession(session.id);
      reset();
      toast("Session ended");
    });
  }

  const totalSeconds = session ? session.plannedMinutes * 60 : minutes * 60;
  const progress =
    session && remaining !== null
      ? Math.min(100, Math.max(0, ((totalSeconds - remaining) / totalSeconds) * 100))
      : 0;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Focus</h1>
        <p className="text-sm text-muted-foreground">
          Start a session. When time&apos;s up, a mandatory alarm rings until you respond.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-10">
          <div className="relative flex h-56 w-56 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--muted)" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
                className="transition-all duration-300"
              />
            </svg>
            <div className="text-center">
              <div
                className={cn(
                  "font-mono text-5xl font-bold tabular-nums",
                  remaining !== null && remaining < 0 && "text-destructive"
                )}
              >
                {remaining !== null ? fmt(remaining) : fmt(minutes * 60)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {session ? session.label ?? "Focusing" : "Ready"}
              </p>
            </div>
          </div>

          {session ? (
            <Button size="lg" variant="destructive" onClick={handleStop} disabled={pending}>
              <Square className="h-4 w-4" /> End early
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-4">
              <div className="flex justify-center gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    variant={minutes === p.minutes ? "default" : "outline"}
                    onClick={() => {
                      setMinutes(p.minutes);
                      setType(p.type);
                    }}
                  >
                    {p.label} · {p.minutes}m
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Custom minutes</label>
                  <Input
                    type="number"
                    min={1}
                    max={600}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Task</label>
                  <Select
                    value={tasks.some((t) => t.id === taskId) ? taskId : "none"}
                    onValueChange={setTaskId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific task</SelectItem>
                      {tasks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button size="lg" onClick={handleStart} disabled={pending}>
                <Play className="h-4 w-4" /> Start focus session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Timer className="h-3.5 w-3.5" />
        Keep this tab open. The alarm uses your browser&apos;s audio and will loop until dismissed.
      </p>

      <AlarmModal />
    </div>
  );
}
