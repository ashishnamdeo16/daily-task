"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { ApplicationStage } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addApplication,
  deleteApplication,
  updateApplicationStage,
} from "@/server/actions/tracker.actions";
import { pct } from "@/lib/utils";

const STAGES: { value: ApplicationStage; label: string }[] = [
  { value: "APPLIED", label: "Applied" },
  { value: "REFERRAL_REQUESTED", label: "Referral" },
  { value: "ONLINE_ASSESSMENT", label: "OA" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "REJECTED", label: "Rejected" },
  { value: "OFFER", label: "Offer" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const STAGE_CLASS: Record<ApplicationStage, string> = {
  APPLIED: "text-blue-500",
  REFERRAL_REQUESTED: "text-cyan-500",
  ONLINE_ASSESSMENT: "text-amber-500",
  INTERVIEW: "text-violet-500",
  REJECTED: "text-red-500",
  OFFER: "text-green-500",
  ACCEPTED: "text-green-600",
  WITHDRAWN: "text-muted-foreground",
};

const STAGE_VALUES = new Set(STAGES.map((s) => s.value));

export type ApplicationRow = {
  id: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  appliedAt: string;
};

function normalizeStage(stage: string): ApplicationStage {
  return STAGE_VALUES.has(stage as ApplicationStage)
    ? (stage as ApplicationStage)
    : "APPLIED";
}

export function JobSearchClient({ applications }: { applications: ApplicationRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const total = applications.length;
  const by = (s: ApplicationStage) => applications.filter((a) => a.stage === s).length;
  const interviews = by("INTERVIEW");
  const offers = by("OFFER") + by("ACCEPTED");

  function add() {
    if (!company.trim() || !role.trim()) return toast.error("Company and role required");
    start(async () => {
      const res = await addApplication({ company: company.trim(), role: role.trim() });
      if (res.success) {
        toast.success("Application logged");
        setCompany("");
        setRole("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function setStage(a: ApplicationRow, stage: ApplicationStage) {
    start(async () => {
      const res = await updateApplicationStage(a.id, stage);
      if (res.success) router.refresh();
      else toast.error(res.error);
    });
  }
  function remove(a: ApplicationRow) {
    start(async () => {
      const res = await deleteApplication(a.id);
      if (res.success) router.refresh();
      else if (res.error) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Job Search Mode</h1>
        <p className="text-sm text-muted-foreground">Track every application from sent to offer.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon="Briefcase" label="Applications" value={total} accent="text-blue-500" />
        <StatCard icon="Users" label="Referrals" value={by("REFERRAL_REQUESTED")} accent="text-cyan-500" />
        <StatCard icon="Code2" label="OAs" value={by("ONLINE_ASSESSMENT")} accent="text-amber-500" />
        <StatCard icon="CalendarCheck" label="Interviews" value={interviews} accent="text-violet-500" hint={`${pct(interviews, total)}% rate`} />
        <StatCard icon="X" label="Rejections" value={by("REJECTED")} accent="text-red-500" />
        <StatCard icon="Trophy" label="Offers" value={offers} accent="text-green-500" hint={`${pct(offers, total)}% rate`} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
          <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
          <Button onClick={add} disabled={pending} className="shrink-0">
            <Plus className="h-4 w-4" /> Log application
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {applications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          applications.map((a) => {
            const stage = normalizeStage(a.stage);
            return (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.role}</p>
                  <p className="truncate text-sm text-muted-foreground">{a.company}</p>
                </div>
                <Select value={stage} onValueChange={(v) => setStage(a, v as ApplicationStage)}>
                  <SelectTrigger className={`w-36 shrink-0 font-medium ${STAGE_CLASS[stage]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => remove(a)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
