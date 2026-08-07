import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { workspaceApi, WorkspaceCard } from '@/entities/workspace';
import { CreateWorkspaceDialog } from '@/features/manage-workspace';
import { queryKeys } from '@/shared/api';
import { Button, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui';

export function WorkspacesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const workspaces = useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: workspaceApi.list,
  });

  return (
    <div>
      <PageHeader
        title="Робочі простори"
        description="Оберіть простір або створіть новий"
        actions={<Button onClick={() => setDialogOpen(true)}>+ Створити</Button>}
      />

      {workspaces.isLoading ? (
        <LoadingState />
      ) : workspaces.isError ? (
        <ErrorState error={workspaces.error} onRetry={workspaces.refetch} />
      ) : workspaces.data?.length === 0 ? (
        <EmptyState
          title="Ще немає робочих просторів"
          description="Створіть перший простір, щоб додавати проєкти й запрошувати команду."
          action={<Button onClick={() => setDialogOpen(true)}>Створити простір</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.data?.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}

      <CreateWorkspaceDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
