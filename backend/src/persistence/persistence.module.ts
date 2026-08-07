import { Global, Module } from '@nestjs/common';
import { RefreshTokenRepository } from '../auth/refresh-token.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { CommentsRepository } from '../tasks/comments.repository';
import { TasksRepository } from '../tasks/tasks.repository';
import { UsersRepository } from '../users/users.repository';
import { InvitationsRepository } from '../workspaces/invitations.repository';
import { WorkspacesRepository } from '../workspaces/workspaces.repository';

const repositories = [
  UsersRepository,
  RefreshTokenRepository,
  WorkspacesRepository,
  InvitationsRepository,
  ProjectsRepository,
  TasksRepository,
  CommentsRepository,
];

@Global()
@Module({
  providers: repositories,
  exports: repositories,
})
export class PersistenceModule {}
