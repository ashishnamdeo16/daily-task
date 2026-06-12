import type { Category, Priority, TaskStatus } from "@prisma/client";

export const APP_NAME = "LifeOS";
export const APP_DESCRIPTION =
  "Your personal execution system — tasks, habits, focus, streaks & accountability.";

// ----------------------------------------------------------------------------
// Categories
// ----------------------------------------------------------------------------

export interface CategoryMeta {
  value: Category;
  label: string;
  icon: string; // lucide icon name
  color: string; // tailwind text/bg base
  defaultXp: number;
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  JOB_APPLICATION: {
    value: "JOB_APPLICATION",
    label: "Job Applications",
    icon: "Briefcase",
    color: "blue",
    defaultXp: 5,
  },
  DSA: {
    value: "DSA",
    label: "DSA / LeetCode",
    icon: "Code2",
    color: "amber",
    defaultXp: 10,
  },
  OPEN_SOURCE: {
    value: "OPEN_SOURCE",
    label: "Open Source",
    icon: "GitPullRequest",
    color: "violet",
    defaultXp: 25,
  },
  AI_PROJECT: {
    value: "AI_PROJECT",
    label: "AI Projects",
    icon: "Brain",
    color: "fuchsia",
    defaultXp: 20,
  },
  NETWORKING: {
    value: "NETWORKING",
    label: "Networking",
    icon: "Users",
    color: "cyan",
    defaultXp: 8,
  },
  FITNESS: {
    value: "FITNESS",
    label: "Fitness",
    icon: "Dumbbell",
    color: "green",
    defaultXp: 8,
  },
  LEARNING: {
    value: "LEARNING",
    label: "Learning",
    icon: "BookOpen",
    color: "orange",
    defaultXp: 10,
  },
  CONTENT: {
    value: "CONTENT",
    label: "Content Creation",
    icon: "PenLine",
    color: "pink",
    defaultXp: 15,
  },
  OTHER: {
    value: "OTHER",
    label: "Other",
    icon: "Circle",
    color: "slate",
    defaultXp: 5,
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

// ----------------------------------------------------------------------------
// Task status (Kanban columns)
// ----------------------------------------------------------------------------

export interface StatusMeta {
  value: TaskStatus;
  label: string;
  color: string;
}

export const KANBAN_COLUMNS: StatusMeta[] = [
  { value: "TODO", label: "Todo", color: "slate" },
  { value: "IN_PROGRESS", label: "In Progress", color: "blue" },
  { value: "COMPLETED", label: "Completed", color: "green" },
  { value: "SKIPPED", label: "Skipped", color: "red" },
];

// ----------------------------------------------------------------------------
// Priority
// ----------------------------------------------------------------------------

export const PRIORITIES: Record<Priority, { label: string; color: string; weight: number }> = {
  LOW: { label: "Low", color: "slate", weight: 1 },
  MEDIUM: { label: "Medium", color: "blue", weight: 2 },
  HIGH: { label: "High", color: "orange", weight: 3 },
  CRITICAL: { label: "Critical", color: "red", weight: 4 },
};

// ----------------------------------------------------------------------------
// XP rewards by source
// ----------------------------------------------------------------------------

export const XP_REWARDS = {
  DSA: 10,
  JOB_APPLICATION: 5,
  OPEN_SOURCE_PR: 25,
  PROJECT_MILESTONE: 50,
  FOCUS_SESSION_25: 5,
  DAY_COMPLETE: 20,
  STREAK_BONUS_PER_DAY: 2,
} as const;
