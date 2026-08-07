import { useState } from 'react';
import type { WorkspaceMember, WorkspaceRole } from '@/entities/workspace';
import { Button, ConfirmDialog, Select } from '@/shared/ui';
import { useRemoveMember, useUpdateMemberRole } from '../model/useWorkspaceMutations';

export function MemberControls({
  workspaceId,
  member,
}: {
  workspaceId: string;
  member: WorkspaceMember;
}) {
  const [confirming, setConfirming] = useState(false);
  const updateRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);

  return (
    <div className="flex items-center gap-1">
      <Select
        aria-label={`Роль користувача ${member.user.name}`}
        value={member.role}
        className="h-8 w-28 text-xs"
        disabled={updateRole.isPending}
        onChange={(e) =>
          updateRole.mutate({ memberId: member.id, role: e.target.value as WorkspaceRole })
        }
      >
        <option value="MEMBER">Учасник</option>
        <option value="OWNER">Власник</option>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Видалити ${member.user.name}`}
        className="text-slate-400 hover:bg-red-50 hover:text-red-600"
        onClick={() => setConfirming(true)}
      >
        ×
      </Button>

      <ConfirmDialog
        open={confirming}
        title={`Видалити ${member.user.name} з простору?`}
        description="Учасник втратить доступ до всіх проєктів цього робочого простору."
        isLoading={removeMember.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          removeMember.mutate(member.id, { onSuccess: () => setConfirming(false) })
        }
      />
    </div>
  );
}
