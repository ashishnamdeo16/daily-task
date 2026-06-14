"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { zonedInputToUtc } from "@/lib/timezone";
import type { ActionResult } from "@/lib/types";
import type { UpcomingEvent } from "@prisma/client";

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  link: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time").optional(),
  allDay: z.boolean().default(false),
});

export async function addEvent(
  input: z.input<typeof eventSchema>
): Promise<ActionResult<UpcomingEvent>> {
  try {
    const user = await requireUser();
    const data = eventSchema.parse(input);
    const eventAt = zonedInputToUtc(data.date, data.time ?? "00:00", data.allDay);

    const event = await prisma.upcomingEvent.create({
      data: {
        userId: user.id,
        title: data.title,
        link: data.link || null,
        notes: data.notes || null,
        eventAt,
        allDay: data.allDay,
      },
    });
    revalidatePath("/events");
    revalidatePath("/dashboard", "layout");
    return { success: true, data: event };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function updateEvent(
  id: string,
  input: z.input<typeof eventSchema>
): Promise<ActionResult<UpcomingEvent>> {
  try {
    const user = await requireUser();
    const existing = await prisma.upcomingEvent.findFirst({ where: { id, userId: user.id } });
    if (!existing) return { success: false, error: "Event not found" };

    const data = eventSchema.parse(input);
    const eventAt = zonedInputToUtc(data.date, data.time ?? "00:00", data.allDay);

    const event = await prisma.upcomingEvent.update({
      where: { id },
      data: {
        title: data.title,
        link: data.link || null,
        notes: data.notes || null,
        eventAt,
        allDay: data.allDay,
      },
    });
    revalidatePath("/events");
    revalidatePath("/dashboard", "layout");
    return { success: true, data: event };
  } catch (err) {
    return { success: false, error: msg(err) };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await prisma.upcomingEvent.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/events");
    revalidatePath("/dashboard", "layout");
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
