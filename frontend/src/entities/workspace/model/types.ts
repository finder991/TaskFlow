import type { UserSummary } from '@/entities/user/@x/workspace';

export type WorkspaceRole = 'OWNER' | 'MEMBER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;

  role: WorkspaceRole;
  membersCount: number;
  projectsCount: number;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  user: UserSummary;
  createdAt: string;
}

export interface WorkspaceDetail extends Workspace {
  members: WorkspaceMember[];
}

export interface Invitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationPreview {
  email: string;
  workspaceName: string;
  status: InvitationStatus;
  expiresAt: string;
}

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: 'Власник',
  MEMBER: 'Учасник',
};
