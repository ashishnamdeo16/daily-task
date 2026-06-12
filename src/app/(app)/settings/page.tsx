import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/features/settings/components/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  return <SettingsClient settings={settings} />;
}
