"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import type { Task, TaskStatus } from "@prisma/client";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { moveTask } from "@/server/actions/task.actions";

type Columns = Record<TaskStatus, Task[]>;

const STATUSES = KANBAN_COLUMNS.map((c) => c.value);

function groupTasks(tasks: Task[]): Columns {
  const cols = { TODO: [], IN_PROGRESS: [], COMPLETED: [], SKIPPED: [], RESCHEDULED: [] } as Columns;
  for (const t of tasks) (cols[t.status] ??= []).push(t);
  for (const s of Object.keys(cols) as TaskStatus[]) {
    cols[s].sort((a, b) => a.position - b.position);
  }
  return cols;
}

export function KanbanBoard({ dayId, initialTasks }: { dayId: string; initialTasks: Task[] }) {
  const [columns, setColumns] = useState<Columns>(() => groupTasks(initialTasks));
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Re-sync when server data changes (e.g. after revalidation).
  useEffect(() => {
    setColumns(groupTasks(initialTasks));
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

  const taskIndex = useMemo(() => {
    const map = new Map<string, TaskStatus>();
    (Object.keys(columns) as TaskStatus[]).forEach((status) =>
      columns[status].forEach((t) => map.set(t.id, status))
    );
    return map;
  }, [columns]);

  function findContainer(id: string): TaskStatus | undefined {
    if (STATUSES.includes(id as TaskStatus)) return id as TaskStatus;
    return taskIndex.get(id);
  }

  function handleDragStart(e: DragStartEvent) {
    const task = e.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const from = findContainer(activeId);
    const to = findContainer(overId);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const fromItems = [...prev[from]];
      const toItems = [...prev[to]];
      const movingIndex = fromItems.findIndex((t) => t.id === activeId);
      if (movingIndex === -1) return prev;
      const [moving] = fromItems.splice(movingIndex, 1);

      const overIndex = toItems.findIndex((t) => t.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : toItems.length;
      toItems.splice(insertAt, 0, { ...moving, status: to });

      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const container = findContainer(overId);
    if (!container) return;

    let newIndex = columns[container].findIndex((t) => t.id === overId);
    if (newIndex === -1) newIndex = columns[container].length;

    // Same-column reorder
    setColumns((prev) => {
      const items = prev[container];
      const oldIndex = items.findIndex((t) => t.id === activeId);
      if (oldIndex === -1 || oldIndex === newIndex) return prev;
      return { ...prev, [container]: arrayMove(items, oldIndex, newIndex) };
    });

    const finalIndex = Math.max(
      0,
      columns[container].findIndex((t) => t.id === activeId)
    );

    const res = await moveTask({
      taskId: activeId,
      status: container,
      position: finalIndex === -1 ? newIndex : finalIndex,
    });
    if (!res.success) {
      toast.error(res.error);
    } else if (container === "COMPLETED") {
      toast.success(`+${res.data.xpValue} XP`);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.value}
            status={col.value}
            label={col.label}
            tasks={columns[col.value] ?? []}
            dayId={dayId}
          />
        ))}
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
