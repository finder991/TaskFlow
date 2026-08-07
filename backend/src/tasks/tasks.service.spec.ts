import { BadRequestException } from '@nestjs/common';
import { TaskActivityType, TaskPriority, TaskStatus } from '@prisma/client';
import { AccessControlService } from '../common/access/access-control.service';
import { RealtimeEvent } from '../realtime/realtime.events';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WorkspacesRepository } from '../workspaces/workspaces.repository';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepo: {
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    reorder: jest.Mock;
    delete: jest.Mock;
    findLastPosition: jest.Mock;
    findManyWithTotal: jest.Mock;
    findManyByCursor: jest.Mock;
    createActivity: jest.Mock;
    createActivities: jest.Mock;
    listActivity: jest.Mock;
  };
  let workspacesRepo: { findMembership: jest.Mock };
  let access: { requireProjectAccess: jest.Mock; requireTaskAccess: jest.Mock };
  let realtime: { emitToProject: jest.Mock };

  const WORKSPACE_ID = 'ws1';
  const PROJECT_ID = 'proj1';
  const USER_ID = 'user1';
  const TASK_ID = 'task1';

  const buildTaskRow = (overrides: Record<string, unknown> = {}) => ({
    id: TASK_ID,
    projectId: PROJECT_ID,
    title: 'Task',
    description: null,
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assigneeId: null,
    createdById: USER_ID,
    dueDate: null,
    position: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    assignee: null,
    _count: { comments: 0 },
    ...overrides,
  });

  const accessTask = (overrides: Record<string, unknown> = {}) => ({
    task: {
      id: TASK_ID,
      projectId: PROJECT_ID,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: null,
      project: { id: PROJECT_ID, workspaceId: WORKSPACE_ID },
      ...overrides,
    },
    role: 'MEMBER',
  });

  beforeEach(() => {
    tasksRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      reorder: jest.fn(),
      delete: jest.fn(),
      findLastPosition: jest.fn(),
      findManyWithTotal: jest.fn(),
      findManyByCursor: jest.fn(),
      createActivity: jest.fn(),
      createActivities: jest.fn(),
      listActivity: jest.fn(),
    };
    workspacesRepo = { findMembership: jest.fn() };
    access = {
      requireProjectAccess: jest.fn().mockResolvedValue({
        project: { id: PROJECT_ID, workspaceId: WORKSPACE_ID },
        role: 'MEMBER',
      }),
      requireTaskAccess: jest.fn(),
    };
    realtime = { emitToProject: jest.fn() };

    service = new TasksService(
      tasksRepo as unknown as TasksRepository,
      workspacesRepo as unknown as WorkspacesRepository,
      access as unknown as AccessControlService,
      realtime as unknown as RealtimeGateway,
    );
  });

  describe('create', () => {
    it('створює задачу, логує активність CREATED і надсилає realtime-подію', async () => {
      tasksRepo.findLastPosition.mockResolvedValue(null);
      tasksRepo.create.mockResolvedValue(buildTaskRow());

      const result = await service.create(USER_ID, PROJECT_ID, {
        title: 'Task',
      });

      expect(tasksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task',
          position: 0,
          createdById: USER_ID,
        }),
      );
      expect(tasksRepo.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: TASK_ID,
          actorId: USER_ID,
          type: TaskActivityType.CREATED,
        }),
      );
      expect(realtime.emitToProject).toHaveBeenCalledWith(
        PROJECT_ID,
        RealtimeEvent.TASK_CREATED,
        expect.objectContaining({ id: TASK_ID }),
      );
      expect(result.position).toBe(0);
    });

    it('обчислює наступну позицію на основі останньої задачі в колонці', async () => {
      tasksRepo.findLastPosition.mockResolvedValue(4);
      tasksRepo.create.mockResolvedValue(buildTaskRow({ position: 5 }));

      await service.create(USER_ID, PROJECT_ID, { title: 'Task' });

      expect(tasksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ position: 5 }),
      );
    });

    it('відхиляє призначення виконавця, який не є учасником простору', async () => {
      workspacesRepo.findMembership.mockResolvedValue(null);

      await expect(
        service.create(USER_ID, PROJECT_ID, {
          title: 'Task',
          assigneeId: 'stranger',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tasksRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('при зміні статусу логує STATUS_CHANGED і виставляє нову позицію', async () => {
      access.requireTaskAccess.mockResolvedValue(accessTask());
      tasksRepo.findLastPosition.mockResolvedValue(2);
      tasksRepo.update.mockResolvedValue(
        buildTaskRow({ status: TaskStatus.DONE, position: 3 }),
      );

      await service.update(USER_ID, TASK_ID, { status: TaskStatus.DONE });

      expect(tasksRepo.update).toHaveBeenCalledWith(
        TASK_ID,
        expect.objectContaining({ status: TaskStatus.DONE, position: 3 }),
      );
      expect(tasksRepo.createActivities).toHaveBeenCalledWith([
        {
          taskId: TASK_ID,
          actorId: USER_ID,
          type: TaskActivityType.STATUS_CHANGED,
          fromValue: TaskStatus.TODO,
          toValue: TaskStatus.DONE,
        },
      ]);
      expect(realtime.emitToProject).toHaveBeenCalledWith(
        PROJECT_ID,
        RealtimeEvent.TASK_UPDATED,
        expect.any(Object),
      );
    });

    it('не пише активність, якщо змінилися лише текстові поля', async () => {
      access.requireTaskAccess.mockResolvedValue(accessTask());
      tasksRepo.update.mockResolvedValue(buildTaskRow({ title: 'New title' }));

      await service.update(USER_ID, TASK_ID, { title: 'New title' });

      expect(tasksRepo.createActivities).toHaveBeenCalledWith([]);
    });

    it('логує зміну виконавця та пріоритету одним записом кожну', async () => {
      access.requireTaskAccess.mockResolvedValue(accessTask());
      workspacesRepo.findMembership.mockResolvedValue({
        id: 'm1',
        role: 'MEMBER',
      });
      tasksRepo.update.mockResolvedValue(
        buildTaskRow({ priority: TaskPriority.HIGH }),
      );

      await service.update(USER_ID, TASK_ID, {
        priority: TaskPriority.HIGH,
        assigneeId: 'user2',
      });

      const activities = tasksRepo.createActivities.mock.calls[0][0];
      expect(activities.map((a: { type: string }) => a.type)).toEqual([
        TaskActivityType.PRIORITY_CHANGED,
        TaskActivityType.ASSIGNEE_CHANGED,
      ]);
    });
  });

  describe('move', () => {
    it('оновлює статус/позицію і логує зміну статусу', async () => {
      access.requireTaskAccess.mockResolvedValue(accessTask());
      tasksRepo.reorder.mockResolvedValue(
        buildTaskRow({ status: TaskStatus.IN_PROGRESS, position: 1 }),
      );

      await service.move(USER_ID, TASK_ID, {
        status: TaskStatus.IN_PROGRESS,
        position: 1,
      });

      expect(tasksRepo.reorder).toHaveBeenCalledWith(
        TASK_ID,
        PROJECT_ID,
        TaskStatus.IN_PROGRESS,
        1,
      );
      expect(tasksRepo.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({ type: TaskActivityType.STATUS_CHANGED }),
      );
      expect(realtime.emitToProject).toHaveBeenCalledWith(
        PROJECT_ID,
        RealtimeEvent.TASK_UPDATED,
        expect.any(Object),
      );
    });

    it('не логує активність при переміщенні всередині тієї ж колонки', async () => {
      access.requireTaskAccess.mockResolvedValue(accessTask());
      tasksRepo.reorder.mockResolvedValue(buildTaskRow({ position: 2 }));

      await service.move(USER_ID, TASK_ID, {
        status: TaskStatus.TODO,
        position: 2,
      });

      expect(tasksRepo.createActivity).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('видаляє задачу і надсилає подію TASK_DELETED', async () => {
      access.requireTaskAccess.mockResolvedValue(accessTask());

      const result = await service.remove(USER_ID, TASK_ID);

      expect(tasksRepo.delete).toHaveBeenCalledWith(TASK_ID);
      expect(realtime.emitToProject).toHaveBeenCalledWith(
        PROJECT_ID,
        RealtimeEvent.TASK_DELETED,
        {
          id: TASK_ID,
          projectId: PROJECT_ID,
        },
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('list', () => {
    it('повертає offset-пагіновані задачі з мета-даними', async () => {
      tasksRepo.findManyWithTotal.mockResolvedValue([1, [buildTaskRow()]]);

      const result = await service.list(USER_ID, PROJECT_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
        }),
      );
    });

    it('у cursor-режимі повертає nextCursor і обрізає зайвий елемент', async () => {
      tasksRepo.findManyByCursor.mockResolvedValue([
        buildTaskRow({ id: 'a' }),
        buildTaskRow({ id: 'b' }),
        buildTaskRow({ id: 'c' }),
      ]);

      const result = await service.list(USER_ID, PROJECT_ID, {
        limit: 2,
        cursor: 'start',
      });

      expect(result.data.map((t) => t.id)).toEqual(['a', 'b']);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.nextCursor).toBe('b');
    });
  });
});
