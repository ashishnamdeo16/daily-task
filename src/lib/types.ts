import type {
  Task,
  Day,
  FocusSession,
  Category,
  Priority,
} from "@prisma/client";

// Shape stored in TaskTemplate.items (Json)
export interface TemplateItem {
  title: string;
  category: Category;
  priority: Priority;
  targetCount?: number;
  unit?: string;
  xpValue?: number;
  estimatedMinutes?: number;
}

export interface TaskWithRelations extends Task {
  focusSessions?: FocusSession[];
}

export interface DayWithTasks extends Day {
  tasks: Task[];
  focusSessions: FocusSession[];
}

export interface DashboardData {
  day: DayWithTasks;
  streak: { current: number; longest: number };
  totalDebt: number;
  activeFocusSessions: FocusSession[];
  remainingTasks: number;
  level: number;
  xp: number;
}

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
