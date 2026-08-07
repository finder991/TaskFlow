import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { QueueModule } from '../queue/queue.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { UsersModule } from '../users/users.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [UsersModule, MailModule, QueueModule, RealtimeModule],
  controllers: [WorkspacesController, InvitationsController],
  providers: [WorkspacesService, InvitationsService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
