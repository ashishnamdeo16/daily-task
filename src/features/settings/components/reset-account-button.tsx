"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetAccount } from "@/server/actions/reset.actions";

export function ResetAccountButton({ variant = "header" }: { variant?: "header" | "settings" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, start] = useTransition();

  function handleReset() {
    if (confirmText !== "RESET") {
      toast.error('Type "RESET" to confirm');
      return;
    }

    start(async () => {
      const res = await resetAccount();
      if (res.success) {
        toast.success("Account reset — starting fresh!");
        setOpen(false);
        setConfirmText("");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      {variant === "header" ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setOpen(true)}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      ) : (
        <Button variant="destructive" onClick={() => setOpen(true)}>
          <RotateCcw className="h-4 w-4" />
          Reset everything
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setConfirmText("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset everything?</DialogTitle>
            <DialogDescription>
              This permanently clears all tasks, days, streaks, XP, debt, focus sessions,
              achievements, job applications, open source items, events, and custom templates.
              Your default Work Day and Weekend templates will be restored.
            </DialogDescription>
          </DialogHeader>

          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Streaks, XP, and level → 0</li>
            <li>All task history and debt → deleted</li>
            <li>Tracker data (jobs, OSS, events) → deleted</li>
            <li>Settings preferences → kept</li>
          </ul>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reset-confirm">Type RESET to confirm</Label>
            <Input
              id="reset-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={pending || confirmText !== "RESET"}
            >
              {pending ? "Resetting…" : "Reset all data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
