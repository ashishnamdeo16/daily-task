import { Activity } from "lucide-react";
import type { Category } from "@prisma/client";
import { CATEGORIES } from "@/lib/constants";
import { Card } from "@/components/ui/card";

export function DebtBanner({
  total,
  byCategory,
}: {
  total: number;
  byCategory: { category: Category; amount: number }[];
}) {
  if (total <= 0) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 font-semibold text-destructive">
          <Activity className="h-5 w-5" />
          {total} units of debt outstanding
        </div>
        <div className="flex flex-wrap gap-1.5">
          {byCategory.map((d) => (
            <span
              key={d.category}
              className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
            >
              {CATEGORIES[d.category].label}: {d.amount}
            </span>
          ))}
        </div>
        <p className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1 sm:text-right">
          Missed work carries forward until you clear it.
        </p>
      </div>
    </Card>
  );
}
