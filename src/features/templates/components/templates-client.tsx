"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Pin, Plus, Trash2, Zap } from "lucide-react";
import type { TaskTemplate } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/shared/category-badge";
import { TemplateEditor } from "./template-editor";
import {
  applyTemplateToToday,
  deleteTemplate,
  setDefaultTemplate,
} from "@/server/actions/template.actions";
import type { TemplateItem } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TemplatesClient({
  templates,
  defaultTemplateId,
}: {
  templates: TaskTemplate[];
  defaultTemplateId: string | null;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [applyPending, startApply] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [defaultPending, startDefault] = useTransition();
  const router = useRouter();

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }
  function openEdit(t: TaskTemplate) {
    setEditing(t);
    setEditorOpen(true);
  }

  function apply(t: TaskTemplate) {
    startApply(async () => {
      const res = await applyTemplateToToday(t.id);
      if (res.success) {
        toast.success(`Added ${res.data.added} tasks to today`);
        router.refresh();
        router.push("/dashboard");
      } else toast.error(res.error);
    });
  }
  function remove(t: TaskTemplate) {
    startDelete(async () => {
      const res = await deleteTemplate(t.id);
      if (res.success) {
        toast.success("Template deleted");
        router.refresh();
      } else toast.error(res.error);
    });
  }
  function makeDefault(t: TaskTemplate) {
    const next = defaultTemplateId === t.id ? null : t.id;
    startDefault(async () => {
      const res = await setDefaultTemplate(next);
      if (res.success) {
        toast.success(next ? "Set as default" : "Default cleared");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Reusable task sets. The default (or weekday-matched) template auto-populates each new day.
          </p>
        </div>
        <Button type="button" onClick={openNew}>
          <Plus className="h-4 w-4" /> New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No templates yet. Create one to auto-populate your days.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const items = (t.items as unknown as TemplateItem[]) ?? [];
            const isDefault = defaultTemplateId === t.id;
            return (
              <Card key={t.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {t.name}
                      {isDefault && <Badge variant="secondary">Default</Badge>}
                    </CardTitle>
                  </div>
                  {t.daysOfWeek.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Auto-applies: {[...t.daysOfWeek].sort((a, b) => a - b).map((d) => DAY_LABELS[d]).join(", ")}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {items.slice(0, 6).map((item, i) => (
                      <CategoryBadge key={i} category={item.category} />
                    ))}
                  </div>
                  <ul className="flex-1 space-y-1 text-sm text-muted-foreground">
                    {items.map((item, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="truncate">{item.title}</span>
                        {item.targetCount ? <span>×{item.targetCount}</span> : null}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => apply(t)}
                      disabled={applyPending}
                    >
                      <Zap className="h-4 w-4" /> Apply today
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => makeDefault(t)}
                      disabled={defaultPending}
                    >
                      <Pin className="h-4 w-4" /> {isDefault ? "Unset" : "Default"}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(t)}
                      disabled={deletePending}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editorOpen ? (
        <TemplateEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          template={editing}
        />
      ) : null}
    </div>
  );
}
