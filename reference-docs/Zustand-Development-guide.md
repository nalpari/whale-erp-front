# Zustand 개발 가이드

이 문서는 `whale-erp-front` 프로젝트에서 Zustand를 사용하는 방법을 설명합니다.
**TanStack Query 도입 이후** 변경된 상태 관리 전략을 반영하여 작성되었습니다.

---

## 목차

1. [상태 관리 전략](#1-상태-관리-전략)
2. [Zustand 기본 사용법](#2-zustand-기본-사용법)
3. [클라이언트 상태 패턴](#3-클라이언트-상태-패턴)
4. [Persist 미들웨어](#4-persist-미들웨어)
5. [실제 프로젝트 예제](#5-실제-프로젝트-예제)
6. [TanStack Query와 함께 사용하기](#6-tanstack-query와-함께-사용하기)
7. [자주 하는 실수와 해결법](#7-자주-하는-실수와-해결법)
8. [Best Practices](#8-best-practices)
9. [마이그레이션 가이드](#9-마이그레이션-가이드)

---

## 1. 상태 관리 전략

### 1.1 서버 상태 vs 클라이언트 상태

TanStack Query 도입 후, 상태를 두 가지로 명확히 구분합니다:

| 구분 | 서버 상태 | 클라이언트 상태 |
|------|----------|----------------|
| **정의** | 서버에 원본이 있는 데이터 | 브라우저에만 존재하는 데이터 |
| **예시** | 점포 목록, 사용자 정보, 주문 내역 | 로그인 토큰, 모달 열림 여부, 폼 입력값 |
| **동기화** | 서버와 동기화 필요 | 로컬에서만 관리 |
| **캐싱** | 복잡한 캐싱 로직 필요 | 단순 저장 |
| **도구** | **TanStack Query** | **Zustand** |

### 1.2 언제 무엇을 사용하나요?

```
┌─────────────────────────────────────────────────────────────┐
│                    상태 관리 결정 트리                        │
└─────────────────────────────────────────────────────────────┘

데이터가 서버에서 오나요?
    │
    ├── YES → API 호출이 필요한가요?
    │         │
    │         ├── YES → TanStack Query 사용
    │         │         (useQuery, useMutation)
    │         │
    │         └── NO → 이미 받아온 데이터를 가공만 하는 경우
    │                  → 컴포넌트 로컬 상태 (useState)
    │
    └── NO → 여러 컴포넌트에서 공유하나요?
              │
              ├── YES → 브라우저 새로고침 후에도 유지해야 하나요?
              │         │
              │         ├── YES → Zustand + persist
              │         │
              │         └── NO → Zustand (일반)
              │
              └── NO → 컴포넌트 로컬 상태 (useState)
```

### 1.3 구체적인 사용 예시

| 데이터 | 사용 도구 | 이유 |
|--------|----------|------|
| 점포 목록 | TanStack Query | 서버에서 조회, 캐싱 필요 |
| 점포 상세 | TanStack Query | 서버에서 조회, ID별 캐싱 |
| 점포 생성/수정 | TanStack Query (mutation) | 서버에 저장, 캐시 무효화 |
| 로그인 토큰 | Zustand + persist | 클라이언트 상태, 새로고침 후 유지 |
| 선택된 조직 ID | Zustand + persist | 클라이언트 상태, 새로고침 후 유지 |
| 모달 열림 여부 | Zustand 또는 useState | 클라이언트 상태 |
| 폼 입력값 | useState | 단일 컴포넌트, 공유 불필요 |
| 사이드바 접힘 | Zustand | 여러 컴포넌트 공유 |

---

## 2. Zustand 기본 사용법

### 2.1 Store 생성

```typescript
import { create } from 'zustand'

// 1. 상태 타입 정의
interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

// 2. Store 생성
export const useCounterStore = create<CounterState>((set) => ({
  // 초기 상태
  count: 0,

  // 액션 (상태를 변경하는 함수)
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

### 2.2 컴포넌트에서 사용

```typescript
'use client'

import { useCounterStore } from '@/stores/counter-store'

function Counter() {
  // 방법 1: 전체 상태 구독 (비권장 - 모든 변경에 리렌더링)
  const { count, increment, decrement } = useCounterStore()

  // 방법 2: 필요한 상태만 선택 (권장)
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)

  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}
```

### 2.3 컴포넌트 외부에서 사용

```typescript
// 이벤트 핸들러, 유틸 함수 등에서 사용
import { useCounterStore } from '@/stores/counter-store'

// 상태 읽기
const currentCount = useCounterStore.getState().count

// 상태 변경
useCounterStore.getState().increment()

// 구독 (변경 감지)
const unsubscribe = useCounterStore.subscribe((state) => {
  console.log('Count changed:', state.count)
})
```

---

## 3. 클라이언트 상태 패턴

### 3.1 인증 상태 관리

**파일: `src/stores/auth-store.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  // 상태
  accessToken: string | null
  refreshToken: string | null
  authority: Record<string, unknown> | null
  affiliationId: string | null

  // 액션
  setTokens: (accessToken: string, refreshToken: string) => void
  setAccessToken: (token: string | null) => void
  setAuthority: (authority: Record<string, unknown>) => void
  setAffiliationId: (id: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // 초기 상태
      accessToken: null,
      refreshToken: null,
      authority: null,
      affiliationId: null,

      // 액션
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setAccessToken: (token) =>
        set({ accessToken: token }),
      setAuthority: (authority) =>
        set({ authority }),
      setAffiliationId: (id) =>
        set({ affiliationId: id }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          authority: null,
          affiliationId: null
        }),
    }),
    {
      name: 'auth-storage', // localStorage 키
    }
  )
)
```

### 3.2 UI 상태 관리

```typescript
import { create } from 'zustand'

interface UIState {
  // 사이드바
  sidebarOpen: boolean
  toggleSidebar: () => void

  // 테마
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void

  // 전역 모달
  modalType: string | null
  modalProps: Record<string, unknown>
  openModal: (type: string, props?: Record<string, unknown>) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  // 사이드바
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // 테마
  theme: 'light',
  setTheme: (theme) => set({ theme }),

  // 전역 모달
  modalType: null,
  modalProps: {},
  openModal: (type, props = {}) => set({ modalType: type, modalProps: props }),
  closeModal: () => set({ modalType: null, modalProps: {} }),
}))
```

### 3.3 폼 상태 관리 (복잡한 폼)

```typescript
import { create } from 'zustand'

interface StoreFormState {
  // 폼 데이터
  storeName: string
  ceoName: string
  businessNumber: string

  // 폼 상태
  isDirty: boolean
  errors: Record<string, string>

  // 액션
  setField: (field: string, value: string) => void
  setErrors: (errors: Record<string, string>) => void
  reset: () => void
}

const initialState = {
  storeName: '',
  ceoName: '',
  businessNumber: '',
  isDirty: false,
  errors: {},
}

export const useStoreFormStore = create<StoreFormState>((set) => ({
  ...initialState,

  setField: (field, value) => set((state) => ({
    ...state,
    [field]: value,
    isDirty: true,
  })),

  setErrors: (errors) => set({ errors }),

  reset: () => set(initialState),
}))
```

---

## 4. Persist 미들웨어

### 4.1 기본 사용법

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  language: string
  notifications: boolean
  setLanguage: (lang: string) => void
  setNotifications: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ko',
      notifications: true,
      setLanguage: (language) => set({ language }),
      setNotifications: (notifications) => set({ notifications }),
    }),
    {
      name: 'settings-storage', // localStorage 키 (필수)
    }
  )
)
```

### 4.2 고급 옵션

```typescript
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // ... 상태와 액션
    }),
    {
      name: 'settings-storage',

      // 특정 필드만 저장
      partialize: (state) => ({
        language: state.language,
        // notifications는 저장하지 않음
      }),

      // 버전 관리 (스키마 변경 시)
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // v0 → v1 마이그레이션
          return { ...persistedState, newField: 'default' }
        }
        return persistedState
      },

      // 저장소 변경 (기본: localStorage)
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
```

### 4.3 Hydration 처리

SSR(Server-Side Rendering) 환경에서 hydration 이슈 해결:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'

function AuthStatus() {
  const [isHydrated, setIsHydrated] = useState(false)
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 서버 렌더링 시에는 로딩 표시
  if (!isHydrated) {
    return <div>Loading...</div>
  }

  return <div>{accessToken ? '로그인됨' : '로그아웃'}</div>
}
```

또는 Zustand의 `onRehydrateStorage` 사용:

```typescript
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ... 상태
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
```

---

## 5. 실제 프로젝트 예제

### 5.0 현재 프로젝트 Store 구조

```
src/stores/
├── auth-store.ts        # ✅ 인증 상태 (persist) - 권장 패턴
├── bp-store.ts          # ⚠️ @deprecated - TanStack Query로 마이그레이션 완료
└── common-code-store.ts # ⚠️ @deprecated - TanStack Query로 마이그레이션 완료
```

| Store | 용도 | 패턴 | 비고 |
|-------|------|------|------|
| `useAuthStore` | 인증 토큰, 조직 ID | ✅ persist | 권장 패턴 - 계속 사용 |
| `useBpStore` | BP 본사/가맹점 트리 | ⚠️ 레거시 | **사용 금지** - `useBpHeadOfficeTree` 사용 |
| `useCommonCodeStore` | 공통코드 캐싱 | ⚠️ 레거시 | **사용 금지** - `useCommonCodeHierarchy` 사용 |

**중요:**
- `bp-store.ts`와 `common-code-store.ts`는 `@deprecated` 마크가 있으며, 새 코드에서 사용하지 마세요.
- 대신 `@/hooks/queries`의 TanStack Query 훅을 사용하세요:
  - BP: `useBpHeadOfficeTree`, `useBpDetail` 또는 래퍼 훅 `useBp`
  - 공통코드: `useCommonCodeHierarchy` 또는 래퍼 훅 `useCommonCode`

### 5.1 인증 Store (auth-store.ts)

**이것이 올바른 Zustand 사용 패턴입니다:**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type AuthState } from '@/lib/schemas/auth'

interface AuthStore extends AuthState {
  subscriptionPlan: number
  setTokens: (accessToken: string, refreshToken: string) => void
  setAccessToken: (token: string | null) => void
  setAuthority: (authority: Record<string, unknown>) => void
  setAffiliationId: (id: string | null) => void
  setSubscriptionPlan: (plan: number) => void
  clearAuth: () => void
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
      clearAuth: () => set({
        accessToken: null,
        refreshToken: null,
        authority: null,
        affiliationId: null,
        subscriptionPlan: 0
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

**왜 이것이 올바른가요?**
- ✅ 서버에서 오는 데이터가 아님 (토큰은 서버가 발급하지만, 저장/관리는 클라이언트)
- ✅ 새로고침 후에도 유지 필요 (persist)
- ✅ 여러 컴포넌트에서 공유 (API 인터셉터, 헤더, 페이지 등)

### 5.2 API에서 Auth Store 사용

**파일: `src/lib/api.ts`**

```typescript
import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { env } from '@/lib/schemas/env'

const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// 요청 인터셉터 - 컴포넌트 외부에서 상태 접근
api.interceptors.request.use((config) => {
  const url = config.url || ''

  // auth 관련 API는 자동 헤더 추가 건너뛰기
  if (url.startsWith('/api/auth/')) {
    return config
  }

  let { accessToken, affiliationId } = useAuthStore.getState()

  // ⚠️ store가 아직 hydrate되지 않은 경우 localStorage에서 직접 읽기
  if (!accessToken && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        accessToken = parsed.state?.accessToken
        affiliationId = affiliationId || parsed.state?.affiliationId
      }
    } catch {
      // localStorage 파싱 실패 시 무시
    }
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (affiliationId) {
    config.headers['affiliationId'] = affiliationId
  }

  return config
})

// 응답 인터셉터 - 401 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      // 로그인 페이지가 아닌 경우에만 리다이렉트
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

> **주의**: persist 미들웨어 사용 시, 앱 초기 로딩 단계에서 store가 아직 hydrate되지 않을 수 있습니다.
> 위 코드처럼 localStorage에서 직접 읽는 fallback을 구현하면 이 문제를 해결할 수 있습니다.

---

## 6. TanStack Query와 함께 사용하기

### 6.1 역할 분리

```
┌─────────────────────────────────────────────────────────────┐
│                         애플리케이션                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────┐   │
│  │    TanStack Query    │    │        Zustand          │   │
│  │                      │    │                         │   │
│  │  • 점포 목록/상세    │    │  • 로그인 토큰          │   │
│  │  • 사용자 정보       │    │  • 선택된 조직 ID       │   │
│  │  • 주문 내역         │    │  • UI 상태 (모달 등)    │   │
│  │  • 코드 테이블       │    │  • 사용자 설정          │   │
│  │                      │    │                         │   │
│  │  [서버 상태]         │    │  [클라이언트 상태]       │   │
│  └─────────────────────┘    └─────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 함께 사용하는 예시

```typescript
'use client'

import { useStoreList } from '@/hooks/queries'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'

function StoreListPage() {
  // Zustand - 클라이언트 상태
  const affiliationId = useAuthStore((state) => state.affiliationId)
  const { openModal } = useUIStore()

  // TanStack Query - 서버 상태
  const { data: stores, isPending } = useStoreList({
    affiliationId: affiliationId ?? undefined,
  })

  const handleCreateClick = () => {
    openModal('storeCreate')  // Zustand로 모달 제어
  }

  if (isPending) return <Loading />

  return (
    <div>
      <button onClick={handleCreateClick}>점포 추가</button>
      <StoreTable data={stores} />
    </div>
  )
}
```

### 6.3 Query와 Store 동기화가 필요한 경우

```typescript
// 예: 로그인 성공 시 토큰 저장 + 사용자 정보 캐싱
const { mutateAsync: login } = useLoginMutation()
const setTokens = useAuthStore((state) => state.setTokens)
const queryClient = useQueryClient()

const handleLogin = async (credentials: LoginCredentials) => {
  const result = await login(credentials)

  // Zustand에 토큰 저장
  setTokens(result.accessToken, result.refreshToken)

  // TanStack Query 캐시에 사용자 정보 설정
  queryClient.setQueryData(['user', 'me'], result.user)
}
```

---

## 7. 자주 하는 실수와 해결법

### 7.1 서버 데이터를 Zustand에 저장

```typescript
// ❌ 잘못된 예 - 서버 데이터를 Zustand에 저장
const useStoreListStore = create((set) => ({
  stores: [],
  loading: false,
  fetchStores: async () => {
    set({ loading: true })
    const data = await api.get('/stores')
    set({ stores: data, loading: false })
  },
}))

// ✅ 올바른 예 - TanStack Query 사용
const { data: stores, isPending } = useQuery({
  queryKey: ['stores'],
  queryFn: fetchStores,
})
```

### 7.2 전체 Store 구독

```typescript
// ❌ 잘못된 예 - 불필요한 리렌더링 발생
function Component() {
  const store = useAuthStore()  // 모든 상태 변경에 리렌더링
  return <div>{store.accessToken}</div>
}

// ✅ 올바른 예 - 필요한 상태만 선택
function Component() {
  const accessToken = useAuthStore((state) => state.accessToken)
  return <div>{accessToken}</div>
}
```

### 7.3 액션을 매번 새로 구독

```typescript
// ❌ 잘못된 예 - 액션도 매번 구독
function Component() {
  const increment = useCounterStore((state) => state.increment)
  // increment는 참조가 바뀌지 않으므로 괜찮지만...
}

// ✅ 더 명확한 예 - 상태와 액션 분리
function Component() {
  const count = useCounterStore((state) => state.count)

  const handleClick = () => {
    useCounterStore.getState().increment()  // 직접 호출
  }
}
```

### 7.4 SSR Hydration 불일치

```typescript
// ❌ 잘못된 예 - hydration 불일치 발생
function UserName() {
  const name = useAuthStore((state) => state.name)
  return <span>{name}</span>  // 서버: null, 클라이언트: "홍길동"
}

// ✅ 올바른 예 - hydration 처리
function UserName() {
  const [mounted, setMounted] = useState(false)
  const name = useAuthStore((state) => state.name)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <span>로딩...</span>
  return <span>{name}</span>
}
```

### 7.5 비동기 액션에서 최신 상태 사용

```typescript
// ❌ 잘못된 예 - 클로저로 인한 stale 상태
const useStore = create((set, get) => ({
  count: 0,
  asyncIncrement: async () => {
    await delay(1000)
    set({ count: count + 1 })  // count는 클로저에 갇힌 옛날 값
  },
}))

// ✅ 올바른 예 - get()으로 최신 상태 조회
const useStore = create((set, get) => ({
  count: 0,
  asyncIncrement: async () => {
    await delay(1000)
    set({ count: get().count + 1 })  // get()은 최신 상태 반환
  },
}))
```

---

## 8. Best Practices

### 8.1 Store 파일 구조

```
src/stores/
├── auth-store.ts       # 인증 관련
├── ui-store.ts         # UI 상태 (모달, 사이드바 등)
├── settings-store.ts   # 사용자 설정
└── index.ts            # 통합 export (선택적)
```

### 8.2 상태와 액션 분리

```typescript
// 타입 분리
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
}

interface AuthActions {
  setTokens: (access: string, refresh: string) => void
  clearAuth: () => void
}

interface AuthStore extends AuthState, AuthActions {}

// 초기 상태 분리
const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      clearAuth: () => set(initialState),
    }),
    { name: 'auth-storage' }
  )
)
```

### 8.3 선택자(Selector) 패턴

```typescript
// store 파일에 선택자 정의
export const useAuthStore = create<AuthStore>()(/* ... */)

// 자주 사용하는 선택자 export
export const useIsAuthenticated = () =>
  useAuthStore((state) => !!state.accessToken)

export const useAccessToken = () =>
  useAuthStore((state) => state.accessToken)

// 컴포넌트에서 사용
function Header() {
  const isAuthenticated = useIsAuthenticated()
  return isAuthenticated ? <UserMenu /> : <LoginButton />
}
```

### 8.4 DevTools 사용

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        // ...
      }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' }  // DevTools에 표시될 이름
  )
)
```

브라우저 Redux DevTools에서 Zustand 상태를 확인할 수 있습니다.

### 8.5 테스트를 위한 Reset 함수

```typescript
const initialState = {
  count: 0,
}

interface CounterStore {
  count: number
  increment: () => void
  _reset: () => void  // 테스트용
}

export const useCounterStore = create<CounterStore>((set) => ({
  ...initialState,
  increment: () => set((state) => ({ count: state.count + 1 })),
  _reset: () => set(initialState),  // 테스트에서 상태 초기화
}))
```

### 8.6 Zod 스키마와 연동

Store의 상태 타입을 Zod 스키마에서 추론하여 타입 안전성과 런타임 검증을 함께 확보할 수 있습니다.

**파일: `src/lib/schemas/auth.ts`**
```typescript
import { z } from 'zod'

// Zod 스키마로 상태 구조 정의
export const authStateSchema = z.object({
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  authority: z.record(z.string(), z.unknown()).nullable(),
  affiliationId: z.string().nullable(),
})

// 스키마에서 타입 추론
export type AuthState = z.infer<typeof authStateSchema>
```

**파일: `src/stores/auth-store.ts`**
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type AuthState } from '@/lib/schemas/auth'

// 스키마에서 추론된 타입을 확장
interface AuthStore extends AuthState {
  subscriptionPlan: number
  setTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  // ... 기타 액션
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      authority: null,
      affiliationId: null,
      subscriptionPlan: 0,
      // ... 액션 구현
    }),
    { name: 'auth-storage' }
  )
)
```

**장점:**
- ✅ 스키마와 Store 타입이 항상 동기화됨
- ✅ API 응답 검증과 Store 타입이 일치
- ✅ 런타임에 데이터 구조 검증 가능 (필요 시)

---

## 9. 마이그레이션 가이드

### 9.1 서버 상태를 TanStack Query로 이전

현재 프로젝트의 `bp-store.ts`와 `common-code-store.ts`는 서버 데이터를 Zustand에 저장하는 레거시 패턴입니다.
**이미 TanStack Query로 마이그레이션이 완료되었으며**, 새로운 기능 개발 시에는 반드시 TanStack Query를 사용하세요.

#### 마이그레이션 완료된 패턴 1: BP (본사-가맹점-점포 트리)

**현재 구조:**
```
src/
├── hooks/
│   ├── queries/
│   │   ├── query-keys.ts           # bpKeys 정의
│   │   └── use-bp-queries.ts       # useBpHeadOfficeTree, useBpDetail
│   └── useBp.ts                    # 래퍼 훅 (레거시 호환)
└── stores/
    └── bp-store.ts                 # ⚠️ @deprecated - 사용하지 마세요
```

**TanStack Query 사용법:**

```typescript
// 방법 1: 직접 사용 (권장)
import { useBpHeadOfficeTree, useBpDetail } from '@/hooks/queries'

function BpComponent() {
  const { data, isPending, error, refetch } = useBpHeadOfficeTree()
  
  if (isPending) return <div>로딩 중...</div>
  if (error) return <div>에러: {error.message}</div>
  
  return <BpTree data={data ?? []} />
}

// 방법 2: 래퍼 훅 사용 (레거시 코드 호환용)
import { useBp } from '@/hooks/useBp'

function BpComponent() {
  const { data, loading, error, refresh } = useBp()
  
  if (loading) return <div>로딩 중...</div>
  if (error) return <div>에러: {error}</div>
  
  return <BpTree data={data} />
}
```

**쿼리 키 구조:**
```typescript
// src/hooks/queries/query-keys.ts
export const bpKeys = {
  all: ['bp'] as const,
  headOfficeTree: () => [...bpKeys.all, 'head-office-tree'] as const,
  detail: (id: number) => [...bpKeys.all, 'detail', id] as const,
}
```

#### 마이그레이션 완료된 패턴 2: 공통코드 (계층 구조)

**현재 구조:**
```
src/
├── hooks/
│   ├── queries/
│   │   ├── query-keys.ts                # commonCodeKeys 정의
│   │   └── use-common-code-queries.ts   # useCommonCodeHierarchy, 캐시 유틸
│   └── useCommonCode.ts                 # 래퍼 훅 (레거시 호환)
└── stores/
    └── common-code-store.ts             # ⚠️ @deprecated - 사용하지 마세요
```

**TanStack Query 사용법:**

```typescript
// 방법 1: 직접 사용 (권장)
import { useCommonCodeHierarchy } from '@/hooks/queries'

function StatusSelector() {
  const { data, isPending, error } = useCommonCodeHierarchy('STATUS')
  
  if (isPending) return <div>로딩 중...</div>
  if (error) return <div>에러: {error.message}</div>
  
  return (
    <select>
      {data?.map(code => (
        <option key={code.id} value={code.code}>{code.name}</option>
      ))}
    </select>
  )
}

// 방법 2: 래퍼 훅 사용 (레거시 코드 호환용)
import { useCommonCode } from '@/hooks/useCommonCode'

function GenderSelector() {
  const { children, loading, error } = useCommonCode('GENDER')
  
  if (loading) return <div>로딩 중...</div>
  if (error) return <div>에러: {error}</div>
  
  return (
    <select>
      {children.map(code => (
        <option key={code.id} value={code.code}>{code.name}</option>
      ))}
    </select>
  )
}

// 방법 3: 캐시 유틸 사용 (컴포넌트 외부)
import { useCommonCodeCache } from '@/hooks/queries'

function MyComponent() {
  const { getChildren, getHierarchyChildren } = useCommonCodeCache()
  
  const handleClick = async () => {
    // 캐시에서 바로 읽기 (없으면 빈 배열)
    const cached = getChildren('STATUS')
    
    // 캐시가 없으면 API 호출 후 캐싱
    const codes = await getHierarchyChildren('STATUS')
  }
  
  return <button onClick={handleClick}>공통코드 조회</button>
}
```

**쿼리 키 구조:**
```typescript
// src/hooks/queries/query-keys.ts
export const commonCodeKeys = {
  all: ['common-codes'] as const,
  hierarchy: (code: string) => [...commonCodeKeys.all, 'hierarchy', code] as const,
}
```

**마이그레이션 장점:**
- ✅ 중복 호출 방지가 자동으로 처리됨
- ✅ 코드별 캐싱이 queryKey로 자동 관리됨
- ✅ 백그라운드 갱신, 에러 재시도 등이 자동으로 제공됨
- ✅ DevTools로 캐시 상태를 시각적으로 확인 가능

### 9.2 마이그레이션 체크리스트

새 기능 개발 시:

- [ ] 데이터가 서버에서 오는가? → TanStack Query
- [ ] 클라이언트에서만 사용하는 상태인가? → Zustand
- [ ] 새로고침 후 유지 필요한가? → Zustand + persist
- [ ] 기존 Zustand store를 사용해야 하는 경우, 해당 store가 서버 상태를 관리하는지 확인

---

## 부록: 유용한 링크

- [Zustand 공식 문서](https://zustand-demo.pmnd.rs/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [TanStack Query 가이드](./Tanstack-query-Development-guide.md) (함께 참고)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-28 | 1.0 | 초기 문서 작성 (TanStack Query 도입 반영) |
| 2026-01-28 | 1.1 | 코드베이스 분석 반영: 현재 Store 구조, 실제 api.ts 코드, 레거시 패턴 상세 설명, Zod 스키마 연동 패턴 추가 |
| 2026-01-28 | 1.2 | BP 및 공통코드 마이그레이션 완료 반영: deprecated 상태 명확화, TanStack Query 사용법 추가, 래퍼 훅 및 캐시 유틸 안내 |
