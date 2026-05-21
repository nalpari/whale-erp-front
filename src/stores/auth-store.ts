import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type AccountType, type AuthState, type LoginAuthorityProgram } from '@/lib/schemas/auth';

interface AuthStore extends AuthState {
  subscriptionPlan: number;
  defaultHeadOfficeId: number | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string | null) => void;
  setAuthority: (authority: LoginAuthorityProgram[]) => void;
  setAffiliationId: (id: string | null) => void;
  setOwnerCode: (code: string | null) => void;
  setAccountType: (type: AccountType | null) => void;
  setSubscriptionPlan: (plan: number) => void;
  setDefaultHeadOfficeId: (id: number | null) => void;
  setUserInfo: (loginId: string, name: string, mobilePhone: string, avatar: string | null) => void;
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
      accountType: null,
      loginId: null,
      name: null,
      mobilePhone: null,
      avatar: null,
      passwordChangeRequired: false,
      subscriptionPlan: 0,
      defaultHeadOfficeId: null,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setAccessToken: (token) => set({ accessToken: token }),
      setAuthority: (authority) => set({ authority }),
      setAffiliationId: (id) => set({ affiliationId: id }),
      setOwnerCode: (code) => set({ ownerCode: code }),
      setAccountType: (type) => set({ accountType: type }),
      setSubscriptionPlan: (plan) => set({ subscriptionPlan: plan }),
      setDefaultHeadOfficeId: (id) => set({ defaultHeadOfficeId: id }),
      setUserInfo: (loginId, name, mobilePhone, avatar) =>
        set({ loginId, name, mobilePhone, avatar }),
      setPasswordChangeRequired: (required) => set({ passwordChangeRequired: required }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, authority: null, affiliationId: null, ownerCode: null, accountType: null, loginId: null, name: null, mobilePhone: null, avatar: null, passwordChangeRequired: false, subscriptionPlan: 0, defaultHeadOfficeId: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
