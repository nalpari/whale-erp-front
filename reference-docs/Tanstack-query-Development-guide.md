# TanStack Query 개발 가이드

이 문서는 `whale-erp-front` 프로젝트에서 TanStack Query를 사용하는 방법을 설명합니다.
주니어 개발자도 쉽게 따라할 수 있도록 기본 개념부터 실제 적용 예제까지 상세히 다룹니다.

---

## 목차

1. [개요 및 핵심 개념](#1-개요-및-핵심-개념)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [기본 설정](#3-기본-설정)
4. [Query (데이터 조회)](#4-query-데이터-조회)
5. [Mutation (데이터 변경)](#5-mutation-데이터-변경)
6. [쿼리 키 관리](#6-쿼리-키-관리)
7. [로딩 및 에러 처리](#7-로딩-및-에러-처리)
8. [실전 예제](#8-실전-예제)
9. [자주 하는 실수와 해결법](#9-자주-하는-실수와-해결법)
10. [Best Practices](#10-best-practices)

---

## 1. 개요 및 핵심 개념

### TanStack Query란?

TanStack Query(구 React Query)는 **서버 상태 관리** 라이브러리입니다.

#### 서버 상태 vs 클라이언트 상태

| 구분 | 서버 상태 | 클라이언트 상태 |
|------|----------|----------------|
| **정의** | 서버에 저장된 데이터 | 브라우저 메모리에만 존재하는 데이터 |
| **예시** | 사용자 목록, 점포 정보, 주문 내역 | 모달 열림 여부, 선택된 탭, 폼 입력값 |
| **특징** | 원격에서 관리됨, 캐싱 필요 | 로컬에서 관리됨, 즉시 접근 |
| **관리 도구** | **TanStack Query** | **Zustand** |

### 왜 TanStack Query를 사용하나요?

**Before (기존 방식):**
```typescript
// 직접 구현해야 했던 것들
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  let cancelled = false
  setLoading(true)

  fetchData()
    .then(result => {
      if (!cancelled) setData(result)
    })
    .catch(err => {
      if (!cancelled) setError(err)
    })
    .finally(() => {
      if (!cancelled) setLoading(false)
    })

  return () => { cancelled = true }
}, [deps])
```

**After (TanStack Query):**
```typescript
const { data, isPending, error } = useQuery({
  queryKey: ['stores'],
  queryFn: fetchStores,
})
```

### TanStack Query가 자동으로 해주는 것들

- **캐싱**: 같은 데이터를 다시 요청하면 캐시에서 즉시 반환
- **중복 제거**: 동시에 같은 요청이 여러 번 발생해도 1번만 실행
- **백그라운드 갱신**: 오래된 데이터는 자동으로 새로고침
- **에러 재시도**: 실패 시 자동 재시도
- **메모리 관리**: 사용하지 않는 캐시는 자동 정리

---

## 2. 프로젝트 구조

```
src/
├── lib/
│   └── query-client.ts          # QueryClient 설정
│
├── providers/
│   └── query-provider.tsx       # QueryClientProvider 래퍼
│
├── hooks/
│   └── queries/                 # 쿼리 훅 모음
│       ├── index.ts             # 통합 export
│       ├── query-keys.ts        # 쿼리 키 팩토리
│       ├── use-store-queries.ts # 점포 관련 쿼리/뮤테이션
│       └── use-file-queries.ts  # 파일 관련 쿼리
│
└── app/
    └── layout.tsx               # QueryProvider 적용
```

---

## 3. 기본 설정

### 3.1 QueryClient 설정

**파일: `src/lib/query-client.ts`**

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5분 동안 데이터를 "신선"하다고 간주
      gcTime: 10 * 60 * 1000,        // 10분 후 미사용 캐시 정리
      retry: 1,                       // 실패 시 1회 재시도
      refetchOnWindowFocus: false,   // 창 포커스 시 자동 재요청 비활성화
      throwOnError: false,           // 에러를 throw하지 않고 반환값으로 제공
    },
    mutations: {
      retry: 0,                       // mutation은 재시도 안함
    },
  },
})
```

#### 주요 옵션 설명

| 옵션 | 기본값 | 우리 설정 | 설명 |
|------|--------|----------|------|
| `staleTime` | 0 | 5분 | 이 시간 동안은 캐시된 데이터를 "신선"하다고 판단하여 재요청하지 않음 |
| `gcTime` | 5분 | 10분 | 캐시된 데이터가 사용되지 않으면 이 시간 후 메모리에서 삭제 |
| `retry` | 3 | 1 | 요청 실패 시 재시도 횟수 |
| `refetchOnWindowFocus` | true | false | 브라우저 탭 전환 후 돌아왔을 때 자동 재요청 여부 |

### 3.2 Provider 설정

**파일: `src/providers/query-provider.tsx`**

```typescript
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

#### DevTools 사용법

개발 환경에서 화면 하단에 꽃 모양 아이콘이 나타납니다. 클릭하면:
- 현재 캐시된 모든 쿼리 확인
- 각 쿼리의 상태 (fresh, stale, fetching 등)
- 수동으로 캐시 무효화 테스트
- 네트워크 요청 시뮬레이션

### 3.3 Layout에 Provider 적용

**파일: `src/app/layout.tsx`**

```typescript
import { QueryProvider } from '@/providers/query-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
```

---

## 4. Query (데이터 조회)

### 4.1 기본 useQuery 사용법

```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isPending, isError, error, refetch } = useQuery({
  queryKey: ['stores', params],    // 캐시 키 (유니크해야 함)
  queryFn: () => fetchStores(params), // 데이터를 가져오는 함수
  enabled: true,                   // false면 쿼리 실행 안함
})
```

### 4.2 반환값 상세 설명

| 속성 | 타입 | 설명 |
|------|------|------|
| `data` | `T \| undefined` | 성공 시 반환된 데이터 |
| `isPending` | `boolean` | 첫 로딩 중 (캐시 없음) |
| `isLoading` | `boolean` | 로딩 중 (isPending && isFetching) |
| `isFetching` | `boolean` | 백그라운드 포함 모든 요청 중 |
| `isError` | `boolean` | 에러 발생 여부 |
| `error` | `Error \| null` | 에러 객체 |
| `isSuccess` | `boolean` | 성공 여부 |
| `refetch` | `() => void` | 수동으로 다시 요청 |

#### isPending vs isLoading vs isFetching

```
첫 로딩 (캐시 없음):
  isPending: true  ← 스켈레톤 UI 표시
  isFetching: true
  isLoading: true

캐시 있고 백그라운드 갱신:
  isPending: false  ← 캐시된 데이터 먼저 표시
  isFetching: true  ← 새로고침 스피너만 표시
  isLoading: false
```

### 4.3 실제 프로젝트 예제

**파일: `src/hooks/queries/use-store-queries.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { storeKeys } from './query-keys'
import type { StoreListResponse, StoreDetailResponse } from '@/types/store'

// 점포 목록 조회
export const useStoreList = (params: StoreListParams, enabled = true) => {
  return useQuery({
    queryKey: storeKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StoreListResponse>>(
        '/api/v1/stores',
        { params }
      )
      return response.data.data
    },
    enabled,
  })
}

// 점포 상세 조회
export const useStoreDetail = (storeId?: number | null) => {
  return useQuery({
    queryKey: storeKeys.detail(storeId!),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StoreDetailResponse>>(
        `/api/v1/stores/${storeId}`
      )
      return response.data.data
    },
    enabled: !!storeId,  // storeId가 있을 때만 실행
  })
}
```

### 4.4 컴포넌트에서 사용하기

```typescript
'use client'

import { useStoreList } from '@/hooks/queries'

export default function StoreListPage() {
  const params = { page: 0, size: 20 }

  const { data, isPending, error } = useStoreList(params)

  // 로딩 중
  if (isPending) {
    return <div>점포 목록을 불러오는 중...</div>
  }

  // 에러 발생
  if (error) {
    return <div>에러: {error.message}</div>
  }

  // 성공
  return (
    <ul>
      {data?.content.map(store => (
        <li key={store.id}>{store.storeName}</li>
      ))}
    </ul>
  )
}
```

---

## 5. Mutation (데이터 변경)

### 5.1 기본 useMutation 사용법

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const { mutate, mutateAsync, isPending, isError, error } = useMutation({
  mutationFn: (data) => api.post('/api/stores', data),
  onSuccess: () => {
    // 성공 시 관련 캐시 무효화
    queryClient.invalidateQueries({ queryKey: ['stores'] })
  },
  onError: (error) => {
    // 에러 처리
    console.error('저장 실패:', error)
  },
})
```

### 5.2 mutate vs mutateAsync

| 메서드 | 반환값 | 에러 처리 | 사용 시점 |
|--------|--------|----------|----------|
| `mutate()` | `void` | `onError` 콜백에서 | 간단한 호출 |
| `mutateAsync()` | `Promise` | `try/catch`로 | async/await 필요시 |

```typescript
// mutate 사용 (콜백 스타일)
createStore.mutate(data, {
  onSuccess: () => toast.success('저장 완료'),
  onError: (err) => toast.error(err.message),
})

// mutateAsync 사용 (async/await 스타일)
try {
  await createStore.mutateAsync(data)
  toast.success('저장 완료')
} catch (err) {
  toast.error(err.message)
}
```

### 5.3 실제 프로젝트 예제

**파일: `src/hooks/queries/use-store-queries.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { storeKeys } from './query-keys'

// 점포 생성
export const useCreateStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ payload, files }: CreateStoreParams) => {
      const formData = buildStoreFormData(payload, files)
      const response = await api.post('/api/v1/stores', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    },
    onSuccess: () => {
      // 목록과 옵션 캐시 무효화 → 자동으로 최신 데이터 다시 요청
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: storeKeys.options() })
    },
  })
}

// 점포 수정
export const useUpdateStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ storeId, payload, files }: UpdateStoreParams) => {
      const formData = buildStoreFormData(payload, files)
      const response = await api.put(`/api/v1/stores/${storeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    },
    onSuccess: (_, { storeId }) => {
      // 목록과 해당 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: storeKeys.detail(storeId) })
    },
  })
}

// 점포 삭제
export const useDeleteStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storeId: number) => api.delete(`/api/v1/stores/${storeId}`),
    onSuccess: () => {
      // 점포 관련 모든 캐시 무효화
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
  })
}
```

### 5.4 컴포넌트에서 Mutation 사용하기

```typescript
'use client'

import { useCreateStore, useUpdateStore } from '@/hooks/queries'

function StoreForm({ storeId }: { storeId?: number }) {
  const isEditMode = !!storeId

  const { mutateAsync: createStore, isPending: createPending } = useCreateStore()
  const { mutateAsync: updateStore, isPending: updatePending } = useUpdateStore()

  const saving = createPending || updatePending

  const handleSubmit = async () => {
    const payload = { /* 폼 데이터 */ }
    const files = { /* 파일 데이터 */ }

    try {
      if (isEditMode) {
        await updateStore({ storeId, payload, files })
      } else {
        await createStore({ payload, files })
      }
      alert('저장 완료')
    } catch (error) {
      alert('저장 실패: ' + error.message)
    }
  }

  return (
    <button onClick={handleSubmit} disabled={saving}>
      {saving ? '저장 중...' : '저장'}
    </button>
  )
}
```

---

## 6. 쿼리 키 관리

### 6.1 쿼리 키란?

쿼리 키는 캐시를 식별하는 **고유 식별자**입니다.

```typescript
// 쿼리 키 예시
['stores']                          // 점포 전체
['stores', 'list', { page: 0 }]     // 특정 파라미터의 목록
['stores', 'detail', 1]             // ID가 1인 점포 상세
```

### 6.2 쿼리 키 팩토리 패턴

**파일: `src/hooks/queries/query-keys.ts`**

```typescript
export interface StoreListParams {
  office?: number
  franchise?: number
  store?: number
  status?: string
  from?: string
  to?: string
  page?: number
  size?: number
  sort?: string
}

export const storeKeys = {
  // 최상위 키 - 모든 점포 관련 캐시의 부모
  all: ['stores'] as const,

  // 목록 관련
  lists: () => [...storeKeys.all, 'list'] as const,
  list: (params: StoreListParams) => [...storeKeys.lists(), params] as const,

  // 상세 관련
  details: () => [...storeKeys.all, 'detail'] as const,
  detail: (id: number) => [...storeKeys.details(), id] as const,

  // 옵션 (드롭다운용)
  options: (officeId?: number | null, franchiseId?: number | null) =>
    [...storeKeys.all, 'options', { officeId, franchiseId }] as const,
}

export const fileKeys = {
  all: ['files'] as const,
  downloadUrl: (id: number) => [...fileKeys.all, 'download', id] as const,
}
```

### 6.3 캐시 무효화 전략

```typescript
const queryClient = useQueryClient()

// 특정 점포 상세만 무효화
queryClient.invalidateQueries({ queryKey: storeKeys.detail(1) })

// 모든 점포 목록 무효화 (파라미터와 관계없이)
queryClient.invalidateQueries({ queryKey: storeKeys.lists() })

// 점포 관련 모든 캐시 무효화 (목록, 상세, 옵션 전부)
queryClient.invalidateQueries({ queryKey: storeKeys.all })
```

#### 키 계층 구조 시각화

```
storeKeys.all = ['stores']
    │
    ├── storeKeys.lists() = ['stores', 'list']
    │       │
    │       └── storeKeys.list({page: 0}) = ['stores', 'list', {page: 0}]
    │       └── storeKeys.list({page: 1}) = ['stores', 'list', {page: 1}]
    │
    ├── storeKeys.details() = ['stores', 'detail']
    │       │
    │       └── storeKeys.detail(1) = ['stores', 'detail', 1]
    │       └── storeKeys.detail(2) = ['stores', 'detail', 2]
    │
    └── storeKeys.options() = ['stores', 'options', {...}]
```

---

## 7. 로딩 및 에러 처리

### 7.1 기본 패턴

```typescript
function StoreDetail({ storeId }: { storeId: number }) {
  const { data, isPending, error } = useStoreDetail(storeId)

  // 1. 로딩 상태
  if (isPending) {
    return <LoadingSkeleton />
  }

  // 2. 에러 상태
  if (error) {
    return <ErrorMessage message={error.message} />
  }

  // 3. 성공 상태
  return <StoreInfo data={data} />
}
```

### 7.2 Suspense와 함께 사용 (선택적)

```typescript
// 부모 컴포넌트
<Suspense fallback={<LoadingSkeleton />}>
  <StoreDetail storeId={1} />
</Suspense>

// 자식 컴포넌트
function StoreDetail({ storeId }: { storeId: number }) {
  const { data } = useSuspenseQuery({
    queryKey: storeKeys.detail(storeId),
    queryFn: () => fetchStoreDetail(storeId),
  })

  // isPending 체크 불필요 - Suspense가 처리
  return <StoreInfo data={data} />
}
```

### 7.3 전역 에러 처리

```typescript
// query-client.ts에서 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 모든 쿼리의 기본 에러 핸들러
      meta: {
        errorMessage: '데이터를 불러오는 중 오류가 발생했습니다.',
      },
    },
    mutations: {
      // 모든 뮤테이션의 기본 에러 핸들러
      onError: (error) => {
        console.error('Mutation failed:', error)
        // toast.error('작업 중 오류가 발생했습니다.')
      },
    },
  },
})
```

---

## 8. 실전 예제

### 8.1 목록 + 검색 + 페이지네이션

```typescript
'use client'

import { useState, useMemo } from 'react'
import { useStoreList, type StoreListParams } from '@/hooks/queries'

export default function StoreListPage() {
  const [filters, setFilters] = useState({
    officeId: null,
    franchiseId: null,
    status: 'ALL',
  })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // 검색 파라미터 구성
  const params: StoreListParams = useMemo(() => ({
    office: filters.officeId ?? undefined,
    franchise: filters.franchiseId ?? undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
    page,
    size: pageSize,
    sort: 'createdAt,desc',
  }), [filters, page, pageSize])

  const { data, isPending, error } = useStoreList(params)

  // 검색 필터 변경 시 첫 페이지로 이동
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(0)  // 검색 조건 변경 시 첫 페이지로
  }

  return (
    <div>
      {/* 검색 폼 */}
      <SearchForm
        filters={filters}
        onChange={handleFilterChange}
      />

      {/* 로딩 상태 */}
      {isPending && <div>불러오는 중...</div>}

      {/* 에러 상태 */}
      {error && <div>에러: {error.message}</div>}

      {/* 목록 */}
      {data && (
        <>
          <StoreTable rows={data.content} />
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
```

### 8.2 상세 조회 + 수정

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useStoreDetail, useUpdateStore } from '@/hooks/queries'

export default function StoreEditPage({ storeId }: { storeId: number }) {
  const { data: store, isPending } = useStoreDetail(storeId)
  const { mutateAsync: updateStore, isPending: saving } = useUpdateStore()

  // 폼 상태 (서버 데이터로 초기화)
  const [formData, setFormData] = useState(null)

  // 서버 데이터가 로드되면 폼 초기화
  useEffect(() => {
    if (store) {
      setFormData({
        storeName: store.storeInfo.storeName,
        ceoName: store.storeInfo.ceoName,
        // ... 나머지 필드
      })
    }
  }, [store])

  const handleSubmit = async () => {
    try {
      await updateStore({
        storeId,
        payload: formData,
        files: {},
      })
      alert('저장되었습니다.')
    } catch (error) {
      alert('저장 실패: ' + error.message)
    }
  }

  if (isPending) return <div>불러오는 중...</div>
  if (!formData) return null

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <input
        value={formData.storeName}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          storeName: e.target.value
        }))}
      />
      {/* ... 나머지 폼 필드 */}
      <button type="submit" disabled={saving}>
        {saving ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
```

### 8.3 의존성 있는 쿼리 (Dependent Queries)

```typescript
// 본사 선택 → 가맹점 옵션 로드 → 점포 옵션 로드
function StoreSelector() {
  const [officeId, setOfficeId] = useState<number | null>(null)
  const [franchiseId, setFranchiseId] = useState<number | null>(null)

  // 본사 목록은 항상 로드
  const { data: offices } = useOfficeOptions()

  // 가맹점은 본사가 선택되면 로드
  const { data: franchises } = useFranchiseOptions(officeId, {
    enabled: !!officeId,  // officeId가 있을 때만 실행
  })

  // 점포는 가맹점이 선택되면 로드
  const { data: stores } = useStoreOptions(officeId, franchiseId, !!franchiseId)

  return (
    <div>
      <select
        value={officeId ?? ''}
        onChange={e => {
          setOfficeId(Number(e.target.value) || null)
          setFranchiseId(null)  // 본사 변경 시 가맹점 초기화
        }}
      >
        <option value="">본사 선택</option>
        {offices?.map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>

      <select
        value={franchiseId ?? ''}
        onChange={e => setFranchiseId(Number(e.target.value) || null)}
        disabled={!officeId}
      >
        <option value="">가맹점 선택</option>
        {franchises?.map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>

      {/* 점포 선택 ... */}
    </div>
  )
}
```

### 8.4 BP 트리 조회 (본사-가맹점-점포 계층 구조)

```typescript
'use client'

import { useBpHeadOfficeTree } from '@/hooks/queries'

function BpSelector() {
  const { data: headOffices, isPending } = useBpHeadOfficeTree()

  if (isPending) return <div>로딩 중...</div>

  return (
    <div>
      {headOffices?.map(office => (
        <div key={office.id}>
          <h3>{office.name}</h3>
          {office.franchises?.map(franchise => (
            <div key={franchise.id}>
              <h4>{franchise.name}</h4>
              {franchise.stores?.map(store => (
                <div key={store.id}>{store.name}</div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

**래퍼 훅 사용:**

```typescript
import { useBp } from '@/hooks/useBp'

function BpComponent() {
  const { data, loading, error, refresh } = useBp()

  if (loading) return <div>로딩 중...</div>
  if (error) return <div>에러: {error}</div>

  return (
    <div>
      <button onClick={refresh}>새로고침</button>
      <BpTree data={data} />
    </div>
  )
}
```

### 8.5 공통코드 조회 (계층 구조)

```typescript
'use client'

import { useCommonCodeHierarchy } from '@/hooks/queries'

function StatusSelector() {
  const { data: statusCodes, isPending } = useCommonCodeHierarchy('STATUS')

  if (isPending) return <div>로딩 중...</div>

  return (
    <select>
      <option value="">상태 선택</option>
      {statusCodes?.map(code => (
        <option key={code.id} value={code.code}>
          {code.name}
        </option>
      ))}
    </select>
  )
}
```

**래퍼 훅 사용:**

```typescript
import { useCommonCode } from '@/hooks/useCommonCode'

function GenderSelector() {
  const { children, loading, error } = useCommonCode('GENDER')

  if (loading) return <div>로딩 중...</div>
  if (error) return <div>에러: {error}</div>

  return (
    <select>
      <option value="">성별 선택</option>
      {children.map(code => (
        <option key={code.id} value={code.code}>
          {code.name}
        </option>
      ))}
    </select>
  )
}
```

**캐시 유틸 사용:**

```typescript
import { useCommonCodeCache } from '@/hooks/queries'

function MyComponent() {
  const { getChildren, getHierarchyChildren } = useCommonCodeCache()

  const handleSomething = async () => {
    // 캐시에서 바로 읽기 (없으면 빈 배열)
    const cached = getChildren('STATUS')

    // 캐시가 없으면 API 호출 후 캐싱
    const codes = await getHierarchyChildren('STATUS')
  }

  return <div>...</div>
}
```

---

## 9. 자주 하는 실수와 해결법

### 9.1 쿼리 키에 객체 사용 시 주의

```typescript
// ❌ 잘못된 예 - 매번 새 객체 생성
const { data } = useQuery({
  queryKey: ['stores', { page, size }],  // 렌더링마다 새 객체!
  queryFn: fetchStores,
})

// ✅ 올바른 예 - useMemo로 안정화
const params = useMemo(() => ({ page, size }), [page, size])
const { data } = useQuery({
  queryKey: ['stores', params],
  queryFn: fetchStores,
})

// ✅ 더 좋은 예 - 쿼리 키 팩토리 사용
const { data } = useQuery({
  queryKey: storeKeys.list({ page, size }),
  queryFn: fetchStores,
})
```

### 9.2 enabled 옵션 누락

```typescript
// ❌ 잘못된 예 - storeId가 undefined일 때도 요청 발생
const { data } = useQuery({
  queryKey: ['stores', storeId],
  queryFn: () => fetchStore(storeId),  // undefined로 요청!
})

// ✅ 올바른 예 - enabled로 조건부 실행
const { data } = useQuery({
  queryKey: ['stores', storeId],
  queryFn: () => fetchStore(storeId!),
  enabled: !!storeId,  // storeId가 있을 때만 실행
})
```

### 9.3 Mutation 후 캐시 무효화 누락

```typescript
// ❌ 잘못된 예 - 저장 후 목록이 갱신되지 않음
const { mutate } = useMutation({
  mutationFn: createStore,
  // onSuccess가 없음!
})

// ✅ 올바른 예 - 저장 후 관련 캐시 무효화
const { mutate } = useMutation({
  mutationFn: createStore,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: storeKeys.lists() })
  },
})
```

### 9.4 에러 타입 처리

```typescript
// ❌ 잘못된 예 - error를 string으로 가정
{error && <div>{error}</div>}  // Error 객체라서 [object Object] 출력

// ✅ 올바른 예 - error.message 사용
{error && <div>{error.message}</div>}
```

### 9.5 컴포넌트 외부에서 queryClient 접근

```typescript
// ❌ 잘못된 예 - 컴포넌트 외부에서 훅 사용
const queryClient = useQueryClient()  // 훅은 컴포넌트 내에서만!

// ✅ 올바른 예 - import로 직접 접근
import { queryClient } from '@/lib/query-client'

// 컴포넌트 외부 (예: 유틸 함수)
function clearAllCache() {
  queryClient.clear()
}
```

---

## 10. Best Practices

### 10.1 쿼리 훅은 별도 파일로 분리

```typescript
// ✅ hooks/queries/use-store-queries.ts에 모아두기
export const useStoreList = (params) => useQuery({...})
export const useStoreDetail = (id) => useQuery({...})
export const useCreateStore = () => useMutation({...})

// 컴포넌트에서 깔끔하게 사용
import { useStoreList, useCreateStore } from '@/hooks/queries'
```

### 10.2 쿼리 키는 팩토리 패턴으로 관리

```typescript
// ✅ 중앙 집중식 쿼리 키 관리
export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  list: (params) => [...storeKeys.lists(), params] as const,
  // ...
}
```

### 10.3 로딩 상태는 isPending 사용

```typescript
// ✅ 권장 - 첫 로딩에만 스켈레톤 표시
if (isPending) return <Skeleton />

// 백그라운드 갱신 시에는 작은 인디케이터만
{isFetching && <RefreshIndicator />}
```

### 10.4 에러 경계와 함께 사용

```typescript
// 전역 에러 처리
<ErrorBoundary fallback={<ErrorPage />}>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</ErrorBoundary>
```

### 10.5 staleTime 적절히 설정

| 데이터 특성 | staleTime | 예시 |
|------------|-----------|------|
| 자주 변경됨 | 0~30초 | 실시간 알림, 채팅 |
| 가끔 변경됨 | 1~5분 | 점포 목록, 사용자 정보 |
| 거의 안 변함 | 10분~1시간 | 코드 테이블, 설정값 |
| 정적 데이터 | Infinity | 국가 목록, 우편번호 |

---

## 부록: 유용한 링크

- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [TanStack Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [React Query 패턴 모음](https://tkdodo.eu/blog/practical-react-query)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-28 | 1.0 | 초기 문서 작성 |
| 2026-01-28 | 1.1 | BP 및 공통코드 TanStack Query 마이그레이션 예제 추가 (useBpHeadOfficeTree, useCommonCodeHierarchy, 래퍼 훅, 캐시 유틸) |
