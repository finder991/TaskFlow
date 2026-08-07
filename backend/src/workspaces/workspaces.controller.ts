import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
} from './dto/workspace-request.dto';
import { InvitationsService } from './invitations.service';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspaces: WorkspacesService,
    private readonly invitations: InvitationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Створити робочий простір' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список робочих просторів користувача' })
  list(@CurrentUser('id') userId: string) {
    return this.workspaces.listForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Деталі робочого простору (з учасниками)' })
  getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workspaces.getById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Оновити робочий простір (лише власник)' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaces.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити робочий простір (лише власник)' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workspaces.remove(userId, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Список учасників' })
  members(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workspaces.listMembers(userId, id);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Змінити роль учасника (лише власник)' })
  updateMemberRole(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspaces.updateMemberRole(userId, id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Видалити учасника (лише власник)' })
  removeMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspaces.removeMember(userId, id, memberId);
  }

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Запросити учасника за email (лише власник)' })
  invite(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.invitations.invite(userId, id, dto);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'Список запрошень (лише власник)' })
  listInvitations(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.invitations.list(userId, id);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiOperation({ summary: 'Скасувати запрошення (лише власник)' })
  revokeInvitation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.invitations.revoke(userId, id, invitationId);
  }
}
