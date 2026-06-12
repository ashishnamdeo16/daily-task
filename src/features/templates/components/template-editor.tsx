"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_LIST, PRIORITIES } from "@/lib/constants";
import { createTemplate, updateTemplate } from "@/server/actions/template.actions";
import type { Category, Priority, TaskTemplate } from "@prisma/client";
import type { TemplateItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const EMPTY_ITEM: TemplateItem = { title: "", category: "DSA", priority: "HIGH" };

const selectClassName =
  "flex h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface EditorProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  template?: TaskTemplate | null;
}

function initialItems(template?: TaskTemplate | null): TemplateItem[] {
  if (!template) return [{ ...EMPTY_ITEM }];
  const saved = template.items as unknown as TemplateItem[];
  return Array.isArray(saved) && saved.length > 0
    ? saved.map((item) => ({ ...item }))
    : [{ ...EMPTY_ITEM }];
}

export function TemplateEditor({ open, onOpenChange, template }: EditorProps) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [name, setName] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [items, setItems] = useState<TemplateItem[]>([{ ...EMPTY_ITEM }]);

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? "");
    setDaysOfWeek(template?.daysOfWeek ?? []);
    setItems(initialItems(template));
  }, [open, template]);

  function updateItem(i: number, patch: Partial<TemplateItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { title: "", category: "OTHER", priority: "MEDIUM" }]);
  }

  function removeItem(i: number) {
    setItems((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length > 0 ? next : [{ ...EMPTY_ITEM }];
    });
  }

  function toggleDay(d: number) {
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function submit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    const cleanItems = items
      .filter((i) => i.title.trim())
      .map((item) => ({
        title: item.title.trim(),
        category: item.category,
        priority: item.priority,
        ...(item.targetCount != null && item.targetCount > 0
          ? { targetCount: item.targetCount }
          : {}),
        ...(item.unit?.trim() ? { unit: item.unit.trim() } : {}),
        ...(item.estimatedMinutes != null && item.estimatedMinutes > 0
          ? { estimatedMinutes: item.estimatedMinutes }
          : {}),
      }));

    if (cleanItems.length === 0) {
      toast.error("Add at least one task with a title");
      return;
    }

    start(async () => {
      try {
        const payload = {
          name: name.trim(),
          type: "CUSTOM" as const,
          daysOfWeek,
          items: cleanItems,
        };

        const res = template
          ? await updateTemplate(template.id, payload)
          : await createTemplate(payload);

        if (res.success) {
          toast.success(template ? "Template updated" : "Template created");
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.error ?? "Failed to save template");
        }
      } catch {
        toast.error("Failed to save template. Check your connection and try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[60] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : "New template"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="tname">Name</Label>
            <Input
              id="tname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work Day"
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Auto-apply on</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border text-xs font-medium",
                    daysOfWeek.includes(i)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tasks</Label>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto scrollbar-thin pr-1">
              {items.map((item, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
                  <Input
                    value={item.title}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                    placeholder="Task title (required)"
                    className="min-w-[140px] flex-1"
                  />
                  <select
                    className={cn(selectClassName, "w-36 shrink-0")}
                    value={item.category}
                    onChange={(e) => updateItem(i, { category: e.target.value as Category })}
                  >
                    {CATEGORY_LIST.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className={cn(selectClassName, "w-28 shrink-0")}
                    value={item.priority}
                    onChange={(e) => updateItem(i, { priority: e.target.value as Priority })}
                  >
                    {Object.entries(PRIORITIES).map(([k, m]) => (
                      <option key={k} value={k}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    value={item.targetCount ?? ""}
                    onChange={(e) =>
                      updateItem(i, {
                        targetCount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Qty"
                    className="w-16 shrink-0"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-fit">
              <Plus className="h-4 w-4" /> Add task
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Saving..." : "Save template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
