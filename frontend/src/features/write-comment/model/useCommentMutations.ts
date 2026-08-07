import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '@/entities/comment';
import { queryKeys } from '@/shared/api';

function useInvalidateComments(taskId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.comments(taskId) });
}

export function useCreateComment(taskId: string) {
  const invalidate = useInvalidateComments(taskId);
  return useMutation({
    mutationFn: (body: string) => commentApi.create(taskId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateComment(taskId: string) {
  const invalidate = useInvalidateComments(taskId);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => commentApi.update(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteComment(taskId: string) {
  const invalidate = useInvalidateComments(taskId);
  return useMutation({
    mutationFn: (id: string) => commentApi.remove(id),
    onSuccess: invalidate,
  });
}
