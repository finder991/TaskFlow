import { http } from '@/shared/api';
import type {
  Invitation,
  InvitationPreview,
  Workspace,
  WorkspaceDetail,
  WorkspaceMember,
  WorkspaceRole,
} from '../model/types';

export const workspaceApi = {
  list: () => http.get<Workspace[]>('/workspaces').then((r) => r.data),

  getById: (id: string) => http.get<WorkspaceDetail>(`/workspaces/${id}`).then((r) => r.data),

  create: (name: string) => http.post<Workspace>('/workspaces', { name }).then((r) => r.data),

  update: (id: string, name: string) =>
    http.patch<Workspace>(`/workspaces/${id}`, { name }).then((r) => r.data),

  remove: (id: string) => http.delete(`/workspaces/${id}`).then((r) => r.data),

  listMembers: (id: string) =>
    http.get<WorkspaceMember[]>(`/workspaces/${id}/members`).then((r) => r.data),

  updateMemberRole: (id: string, memberId: string, role: WorkspaceRole) =>
    http
      .patch<WorkspaceMember>(`/workspaces/${id}/members/${memberId}`, { role })
      .then((r) => r.data),

  removeMember: (id: string, memberId: string) =>
    http.delete(`/workspaces/${id}/members/${memberId}`).then((r) => r.data),

  invite: (id: string, payload: { email: string; role?: WorkspaceRole }) =>
    http.post<Invitation>(`/workspaces/${id}/invitations`, payload).then((r) => r.data),

};

export const invitationApi = {
  preview: (token: string) =>
    http.get<InvitationPreview>(`/invitations/${token}`).then((r) => r.data),

  accept: (token: string) =>
    http.post<Workspace>(`/invitations/${token}/accept`).then((r) => r.data),
};
