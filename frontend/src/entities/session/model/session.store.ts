import { create } from 'zustand';
import type { User } from '@/entities/user/@x/session';

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionState {
  user: User | null;
  status: SessionStatus;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  status: 'loading',
  setUser: (user) => set({ user, status: 'authenticated' }),
  clear: () => set({ user: null, status: 'anonymous' }),
}));
