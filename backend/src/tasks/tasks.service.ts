import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TaskActivityType,
  TaskStatus,
  WorkspaceRole,
} from '@prisma/client';
import { AccessControlService } from '../common/access/access-control.service';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { RealtimeEvent } from '../realtime/realtime.events';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WorkspacesRepository } from '../workspaces/workspaces.repository';
import {
  CreateTaskDto,
  MoveTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from './dto/task-request.dto';
import { TaskActivityDto, TaskDto } from './dto/task-response.dto';
import { TasksRepository } from './tasks.repository';

const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tasks: TasksRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly access: AccessControlService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(
    userId: string,
    projectId: string,
    dto: CreateTaskDto,
  ): Promise<TaskDto> {
    const { project } = await this.access.requireProjectAccess(
      userId,
      projectId,
    );
    const status = dto.status ?? TaskStatus.TODO;

    if (dto.assigneeId) {
      await this.assertAssigneeIsMember(project.workspaceId, dto.assigneeId);
    }

    const task = await this.tasks.create({
      projectId,
      title: dto.title,
      description: dto.description ?? null,
      status,
      priority: dto.priority ?? undefined,
      assigneeId: dto.assigneeId ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      createdById: userId,
      position: await this.nextPosition(projectId, status),
    });

    await this.tasks.createActivity(
      this.activity(task.id, userId, TaskActivityType.CREATED),
    );

    const result = TaskDto.from(task);
    this.logger.log(
      `Створено задачу ${task.id} у проєкті ${projectId} (автор ${userId})`,
    );
    this.realtime.emitToProject(projectId, RealtimeEvent.TASK_CREATED, result);
    return result;
  }

  async list(
    userId: string,
    projectId: string,
    query: TaskQueryDto,
  ): Promise<PaginatedResult<TaskDto>> {
    await this.access.requireProjectAccess(userId, projectId);

    const filters = {
      projectId,
      status: query.status,
      priority: query.priority,
      assigneeId: query.assigneeId,
      search: query.search,
    };
    const limit = query.limit ?? DEFAULT_LIMIT;

    if (query.cursor) {
      const items = await this.tasks.findManyByCursor(
        filters,
        limit,
        query.cursor,
      );
      const hasNextPage = items.length > limit;
      const data = items.slice(0, limit).map((task) => TaskDto.from(task));
      return {
        data,
        meta: {
          limit,
          hasNextPage,
          nextCursor: hasNextPage ? data[data.length - 1].id : null,
        },
      };
    }

    const page = query.page ?? DEFAULT_PAGE;
    const [total, items] = await this.tasks.findManyWithTotal(
      filters,
      page,
      limit,
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: items.map((task) => TaskDto.from(task)),
      meta: { limit, page, total, totalPages, hasNextPage: page < totalPages },
    };
  }

  async getById(userId: string, taskId: string): Promise<TaskDto> {
    await this.access.requireTaskAccess(userId, taskId);
    const task = await this.tasks.findById(taskId);
    if (!task) {
      throw new NotFoundException('Задачу не знайдено');
    }
    return TaskDto.from(task);
  }

  async update(
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskDto> {
    const { task, role } = await this.access.requireTaskAccess(userId, taskId);
    this.assertCanManageTask(role);

    if (dto.assigneeId) {
      await this.assertAssigneeIsMember(
        task.project.workspaceId,
        dto.assigneeId,
      );
    }

    const data: Prisma.TaskUpdateInput = {};
    const activities: Prisma.TaskActivityCreateManyInput[] = [];

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    if (dto.status !== undefined && dto.status !== task.status) {
      data.status = dto.status;

      data.position = await this.nextPosition(task.projectId, dto.status);
      activities.push(
        this.activity(
          taskId,
          userId,
          TaskActivityType.STATUS_CHANGED,
          task.status,
          dto.status,
        ),
      );
    }
    if (dto.priority !== undefined && dto.priority !== task.priority) {
      data.priority = dto.priority;
      activities.push(
        this.activity(
          taskId,
          userId,
          TaskActivityType.PRIORITY_CHANGED,
          task.priority,
          dto.priority,
        ),
      );
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== task.assigneeId) {
      data.assignee = dto.assigneeId
        ? { connect: { id: dto.assigneeId } }
        : { disconnect: true };
      activities.push(
        this.activity(
          taskId,
          userId,
          TaskActivityType.ASSIGNEE_CHANGED,
          task.assigneeId,
          dto.assigneeId ?? null,
        ),
      );
    }

    const updated = await this.tasks.update(taskId, data);
    await this.tasks.createActivities(activities);

    if (activities.length) {
      this.logger.log(
        `Оновлено задачу ${taskId}: ${activities.map((a) => a.type).join(', ')} (користувач ${userId})`,
      );
    }

    const result = TaskDto.from(updated);
    this.realtime.emitToProject(
      updated.projectId,
      RealtimeEvent.TASK_UPDATED,
      result,
    );
    return result;
  }

  async move(
    userId: string,
    taskId: string,
    dto: MoveTaskDto,
  ): Promise<TaskDto> {
    const { task } = await this.access.requireTaskAccess(userId, taskId);

    const updated = await this.tasks.reorder(
      taskId,
      task.projectId,
      dto.status,
      dto.position,
    );
    if (dto.status !== task.status) {
      await this.tasks.createActivity(
        this.activity(
          taskId,
          userId,
          TaskActivityType.STATUS_CHANGED,
          task.status,
          dto.status,
        ),
      );
      this.logger.log(
        `Задачу ${taskId} переміщено ${task.status} → ${dto.status} (користувач ${userId})`,
      );
    }

    const result = TaskDto.from(updated);
    this.realtime.emitToProject(
      updated.projectId,
      RealtimeEvent.TASK_UPDATED,
      result,
    );
    return result;
  }

  async remove(userId: string, taskId: string): Promise<{ success: true }> {
    const { task, role } = await this.access.requireTaskAccess(userId, taskId);
    this.assertCanManageTask(role);
    await this.tasks.delete(taskId);
    this.logger.log(`Видалено задачу ${taskId} (користувач ${userId})`);
    this.realtime.emitToProject(task.projectId, RealtimeEvent.TASK_DELETED, {
      id: taskId,
      projectId: task.projectId,
    });
    return { success: true };
  }

  async listActivity(
    userId: string,
    taskId: string,
  ): Promise<TaskActivityDto[]> {
    await this.access.requireTaskAccess(userId, taskId);
    const activities = await this.tasks.listActivity(taskId);
    return activities.map((activity) => TaskActivityDto.from(activity));
  }

  private activity(
    taskId: string,
    actorId: string,
    type: TaskActivityType,
    fromValue: string | null = null,
    toValue: string | null = null,
  ): Prisma.TaskActivityCreateManyInput {
    return { taskId, actorId, type, fromValue, toValue };
  }

  private async nextPosition(
    projectId: string,
    status: TaskStatus,
  ): Promise<number> {
    const last = await this.tasks.findLastPosition(projectId, status);
    return last === null ? 0 : last + 1;
  }

  private async assertAssigneeIsMember(
    workspaceId: string,
    assigneeId: string,
  ): Promise<void> {
    const membership = await this.workspaces.findMembership(
      workspaceId,
      assigneeId,
    );
    if (!membership) {
      throw new BadRequestException(
        'Виконавець має бути учасником робочого простору',
      );
    }
  }

  private assertCanManageTask(role: WorkspaceRole): void {
    if (role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Редагувати або видаляти задачу може лише власник робочого простору',
      );
    }
  }
}
