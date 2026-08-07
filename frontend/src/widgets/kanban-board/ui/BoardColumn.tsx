import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { STATUS_LABELS, type Task, type TaskStatus } from '@/entities/task';
import { cn } from '@/shared/lib';
import { SortableTaskCard } from './SortableTaskCard';

export function BoardColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className="flex min-h-0 flex-col rounded-xl bg-slate-100/80 ring-1 ring-slate-200/70">
      <header className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">{STATUS_LABELS[status]}</h3>
          <span className="rounded-full bg-white px-2 text-xs font-medium tabular-nums text-slate-500 ring-1 ring-slate-200">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddTask(status)}
          aria-label={`Додати задачу в «${STATUS_LABELS[status]}»`}
          className="grid h-6 w-6 place-items-center rounded-md text-lg leading-none text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
        >
          +
        </button>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'scrollbar-thin min-h-28 flex-1 space-y-2 overflow-y-auto p-2 transition-colors',
          isOver && 'bg-brand-50/70',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">Перетягніть задачу сюди</p>
        )}
      </div>
    </section>
  );
}
