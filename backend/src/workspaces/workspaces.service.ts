import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceMember, WorkspaceRole } from '@prisma/client';
import { AccessControlService } from '../common/access/access-control.service';
import {
  CreateWorkspaceDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
} from './dto/workspace-request.dto';
import {
  WorkspaceDetailDto,
  WorkspaceDto,
  WorkspaceMemberDto,
} from './dto/workspace-response.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WorkspacesRepository } from './workspaces.repository';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    private readonly workspaces: WorkspacesRepository,
    private readonly access: AccessControlService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const workspace = await this.workspaces.create({
      name: dto.name,
      ownerId: userId,
    });
    this.logger.log(
      `Створено робочий простір ${workspace.id} (власник ${userId})`,
    );
    return WorkspaceDto.from(workspace, WorkspaceRole.OWNER);
  }

  async listForUser(userId: string): Promise<WorkspaceDto[]> {
    const items = await this.workspaces.listForUser(userId);
    return items.map(({ workspace, role }) =>
      WorkspaceDto.from(workspace, role),
    );
  }

  async getById(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceDetailDto> {
    const role = await this.access.requireWorkspaceRole(userId, workspaceId);
    const workspace = await this.workspaces.findByIdWithMembers(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Робочий простір не знайдено');
    }
    return {
      ...WorkspaceDto.from(workspace, role),
      members: workspace.members.map((member) =>
        WorkspaceMemberDto.from(member),
      ),
    };
  }

  async update(
    userId: string,
    workspaceId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDto> {
    await this.access.requireWorkspaceOwner(userId, workspaceId);
    const workspace = await this.workspaces.update(workspaceId, {
      name: dto.name,
    });
    return WorkspaceDto.from(workspace, WorkspaceRole.OWNER);
  }

  async remove(
    userId: string,
    workspaceId: string,
  ): Promise<{ success: true }> {
    await this.access.requireWorkspaceOwner(userId, workspaceId);
    await this.workspaces.delete(workspaceId);
    this.logger.log(
      `Видалено робочий простір ${workspaceId} (користувач ${userId})`,
    );
    return { success: true };
  }

  async listMembers(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMemberDto[]> {
    await this.access.requireWorkspaceRole(userId, workspaceId);
    const members = await this.workspaces.listMembers(workspaceId);
    return members.map((member) => WorkspaceMemberDto.from(member));
  }

  async updateMemberRole(
    userId: string,
    workspaceId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<WorkspaceMemberDto> {
    await this.access.requireWorkspaceOwner(userId, workspaceId);
    const member = await this.getMemberOrThrow(workspaceId, memberId);
    await this.assertNotWorkspaceOwner(
      workspaceId,
      member.userId,
      'змінити роль',
    );

    const updated = await this.workspaces.updateMemberRole(memberId, dto.role);
    this.logger.log(
      `Роль учасника ${member.userId} у просторі ${workspaceId} → ${dto.role} (виконав ${userId})`,
    );
    return WorkspaceMemberDto.from(updated);
  }

  async removeMember(
    userId: string,
    workspaceId: string,
    memberId: string,
  ): Promise<{ success: true }> {
    await this.access.requireWorkspaceOwner(userId, workspaceId);
    const member = await this.getMemberOrThrow(workspaceId, memberId);
    await this.assertNotWorkspaceOwner(workspaceId, member.userId, 'видалити');

    await this.workspaces.deleteMember(memberId);
    await this.realtime.disconnectFromWorkspace(member.userId);
    this.logger.log(
      `Учасника ${member.userId} видалено з простору ${workspaceId} (виконав ${userId})`,
    );
    return { success: true };
  }

  private async getMemberOrThrow(
    workspaceId: string,
    memberId: string,
  ): Promise<WorkspaceMember> {
    const member = await this.workspaces.findMemberInWorkspace(
      workspaceId,
      memberId,
    );
    if (!member) {
      throw new NotFoundException('Учасника не знайдено');
    }
    return member;
  }

  private async assertNotWorkspaceOwner(
    workspaceId: string,
    memberUserId: string,
    action: string,
  ): Promise<void> {
    const workspace = await this.workspaces.findById(workspaceId);
    if (workspace?.ownerId === memberUserId) {
      throw new BadRequestException(
        `Не можна ${action} власника робочого простору`,
      );
    }
  }
}
