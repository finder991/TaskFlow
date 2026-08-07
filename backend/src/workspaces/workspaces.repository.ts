import { Injectable } from '@nestjs/common';
import {
  Prisma,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const COUNTS = {
  _count: { select: { members: true, projects: true } },
} as const;

export type WorkspaceWithCounts = Workspace & {
  _count: { members: number; projects: number };
};
export type MemberWithUser = WorkspaceMember & { user: User };
export type WorkspaceWithMembers = WorkspaceWithCounts & {
  members: MemberWithUser[];
};

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    name: string;
    ownerId: string;
  }): Promise<WorkspaceWithCounts> {
    return this.prisma.workspace.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,

        members: {
          create: { userId: data.ownerId, role: WorkspaceRole.OWNER },
        },
      },
      include: COUNTS,
    });
  }

  findById(id: string): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({ where: { id } });
  }

  findByIdWithCounts(id: string): Promise<WorkspaceWithCounts | null> {
    return this.prisma.workspace.findUnique({ where: { id }, include: COUNTS });
  }

  findByIdWithMembers(id: string): Promise<WorkspaceWithMembers | null> {
    return this.prisma.workspace.findUnique({
      where: { id },
      include: {
        ...COUNTS,
        members: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async listForUser(
    userId: string,
  ): Promise<Array<{ workspace: WorkspaceWithCounts; role: WorkspaceRole }>> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: { include: COUNTS } },
      orderBy: { workspace: { createdAt: 'desc' } },
    });
    return memberships.map((m) => ({ workspace: m.workspace, role: m.role }));
  }

  update(
    id: string,
    data: Prisma.WorkspaceUpdateInput,
  ): Promise<WorkspaceWithCounts> {
    return this.prisma.workspace.update({
      where: { id },
      data,
      include: COUNTS,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workspace.delete({ where: { id } });
  }

  findMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  listMembers(workspaceId: string): Promise<MemberWithUser[]> {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findMemberInWorkspace(
    workspaceId: string,
    memberId: string,
  ): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
  }

  updateMemberRole(
    memberId: string,
    role: WorkspaceRole,
  ): Promise<MemberWithUser> {
    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true },
    });
  }

  async deleteMember(memberId: string): Promise<void> {
    await this.prisma.workspaceMember.delete({ where: { id: memberId } });
  }
}
