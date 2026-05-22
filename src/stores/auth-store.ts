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
      // v2: accountType 필드 신규 추가 (BE PR #152). 기존 사용자(v1 이전)는 accountType 누락 →
      // 자동선택 가드(`if (accountType == null) return`)에 영구 차단되므로 인증 상태를 무효화하여
      // 강제 재로그인 유도. API 401 인터셉터가 로그인 페이지로 리다이렉트.
      version: 2,
      migrate: (_persistedState, version) => {
        if (version < 2) {
          return {
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
          } as AuthState & { subscriptionPlan: number; defaultHeadOfficeId: number | null }
        }
        return _persistedState as AuthState & {
          subscriptionPlan: number
          defaultHeadOfficeId: number | null
        }
      },
    }
  )
);
