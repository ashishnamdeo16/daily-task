"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { Goal } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/stat-card";
import { adjustGoalProgress, createGoal, deleteGoal } from "@/server/actions/goal.actions";
import { pct } from "@/lib/utils";

const SUGGESTIONS = [
  "Research Papers Read",
  "Agents Built",
  "Features Shipped",
  "Experiments Completed",
  "Project Hours",
];

export function AiBuilderClient({
  goals,
  tasksCompleted,
  focusHours,
}: {
  goals: Goal[];
  tasksCompleted: number;
  focusHours: number;
}) {
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  function add(presetTitle?: string) {
    const t = (presetTitle ?? title).trim();
    if (!t) return toast.error("Enter a metric");
    start(async () => {
      const res = await createGoal({
        title: t,
        category: "AI_PROJECT",
        targetValue: target ? Number(target) : 10,
      });
      if (res.success) {
        toast.success("Metric added");
        setTitle("");
        setTarget("");
      } else toast.error(res.error);
    });
  }

  function adjust(g: Goal, delta: number) {
    start(async () => {
      const res = await adjustGoalProgress(g.id, delta);
      if (!res.success) toast.error(res.error);
    });
  }
  function remove(g: Goal) {
    start(async () => {
      await deleteGoal(g.id);
    });
  }

  const totalProgress = goals.reduce((s, g) => s + g.currentValue, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Builder Mode</h1>
        <p className="text-sm text-muted-foreground">
          Track research, agents, features, experiments and project hours.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="Brain" label="AI tasks done" value={tasksCompleted} accent="text-fuchsia-500" />
        <StatCard icon="Timer" label="Focus hours" value={focusHours} accent="text-violet-500" />
        <StatCard icon="Target" label="Metrics tracked" value={goals.length} accent="text-primary" />
        <StatCard icon="TrendingUp" label="Total progress" value={totalProgress} accent="text-blue-500" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Metric (e.g. Agents Built)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input type="number" min={1} placeholder="Target" value={target} onChange={(e) => setTarget(e.target.value)} className="sm:w-32" />
            <Button onClick={() => add()} disabled={pending} className="shrink-0">
              <Plus className="h-4 w-4" /> Add metric
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.filter((s) => !goals.some((g) => g.title === s)).map((s) => (
              <Button key={s} size="sm" variant="outline" onClick={() => add(s)} disabled={pending}>
                <Plus className="h-3 w-3" /> {s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const progress = pct(g.currentValue, g.targetValue);
          return (
            <Card key={g.id}>
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{g.title}</p>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(g)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{g.currentValue}/{g.targetValue}</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} indicatorClassName={g.status === "COMPLETED" ? "bg-green-500" : undefined} />
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(g, -1)} disabled={pending}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(g, 1)} disabled={pending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
