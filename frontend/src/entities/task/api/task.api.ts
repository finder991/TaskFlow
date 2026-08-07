import { http, type Paginated } from '@/shared/api';
import type {
  CreateTaskPayload,
  MoveTaskPayload,
  Task,
  TaskActivity,
  TaskFilters,
  UpdateTaskPayload,
} from '../model/types';

export interface TaskListParams extends TaskFilters {
  page?: number;
  limit?: number;
  cursor?: string;
}

export const taskApi = {
  list: (projectId: string, params?: TaskListParams) =>
    http.get<Paginated<Task>>(`/projects/${projectId}/tasks`, { params }).then((r) => r.data),

  getById: (id: string) => http.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (projectId: string, payload: CreateTaskPayload) =>
    http.post<Task>(`/projects/${projectId}/tasks`, payload).then((r) => r.data),

  update: (id: string, payload: UpdateTaskPayload) =>
    http.patch<Task>(`/tasks/${id}`, payload).then((r) => r.data),

  move: (id: string, payload: MoveTaskPayload) =>
    http.patch<Task>(`/tasks/${id}/move`, payload).then((r) => r.data),

  remove: (id: string) => http.delete(`/tasks/${id}`).then((r) => r.data),

  activity: (id: string) => http.get<TaskActivity[]>(`/tasks/${id}/activity`).then((r) => r.data),
};
