import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectApi } from '@/entities/project';
import { filterTasks, taskApi, type Task, type TaskStatus } from '@/entities/task';
import { workspaceApi } from '@/entities/workspace';
import {
  EMPTY_TASK_FILTERS,
  TaskFiltersPanel,
  type TaskFilterValue,
} from '@/features/filter-tasks';
import { TaskFormDialog, useMoveTask } from '@/features/manage-task';
import { useProjectRealtime } from '@/features/realtime-board';
import { KanbanBoard } from '@/widgets/kanban-board';
import { TaskDetailsDialog } from '@/widgets/task-details';
import { queryKeys } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { Button, ErrorState, LoadingState, PageHeader } from '@/shared/ui';

const BOARD_PAGE_SIZE = 100;

export function BoardPage() {
  const { projectId = '' } = useParams();
  const [filters, setFilters] = useState<TaskFilterValue>(EMPTY_TASK_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formStatus, setFormStatus] = useState<TaskStatus | undefined>();
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);

  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => projectApi.getById(projectId),
    enabled: Boolean(projectId),
  });

  const workspaceId = project.data?.workspaceId ?? '';
  const workspace = useQuery({
    queryKey: queryKeys.workspace(workspaceId),
    queryFn: () => workspaceApi.getById(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const board = useQuery({
    queryKey: queryKeys.board(projectId),
    queryFn: () => taskApi.list(projectId, { limit: BOARD_PAGE_SIZE }).then((res) => res.data),
    enabled: Boolean(projectId),
  });

  const moveTask = useMoveTask(projectId);
  useProjectRealtime(projectId);

  const members = useMemo(
    () => workspace.data?.members.map((member) => member.user) ?? [],
    [workspace.data],
  );

  const tasks = useMemo(() => board.data ?? [], [board.data]);
  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);

  const openCreateForm = (status?: TaskStatus) => {
    setEditingTask(null);
    setFormStatus(status);
    setFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setFormStatus(undefined);
    setDetailsTaskId(null);
    setFormOpen(true);
  };

  if (project.isLoading) return <LoadingState />;
  if (project.isError) return <ErrorState error={project.error} onRetry={project.refetch} />;
  if (!project.data) return null;

  return (
    <div>
      <PageHeader
        title={project.data.name}
        description={project.data.description}
        backTo={{ href: ROUTES.workspace(workspaceId), label: 'До проєктів' }}
        actions={<Button onClick={() => openCreateForm()}>+ Задача</Button>}
      />

      <div className="mb-4">
        <TaskFiltersPanel members={members} value={filters} onChange={setFilters} />
      </div>

      {board.isLoading ? (
        <LoadingState label="Завантаження дошки…" />
      ) : board.isError ? (
        <ErrorState error={board.error} onRetry={board.refetch} />
      ) : (
        <KanbanBoard
          tasks={visibleTasks}
          onTaskClick={(task) => setDetailsTaskId(task.id)}
          onAddTask={openCreateForm}
          onMove={(id, status, position) => moveTask.mutate({ id, status, position })}
        />
      )}

      {formOpen && (
        <TaskFormDialog
          key={editingTask?.id ?? 'new'}
          projectId={projectId}
          members={members}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          task={editingTask}
          defaultStatus={formStatus}
        />
      )}

      <TaskDetailsDialog
        taskId={detailsTaskId}
        projectId={projectId}
        members={members}
        open={Boolean(detailsTaskId)}
        onClose={() => setDetailsTaskId(null)}
        onEdit={openEditForm}
      />
    </div>
  );
}
