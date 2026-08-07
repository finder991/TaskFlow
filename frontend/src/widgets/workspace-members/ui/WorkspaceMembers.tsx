import { useState } from 'react';
import { useCurrentUser } from '@/entities/session';
import { UserName } from '@/entities/user';
import { RoleBadge, type WorkspaceDetail } from '@/entities/workspace';
import { InviteMemberDialog, MemberControls } from '@/features/manage-workspace';
import { Button, Card } from '@/shared/ui';

export function WorkspaceMembers({ workspace }: { workspace: WorkspaceDetail }) {
  const currentUser = useCurrentUser();
  const [inviteOpen, setInviteOpen] = useState(false);
  const isOwner = workspace.role === 'OWNER';

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Учасники{' '}
          <span className="text-sm font-normal tabular-nums text-slate-400">
            {workspace.members.length}
          </span>
        </h2>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
            Запросити
          </Button>
        )}
      </div>

      <ul className="divide-y divide-slate-100">
        {workspace.members.map((member) => {
          const isWorkspaceOwner = member.user.id === workspace.ownerId;
          const canManage = isOwner && !isWorkspaceOwner;

          return (
            <li key={member.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <UserName
                  user={member.user}
                  withEmail
                  suffix={
                    member.user.id === currentUser?.id ? (
                      <span className="ml-1 text-xs font-normal text-slate-400">(ви)</span>
                    ) : null
                  }
                />
              </div>

              {canManage ? (
                <MemberControls workspaceId={workspace.id} member={member} />
              ) : (
                <RoleBadge role={member.role} />
              )}
            </li>
          );
        })}
      </ul>

      <InviteMemberDialog
        workspaceId={workspace.id}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </Card>
  );
}
