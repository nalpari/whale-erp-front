import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type AuthState } from '@/lib/schemas/auth';

interface AuthStore extends AuthState {
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string | null) => void;
  setAuthority: (authority: Record<string, unknown>) => void;
  setAffiliationId: (id: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      authority: null,
      affiliationId: null,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setAccessToken: (token) => set({ accessToken: token }),
      setAuthority: (authority) => set({ authority }),
      setAffiliationId: (id) => set({ affiliationId: id }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, authority: null, affiliationId: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
