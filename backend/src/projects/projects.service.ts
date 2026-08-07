import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { AccessControlService } from '../common/access/access-control.service';
import {
  CreateProjectDto,
  ProjectDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly projects: ProjectsRepository,
    private readonly access: AccessControlService,
  ) {}

  async create(
    userId: string,
    workspaceId: string,
    dto: CreateProjectDto,
  ): Promise<ProjectDto> {
    await this.access.requireWorkspaceRole(userId, workspaceId);
    const project = await this.projects.create({
      workspaceId,
      name: dto.name,
      description: dto.description ?? null,
    });
    this.logger.log(
      `Створено проєкт ${project.id} у просторі ${workspaceId} (користувач ${userId})`,
    );
    return ProjectDto.from(project);
  }

  async listForWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<ProjectDto[]> {
    await this.access.requireWorkspaceRole(userId, workspaceId);
    const projects = await this.projects.listForWorkspace(workspaceId);
    return projects.map((project) => ProjectDto.from(project));
  }

  async getById(userId: string, projectId: string): Promise<ProjectDto> {
    await this.access.requireProjectAccess(userId, projectId);
    const project = await this.projects.findByIdWithCounts(projectId);
    if (!project) {
      throw new NotFoundException('Проєкт не знайдено');
    }
    return ProjectDto.from(project);
  }

  async update(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    await this.access.requireProjectAccess(userId, projectId);
    const project = await this.projects.update(projectId, {
      name: dto.name,
      description: dto.description,
    });
    return ProjectDto.from(project);
  }

  async remove(userId: string, projectId: string): Promise<{ success: true }> {
    const { role } = await this.access.requireProjectAccess(userId, projectId);
    if (role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Видаляти проєкт може лише власник робочого простору',
      );
    }
    await this.projects.delete(projectId);
    this.logger.log(`Видалено проєкт ${projectId} (користувач ${userId})`);
    return { success: true };
  }
}
