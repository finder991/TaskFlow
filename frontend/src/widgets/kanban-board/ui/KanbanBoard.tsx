import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { groupByStatus, TASK_STATUSES, TaskCard, type Task, type TaskStatus } from '@/entities/task';
import { BoardColumn } from './BoardColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onMove: (id: string, status: TaskStatus, position: number) => void;
}

const DRAG_ACTIVATION_DISTANCE = 5;

export function KanbanBoard({ tasks, onTaskClick, onAddTask, onMove }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } }),
  );
  const groups = groupByStatus(tasks);

  const findTask = (id: string) => tasks.find((task) => task.id === id) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(findTask(String(event.active.id)));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const task = findTask(activeId);
    if (!task) return;

    let destinationStatus: TaskStatus;
    let destinationIndex: number;

    if ((TASK_STATUSES as string[]).includes(overId)) {
      destinationStatus = overId as TaskStatus;
      destinationIndex = groups[destinationStatus].length;
    } else {
      const overTask = findTask(overId);
      if (!overTask) return;
      destinationStatus = overTask.status;
      destinationIndex = groups[destinationStatus].findIndex((t) => t.id === overId);
    }

    const currentIndex = groups[task.status].findIndex((t) => t.id === activeId);
    if (destinationStatus === task.status && destinationIndex === currentIndex) return;

    onMove(activeId, destinationStatus, destinationIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid items-start gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={groups[status]}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
    </DndContext>
  );
}
