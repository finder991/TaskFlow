import { Project, WorkspaceRole } from '@prisma/client';
import { TaskWithProject } from '../../tasks/tasks.repository';

export interface ProjectAccess {
  project: Project;
  role: WorkspaceRole;
}

export interface TaskAccess {
  task: TaskWithProject;
  role: WorkspaceRole;
}
