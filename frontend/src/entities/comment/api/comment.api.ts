import { http, type Paginated } from '@/shared/api';
import type { Comment } from '../model/types';

const COMMENTS_PAGE_SIZE = 100;

export const commentApi = {
  list: (taskId: string) =>
    http
      .get<Paginated<Comment>>(`/tasks/${taskId}/comments`, {
        params: { limit: COMMENTS_PAGE_SIZE },
      })
      .then((r) => r.data),

  create: (taskId: string, body: string) =>
    http.post<Comment>(`/tasks/${taskId}/comments`, { body }).then((r) => r.data),

  update: (id: string, body: string) =>
    http.patch<Comment>(`/comments/${id}`, { body }).then((r) => r.data),

  remove: (id: string) => http.delete(`/comments/${id}`).then((r) => r.data),
};
