"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Minus, Plus, Target, Trash2 } from "lucide-react";
import type { WeeklyGoal } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CategoryBadge } from "@/components/shared/category-badge";
import {
  createWeeklyGoal,
  deleteWeeklyGoal,
  updateWeeklyGoalProgress,
} from "@/server/actions/weekly.actions";
import { pct } from "@/lib/utils";

export function WeeklyClient({
  goals,
  weekLabel,
}: {
  goals: WeeklyGoal[];
  weekLabel: string;
}) {
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  function add() {
    if (!title.trim()) return toast.error("Enter a goal");
    if (goals.length >= 3) return toast.error("Top 3 goals only — keep it focused");
    start(async () => {
      const res = await createWeeklyGoal({
        title: title.trim(),
        targetValue: target ? Number(target) : 1,
        rank: goals.length + 1,
      });
      if (res.success) {
        toast.success("Goal added");
        setTitle("");
        setTarget("");
      } else toast.error(res.error);
    });
  }

  function adjust(g: WeeklyGoal, delta: number) {
    start(async () => {
      const res = await updateWeeklyGoalProgress(g.id, g.currentValue + delta);
      if (!res.success) toast.error(res.error);
    });
  }

  function remove(g: WeeklyGoal) {
    start(async () => {
      const res = await deleteWeeklyGoal(g.id);
      if (res.success) toast.success("Goal removed");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Weekly planning</h1>
        <p className="text-sm text-muted-foreground">
          Week of {weekLabel} · Define your Top 3 goals and track them daily.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {goals.map((g) => {
          const progress = pct(g.currentValue, g.targetValue);
          const done = g.status === "COMPLETED";
          return (
            <Card key={g.id}>
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {g.rank}
                  </span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(g)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-medium leading-snug">{g.title}</p>
                <CategoryBadge category={g.category} className="w-fit" />
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className={done ? "font-semibold text-green-500" : ""}>
                      {g.currentValue}/{g.targetValue}
                    </span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} indicatorClassName={done ? "bg-green-500" : undefined} />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(g, -1)} disabled={pending}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(g, 1)} disabled={pending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  {done && <Check className="ml-auto h-5 w-5 text-green-500" />}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {goals.length < 3 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-5 w-5" />
                <span className="text-sm font-medium">Add goal #{goals.length + 1}</span>
              </div>
              <Input
                placeholder="e.g. Reach 250 LeetCode problems"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                type="number"
                min={1}
                placeholder="Target (e.g. 250)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              <Button onClick={add} disabled={pending}>
                <Plus className="h-4 w-4" /> Add goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
