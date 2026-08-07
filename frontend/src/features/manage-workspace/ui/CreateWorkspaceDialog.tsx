import { useState } from 'react';
import { Button, Dialog, FormError, Input, Label } from '@/shared/ui';
import { useCreateWorkspace } from '../model/useWorkspaceMutations';

const MIN_NAME_LENGTH = 2;

export function CreateWorkspaceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const create = useCreateWorkspace();
  const trimmed = name.trim();
  const isValid = trimmed.length >= MIN_NAME_LENGTH;

  const submit = () => {
    if (!isValid) return;
    create.mutate(trimmed, {
      onSuccess: () => {
        setName('');
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="Новий робочий простір">
      <div className="space-y-4">
        <div>
          <Label htmlFor="ws-name">Назва</Label>
          <Input
            id="ws-name"
            value={name}
            autoFocus
            placeholder="Напр., Команда маркетингу"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        {create.isError && <FormError error={create.error} />}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button onClick={submit} isLoading={create.isPending} disabled={!isValid}>
            Створити
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
