import { useEffect } from 'react';
import { onUnauthorized } from '@/shared/api';
import { userApi } from '@/entities/user/@x/session';
import { useSessionStore } from './session.store';

export const useCurrentUser = () => useSessionStore((s) => s.user);

export const useSessionStatus = () => useSessionStore((s) => s.status);

export function useSessionBootstrap(): void {
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onUnauthorized(() => useSessionStore.getState().clear());

    userApi
      .getMe()
      .then((user) => {
        if (!cancelled) useSessionStore.getState().setUser(user);
      })
      .catch(() => {
        if (!cancelled) useSessionStore.getState().clear();
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
}
