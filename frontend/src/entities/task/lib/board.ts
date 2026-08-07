import { TASK_STATUSES } from '../model/labels';
import type { Task, TaskStatus } from '../model/types';

export function upsertTask(tasks: Task[] | undefined, task: Task): Task[] {
  if (!tasks) return [task];
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index === -1) return [...tasks, task];
  const next = tasks.slice();
  next[index] = task;
  return next;
}

export function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  for (const status of TASK_STATUSES) {
    groups[status].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
  }
  return groups;
}

export function filterTasks(
  tasks: Task[],
  filters: { priority?: string; assigneeId?: string; search?: string },
): Task[] {
  const search = filters.search?.trim().toLowerCase() ?? '';
  return tasks.filter((task) => {
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assigneeId === 'unassigned' && task.assigneeId) return false;
    if (
      filters.assigneeId &&
      filters.assigneeId !== 'unassigned' &&
      task.assigneeId !== filters.assigneeId
    ) {
      return false;
    }
    if (search && !task.title.toLowerCase().includes(search)) return false;
    return true;
  });
}
