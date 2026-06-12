import { prisma } from "@/lib/prisma";
import type { Prisma, TaskTemplate } from "@prisma/client";

export const templateRepository = {
  listByUser(userId: string): Promise<TaskTemplate[]> {
    return prisma.taskTemplate.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
  },

  findById(id: string): Promise<TaskTemplate | null> {
    return prisma.taskTemplate.findUnique({ where: { id } });
  },

  findForWeekday(userId: string, weekday: number): Promise<TaskTemplate | null> {
    return prisma.taskTemplate.findFirst({
      where: { userId, daysOfWeek: { has: weekday } },
      orderBy: { isDefault: "desc" },
    });
  },

  create(data: Prisma.TaskTemplateUncheckedCreateInput): Promise<TaskTemplate> {
    return prisma.taskTemplate.create({ data });
  },

  update(id: string, data: Prisma.TaskTemplateUncheckedUpdateInput): Promise<TaskTemplate> {
    return prisma.taskTemplate.update({ where: { id }, data });
  },

  delete(id: string): Promise<TaskTemplate> {
    return prisma.taskTemplate.delete({ where: { id } });
  },
};
