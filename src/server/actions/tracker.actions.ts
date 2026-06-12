"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { checkAchievements } from "@/server/services/achievement.service";
import type { ActionResult } from "@/lib/types";
import type { ApplicationTracker, OpenSourceTracker } from "@prisma/client";

// ---------------------------------------------------------------------------
// Job Search — ApplicationTracker
// ---------------------------------------------------------------------------

const stageEnum = z.enum([
  "APPLIED", "REFERRAL_REQUESTED", "ONLINE_ASSESSMENT", "INTERVIEW",
  "REJECTED", "OFFER", "ACCEPTED", "WITHDRAWN",
]);

const appSchema = z.object({
  company: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  location: z.string().max(120).optional(),
  link: z.string().url().optional().or(z.literal("")),
  source: z.string().max(80).optional(),
  stage: stageEnum.default("APPLIED"),
  notes: z.string().max(2000).optional(),
});

export async function addApplication(
  input: z.input<typeof appSchema>
): Promise<ActionResult<ApplicationTracker>> {
  try {
    const user = await requireUser();
    const data = appSchema.parse(input);
    const app = await prisma.applicationTracker.create({
      data: { ...data, link: data.link || null, userId: user.id },
    });
    await checkAchievements(user.id);
    revalidatePath("/modes/job-search");
    return { success: true, data: app };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function updateApplicationStage(
  id: string,
  stage: z.infer<typeof stageEnum>
): Promise<ActionResult<ApplicationTracker>> {
  try {
    const user = await requireUser();
    const existing = await prisma.applicationTracker.findFirst({ where: { id, userId: user.id } });
    if (!existing) return { success: false, error: "Application not found" };
    const app = await prisma.applicationTracker.update({
      where: { id },
      data: { stage, respondedAt: stage !== "APPLIED" ? new Date() : existing.respondedAt },
    });
    revalidatePath("/modes/job-search");
    return { success: true, data: app };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function deleteApplication(id: string): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await prisma.applicationTracker.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/modes/job-search");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

// ---------------------------------------------------------------------------
// Open Source — OpenSourceTracker
// ---------------------------------------------------------------------------

const osSchema = z.object({
  repo: z.string().min(1).max(160),
  title: z.string().min(1).max(200),
  url: z.string().url().optional().or(z.literal("")),
  type: z.enum(["issue", "pr"]).default("pr"),
  number: z.coerce.number().int().optional(),
  issueAssigned: z.boolean().default(false),
  issueClosed: z.boolean().default(false),
  prCreated: z.boolean().default(false),
  prMerged: z.boolean().default(false),
  commits: z.coerce.number().int().min(0).default(0),
});

export async function addOpenSourceItem(
  input: z.input<typeof osSchema>
): Promise<ActionResult<OpenSourceTracker>> {
  try {
    const user = await requireUser();
    const data = osSchema.parse(input);
    const item = await prisma.openSourceTracker.create({
      data: { ...data, url: data.url || null, userId: user.id },
    });
    await checkAchievements(user.id);
    revalidatePath("/modes/open-source");
    return { success: true, data: item };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function toggleOpenSourceFlag(
  id: string,
  field: "issueAssigned" | "issueClosed" | "prCreated" | "prMerged",
  value: boolean
): Promise<ActionResult<OpenSourceTracker>> {
  try {
    const user = await requireUser();
    const existing = await prisma.openSourceTracker.findFirst({ where: { id, userId: user.id } });
    if (!existing) return { success: false, error: "Item not found" };
    const item = await prisma.openSourceTracker.update({
      where: { id },
      data: { [field]: value },
    });
    await checkAchievements(user.id);
    revalidatePath("/modes/open-source");
    return { success: true, data: item };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function deleteOpenSourceItem(id: string): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await prisma.openSourceTracker.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/modes/open-source");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

function msg(err: unknown): string {
  if (err instanceof z.ZodError) return err.issues[0]?.message ?? "Invalid input";
  console.error(err);
  return "Something went wrong";
}
