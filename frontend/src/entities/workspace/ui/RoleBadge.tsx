import { Badge } from '@/shared/ui';
import { ROLE_LABELS, type WorkspaceRole } from '../model/types';

export function RoleBadge({ role }: { role: WorkspaceRole }) {
  return <Badge tone={role === 'OWNER' ? 'brand' : 'neutral'}>{ROLE_LABELS[role]}</Badge>;
}
