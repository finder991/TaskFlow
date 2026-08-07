
export const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const WS_URL = import.meta.env.VITE_WS_URL ?? '/';

export const ROUTES = {
  login: '/login',
  register: '/register',
  workspaces: '/',
  workspace: (id: string) => `/workspaces/${id}`,
  board: (projectId: string) => `/projects/${projectId}`,
  invitation: (token: string) => `/invitations/${token}`,
} as const;
