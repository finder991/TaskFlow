import type { UserSummary } from '@/entities/user/@x/task';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskActivityType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'PRIORITY_CHANGED';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assignee: UserSummary | null;
  createdById: string;
  dueDate: string | null;
  position: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  type: TaskActivityType;
  fromValue: string | null;
  toValue: string | null;
  actor: UserSummary | null;
  createdAt: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority | '';

  assigneeId?: string;
  search?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export interface MoveTaskPayload {
  status: TaskStatus;
  position: number;
}
