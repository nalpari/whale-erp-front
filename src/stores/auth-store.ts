import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type AuthState, type LoginAuthorityProgram } from '@/lib/schemas/auth';

interface AuthStore extends AuthState {
  subscriptionPlan: number;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string | null) => void;
  setAuthority: (authority: LoginAuthorityProgram[]) => void;
  setAffiliationId: (id: string | null) => void;
  setOwnerCode: (code: string | null) => void;
  setSubscriptionPlan: (plan: number) => void;
  setUserInfo: (loginId: string, name: string, mobilePhone: string) => void;
  setPasswordChangeRequired: (required: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      authority: null,
      affiliationId: null,
      ownerCode: null,
      loginId: null,
      name: null,
      mobilePhone: null,
      passwordChangeRequired: false,
      subscriptionPlan: 0,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setAccessToken: (token) => set({ accessToken: token }),
      setAuthority: (authority) => set({ authority }),
      setAffiliationId: (id) => set({ affiliationId: id }),
      setOwnerCode: (code) => set({ ownerCode: code }),
      setSubscriptionPlan: (plan) => set({ subscriptionPlan: plan }),
      setUserInfo: (loginId, name, mobilePhone) =>
        set({ loginId, name, mobilePhone }),
      setPasswordChangeRequired: (required) => set({ passwordChangeRequired: required }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, authority: null, affiliationId: null, ownerCode: null, loginId: null, name: null, mobilePhone: null, subscriptionPlan: 0 }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
