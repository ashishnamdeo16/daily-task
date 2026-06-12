"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "@prisma/client";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";
import { useBoardStore } from "../use-board-store";

const COLUMN_ACCENT: Record<string, string> = {
  TODO: "border-t-slate-400",
  IN_PROGRESS: "border-t-blue-500",
  COMPLETED: "border-t-green-500",
  SKIPPED: "border-t-red-500",
};

export function KanbanColumn({
  status,
  label,
  tasks,
  dayId,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  dayId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const openCreate = useBoardStore((s) => s.openCreate);

  return (
    <div
      className={cn(
        "flex h-full min-h-[60vh] flex-col rounded-xl border border-t-2 bg-card/50",
        COLUMN_ACCENT[status]
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {label}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        {status === "TODO" && (
          <button
            onClick={() => openCreate(dayId, "TODO")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Add task"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0 scrollbar-thin transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-8 text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
