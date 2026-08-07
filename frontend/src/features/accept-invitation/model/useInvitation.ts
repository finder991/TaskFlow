import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invitationApi } from '@/entities/workspace';
import { queryKeys } from '@/shared/api';

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: queryKeys.invitationPreview(token),
    queryFn: () => invitationApi.preview(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useAcceptInvitation(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => invitationApi.accept(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces }),
  });
}
