import { Injectable } from '@nestjs/common';
import {
  Invitation,
  InvitationStatus,
  Workspace,
  WorkspaceRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type InvitationWithWorkspace = Invitation & { workspace: Workspace };

export interface CreateInvitationData {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedById: string;
  expiresAt: Date;
}

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateInvitationData): Promise<Invitation> {
    return this.prisma.invitation.create({ data });
  }

  findByToken(token: string): Promise<Invitation | null> {
    return this.prisma.invitation.findUnique({ where: { token } });
  }

  findByTokenWithWorkspace(
    token: string,
  ): Promise<InvitationWithWorkspace | null> {
    return this.prisma.invitation.findUnique({
      where: { token },
      include: { workspace: true },
    });
  }

  findPendingFor(
    workspaceId: string,
    email: string,
  ): Promise<Invitation | null> {
    return this.prisma.invitation.findFirst({
      where: { workspaceId, email, status: InvitationStatus.PENDING },
    });
  }

  findInWorkspace(
    workspaceId: string,
    invitationId: string,
  ): Promise<Invitation | null> {
    return this.prisma.invitation.findFirst({
      where: { id: invitationId, workspaceId },
    });
  }

  listForWorkspace(workspaceId: string): Promise<Invitation[]> {
    return this.prisma.invitation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(id: string, status: InvitationStatus): Promise<Invitation> {
    return this.prisma.invitation.update({ where: { id }, data: { status } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.invitation.delete({ where: { id } });
  }

  async acceptInTransaction(
    invitation: Invitation,
    userId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
        },
        create: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
        update: {},
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      }),
    ]);
  }
}
