import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ProjectCard, projectApi } from '@/entities/project';
import { CreateProjectDialog, DeleteProjectButton } from '@/features/manage-project';
import { queryKeys } from '@/shared/api';
import { Button, EmptyState, ErrorState, LoadingState } from '@/shared/ui';

export function WorkspaceProjects({
  workspaceId,
  canDelete,
}: {
  workspaceId: string;
  canDelete: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const projects = useQuery({
    queryKey: queryKeys.projects(workspaceId),
    queryFn: () => projectApi.list(workspaceId),
    enabled: Boolean(workspaceId),
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Проєкти</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          + Проєкт
        </Button>
      </div>

      {projects.isLoading ? (
        <LoadingState />
      ) : projects.isError ? (
        <ErrorState error={projects.error} onRetry={projects.refetch} />
      ) : projects.data?.length === 0 ? (
        <EmptyState
          title="Ще немає проєктів"
          description="Створіть проєкт, щоб почати вести задачі на Kanban-дошці."
          action={<Button onClick={() => setDialogOpen(true)}>Створити проєкт</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.data?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              actions={canDelete ? <DeleteProjectButton project={project} /> : null}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        workspaceId={workspaceId}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
