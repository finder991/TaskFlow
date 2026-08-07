import { PRIORITY_LABELS, type TaskPriority } from '@/entities/task';

export const PRIORITIES = Object.keys(PRIORITY_LABELS) as TaskPriority[];

export interface TaskFilterValue {
  assigneeId: string;
  priority: string;
  search: string;
}

export const EMPTY_TASK_FILTERS: TaskFilterValue = {
  assigneeId: '',
  priority: '',
  search: '',
};
