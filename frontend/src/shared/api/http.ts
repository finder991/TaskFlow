import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { API_URL } from '@/shared/config';

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  await axios.post(`${API_URL}/auth/refresh`, null, { withCredentials: true });
}

const unauthorizedHandlers = new Set<() => void>();

export function onUnauthorized(handler: () => void): () => void {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthPath = NO_REFRESH_PATHS.some((path) => original?.url?.includes(path));

    if (error.response?.status === 401 && original && !original._retry && !isAuthPath) {
      original._retry = true;
      try {
        refreshPromise ??= refreshSession().finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
        return http(original);
      } catch (refreshError) {
        unauthorizedHandlers.forEach((handler) => handler());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
