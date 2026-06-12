import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { JobSearchClient } from "@/features/modes/components/job-search-client";
import type { ApplicationRow } from "@/features/modes/components/job-search-client";

export const dynamic = "force-dynamic";

export default async function JobSearchPage() {
  const user = await requireUser();
  const rows = await prisma.applicationTracker.findMany({
    where: { userId: user.id },
    orderBy: { appliedAt: "desc" },
  });

  const applications: ApplicationRow[] = rows.map((a) => ({
    id: a.id,
    company: a.company,
    role: a.role,
    stage: a.stage,
    appliedAt: a.appliedAt.toISOString(),
  }));

  return <JobSearchClient applications={applications} />;
}
