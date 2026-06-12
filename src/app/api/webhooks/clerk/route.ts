import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { bootstrapDefaultTemplates } from "@/lib/bootstrap";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return new Response("Missing webhook secret", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Clerk webhook verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url, username } =
        evt.data;
      const email = email_addresses?.[0]?.email_address ?? `${id}@placeholder.local`;
      const name =
        [first_name, last_name].filter(Boolean).join(" ") || username || "Operator";

      const user = await prisma.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email,
          name,
          imageUrl: image_url,
          settings: { create: {} },
        },
        update: { email, name, imageUrl: image_url },
      });
      if (evt.type === "user.created") {
        await bootstrapDefaultTemplates(user.id);
      }
      break;
    }
    case "user.deleted": {
      const id = evt.data.id;
      if (id) {
        await prisma.user.deleteMany({ where: { clerkId: id } });
      }
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
