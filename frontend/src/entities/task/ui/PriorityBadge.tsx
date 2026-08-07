import { Badge } from '@/shared/ui';
import { PRIORITY_LABELS, PRIORITY_TONES } from '../model/labels';
import type { TaskPriority } from '../model/types';

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge tone={PRIORITY_TONES[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}
