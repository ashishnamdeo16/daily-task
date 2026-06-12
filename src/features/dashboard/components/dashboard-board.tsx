"use client";

import { Plus } from "lucide-react";
import type { Task } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "./kanban-board";
import { TaskDialog } from "./task-dialog";
import { useBoardStore } from "../use-board-store";

export function DashboardBoard({ dayId, tasks }: { dayId: string; tasks: Task[] }) {
  const openCreate = useBoardStore((s) => s.openCreate);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Today&apos;s board</h2>
        <Button size="sm" onClick={() => openCreate(dayId, "TODO")}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>
      <KanbanBoard dayId={dayId} initialTasks={tasks} />
      <TaskDialog />
    </div>
  );
}
