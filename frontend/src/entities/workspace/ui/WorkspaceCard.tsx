import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config';
import { Card } from '@/shared/ui';
import type { Workspace } from '../model/types';
import { RoleBadge } from './RoleBadge';

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Link to={ROUTES.workspace(workspace.id)} className="block">
      <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate font-medium text-slate-900">{workspace.name}</h3>
          <RoleBadge role={workspace.role} />
        </div>
        <dl className="mt-5 flex gap-6 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Проєктів</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-slate-700">
              {workspace.projectsCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Учасників</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-slate-700">
              {workspace.membersCount}
            </dd>
          </div>
        </dl>
      </Card>
    </Link>
  );
}
