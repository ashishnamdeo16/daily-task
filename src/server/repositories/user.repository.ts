import { prisma } from "@/lib/prisma";
import type { Prisma, User } from "@prisma/client";

export const userRepository = {
  findByClerkId(clerkId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { clerkId } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  delete(clerkId: string): Promise<User> {
    return prisma.user.delete({ where: { clerkId } });
  },

  addXp(id: string, amount: number): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { xp: { increment: amount } },
    });
  },
};
