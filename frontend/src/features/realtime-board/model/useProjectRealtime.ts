import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { upsertTask, type Task } from '@/entities/task';
import { queryKeys } from '@/shared/api';
import { createSocket, REALTIME_EVENTS } from './socket';

export function useProjectRealtime(projectId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const socket = createSocket();
    const boardKey = queryKeys.board(projectId);

    const joinProject = () => socket.emit('project:join', projectId);
    joinProject();
    socket.on('connect', joinProject);

    const handleTaskUpsert = (task: Task) => {
      queryClient.setQueryData<Task[]>(boardKey, (old) => upsertTask(old, task));
    };

    const handleTaskUpdated = (task: Task) => {
      handleTaskUpsert(task);
      queryClient.setQueryData(queryKeys.task(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(task.id) });
    };

    const handleTaskDeleted = ({ id }: { id: string }) => {
      queryClient.setQueryData<Task[]>(boardKey, (old) => old?.filter((task) => task.id !== id));
    };

    const handleComment = ({ taskId }: { taskId: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(taskId) });
    };

    socket.on(REALTIME_EVENTS.taskCreated, handleTaskUpsert);
    socket.on(REALTIME_EVENTS.taskUpdated, handleTaskUpdated);
    socket.on(REALTIME_EVENTS.taskDeleted, handleTaskDeleted);
    socket.on(REALTIME_EVENTS.commentCreated, handleComment);
    socket.on(REALTIME_EVENTS.commentUpdated, handleComment);
    socket.on(REALTIME_EVENTS.commentDeleted, handleComment);

    return () => {
      socket.off('connect', joinProject);
      socket.emit('project:leave', projectId);
      socket.disconnect();
    };
  }, [projectId, queryClient]);
}
