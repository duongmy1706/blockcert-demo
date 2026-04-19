import { create } from 'zustand';
import { api } from './api';

export type UserRole = 'university' | 'student' | 'verifier' | null;

interface AuthState {
  role: UserRole;
  userId: string | null;
  hoTen: string | null;
  email: string | null;
  loading: boolean;
  setAuth: (role: UserRole, userId: string | null, hoTen?: string, email?: string) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  role: null,
  userId: null,
  hoTen: null,
  email: null,
  loading: true,
  setAuth: (role, userId, hoTen = null, email = null) =>
    set({ role, userId, hoTen, email }),
  logout: async () => {
    try { await api.logout(); } catch {}
    set({ role: null, userId: null, hoTen: null, email: null });
  },
  restoreSession: async () => {
    try {
      const { user } = await api.me();
      set({ role: user.role as UserRole, userId: user.id, hoTen: user.hoTen, email: user.email, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
