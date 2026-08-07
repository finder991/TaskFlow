import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { ProjectsRepository } from '../../projects/projects.repository';
import { TasksRepository, TaskWithProject } from '../../tasks/tasks.repository';
import { WorkspacesRepository } from '../../workspaces/workspaces.repository';
import { ProjectAccess, TaskAccess } from './access.types';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly workspaces: WorkspacesRepository,
    private readonly projects: ProjectsRepository,
    private readonly tasks: TasksRepository,
  ) {}

  async requireWorkspaceRole(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceRole> {
    const membership = await this.workspaces.findMembership(
      workspaceId,
      userId,
    );
    if (membership) {
      return membership.role;
    }

    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Робочий простір не знайдено');
    }
    throw new ForbiddenException('Немає доступу до цього робочого простору');
  }

  async requireWorkspaceOwner(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const role = await this.requireWorkspaceRole(userId, workspaceId);
    if (role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Дія доступна лише власнику робочого простору',
      );
    }
  }

  async requireProjectAccess(
    userId: string,
    projectId: string,
  ): Promise<ProjectAccess> {
    const project = await this.projects.findById(projectId);
    if (!project) {
      throw new NotFoundException('Проєкт не знайдено');
    }
    const role = await this.requireWorkspaceRole(userId, project.workspaceId);
    return { project, role };
  }

  async requireTaskAccess(userId: string, taskId: string): Promise<TaskAccess> {
    const task: TaskWithProject | null =
      await this.tasks.findByIdWithProject(taskId);
    if (!task) {
      throw new NotFoundException('Задачу не знайдено');
    }
    const role = await this.requireWorkspaceRole(
      userId,
      task.project.workspaceId,
    );
    return { task, role };
  }
}
