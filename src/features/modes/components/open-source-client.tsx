"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { OpenSourceTracker } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StatCard } from "@/components/shared/stat-card";
import {
  addOpenSourceItem,
  deleteOpenSourceItem,
  toggleOpenSourceFlag,
} from "@/server/actions/tracker.actions";

const FLAGS = [
  { field: "issueAssigned", label: "Assigned" },
  { field: "issueClosed", label: "Closed" },
  { field: "prCreated", label: "PR" },
  { field: "prMerged", label: "Merged" },
] as const;

export function OpenSourceClient({ items }: { items: OpenSourceTracker[] }) {
  const [pending, start] = useTransition();
  const [repo, setRepo] = useState("");
  const [title, setTitle] = useState("");

  const count = (k: keyof OpenSourceTracker) => items.filter((i) => i[k] === true).length;
  const commits = items.reduce((s, i) => s + i.commits, 0);

  function add() {
    if (!repo.trim() || !title.trim()) return toast.error("Repo and title required");
    start(async () => {
      const res = await addOpenSourceItem({ repo: repo.trim(), title: title.trim(), type: "pr" });
      if (res.success) {
        toast.success("Item added");
        setRepo("");
        setTitle("");
      } else toast.error(res.error);
    });
  }

  function toggle(item: OpenSourceTracker, field: (typeof FLAGS)[number]["field"], value: boolean) {
    start(async () => {
      const res = await toggleOpenSourceFlag(item.id, field, value);
      if (!res.success) toast.error(res.error);
    });
  }
  function remove(item: OpenSourceTracker) {
    start(async () => {
      await deleteOpenSourceItem(item.id);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Open Source Mode</h1>
        <p className="text-sm text-muted-foreground">Track issues, PRs, merges and commits.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard icon="CircleDot" label="Assigned" value={count("issueAssigned")} accent="text-blue-500" />
        <StatCard icon="Check" label="Closed" value={count("issueClosed")} accent="text-green-500" />
        <StatCard icon="GitPullRequest" label="PRs Created" value={count("prCreated")} accent="text-violet-500" />
        <StatCard icon="GitMerge" label="PRs Merged" value={count("prMerged")} accent="text-fuchsia-500" />
        <StatCard icon="Activity" label="Commits" value={commits} accent="text-amber-500" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
          <Input placeholder="owner/repo" value={repo} onChange={(e) => setRepo(e.target.value)} />
          <Input placeholder="Issue / PR title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button onClick={add} disabled={pending} className="shrink-0">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No contributions tracked yet.</p>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.repo}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {FLAGS.map((f) => (
                    <label key={f.field} className="flex items-center gap-1.5 text-xs">
                      <Switch
                        checked={item[f.field]}
                        onCheckedChange={(v) => toggle(item, f.field, v)}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
                <Button size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => remove(item)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
