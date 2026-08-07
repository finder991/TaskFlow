import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  PriorityBadge,
  STATUS_LABELS,
  TaskActivityList,
  taskApi,
  type Task,
} from '@/entities/task';
import { UserName, type UserSummary } from '@/entities/user';
import { useDeleteTask } from '@/features/manage-task';
import { queryKeys } from '@/shared/api';
import { formatDate } from '@/shared/lib';
import { Badge, Button, ConfirmDialog, Dialog, Spinner } from '@/shared/ui';
import { CommentsSection } from './CommentsSection';

interface TaskDetailsDialogProps {
  taskId: string | null;
  projectId: string;
  members: UserSummary[];
  open: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export function TaskDetailsDialog({
  taskId,
  projectId,
  members,
  open,
  onClose,
  onEdit,
}: TaskDetailsDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const deleteTask = useDeleteTask(projectId);

  const taskQuery = useQuery({
    queryKey: queryKeys.task(taskId ?? ''),
    queryFn: () => taskApi.getById(taskId as string),
    enabled: Boolean(taskId) && open,
  });

  const activityQuery = useQuery({
    queryKey: queryKeys.activity(taskId ?? ''),
    queryFn: () => taskApi.activity(taskId as string),
    enabled: Boolean(taskId) && open,
  });

  const nameById = new Map(members.map((member) => [member.id, member.name]));
  const task = taskQuery.data;

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      {!task ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold leading-snug text-slate-900">{task.title}</h2>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(task)}>
                Редагувати
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={deleteTask.isPending}
                onClick={() => setConfirming(true)}
              >
                Видалити
              </Button>
            </div>
          </div>

          <dl className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Badge>{STATUS_LABELS[task.status]}</Badge>
            <PriorityBadge priority={task.priority} />
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-400">Виконавець:</dt>
              <dd>
                <UserName user={task.assignee} fallback="не призначено" />
              </dd>
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-1.5">
                <dt className="text-slate-400">Дедлайн:</dt>
                <dd className="tabular-nums text-slate-700">{formatDate(task.dueDate)}</dd>
              </div>
            )}
          </dl>

          {task.description && (
            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {task.description}
            </p>
          )}

          <CommentsSection taskId={task.id} />

          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Історія змін</h3>
            {activityQuery.isLoading ? (
              <Spinner className="h-5 w-5 text-brand-600" />
            ) : (
              <TaskActivityList activities={activityQuery.data ?? []} nameById={nameById} />
            )}
          </section>

          <ConfirmDialog
            open={confirming}
            title="Видалити задачу?"
            description="Разом із задачею зникнуть її коментарі та історія змін."
            isLoading={deleteTask.isPending}
            onCancel={() => setConfirming(false)}
            onConfirm={() =>
              deleteTask.mutate(task.id, {
                onSuccess: () => {
                  setConfirming(false);
                  onClose();
                },
              })
            }
          />
        </div>
      )}
    </Dialog>
  );
}
