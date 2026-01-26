import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type AuthState } from '@/lib/schemas/auth';

interface AuthStore extends AuthState {
  subscriptionPlan: number;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string | null) => void;
  setAuthority: (authority: Record<string, unknown>) => void;
  setAffiliationId: (id: string | null) => void;
  setSubscriptionPlan: (plan: number) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      authority: null,
      affiliationId: null,
      subscriptionPlan: 0,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setAccessToken: (token) => set({ accessToken: token }),
      setAuthority: (authority) => set({ authority }),
      setAffiliationId: (id) => set({ affiliationId: id }),
      setSubscriptionPlan: (plan) => set({ subscriptionPlan: plan }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, authority: null, affiliationId: null, subscriptionPlan: 0 }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
