import { http } from '@/shared/api';
import type { User } from '../model/types';

export const userApi = {
  getMe: () => http.get<User>('/users/me').then((r) => r.data),
};
