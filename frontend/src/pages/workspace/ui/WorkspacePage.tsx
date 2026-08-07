import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { RoleBadge, workspaceApi } from '@/entities/workspace';
import { WorkspaceMembers } from '@/widgets/workspace-members';
import { WorkspaceProjects } from '@/widgets/workspace-projects';
import { queryKeys } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { ErrorState, LoadingState, PageHeader } from '@/shared/ui';

export function WorkspacePage() {
  const { workspaceId = '' } = useParams();

  const workspace = useQuery({
    queryKey: queryKeys.workspace(workspaceId),
    queryFn: () => workspaceApi.getById(workspaceId),
    enabled: Boolean(workspaceId),
  });

  if (workspace.isLoading) return <LoadingState />;
  if (workspace.isError) {
    return <ErrorState error={workspace.error} onRetry={workspace.refetch} />;
  }
  if (!workspace.data) return null;

  const data = workspace.data;

  return (
    <div>
      <PageHeader
        title={data.name}
        backTo={{ href: ROUTES.workspaces, label: 'Усі простори' }}
        meta={<RoleBadge role={data.role} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkspaceProjects workspaceId={data.id} canDelete={data.role === 'OWNER'} />
        </div>
        <aside>
          <WorkspaceMembers workspace={data} />
        </aside>
      </div>
    </div>
  );
}
