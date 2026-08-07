import { useState } from 'react';
import type { WorkspaceRole } from '@/entities/workspace';
import { Button, Dialog, FormError, Input, Label, Select } from '@/shared/ui';
import { useInviteMember } from '../model/useWorkspaceMutations';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMemberDialog({
  workspaceId,
  open,
  onClose,
}: {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('MEMBER');
  const invite = useInviteMember(workspaceId);
  const isValid = EMAIL_PATTERN.test(email.trim());

  const submit = () => {
    if (!isValid) return;
    invite.mutate({ email: email.trim(), role }, { onSuccess: () => setEmail('') });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Запросити учасника"
      description="Надішлемо запрошення на email (у dev-режимі лист видно в Mailhog)."
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            autoFocus
            placeholder="teammate@example.com"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        <div>
          <Label htmlFor="invite-role">Роль</Label>
          <Select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceRole)}
          >
            <option value="MEMBER">Учасник</option>
            <option value="OWNER">Власник</option>
          </Select>
        </div>

        {invite.isError && <FormError error={invite.error} />}
        {invite.isSuccess && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Запрошення надіслано ✓
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Закрити
          </Button>
          <Button onClick={submit} isLoading={invite.isPending} disabled={!isValid}>
            Надіслати
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
