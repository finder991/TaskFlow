import { useState } from 'react';
import type { Project } from '@/entities/project';
import { Button, ConfirmDialog } from '@/shared/ui';
import { useDeleteProject } from '../model/useProjectMutations';

export function DeleteProjectButton({ project }: { project: Project }) {
  const [confirming, setConfirming] = useState(false);
  const deleteProject = useDeleteProject(project.workspaceId);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Видалити проєкт ${project.name}`}
        className="h-7 w-7 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        onClick={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
      >
        ×
      </Button>

      <ConfirmDialog
        open={confirming}
        title={`Видалити проєкт «${project.name}»?`}
        description="Разом із проєктом буде видалено всі його задачі. Дію не можна скасувати."
        isLoading={deleteProject.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          deleteProject.mutate(project.id, { onSuccess: () => setConfirming(false) })
        }
      />
    </>
  );
}
