import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, type ProjectPayload } from '@/entities/project';
import { queryKeys } from '@/shared/api';

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPayload) => projectApi.create(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) });

      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    },
  });
}

export function useDeleteProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => projectApi.remove(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    },
  });
}
