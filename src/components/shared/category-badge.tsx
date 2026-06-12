import type { Category, Priority } from "@prisma/client";
import { CATEGORIES, PRIORITIES } from "@/lib/constants";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

// Static class maps so Tailwind can detect them at build time.
const CATEGORY_CLASSES: Record<Category, string> = {
  JOB_APPLICATION: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DSA: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  OPEN_SOURCE: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  AI_PROJECT: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  NETWORKING: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  FITNESS: "bg-green-500/10 text-green-600 dark:text-green-400",
  LEARNING: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  CONTENT: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  OTHER: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const PRIORITY_CLASSES: Record<Priority, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

export function CategoryBadge({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  const meta = CATEGORIES[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        CATEGORY_CLASSES[category],
        className
      )}
    >
      <Icon name={meta.icon} className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span
      title={PRIORITIES[priority].label}
      className={cn("inline-block h-2 w-2 rounded-full", PRIORITY_CLASSES[priority])}
    />
  );
}
