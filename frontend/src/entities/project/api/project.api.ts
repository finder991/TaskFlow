import { http } from '@/shared/api';
import type { Project, ProjectPayload } from '../model/types';

export const projectApi = {
  list: (workspaceId: string) =>
    http.get<Project[]>(`/workspaces/${workspaceId}/projects`).then((r) => r.data),

  getById: (id: string) => http.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (workspaceId: string, payload: ProjectPayload) =>
    http.post<Project>(`/workspaces/${workspaceId}/projects`, payload).then((r) => r.data),

  update: (id: string, payload: Partial<ProjectPayload>) =>
    http.patch<Project>(`/projects/${id}`, payload).then((r) => r.data),

  remove: (id: string) => http.delete(`/projects/${id}`).then((r) => r.data),
};
