import type { UserSummary } from '@/entities/user/@x/comment';

export interface Comment {
  id: string;
  taskId: string;
  body: string;
  author: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}
