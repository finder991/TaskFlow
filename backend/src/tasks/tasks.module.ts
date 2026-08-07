import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [RealtimeModule],
  controllers: [TasksController, CommentsController],
  providers: [TasksService, CommentsService],
  exports: [TasksService],
})
export class TasksModule {}
