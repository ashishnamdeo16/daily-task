import "server-only";
import { prisma } from "@/lib/prisma";
import type { TemplateItem } from "@/lib/types";

/** Default Work Day template — Mon–Fri */
const WORK_DAY_ITEMS: TemplateItem[] = [
  {
    title: "DSA / LeetCode",
    category: "DSA",
    priority: "HIGH",
    targetCount: 3,
    unit: "problems",
    estimatedMinutes: 90,
  },
  {
    title: "Job Applications",
    category: "JOB_APPLICATION",
    priority: "CRITICAL",
    targetCount: 20,
    unit: "applications",
    estimatedMinutes: 60,
  },
  {
    title: "Gym",
    category: "FITNESS",
    priority: "MEDIUM",
    estimatedMinutes: 60,
  },
];

/** Default Weekend template — Sat & Sun */
const WEEKEND_ITEMS: TemplateItem[] = [
  {
    title: "DSA / LeetCode",
    category: "DSA",
    priority: "HIGH",
    targetCount: 5,
    unit: "problems",
    estimatedMinutes: 120,
  },
  {
    title: "Open Source",
    category: "OPEN_SOURCE",
    priority: "HIGH",
    targetCount: 1,
    unit: "PRs",
    estimatedMinutes: 120,
  },
  {
    title: "Project Work",
    category: "AI_PROJECT",
    priority: "HIGH",
    estimatedMinutes: 180,
  },
  {
    title: "Networking",
    category: "NETWORKING",
    priority: "MEDIUM",
    targetCount: 3,
    unit: "outreach",
    estimatedMinutes: 45,
  },
  {
    title: "Content Creation",
    category: "CONTENT",
    priority: "MEDIUM",
    estimatedMinutes: 60,
  },
];

/**
 * Provision default Work Day and Weekend templates for a new user.
 * Idempotent — skips if the user already has templates.
 */
export async function bootstrapDefaultTemplates(userId: string): Promise<void> {
  const count = await prisma.taskTemplate.count({ where: { userId } });
  if (count > 0) return;

  const workDay = await prisma.taskTemplate.create({
    data: {
      userId,
      name: "Work Day",
      description: "DSA, job applications, and gym — the weekday grind.",
      type: "WORK_DAY",
      icon: "Briefcase",
      isDefault: true,
      daysOfWeek: [1, 2, 3, 4, 5],
      items: WORK_DAY_ITEMS as unknown as object[],
    },
  });

  await prisma.taskTemplate.create({
    data: {
      userId,
      name: "Weekend",
      description: "DSA, open source, projects, networking, and content.",
      type: "WEEKEND",
      icon: "Calendar",
      daysOfWeek: [0, 6],
      items: WEEKEND_ITEMS as unknown as object[],
    },
  });

  await prisma.settings.upsert({
    where: { userId },
    create: { userId, defaultTemplateId: workDay.id },
    update: { defaultTemplateId: workDay.id },
  });
}
