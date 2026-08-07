import { Injectable } from '@nestjs/common';
import {
  Prisma,
  Project,
  Task,
  TaskActivity,
  TaskActivityType,
  TaskStatus,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const TASK_INCLUDE = {
  assignee: { select: { id: true, email: true, name: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskInclude;

const ACTOR_INCLUDE = {
  actor: { select: { id: true, email: true, name: true } },
} satisfies Prisma.TaskActivityInclude;

export type TaskWithRelations = Task & {
  assignee: Pick<User, 'id' | 'email' | 'name'> | null;
  _count: { comments: number };
};
export type TaskWithProject = Task & { project: Project };
export type ActivityWithActor = TaskActivity & {
  actor: Pick<User, 'id' | 'email' | 'name'> | null;
};

export interface CreateTaskData {
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority?: Prisma.TaskCreateInput['priority'];
  assigneeId: string | null;
  dueDate: Date | null;
  createdById: string;
  position: number;
}

export interface TaskFilters {
  projectId: string;
  status?: TaskStatus;
  priority?: Prisma.TaskWhereInput['priority'];
  assigneeId?: string;
  search?: string;
}

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateTaskData): Promise<TaskWithRelations> {
    return this.prisma.task.create({ data, include: TASK_INCLUDE });
  }

  findById(id: string): Promise<TaskWithRelations | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: TASK_INCLUDE,
    });
  }

  findByIdWithProject(id: string): Promise<TaskWithProject | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });
  }

  update(id: string, data: Prisma.TaskUpdateInput): Promise<TaskWithRelations> {
    return this.prisma.task.update({
      where: { id },
      data,
      include: TASK_INCLUDE,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  findManyByCursor(
    filters: TaskFilters,
    limit: number,
    cursor: string,
  ): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: this.buildWhere(filters),
      include: TASK_INCLUDE,
      orderBy: { id: 'desc' },
      take: limit + 1,
      cursor: { id: cursor },
      skip: 1,
    });
  }

  findManyWithTotal(
    filters: TaskFilters,
    page: number,
    limit: number,
  ): Promise<[number, TaskWithRelations[]]> {
    const where = this.buildWhere(filters);
    return this.prisma.$transaction([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
  }

  async findLastPosition(
    projectId: string,
    status: TaskStatus,
  ): Promise<number | null> {
    const last = await this.prisma.task.findFirst({
      where: { projectId, status },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return last?.position ?? null;
  }

  async reorder(
    taskId: string,
    projectId: string,
    toStatus: TaskStatus,
    toIndex: number,
  ): Promise<TaskWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const column = await tx.task.findMany({
        where: { projectId, status: toStatus, id: { not: taskId } },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: { id: true },
      });

      const index = Math.max(0, Math.min(toIndex, column.length));
      const ordered = [
        ...column.slice(0, index).map((t) => t.id),
        taskId,
        ...column.slice(index).map((t) => t.id),
      ];

      for (const [position, id] of ordered.entries()) {
        await tx.task.update({
          where: { id },
          data: id === taskId ? { position, status: toStatus } : { position },
        });
      }

      return tx.task.findUniqueOrThrow({
        where: { id: taskId },
        include: TASK_INCLUDE,
      });
    });
  }

  createActivity(data: {
    taskId: string;
    actorId: string;
    type: TaskActivityType;
    fromValue?: string | null;
    toValue?: string | null;
  }): Promise<TaskActivity> {
    return this.prisma.taskActivity.create({ data });
  }

  async createActivities(
    data: Prisma.TaskActivityCreateManyInput[],
  ): Promise<void> {
    if (data.length === 0) return;
    await this.prisma.taskActivity.createMany({ data });
  }

  listActivity(taskId: string): Promise<ActivityWithActor[]> {
    return this.prisma.taskActivity.findMany({
      where: { taskId },
      include: ACTOR_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildWhere(filters: TaskFilters): Prisma.TaskWhereInput {
    const where: Prisma.TaskWhereInput = { projectId: filters.projectId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) {
      where.assigneeId =
        filters.assigneeId === 'unassigned' ? null : filters.assigneeId;
    }
    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    return where;
  }
}
