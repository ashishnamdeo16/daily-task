"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewDialog } from "./review-dialog";

export function EndOfDayReminder({
  dayId,
  endOfDayHour,
  isClosed,
  openTasks,
}: {
  dayId: string;
  endOfDayHour: number;
  isClosed: boolean;
  openTasks: number;
}) {
  const [open, setOpen] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setShowReminder(!isClosed && hour >= endOfDayHour);
  }, [endOfDayHour, isClosed]);

  if (isClosed || !showReminder) return null;

  return (
    <>
      <Card className="flex flex-wrap items-center gap-3 border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 font-semibold">
          <Moon className="h-5 w-5 text-primary" />
          Review today&apos;s progress
        </div>
        <p className="text-sm text-muted-foreground">
          {openTasks > 0
            ? `${openTasks} task${openTasks === 1 ? "" : "s"} still open. Resolve them, then close the day.`
            : "Wrap up the day to lock in your streak."}
        </p>
        <Button size="sm" className="ml-auto" onClick={() => setOpen(true)}>
          Start review
        </Button>
      </Card>
      <ReviewDialog dayId={dayId} open={open} onOpenChange={setOpen} />
    </>
  );
}
