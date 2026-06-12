"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LIST, PRIORITIES } from "@/lib/constants";
import { useBoardStore } from "../use-board-store";
import { createTask, updateTask } from "@/server/actions/task.actions";
import type { Category, Priority } from "@prisma/client";

export function TaskDialog() {
  const { dialogOpen, editingTask, dayId, close } = useBoardStore();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("OTHER");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [targetCount, setTargetCount] = useState("");
  const [unit, setUnit] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");

  useEffect(() => {
    if (dialogOpen) {
      setTitle(editingTask?.title ?? "");
      setDescription(editingTask?.description ?? "");
      setCategory((editingTask?.category as Category) ?? "OTHER");
      setPriority((editingTask?.priority as Priority) ?? "MEDIUM");
      setTargetCount(editingTask?.targetCount?.toString() ?? "");
      setUnit(editingTask?.unit ?? "");
      setEstimatedMinutes(editingTask?.estimatedMinutes?.toString() ?? "");
    }
  }, [dialogOpen, editingTask]);

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        targetCount: targetCount ? Number(targetCount) : undefined,
        unit: unit.trim() || undefined,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      };

      const res = editingTask
        ? await updateTask({ taskId: editingTask.id, ...payload })
        : await createTask({ dayId: dayId!, ...payload });

      if (res.success) {
        toast.success(editingTask ? "Task updated" : "Task added");
        close();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingTask ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apply to 20 jobs"
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_LIST.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITIES).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                min={0}
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
                placeholder="20"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="apps"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mins">Minutes</Label>
              <Input
                id="mins"
                type="number"
                min={0}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="90"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Saving..." : editingTask ? "Save" : "Add task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
