import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi, type WorkspaceRole } from '@/entities/workspace';
import { queryKeys } from '@/shared/api';

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => workspaceApi.create(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces }),
  });
}

export function useInviteMember(workspaceId: string) {
  return useMutation({
    mutationFn: (payload: { email: string; role?: WorkspaceRole }) =>
      workspaceApi.invite(workspaceId, payload),
  });
}


export function useUpdateMemberRole(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceRole }) =>
      workspaceApi.updateMemberRole(workspaceId, memberId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) }),
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => workspaceApi.removeMember(workspaceId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) }),
  });
}
