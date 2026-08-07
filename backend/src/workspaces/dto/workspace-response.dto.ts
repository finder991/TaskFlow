import { ApiProperty } from '@nestjs/swagger';
import {
  Invitation,
  InvitationStatus,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from '@prisma/client';
import { UserSummaryDto } from '../../users/dto/user-response.dto';

export class WorkspaceMemberDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: WorkspaceRole })
  role!: WorkspaceRole;

  @ApiProperty({ type: UserSummaryDto })
  user!: UserSummaryDto;

  @ApiProperty()
  createdAt!: Date;

  static from(member: WorkspaceMember & { user: User }): WorkspaceMemberDto {
    return {
      id: member.id,
      role: member.role,
      user: UserSummaryDto.from(member.user)!,
      createdAt: member.createdAt,
    };
  }
}

export class WorkspaceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'ID власника робочого простору' })
  ownerId!: string;

  @ApiProperty({
    enum: WorkspaceRole,
    description: 'Роль поточного користувача',
  })
  role!: WorkspaceRole;

  @ApiProperty()
  membersCount!: number;

  @ApiProperty()
  projectsCount!: number;

  @ApiProperty()
  createdAt!: Date;

  static from(
    workspace: Workspace & { _count?: { members: number; projects: number } },
    role: WorkspaceRole,
  ): WorkspaceDto {
    return {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
      role,
      membersCount: workspace._count?.members ?? 0,
      projectsCount: workspace._count?.projects ?? 0,
      createdAt: workspace.createdAt,
    };
  }
}

export class WorkspaceDetailDto extends WorkspaceDto {
  @ApiProperty({ type: [WorkspaceMemberDto] })
  members!: WorkspaceMemberDto[];
}

export class InvitationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: WorkspaceRole })
  role!: WorkspaceRole;

  @ApiProperty({ enum: InvitationStatus })
  status!: InvitationStatus;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty()
  createdAt!: Date;

  static from(invitation: Invitation): InvitationDto {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }
}

export class InvitationPreviewDto {
  @ApiProperty()
  email!: string;

  @ApiProperty()
  workspaceName!: string;

  @ApiProperty({ enum: InvitationStatus })
  status!: InvitationStatus;

  @ApiProperty()
  expiresAt!: Date;
}
