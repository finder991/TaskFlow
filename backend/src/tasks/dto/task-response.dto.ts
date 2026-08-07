import { ApiProperty } from '@nestjs/swagger';
import {
  Comment,
  Task,
  TaskActivity,
  TaskActivityType,
  TaskPriority,
  TaskStatus,
  User,
} from '@prisma/client';
import { UserSummaryDto } from '../../users/dto/user-response.dto';

type TaskWithRelations = Task & {
  assignee?: Pick<User, 'id' | 'email' | 'name'> | null;
  _count?: { comments: number };
};

export class TaskDto {
  @ApiProperty() id!: string;
  @ApiProperty() projectId!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ enum: TaskStatus }) status!: TaskStatus;
  @ApiProperty({ enum: TaskPriority }) priority!: TaskPriority;
  @ApiProperty({ nullable: true }) assigneeId!: string | null;
  @ApiProperty({ type: UserSummaryDto, nullable: true })
  assignee!: UserSummaryDto | null;
  @ApiProperty() createdById!: string;
  @ApiProperty({ nullable: true }) dueDate!: Date | null;
  @ApiProperty() position!: number;
  @ApiProperty() commentsCount!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static from(task: TaskWithRelations): TaskDto {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      assignee: UserSummaryDto.from(task.assignee),
      createdById: task.createdById,
      dueDate: task.dueDate,
      position: task.position,
      commentsCount: task._count?.comments ?? 0,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}

export class TaskActivityDto {
  @ApiProperty() id!: string;
  @ApiProperty() taskId!: string;
  @ApiProperty({ enum: TaskActivityType }) type!: TaskActivityType;
  @ApiProperty({ nullable: true }) fromValue!: string | null;
  @ApiProperty({ nullable: true }) toValue!: string | null;
  @ApiProperty({ type: UserSummaryDto, nullable: true })
  actor!: UserSummaryDto | null;
  @ApiProperty() createdAt!: Date;

  static from(
    activity: TaskActivity & {
      actor?: Pick<User, 'id' | 'email' | 'name'> | null;
    },
  ): TaskActivityDto {
    return {
      id: activity.id,
      taskId: activity.taskId,
      type: activity.type,
      fromValue: activity.fromValue,
      toValue: activity.toValue,
      actor: UserSummaryDto.from(activity.actor),
      createdAt: activity.createdAt,
    };
  }
}

export class CommentDto {
  @ApiProperty() id!: string;
  @ApiProperty() taskId!: string;
  @ApiProperty() body!: string;
  @ApiProperty({ type: UserSummaryDto, nullable: true })
  author!: UserSummaryDto | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static from(
    comment: Comment & { author?: Pick<User, 'id' | 'email' | 'name'> | null },
  ): CommentDto {
    return {
      id: comment.id,
      taskId: comment.taskId,
      body: comment.body,
      author: UserSummaryDto.from(comment.author),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
