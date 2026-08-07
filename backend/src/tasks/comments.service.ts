import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { AccessControlService } from '../common/access/access-control.service';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../common/dto/pagination.dto';
import { RealtimeEvent } from '../realtime/realtime.events';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CommentsRepository, CommentWithTask } from './comments.repository';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment-request.dto';
import { CommentDto } from './dto/task-response.dto';

const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

@Injectable()
export class CommentsService {
  constructor(
    private readonly comments: CommentsRepository,
    private readonly access: AccessControlService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async list(
    userId: string,
    taskId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<CommentDto>> {
    await this.access.requireTaskAccess(userId, taskId);
    const limit = pagination.limit ?? DEFAULT_LIMIT;
    const page = pagination.page ?? DEFAULT_PAGE;

    const [total, items] = await this.comments.findManyWithTotal(
      taskId,
      page,
      limit,
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: items.map((comment) => CommentDto.from(comment)),
      meta: { limit, page, total, totalPages, hasNextPage: page < totalPages },
    };
  }

  async create(
    userId: string,
    taskId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDto> {
    const { task } = await this.access.requireTaskAccess(userId, taskId);
    const comment = await this.comments.create({
      taskId,
      authorId: userId,
      body: dto.body,
    });

    const result = CommentDto.from(comment);
    this.realtime.emitToProject(
      task.projectId,
      RealtimeEvent.COMMENT_CREATED,
      result,
    );
    return result;
  }

  async update(
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentDto> {
    const { comment } = await this.loadCommentWithRole(userId, commentId);
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Редагувати можна лише власні коментарі');
    }
    const updated = await this.comments.update(commentId, dto.body);

    const result = CommentDto.from(updated);
    this.realtime.emitToProject(
      comment.task.projectId,
      RealtimeEvent.COMMENT_UPDATED,
      result,
    );
    return result;
  }

  async remove(userId: string, commentId: string): Promise<{ success: true }> {
    const { comment, role } = await this.loadCommentWithRole(userId, commentId);

    if (comment.authorId !== userId && role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Видаляти можна власні коментарі або бути власником робочого простору',
      );
    }
    await this.comments.delete(commentId);

    this.realtime.emitToProject(
      comment.task.projectId,
      RealtimeEvent.COMMENT_DELETED,
      {
        id: commentId,
        taskId: comment.taskId,
        projectId: comment.task.projectId,
      },
    );
    return { success: true };
  }

  private async loadCommentWithRole(
    userId: string,
    commentId: string,
  ): Promise<{ comment: CommentWithTask; role: WorkspaceRole }> {
    const comment = await this.comments.findByIdWithTask(commentId);
    if (!comment) {
      throw new NotFoundException('Коментар не знайдено');
    }
    const { role } = await this.access.requireTaskAccess(
      userId,
      comment.taskId,
    );
    return { comment, role };
  }
}
