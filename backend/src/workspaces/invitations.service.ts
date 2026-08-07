import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invitation, InvitationStatus, WorkspaceRole } from '@prisma/client';
import { Queue } from 'bullmq';
import { randomBytes } from 'crypto';
import { AccessControlService } from '../common/access/access-control.service';
import { Env } from '../config/env.validation';
import { InvitationEmail, MailService } from '../mail/mail.service';
import { EMAIL_JOB, EMAIL_QUEUE } from '../queue/email-queue.constants';
import { UsersService } from '../users/users.service';
import { InviteMemberDto } from './dto/workspace-request.dto';
import {
  InvitationDto,
  InvitationPreviewDto,
  WorkspaceDto,
} from './dto/workspace-response.dto';
import { InvitationsRepository } from './invitations.repository';
import { WorkspacesRepository } from './workspaces.repository';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVITATION_TOKEN_BYTES = 32;

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly invitations: InvitationsRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly access: AccessControlService,
    private readonly users: UsersService,
    private readonly mail: MailService,
    private readonly config: ConfigService<Env, true>,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
  ) {}

  async invite(
    userId: string,
    workspaceId: string,
    dto: InviteMemberDto,
  ): Promise<InvitationDto> {
    await this.access.requireWorkspaceOwner(userId, workspaceId);
    const email = dto.email.toLowerCase();

    await this.assertNotAlreadyMember(workspaceId, email);

    const active = await this.invitations.findPendingFor(workspaceId, email);
    if (active) {
      throw new ConflictException(
        'Активне запрошення для цього email уже існує',
      );
    }

    const token = randomBytes(INVITATION_TOKEN_BYTES).toString('hex');
    const invitation = await this.invitations.create({
      workspaceId,
      email,
      role: dto.role ?? WorkspaceRole.MEMBER,
      token,
      invitedById: userId,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    });

    this.logger.log(
      `Створено запрошення ${invitation.id} до простору ${workspaceId} (від ${userId})`,
    );
    await this.dispatchEmail(userId, workspaceId, email, token);
    return InvitationDto.from(invitation);
  }

  async list(userId: string, workspaceId: string): Promise<InvitationDto[]> {
    await this.access.requireWorkspaceOwner(userId, workspaceId);
    const invitations = await this.invitations.listForWorkspace(workspaceId);
    return invitations.map((invitation) => InvitationDto.from(invitation));
  }

  async revoke(
    userId: string,
    workspaceId: string,
    invitationId: string,
  ): Promise<{ success: true }> {
    await this.access.requireWorkspaceOwner(userId, workspaceId);
    const invitation = await this.invitations.findInWorkspace(
      workspaceId,
      invitationId,
    );
    if (!invitation) {
      throw new NotFoundException('Запрошення не знайдено');
    }
    await this.invitations.delete(invitationId);
    return { success: true };
  }

  async preview(token: string): Promise<InvitationPreviewDto> {
    const invitation = await this.invitations.findByTokenWithWorkspace(token);
    if (!invitation) {
      throw new NotFoundException('Запрошення не знайдено');
    }
    return {
      email: invitation.email,
      workspaceName: invitation.workspace.name,
      status: this.effectiveStatus(invitation),
      expiresAt: invitation.expiresAt,
    };
  }

  async accept(
    userId: string,
    userEmail: string,
    token: string,
  ): Promise<WorkspaceDto> {
    const invitation = await this.invitations.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Запрошення не знайдено');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Запрошення вже використане або скасоване');
    }
    if (invitation.expiresAt < new Date()) {
      await this.invitations.updateStatus(
        invitation.id,
        InvitationStatus.EXPIRED,
      );
      throw new BadRequestException('Термін дії запрошення минув');
    }
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException('Запрошення призначене для іншого email');
    }

    await this.invitations.acceptInTransaction(invitation, userId);
    this.logger.log(
      `Користувач ${userId} прийняв запрошення до простору ${invitation.workspaceId}`,
    );

    const workspace = await this.workspaces.findByIdWithCounts(
      invitation.workspaceId,
    );
    if (!workspace) {
      throw new NotFoundException('Робочий простір не знайдено');
    }
    return WorkspaceDto.from(workspace, invitation.role);
  }

  private async assertNotAlreadyMember(
    workspaceId: string,
    email: string,
  ): Promise<void> {
    const existingUser = await this.users.findByEmail(email);
    if (!existingUser) return;

    const membership = await this.workspaces.findMembership(
      workspaceId,
      existingUser.id,
    );
    if (membership) {
      throw new ConflictException(
        'Користувач уже є учасником робочого простору',
      );
    }
  }

  private effectiveStatus(invitation: Invitation): InvitationStatus {
    if (
      invitation.status === InvitationStatus.PENDING &&
      invitation.expiresAt < new Date()
    ) {
      return InvitationStatus.EXPIRED;
    }
    return invitation.status;
  }

  private async dispatchEmail(
    inviterId: string,
    workspaceId: string,
    email: string,
    token: string,
  ): Promise<void> {
    const [workspace, inviter] = await Promise.all([
      this.workspaces.findById(workspaceId),
      this.users.findById(inviterId),
    ]);
    const payload: InvitationEmail = {
      to: email,
      workspaceName: workspace?.name ?? 'TaskFlow',
      inviterName: inviter?.name ?? 'Учасник команди',
      acceptUrl: `${this.config.get('FRONTEND_URL', { infer: true })}/invitations/${token}`,
    };

    try {
      await this.emailQueue.add(EMAIL_JOB.INVITATION, payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.warn(
        `Черга email недоступна, надсилаю напряму: ${String(error)}`,
      );
      await this.mail
        .sendInvitationEmail(payload)
        .catch((e) =>
          this.logger.error(`Не вдалося надіслати лист: ${String(e)}`),
        );
    }
  }
}
