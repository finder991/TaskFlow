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
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller()
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post('workspaces/:workspaceId/projects')
  @ApiOperation({ summary: 'Створити проєкт у робочому просторі' })
  create(
    @CurrentUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(userId, workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/projects')
  @ApiOperation({ summary: 'Список проєктів робочого простору' })
  list(
    @CurrentUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.projects.listForWorkspace(userId, workspaceId);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Деталі проєкту' })
  getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projects.getById(userId, id);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Оновити проєкт' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(userId, id, dto);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Видалити проєкт (лише власник)' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projects.remove(userId, id);
  }
}
