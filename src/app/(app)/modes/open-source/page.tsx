import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { OpenSourceClient } from "@/features/modes/components/open-source-client";

export const dynamic = "force-dynamic";

export default async function OpenSourcePage() {
  const user = await requireUser();
  const items = await prisma.openSourceTracker.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return <OpenSourceClient items={items} />;
}
