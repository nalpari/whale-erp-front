# Global Loading Spinner (글로벌 로딩 스피너) 가이드

이 문서는 `whale-erp-front` 프로젝트의 글로벌 로딩 스피너 구현 방식과 개발 시 적용 방법을 설명합니다.

---

## 목차

1. [개요](#1-개요)
2. [아키텍처](#2-아키텍처)
3. [동작 원리](#3-동작-원리)
4. [적용 방법](#4-적용-방법)
5. [로딩 처리 전략 (Query vs Mutation)](#5-로딩-처리-전략-query-vs-mutation)
6. [실전 예제: 로그인 페이지](#6-실전-예제-로그인-페이지)
7. [새 기능 개발 시 적용 가이드](#7-새-기능-개발-시-적용-가이드)
8. [주의사항 및 FAQ](#8-주의사항-및-faq)

---

## 1. 개요

### 글로벌 로딩 스피너란?

TanStack Query의 `useIsMutating()` 훅을 활용하여, **`useMutation`을 사용하는 API 요청이 진행 중일 때 자동으로 전체 화면 로딩 오버레이(CubeLoader)를 표시**하는 시스템입니다.

### 설계 방침: Query와 Mutation의 로딩 분리

| 구분 | 로딩 방식 | 이유 |
|------|----------|------|
| **Query (조회)** | 각 컴포넌트에서 `isPending`으로 개별 처리 | 조회는 부분 로딩 UI(스켈레톤)가 더 나은 UX |
| **Mutation (생성/수정/삭제)** | 글로벌 오버레이 자동 표시 | 중복 클릭 방지 + 사용자에게 처리중 피드백 |

---

## 2. 아키텍처

### 관련 파일

```
src/
├── components/common/ui/
│   ├── CubeLoader.tsx              # 3D 큐브 로딩 애니메이션 컴포넌트
│   ├── CubeLoader.css              # 큐브 로더 스타일 (.cube-loader-overlay 포함)
│   └── GlobalMutationSpinner.tsx   # 글로벌 mutation 로딩 감지 컴포넌트
│
├── providers/
│   └── query-provider.tsx          # QueryProvider + GlobalMutationSpinner 통합
│
└── hooks/queries/
    └── use-login-mutation.ts       # 로그인 mutation 훅 (적용 예시)
```

### 컴포넌트 구조

```
RootLayout
└── QueryProvider (query-provider.tsx)
    ├── {children}                    ← 앱 전체 콘텐츠
    ├── GlobalMutationSpinner         ← mutation 감지 → CubeLoader 오버레이
    └── ReactQueryDevtools            ← 개발 환경 전용
```

---

## 3. 동작 원리

### 흐름도

```
사용자 액션 (저장/수정/삭제 버튼 클릭)
  │
  ▼
useMutation의 mutateAsync() 호출
  │
  ▼
TanStack Query 내부 mutation 카운트 +1
  │
  ▼
useIsMutating() > 0 감지 (GlobalMutationSpinner)
  │
  ▼
CubeLoader 오버레이 표시 (전체 화면 차단)
  │
  ▼
API 응답 수신 (성공 또는 실패)
  │
  ▼
mutation 카운트 -1
  │
  ▼
useIsMutating() === 0
  │
  ▼
오버레이 자동 숨김
```

### 핵심 코드

**GlobalMutationSpinner.tsx:**

```tsx
'use client'

import { useIsMutating } from '@tanstack/react-query'
import CubeLoader from './CubeLoader'

export default function GlobalMutationSpinner() {
  const isMutating = useIsMutating()

  if (!isMutating) return null

  return (
    <div className="cube-loader-overlay">
      <CubeLoader />
    </div>
  )
}
```

- `useIsMutating()`: 현재 진행 중인 mutation 수를 반환 (0이면 없음)
- `isMutating > 0`이면 오버레이 렌더링, 0이면 `null` 반환 (숨김)

---

## 4. 적용 방법

### 4.1 자동 적용 (기본 - 별도 코드 불필요)

`useMutation`을 사용하는 모든 곳에서 **자동으로** 글로벌 스피너가 표시됩니다.

```tsx
// 이미 존재하는 mutation 훅들 - 별도 수정 없이 자동 동작
const { mutateAsync } = useCreateStore()
const { mutateAsync } = useUpdateStore()
const { mutateAsync } = useDeleteStore()
const { mutateAsync } = useCreateEmployee()
```

### 4.2 새로운 Mutation 훅 작성 시

새 기능을 추가할 때 `useMutation`으로 훅을 작성하면 자동으로 글로벌 스피너가 적용됩니다.

```tsx
// src/hooks/queries/use-order-queries.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { orderKeys } from './query-keys'

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: OrderCreateRequest) => {
      const response = await api.post('/api/v1/orders', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}
```

컴포넌트에서 사용:

```tsx
function OrderForm() {
  const { mutateAsync: createOrder } = useCreateOrder()

  const handleSubmit = async () => {
    try {
      await createOrder(formData)
      // mutateAsync 호출 시점: 글로벌 스피너 자동 표시
      // API 응답 수신 시점: 글로벌 스피너 자동 숨김
      alert('주문이 생성되었습니다.')
    } catch (error) {
      alert('주문 생성 실패')
    }
  }

  return <button onClick={handleSubmit}>주문 생성</button>
  // disabled 처리 불필요 - 오버레이가 화면 전체를 차단
}
```

---

## 5. 로딩 처리 전략 (Query vs Mutation)

### Query (조회) - 개별 로딩 처리

조회 요청은 글로벌 스피너를 사용하지 않습니다. 각 컴포넌트에서 `isPending`을 활용합니다.

```tsx
function StoreListPage() {
  const { data, isPending, error } = useStoreList(params)

  // 첫 로딩: 스켈레톤 또는 로딩 메시지
  if (isPending) return <div>불러오는 중...</div>

  // 에러 처리
  if (error) return <div>에러: {error.message}</div>

  // 데이터 표시
  return <StoreTable rows={data.content} />
}
```

### Mutation (변경) - 글로벌 스피너 자동

변경 요청은 글로벌 스피너가 자동 처리하므로, 컴포넌트에서 별도 로딩 UI를 구현할 필요가 없습니다.

```tsx
function StoreForm() {
  const { mutateAsync: createStore } = useCreateStore()

  const handleSubmit = async () => {
    try {
      await createStore({ payload, files })
      // 글로벌 스피너가 자동으로 표시/숨김
      alert('저장 완료')
    } catch (error) {
      alert('저장 실패')
    }
  }

  return <button onClick={handleSubmit}>저장</button>
}
```

### 버튼 비활성화가 필요한 경우

글로벌 오버레이가 화면을 차단하므로 대부분 불필요하지만, 버튼 텍스트를 변경하고 싶다면 `isPending`을 사용합니다.

```tsx
function StoreForm() {
  const { mutateAsync: createStore, isPending } = useCreateStore()

  return (
    <button onClick={handleSubmit} disabled={isPending}>
      {isPending ? '저장 중...' : '저장'}
    </button>
  )
}
```

---

## 6. 실전 예제: 로그인 페이지

로그인 페이지는 글로벌 스피너 적용의 대표적인 예시입니다.

### Before (수동 로딩 관리)

```tsx
// 수동 isLoading 상태 관리
const [isLoading, setIsLoading] = useState(false)

const handleLogin = async () => {
  setIsLoading(true)
  try {
    const response = await api.post('/api/auth/login', data)
    // ...처리
  } catch (error) {
    // ...에러 처리
  } finally {
    setIsLoading(false)
  }
}

// JSX에서 수동 로딩 오버레이
{isLoading && (
  <div className="cube-loader-overlay">
    <CubeLoader />
  </div>
)}
```

### After (Mutation 훅 + 글로벌 스피너)

**1단계: Mutation 훅 작성** (`src/hooks/queries/use-login-mutation.ts`)

```tsx
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import type { LoginRequest, LoginAuthorityProgram } from '@/lib/schemas/auth'

interface LoginResponse {
  accessToken: string
  refreshToken: string
  authority?: {
    authority_id: number
    programs: LoginAuthorityProgram[]
  }
  companies?: Array<{
    authority_id: number
    company_name: string | null
    brand_name: string | null
  }>
  loginId?: string
  name?: string
  mobilePhone?: string
  subscriptionPlanId?: number
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<{ data: LoginResponse }>('/api/auth/login', data)
      return response.data.data
    },
  })
}
```

**2단계: 컴포넌트에서 사용** (`src/app/(auth)/login/page.tsx`)

```tsx
import { useLoginMutation } from '@/hooks/queries/use-login-mutation'

export default function LoginPage() {
  const loginMutation = useLoginMutation()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const data = await loginMutation.mutateAsync(validation.data)
      // API 호출 중: 글로벌 CubeLoader 오버레이 자동 표시
      // 응답 후: 자동 숨김

      // ...토큰 저장, 라우팅 등
    } catch (error) {
      // ...에러 처리
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {/* 로딩 오버레이 코드 불필요 - 글로벌 스피너가 자동 처리 */}
      <button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? '로그인 중...' : 'LOGIN'}
      </button>
    </form>
  )
}
```

### 변경 포인트 정리

| Before | After |
|--------|-------|
| `useState(false)` + `setIsLoading` 수동 관리 | `loginMutation.isPending` 자동 제공 |
| `api.post()` 직접 호출 | `loginMutation.mutateAsync()` 호출 |
| `CubeLoader` 수동 렌더링 | 글로벌 스피너 자동 표시 |
| `try/finally { setIsLoading(false) }` | 자동 상태 정리 |
| `CubeLoader` import 필요 | import 불필요 |

---

## 7. 새 기능 개발 시 적용 가이드

### 체크리스트

새 기능에 API 호출이 포함될 때 아래 순서를 따릅니다.

#### 1. 조회 API인 경우 → `useQuery`

```tsx
// hooks/queries/use-xxx-queries.ts
export function useXxxList(params: XxxListParams) {
  return useQuery({
    queryKey: xxxKeys.list(params),
    queryFn: async () => {
      const response = await api.get('/api/v1/xxx', { params })
      return response.data.data
    },
  })
}
```

- 글로벌 스피너 동작하지 않음 (정상)
- 컴포넌트에서 `isPending`으로 개별 로딩 UI 구현

#### 2. 변경 API인 경우 → `useMutation`

```tsx
// hooks/queries/use-xxx-queries.ts
export function useCreateXxx() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: XxxCreateRequest) => {
      const response = await api.post('/api/v1/xxx', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: xxxKeys.lists() })
    },
  })
}
```

- 글로벌 스피너 자동 동작 (별도 코드 불필요)
- 컴포넌트에서 `mutateAsync()`로 호출

#### 3. 컴포넌트에서 사용

```tsx
function XxxPage() {
  // 조회
  const { data, isPending } = useXxxList(params)

  // 변경
  const { mutateAsync: createXxx } = useCreateXxx()

  const handleCreate = async () => {
    try {
      await createXxx(formData)
      // 글로벌 스피너 자동
      alert('생성 완료')
    } catch {
      alert('생성 실패')
    }
  }

  // 조회 로딩은 개별 처리
  if (isPending) return <div>로딩 중...</div>

  return (
    <div>
      <DataTable data={data} />
      <button onClick={handleCreate}>생성</button>
    </div>
  )
}
```

---

## 8. 주의사항 및 FAQ

### Q1. 특정 mutation에서 글로벌 스피너를 표시하고 싶지 않다면?

`useIsMutating`에 필터를 적용할 수 있습니다. 현재는 모든 mutation에 적용되지만, 필요 시 `mutationKey`로 필터링할 수 있습니다.

```tsx
// 특정 키만 감지하도록 변경 (필요 시)
const isMutating = useIsMutating({ mutationKey: ['important'] })
```

단, 이 방법을 사용하면 각 mutation에 `mutationKey`를 명시해야 합니다.

### Q2. Query 조회에도 글로벌 스피너를 적용하고 싶다면?

`useIsFetching()`을 추가로 사용합니다.

```tsx
import { useIsFetching, useIsMutating } from '@tanstack/react-query'

export default function GlobalLoadingSpinner() {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()

  if (!isFetching && !isMutating) return null

  return (
    <div className="cube-loader-overlay">
      <CubeLoader />
    </div>
  )
}
```

> 권장하지 않음: 백그라운드 refetch에도 스피너가 표시되어 UX가 나빠질 수 있습니다.

### Q3. 여러 mutation이 동시에 진행되면?

`useIsMutating()`은 진행 중인 mutation **수**를 반환합니다. 3개가 동시에 진행되면 `3`을 반환합니다. 모두 완료되어 `0`이 되면 스피너가 숨겨집니다.

### Q4. CubeLoader 디자인을 변경하려면?

- 컴포넌트: `src/components/common/ui/CubeLoader.tsx`
- 스타일: `src/components/common/ui/CubeLoader.css`
- 오버레이 스타일: `.cube-loader-overlay` 클래스

### Q5. 기존에 수동으로 isLoading을 관리하던 코드는?

점진적으로 mutation 훅으로 전환할 수 있습니다. 기존 방식과 충돌하지 않으므로, 새 기능부터 mutation 훅으로 작성하고 기존 코드는 리팩토링 시 전환합니다.

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-02-12 | 1.0 | 초기 문서 작성 |
