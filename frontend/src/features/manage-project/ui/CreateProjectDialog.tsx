import { useState } from 'react';
import { Button, Dialog, FormError, Input, Label, Textarea } from '@/shared/ui';
import { useCreateProject } from '../model/useProjectMutations';

const MIN_NAME_LENGTH = 2;

export function CreateProjectDialog({
  workspaceId,
  open,
  onClose,
}: {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateProject(workspaceId);
  const trimmed = name.trim();
  const isValid = trimmed.length >= MIN_NAME_LENGTH;

  const submit = () => {
    if (!isValid) return;
    create.mutate(
      { name: trimmed, description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title="Новий проєкт">
      <div className="space-y-4">
        <div>
          <Label htmlFor="proj-name">Назва</Label>
          <Input
            id="proj-name"
            value={name}
            autoFocus
            placeholder="Напр., Редизайн сайту"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="proj-desc">Опис (необов'язково)</Label>
          <Textarea
            id="proj-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
