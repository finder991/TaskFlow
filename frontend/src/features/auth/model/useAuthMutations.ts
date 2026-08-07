import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sessionApi,
  useSessionStore,
  type LoginPayload,
  type RegisterPayload,
} from '@/entities/session';

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => sessionApi.login(payload),
    onSuccess: (user) => useSessionStore.getState().setUser(user),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => sessionApi.register(payload),
    onSuccess: (user) => useSessionStore.getState().setUser(user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sessionApi.logout(),

    onSettled: () => {
      useSessionStore.getState().clear();
      queryClient.clear();
    },
  });
}
