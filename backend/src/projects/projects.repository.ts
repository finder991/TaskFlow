import { Injectable } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const TASKS_COUNT = { _count: { select: { tasks: true } } } as const;

export type ProjectWithCounts = Project & { _count: { tasks: number } };

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    workspaceId: string;
    name: string;
    description: string | null;
  }): Promise<ProjectWithCounts> {
    return this.prisma.project.create({ data, include: TASKS_COUNT });
  }

  findById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }

  findByIdWithCounts(id: string): Promise<ProjectWithCounts | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: TASKS_COUNT,
    });
  }

  listForWorkspace(workspaceId: string): Promise<ProjectWithCounts[]> {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: TASKS_COUNT,
      orderBy: { createdAt: 'desc' },
    });
  }

  update(
    id: string,
    data: Prisma.ProjectUpdateInput,
  ): Promise<ProjectWithCounts> {
    return this.prisma.project.update({
      where: { id },
      data,
      include: TASKS_COUNT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }
}
