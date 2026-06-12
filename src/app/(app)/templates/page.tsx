import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { templateRepository } from "@/server/repositories/template.repository";
import { TemplatesClient } from "@/features/templates/components/templates-client";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await requireUser();
  const [templates, settings] = await Promise.all([
    templateRepository.listByUser(user.id),
    prisma.settings.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <TemplatesClient
      templates={templates}
      defaultTemplateId={settings?.defaultTemplateId ?? null}
    />
  );
}
