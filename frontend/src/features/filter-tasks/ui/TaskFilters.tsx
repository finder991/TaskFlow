import { PRIORITY_LABELS } from '@/entities/task';
import type { UserSummary } from '@/entities/user';
import { Input, Select } from '@/shared/ui';
import { PRIORITIES, type TaskFilterValue } from '../model/filterTypes';

export function TaskFiltersPanel({
  members,
  value,
  onChange,
}: {
  members: UserSummary[];
  value: TaskFilterValue;
  onChange: (value: TaskFilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label="Пошук задач"
        placeholder="Пошук за назвою…"
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
        className="h-9 w-56"
      />

      <Select
        aria-label="Фільтр за пріоритетом"
        value={value.priority}
        onChange={(e) => onChange({ ...value, priority: e.target.value })}
        className="h-9 w-44"
      >
        <option value="">Усі пріоритети</option>
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {PRIORITY_LABELS[priority]}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Фільтр за виконавцем"
        value={value.assigneeId}
        onChange={(e) => onChange({ ...value, assigneeId: e.target.value })}
        className="h-9 w-48"
      >
        <option value="">Усі виконавці</option>
        <option value="unassigned">Без виконавця</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
