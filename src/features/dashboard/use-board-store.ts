"use client";

import { create } from "zustand";
import type { Task, TaskStatus } from "@prisma/client";

interface BoardUIState {
  dialogOpen: boolean;
  editingTask: Task | null;
  defaultStatus: TaskStatus;
  dayId: string | null;

  openCreate: (dayId: string, status?: TaskStatus) => void;
  openEdit: (task: Task) => void;
  close: () => void;
}

export const useBoardStore = create<BoardUIState>((set) => ({
  dialogOpen: false,
  editingTask: null,
  defaultStatus: "TODO",
  dayId: null,

  openCreate: (dayId, status = "TODO") =>
    set({ dialogOpen: true, editingTask: null, defaultStatus: status, dayId }),
  openEdit: (task) =>
    set({ dialogOpen: true, editingTask: task, dayId: task.dayId }),
  close: () => set({ dialogOpen: false, editingTask: null }),
}));
