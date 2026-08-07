import type { BadgeTone } from '@/shared/ui';
import type { TaskPriority, TaskStatus } from './types';

export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'До виконання',
  IN_PROGRESS: 'В роботі',
  DONE: 'Готово',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Низький',
  MEDIUM: 'Середній',
  HIGH: 'Високий',
  URGENT: 'Терміново',
};

export const PRIORITY_TONES: Record<TaskPriority, BadgeTone> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

export const statusLabel = (value: string | null): string =>
  value ? (STATUS_LABELS[value as TaskStatus] ?? '—') : '—';

export const priorityLabel = (value: string | null): string =>
  value ? (PRIORITY_LABELS[value as TaskPriority] ?? '—') : '—';
