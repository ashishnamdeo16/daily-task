"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { HeatmapCell } from "@/server/services/streak.service";

const LEVEL_CLASSES = [
  "bg-muted",
  "bg-green-500/30",
  "bg-green-500/50",
  "bg-green-500/75",
  "bg-green-500",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Heatmap({ cells, from, to }: { cells: HeatmapCell[]; from: string; to: string }) {
  const map = new Map(cells.map((c) => [c.date, c]));

  // Build weeks (columns) of 7 days from the Sunday on/before `from`.
  const start = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const weeks: { date: string; cell?: HeatmapCell }[][] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const week: { date: string; cell?: HeatmapCell }[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cur.toISOString().slice(0, 10);
      week.push({ date: iso, cell: map.get(iso) });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels above columns where the month changes.
  const monthLabels = weeks.map((week, i) => {
    const first = new Date(week[0].date + "T00:00:00Z");
    const prevFirst = i > 0 ? new Date(weeks[i - 1][0].date + "T00:00:00Z") : null;
    if (!prevFirst || first.getUTCMonth() !== prevFirst.getUTCMonth()) {
      return MONTHS[first.getUTCMonth()];
    }
    return "";
  });

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-1 pl-7 text-[10px] text-muted-foreground">
          {monthLabels.map((m, i) => (
            <div key={i} className="w-3 shrink-0">{m}</div>
          ))}
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 pr-1 text-[10px] text-muted-foreground">
            <div className="h-3" />
            <div className="h-3">Mon</div>
            <div className="h-3" />
            <div className="h-3">Wed</div>
            <div className="h-3" />
            <div className="h-3">Fri</div>
            <div className="h-3" />
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map(({ date, cell }) => {
                const future = new Date(date + "T00:00:00Z") > end;
                return (
                  <Tooltip key={date}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "h-3 w-3 rounded-sm",
                          future ? "bg-transparent" : LEVEL_CLASSES[cell?.level ?? 0]
                        )}
                      />
                    </TooltipTrigger>
                    {!future && (
                      <TooltipContent>
                        {cell ? `${cell.score}% on ${date}` : `No activity · ${date}`}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-muted-foreground">
          Less
          {LEVEL_CLASSES.map((c, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-sm", c)} />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
