import { describe, expect, it } from 'vitest';
import type { Task } from '../model/types';
import { filterTasks, groupByStatus, upsertTask } from './board';

function makeTask(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    projectId: 'p1',
    title: 'Task',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: null,
    assignee: null,
    createdById: 'u1',
    dueDate: null,
    position: 0,
    commentsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('groupByStatus', () => {
  it('групує задачі за статусом і сортує за position', () => {
    const tasks = [
      makeTask({ id: 'a', status: 'TODO', position: 1 }),
      makeTask({ id: 'b', status: 'TODO', position: 0 }),
      makeTask({ id: 'c', status: 'DONE', position: 0 }),
    ];

    const groups = groupByStatus(tasks);

    expect(groups.TODO.map((t) => t.id)).toEqual(['b', 'a']);
    expect(groups.DONE.map((t) => t.id)).toEqual(['c']);
    expect(groups.IN_PROGRESS).toHaveLength(0);
  });
});

describe('upsertTask', () => {
  it('додає нову задачу', () => {
    const result = upsertTask([], makeTask({ id: 'a' }));
    expect(result).toHaveLength(1);
  });

  it('замінює наявну задачу за id', () => {
    const existing = [makeTask({ id: 'a', title: 'Old' })];
    const result = upsertTask(existing, makeTask({ id: 'a', title: 'New', status: 'DONE' }));

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('New');
    expect(result[0].status).toBe('DONE');
  });
});

describe('filterTasks', () => {
  const tasks = [
    makeTask({ id: 'a', title: 'Полагодити логін', priority: 'HIGH', assigneeId: 'u1' }),
    makeTask({ id: 'b', title: 'Оновити доку', priority: 'LOW' }),
    makeTask({ id: 'c', title: 'Логи сервера', priority: 'HIGH', assigneeId: 'u2' }),
  ];

  it('фільтрує за пріоритетом', () => {
    expect(filterTasks(tasks, { priority: 'HIGH' }).map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('фільтрує задачі без виконавця', () => {
    expect(filterTasks(tasks, { assigneeId: 'unassigned' }).map((t) => t.id)).toEqual(['b']);
  });

  it('фільтрує за конкретним виконавцем', () => {
    expect(filterTasks(tasks, { assigneeId: 'u2' }).map((t) => t.id)).toEqual(['c']);
  });

  it('шукає за назвою без урахування регістру', () => {
    expect(filterTasks(tasks, { search: 'ЛОГ' }).map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('повертає всі задачі, якщо фільтри порожні', () => {
    expect(filterTasks(tasks, {})).toHaveLength(3);
  });
});
