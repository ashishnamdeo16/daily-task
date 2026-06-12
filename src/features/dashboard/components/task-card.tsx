"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { GripVertical, Minus, MoreVertical, Pencil, Plus, Timer, Trash2 } from "lucide-react";
import type { Task } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryBadge, PriorityDot } from "@/components/shared/category-badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useBoardStore } from "../use-board-store";
import { adjustTaskCount, deleteTask } from "@/server/actions/task.actions";

export function TaskCard({ task, overlay }: { task: Task; overlay?: boolean }) {
  const router = useRouter();
  const openEdit = useBoardStore((s) => s.openEdit);
  const [pending, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const required = (task.targetCount ?? 0) + task.debtCount;
  const isQuantitative = task.targetCount != null && required > 0;
  const progress = isQuantitative ? Math.min(100, (task.completedCount / required) * 100) : 0;

  function adjust(delta: number) {
    startTransition(async () => {
      const res = await adjustTaskCount({ taskId: task.id, delta });
      if (!res.success) toast.error(res.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteTask(task.id);
      if (res.success) toast.success("Task deleted");
      else toast.error(res.error);
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-background p-3 shadow-sm",
        isDragging && "opacity-40",
        overlay && "rotate-2 shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag task"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm font-medium leading-snug", task.status === "COMPLETED" && "line-through opacity-60")}>
              {task.title}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <PriorityDot priority={task.priority} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground/60 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(task)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/focus?taskId=${task.id}`)}>
                    <Timer className="h-4 w-4" /> Start focus
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={task.category} />
            {task.debtCount > 0 && (
              <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
                +{task.debtCount} debt
              </span>
            )}
            <span className="text-xs text-muted-foreground">{task.xpValue} XP</span>
          </div>

          {isQuantitative && (
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {task.completedCount}/{required} {task.unit ?? ""}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-5 w-5"
                    disabled={pending}
                    onClick={() => adjust(-1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-5 w-5"
                    disabled={pending}
                    onClick={() => adjust(1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
