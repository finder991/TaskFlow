import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard, type Task } from '@/entities/task';

export function SortableTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}
