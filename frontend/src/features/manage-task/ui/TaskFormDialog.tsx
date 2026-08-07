import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/entities/task';
import type { UserSummary } from '@/entities/user';
import { toDateInput } from '@/shared/lib';
import { Button, Dialog, FormError, Input, Label, Select, Textarea } from '@/shared/ui';
import { taskFormSchema, type TaskFormValues } from '../model/taskForm.schema';
import { useCreateTask, useUpdateTask } from '../model/useTaskMutations';

const PRIORITIES = Object.keys(PRIORITY_LABELS) as TaskPriority[];

interface TaskFormDialogProps {
  projectId: string;
  members: UserSummary[];
  open: boolean;
  onClose: () => void;

  task?: Task | null;
  defaultStatus?: TaskStatus;
}

export function TaskFormDialog({
  projectId,
  members,
  open,
  onClose,
  task,
  defaultStatus,
}: TaskFormDialogProps) {
  const create = useCreateTask(projectId);
  const update = useUpdateTask(projectId);
  const isPending = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId ?? '',
          dueDate: toDateInput(task.dueDate),
        }
      : {
          title: '',
          description: '',
          status: defaultStatus ?? 'TODO',
          priority: 'MEDIUM',
          assigneeId: '',
          dueDate: '',
        },
  });

  const onSubmit = (values: TaskFormValues) => {
    const payload = {
      title: values.title,
      description: values.description?.trim() ? values.description : null,
      status: values.status,
      priority: values.priority,
      assigneeId: values.assigneeId || null,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
    };

    if (task) {
      update.mutate({ id: task.id, payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={task ? 'Редагувати задачу' : 'Нова задача'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="task-title">Назва</Label>
          <Input id="task-title" autoFocus {...register('title')} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="task-desc">Опис</Label>
          <Textarea id="task-desc" rows={3} {...register('description')} />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="task-status">Статус</Label>
            <Select id="task-status" {...register('status')}>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="task-priority">Пріоритет</Label>
            <Select id="task-priority" {...register('priority')}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="task-assignee">Виконавець</Label>
            <Select id="task-assignee" {...register('assigneeId')}>
              <option value="">Без виконавця</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="task-due">Дедлайн</Label>
            <Input id="task-due" type="date" {...register('dueDate')} />
          </div>
        </div>

        {mutationError && <FormError error={mutationError} />}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button type="submit" isLoading={isPending}>
            {task ? 'Зберегти' : 'Створити'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
