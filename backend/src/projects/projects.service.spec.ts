import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { AccessControlService } from '../common/access/access-control.service';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepo: {
    update: jest.Mock;
  };
  let access: { requireProjectAccess: jest.Mock };

  const USER_ID = 'user1';
  const PROJECT_ID = 'project1';
  const WORKSPACE_ID = 'workspace1';

  const projectRow = {
    id: PROJECT_ID,
    workspaceId: WORKSPACE_ID,
    name: 'Project',
    description: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    _count: { tasks: 0 },
  };

  beforeEach(() => {
    projectsRepo = {
      update: jest.fn(),
    };
    access = {
      requireProjectAccess: jest.fn(),
    };

    service = new ProjectsService(
      projectsRepo as unknown as ProjectsRepository,
      access as unknown as AccessControlService,
    );
  });

  describe('update', () => {
    it('забороняє учаснику редагувати проєкт', async () => {
      access.requireProjectAccess.mockResolvedValue({
        project: projectRow,
        role: WorkspaceRole.MEMBER,
      });

      await expect(
        service.update(USER_ID, PROJECT_ID, { name: 'Blocked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(projectsRepo.update).not.toHaveBeenCalled();
    });
  });
});
