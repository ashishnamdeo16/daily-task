"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { closeDay } from "@/server/actions/review.actions";

const MOODS = ["😞", "😕", "😐", "🙂", "🤩"];

export function ReviewDialog({
  dayId,
  open,
  onOpenChange,
}: {
  dayId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [wins, setWins] = useState("");
  const [failures, setFailures] = useState("");
  const [lessons, setLessons] = useState("");
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState(3);

  function submit() {
    startTransition(async () => {
      const res = await closeDay({ dayId, wins, failures, lessons, notes, mood });
      if (res.success) {
        toast.success(`Day closed — score ${res.data.score}%, streak ${res.data.streak}d`);
        onOpenChange(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End of day review</DialogTitle>
          <DialogDescription>
            Reflect on today before closing it. This is stored permanently.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>How did today feel?</Label>
            <div className="flex gap-2">
              {MOODS.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMood(i + 1)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-all ${
                    mood === i + 1 ? "border-primary bg-primary/10 scale-110" : "hover:bg-accent"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="wins">Wins</Label>
            <Textarea id="wins" value={wins} onChange={(e) => setWins(e.target.value)} placeholder="What went well?" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="failures">Failures</Label>
            <Textarea id="failures" value={failures} onChange={(e) => setFailures(e.target.value)} placeholder="What didn't get done?" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lessons">Lessons learned</Label>
            <Textarea id="lessons" value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="What will you change tomorrow?" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Later
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Closing..." : "Close the day"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
