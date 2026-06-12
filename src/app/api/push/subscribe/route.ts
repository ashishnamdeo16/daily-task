import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid subscription" }, { status: 400 });
  }

  await prisma.settings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      pushSubscription: parsed.data,
    },
    update: {
      pushSubscription: parsed.data,
    },
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.settings.updateMany({
    where: { userId: user.id },
    data: { pushSubscription: Prisma.JsonNull },
  });

  return Response.json({ ok: true });
}
