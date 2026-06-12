"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAlarm } from "../use-alarm";
import { useFocusStore } from "../use-focus-store";
import {
  completeFocusSession,
  snoozeFocusSession,
} from "@/server/actions/focus.actions";

export function AlarmModal() {
  const { session, alarmActive, clearAlarm, reset, setSession } = useFocusStore();
  const { start, stop } = useAlarm();
  const [pending, startTransition] = useTransition();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!alarmActive) return;
    start();
    const startedAt = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => {
      stop();
      clearInterval(id);
    };
  }, [alarmActive, start, stop]);

  if (!alarmActive || !session) return null;

  function endSession() {
    stop();
    startTransition(async () => {
      const res = await completeFocusSession(session!.id);
      if (res.success) toast.success(`Session done · +${res.data.xp} XP`);
      clearAlarm();
      reset();
    });
  }

  function continueSession() {
    stop();
    // Keep working: add 10 minutes of overtime before the alarm fires again.
    startTransition(async () => {
      const res = await snoozeFocusSession(session!.id, 10);
      if (res.success) setSession(res.data);
      clearAlarm();
    });
  }

  function snooze() {
    stop();
    startTransition(async () => {
      const res = await snoozeFocusSession(session!.id, 5);
      if (res.success) {
        setSession(res.data);
        toast("Snoozed 5 minutes");
      }
      clearAlarm();
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-destructive/95 p-6 text-white backdrop-blur">
      <div className="animate-alarm mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
        <BellRing className="h-12 w-12" />
      </div>
      <h1 className="text-3xl font-bold">Time&apos;s up!</h1>
      <p className="mt-2 text-lg opacity-90">{session.label ?? "Focus session"} complete</p>
      <p className="mt-1 text-sm opacity-70">Alarm ringing for {elapsed}s — dismiss to silence</p>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        <Button
          size="lg"
          variant="secondary"
          className="h-14 text-base"
          onClick={endSession}
          disabled={pending}
        >
          End Session
        </Button>
        <Button
          size="lg"
          className="h-14 bg-white text-base text-destructive hover:bg-white/90"
          onClick={continueSession}
          disabled={pending}
        >
          Continue Session
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 border-white/40 bg-transparent text-base text-white hover:bg-white/10"
          onClick={snooze}
          disabled={pending}
        >
          Snooze 5 Minutes
        </Button>
      </div>
    </div>
  );
}
