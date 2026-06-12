import { prisma } from "@/lib/prisma";
import type { Prisma, Task, TaskStatus } from "@prisma/client";

export const taskRepository = {
  findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({ where: { id } });
  },

  listByDay(dayId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: { dayId },
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });
  },

  create(data: Prisma.TaskUncheckedCreateInput): Promise<Task> {
    return prisma.task.create({ data });
  },

  createMany(data: Prisma.TaskUncheckedCreateInput[]) {
    return prisma.task.createMany({ data });
  },

  update(id: string, data: Prisma.TaskUncheckedUpdateInput): Promise<Task> {
    return prisma.task.update({ where: { id }, data });
  },

  delete(id: string): Promise<Task> {
    return prisma.task.delete({ where: { id } });
  },

  countByStatus(dayId: string, status: TaskStatus): Promise<number> {
    return prisma.task.count({ where: { dayId, status } });
  },

  maxPosition(dayId: string, status: TaskStatus) {
    return prisma.task.aggregate({
      where: { dayId, status },
      _max: { position: true },
    });
  },
};
