import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bootstrapDefaultTemplates } from "@/lib/bootstrap";
import { userRepository } from "@/server/repositories/user.repository";

/**
 * Returns the LifeOS DB user for the currently authenticated Clerk session,
 * creating (and bootstrapping settings + default templates) on first sign-in.
 * Cached per-request via React.cache.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await userRepository.findByClerkId(clerkId);
  if (existing) return existing;

  // First time we've seen this Clerk user — provision them.
  const clerk = await currentUser();
  if (!clerk) return null;

  const email =
    clerk.primaryEmailAddress?.emailAddress ??
    clerk.emailAddresses[0]?.emailAddress ??
    `${clerkId}@placeholder.local`;

  const name =
    [clerk.firstName, clerk.lastName].filter(Boolean).join(" ") ||
    clerk.username ||
    "Operator";

  const user = await prisma.user.create({
    data: {
      clerkId,
      email,
      name,
      imageUrl: clerk.imageUrl,
      settings: { create: {} },
    },
  });

  await bootstrapDefaultTemplates(user.id);
  return user;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
