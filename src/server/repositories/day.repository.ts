import { prisma } from "@/lib/prisma";
import type { Day, Prisma } from "@prisma/client";

export const dayRepository = {
  findByDate(userId: string, date: Date): Promise<Day | null> {
    return prisma.day.findUnique({
      where: { userId_date: { userId, date } },
    });
  },

  findByDateWithTasks(userId: string, date: Date) {
    return prisma.day.findUnique({
      where: { userId_date: { userId, date } },
      include: {
        tasks: { orderBy: { position: "asc" } },
        focusSessions: true,
        review: true,
      },
    });
  },

  findPrevious(userId: string, before: Date) {
    return prisma.day.findFirst({
      where: { userId, date: { lt: before } },
      orderBy: { date: "desc" },
      include: { tasks: true },
    });
  },

  create(data: Prisma.DayUncheckedCreateInput): Promise<Day> {
    return prisma.day.create({ data });
  },

  update(id: string, data: Prisma.DayUncheckedUpdateInput): Promise<Day> {
    return prisma.day.update({ where: { id }, data });
  },

  listRange(userId: string, from: Date, to: Date) {
    return prisma.day.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });
  },
};
