import { http } from '@/shared/api';
import type { User } from '@/entities/user/@x/session';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

interface AuthResponse {
  user: User;
}

export const sessionApi = {
  login: (payload: LoginPayload) =>
    http.post<AuthResponse>('/auth/login', payload).then((r) => r.data.user),

  register: (payload: RegisterPayload) =>
    http.post<AuthResponse>('/auth/register', payload).then((r) => r.data.user),

  logout: () => http.post('/auth/logout').then((r) => r.data),
};
