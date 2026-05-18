# PlanHeader 페이지 이동 구현 계획 (TanStack Query 캐싱 활용)

> **작성일**: 2026-01-30  
> **수정일**: 2026-01-30  
> **목표**: PlanDetail에서 "수정" 버튼 클릭 시 PlanHeader 수정 페이지로 이동 (TanStack Query 캐시 활용)

---

## 📋 핵심 개념

### TanStack Query 캐싱 동작 방식

TanStack Query는 동일한 `queryKey`로 조회된 데이터를 자동으로 캐싱합니다.

```typescript
// PlanDetail에서 조회
const { data: plan } = usePlanDetail(planId)  // API 호출 O, 캐시에 저장

// PlanHeader에서 동일한 queryKey로 조회
const { data: plan } = usePlanDetail(planId)  // 캐시 사용, API 호출 X
```

**장점:**
- 별도 상태 관리 불필요 (Zustand 등)
- 동일한 쿼리 훅 재사용
- 자동 캐시 무효화 및 갱신

---

## 🛠️ 구현 단계

### 1단계: 기존 usePlanDetail 훅 확인

**경로**: `src/hooks/queries/use-plans-queries.ts`

현재 구현이 캐싱을 지원하는지 확인 (이미 지원 중):

```typescript
// 현재 구현
export const usePlanDetail = (id: number, enabled = true) => {
    return useQuery({
        queryKey: plansKeys.detail(id),  // ← 동일한 id면 동일한 캐시 키
        queryFn: async () => {
            const response = await api.get<ApiResponse<PlanDetailResponse>>(
                `/api/v1/subscription/plans/${id}`
            )
            return response.data.data
        },
        enabled: enabled && id > 0,
    })
}
```

**queryKey `plansKeys.detail(id)`가 동일하면 캐시된 데이터를 반환합니다.**

---

### 2단계: header/page.tsx 생성

**경로**: `src/app/(sub)/subscription/[id]/header/page.tsx`

```typescript
import PlanHeader from '@/components/subscription/detail/PlanHeader'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PlanHeaderPage({ params }: PageProps) {
    const { id } = await params
    const planId = Number(id)

    if (isNaN(planId) || planId <= 0) {
        return (
            <div className="data-wrap">
                <div className="error-wrap">
                    <div className="form-helper error">잘못된 요금제 ID입니다.</div>
                </div>
            </div>
        )
    }

    return <PlanHeader planId={planId} />
}
```

---

### 3단계: PlanDetail.tsx 수정

수정 버튼 클릭 시 `/subscription/[id]/header` 페이지로 이동

```typescript
// PlanDetail.tsx
const router = useRouter()

// 헤더 수정 페이지로 이동
const handleEditHeader = () => {
    router.push(`/subscription/${planId}/header`)
}
```

**추가 작업 없음!** TanStack Query가 자동으로 캐시된 데이터를 유지합니다.

---

### 4단계: PlanHeader.tsx 수정

동일한 `usePlanDetail` 훅 사용 → 캐시된 데이터 자동 사용

```typescript
// PlanHeader.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePlanDetail } from '@/hooks/queries'
import Location from '@/components/ui/Location'
import { PlanFeature, PlanDetailResponse } from '@/types/plans'

const BREADCRUMBS = ['과금관리', 'ERP 요금제 관리', 'ERP요금제 헤더 수정']

interface PlanHeaderProps {
    planId: number
}

export default function PlanHeader({ planId }: PlanHeaderProps) {
    const router = useRouter()
    
    // 동일한 queryKey → PlanDetail에서 조회한 캐시 데이터 사용 (추가 API 호출 없음)
    const { data: plan, isPending, error } = usePlanDetail(planId)
    
    // 수정용 로컬 상태 (캐시 데이터 기반 초기화)
    const [storeLimit, setStoreLimit] = useState<number | null>(null)
    const [employeeLimit, setEmployeeLimit] = useState<number | null>(null)
    const [features, setFeatures] = useState<PlanFeature[]>([])
    
    // plan 데이터가 로드되면 상태 초기화 (최초 1회)
    useEffect(() => {
        if (plan && features.length === 0) {
            setStoreLimit(plan.storeLimit)
            setEmployeeLimit(plan.employeeLimit)
            setFeatures(plan.features)
        }
    }, [plan, features.length])
    
    // 취소 시 상세 페이지로 이동
    const handleCancel = () => {
        router.push(`/subscription/${planId}`)
    }
    
    // 저장 시 mutation 호출 후 상세 페이지로 이동
    const handleSave = async () => {
        // TODO: mutation 호출
        router.push(`/subscription/${planId}`)
    }
    
    // 로딩 상태 (캐시가 있으면 즉시 렌더링)
    if (isPending) {
        return <div className="loading-wrap">로딩 중...</div>
    }
    
    // 에러 상태
    if (error || !plan) {
        return <div className="error-wrap">데이터를 불러올 수 없습니다.</div>
    }
    
    return (
        // ... 수정 폼 렌더링
    )
}
```

---

## 📁 최종 파일 구조

```
src/
├── hooks/queries/
│   └── use-plans-queries.ts        # 기존 usePlanDetail 훅 (수정 없음)
│
├── app/(sub)/subscription/
│   ├── page.tsx                    # /subscription (목록)
│   └── [id]/
│       ├── page.tsx                # /subscription/[id] (상세)
│       └── header/
│           └── page.tsx            # /subscription/[id]/header (헤더 수정) ← 새로 생성
│
└── components/subscription/detail/
    ├── PlanDetail.tsx              # 상세 조회 + 수정 페이지 이동 ← 간단 수정
    └── PlanHeader.tsx              # 헤더 수정 (동일 훅으로 캐시 사용) ← 수정
```

---

## 🔄 데이터 흐름

```
1. PlanDetail에서 usePlanDetail(planId) 호출
        ↓
2. TanStack Query가 API 호출 후 캐시에 저장
   (queryKey: ['plans', 'detail', planId])
        ↓
3. "수정" 버튼 클릭 → router.push('/subscription/[id]/header')
        ↓
4. PlanHeader에서 usePlanDetail(planId) 호출
        ↓
5. 동일한 queryKey → 캐시된 데이터 즉시 반환 (API 호출 없음!)
        ↓
6. 수정 폼 렌더링 (캐시 데이터로 초기화)
        ↓
7. 저장 시 mutation 호출 → queryClient.invalidateQueries로 캐시 무효화
        ↓
8. 상세 페이지로 복귀 → 최신 데이터 자동 refetch
```

---

## ⚙️ TanStack Query 캐시 설정 확인

### 캐시 유지 시간 (staleTime)

현재 설정에 따라 캐시 동작이 달라집니다:

| 설정 | 동작 |
|------|------|
| `staleTime: 0` (기본값) | 캐시 사용하지만, 백그라운드에서 refetch |
| `staleTime: Infinity` | 캐시만 사용, refetch 안함 |
| `staleTime: 60000` | 1분간 캐시만 사용 |

**권장**: 현재 기본값(`staleTime: 0`)으로도 충분합니다. 페이지 이동 시 캐시된 데이터를 즉시 표시하고, 백그라운드에서 조용히 갱신합니다.

---

## ✅ 체크리스트

- [ ] `src/app/(sub)/subscription/[id]/header/page.tsx` 생성 (이미 생성됨)
- [ ] `PlanDetail.tsx` 수정 - 수정 버튼 클릭 시 페이지 이동
- [ ] `PlanHeader.tsx` 수정 - usePlanDetail 훅으로 캐시 데이터 사용
- [ ] 테스트: 상세 → 수정 페이지 이동 시 Network 탭에서 API 호출 없음 확인
- [ ] 테스트: 저장 후 캐시 무효화 및 데이터 갱신 확인
- [ ] 테스트: 직접 URL 접근 시 API 조회 동작 확인

---

## 📝 장점

- ✅ **별도 상태 관리 불필요** - Zustand store 추가 없음
- ✅ **중복 API 호출 방지** - TanStack Query 캐싱 자동 활용
- ✅ **코드 간소화** - 동일한 쿼리 훅 재사용
- ✅ **자동 캐시 무효화** - mutation 후 invalidateQueries로 갱신
- ✅ **기존 패턴 유지** - 프로젝트의 TanStack Query 패턴 그대로 사용
