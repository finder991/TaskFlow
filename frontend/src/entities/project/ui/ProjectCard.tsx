import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config';
import { Card } from '@/shared/ui';
import type { Project } from '../model/types';

interface ProjectCardProps {
  project: Project;

  actions?: ReactNode;
}

export function ProjectCard({ project, actions }: ProjectCardProps) {
  return (
    <Card className="group relative p-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link to={ROUTES.board(project.id)} className="block">
        <h3 className="truncate pr-6 font-medium text-slate-900">{project.name}</h3>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>
        )}
        <p className="mt-4 text-xs text-slate-400">{project.tasksCount} задач</p>
      </Link>
      {actions && <div className="absolute right-2 top-2">{actions}</div>}
    </Card>
  );
}
