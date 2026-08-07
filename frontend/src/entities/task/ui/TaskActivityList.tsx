import { formatDateTime } from '@/shared/lib';
import { priorityLabel, statusLabel } from '../model/labels';
import type { TaskActivity } from '../model/types';

function describe(activity: TaskActivity, nameById: Map<string, string>): string {
  const actor = activity.actor?.name ?? 'Користувач';
  switch (activity.type) {
    case 'CREATED':
      return `${actor} створив(-ла) задачу`;
    case 'STATUS_CHANGED':
      return `${actor}: статус ${statusLabel(activity.fromValue)} → ${statusLabel(activity.toValue)}`;
    case 'PRIORITY_CHANGED':
      return `${actor}: пріоритет ${priorityLabel(activity.fromValue)} → ${priorityLabel(activity.toValue)}`;
    case 'ASSIGNEE_CHANGED': {
      const to = activity.toValue ? (nameById.get(activity.toValue) ?? 'учасник') : 'знято';
      return `${actor}: виконавець → ${to}`;
    }
    default:
      return actor;
  }
}

export function TaskActivityList({
  activities,
  nameById,
}: {
  activities: TaskActivity[];
  nameById: Map<string, string>;
}) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-400">Історія порожня.</p>;
  }

  return (
    <ol className="space-y-2 border-l border-slate-200 pl-4">
      {activities.map((activity) => (
        <li key={activity.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-300" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
            <span className="text-slate-600">{describe(activity, nameById)}</span>
            <span className="shrink-0 tabular-nums text-slate-400">
              {formatDateTime(activity.createdAt)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
