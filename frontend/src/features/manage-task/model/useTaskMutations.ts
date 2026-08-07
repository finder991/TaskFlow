import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  taskApi,
  upsertTask,
  type CreateTaskPayload,
  type Task,
  type TaskStatus,
  type UpdateTaskPayload,
} from '@/entities/task';
import { queryKeys } from '@/shared/api';

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => taskApi.create(projectId, payload),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(queryKeys.board(projectId), (old) => upsertTask(old, task));
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      taskApi.update(id, payload),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(queryKeys.board(projectId), (old) => upsertTask(old, task));
      queryClient.setQueryData(queryKeys.task(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(task.id) });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => taskApi.remove(taskId),
    onSuccess: (_result, taskId) => {
      queryClient.setQueryData<Task[]>(queryKeys.board(projectId), (old) =>
        old?.filter((task) => task.id !== taskId),
      );
    },
  });
}

interface MoveVariables {
  id: string;
  status: TaskStatus;
  position: number;
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();
  const boardKey = queryKeys.board(projectId);

  return useMutation({
    mutationFn: ({ id, status, position }: MoveVariables) =>
      taskApi.move(id, { status, position }),

    onMutate: async ({ id, status, position }) => {
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previous = queryClient.getQueryData<Task[]>(boardKey);
      queryClient.setQueryData<Task[]>(boardKey, (old) =>
        old?.map((task) => (task.id === id ? { ...task, status, position } : task)),
      );
      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKey, context.previous);
      }
    },

    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(boardKey, (old) => upsertTask(old, task));
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(task.id) });
    },
  });
}
