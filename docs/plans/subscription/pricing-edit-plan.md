# Plan Pricing Edit - 가격 정책 수정 기능 구현 계획

가격 정책 목록에서 '종료' 상태가 아닌 항목을 클릭했을 때 수정 화면으로 이동하고, 정보를 수정할 수 있는 기능을 구현하기 위한 계획입니다.

## 1. 개요

현재 가격 정책 목록(`PlanPricingList.tsx`)에서 로우 클릭 시의 동작이 정의되어 있지 않습니다. '대기' 또는 '진행' 상태인 가격 정책을 클릭하면 해당 정책의 상세 정보를 수정할 수 있는 페이지로 이동하는 기능을 추가합니다.

### 상태별 수정 가능 범위

| 상태 | 수정 가능 여부 | 비고 |
|------|---------------|------|
| 대기 | ✅ 전체 필드 | 시작 전이므로 모든 필드 수정 가능 |
| 진행 | ✅ 전체 필드 | (서버 API 확인 필요 - 제한 있을 수 있음) |
| 종료 | ❌ 수정 불가 | 클릭해도 이동하지 않음 |

## 2. 상세 작업 단계

### 단계 1: PlanPricingForm 컴포넌트 리팩토링

기존 `PlanPricingCreate.tsx`를 `PlanPricingForm.tsx`로 리팩토링하여 생성/수정 모드를 모두 지원합니다.

**변경 사항:**
- 파일명: `PlanPricingCreate.tsx` → `PlanPricingForm.tsx`
- Props 변경:
```typescript
interface PlanPricingFormProps {
    planId: number
    planTypeName: string
    mode: 'create' | 'edit'
    initialData?: PlanPricing  // edit 모드일 때 기존 데이터
    pricingId?: number         // edit 모드일 때 pricing ID
}
```

**mode별 동작 차이:**
| 항목 | create | edit |
|------|--------|------|
| 초기 상태 | 빈 값 | initialData로 채움 |
| 기간 중복 체크 | 전체 체크 | 자기 자신 제외 |
| 저장 API | POST (생성) | PUT (수정) |
| 페이지 타이틀 | "가격 정보 등록" | "가격 정보 수정" |

### 단계 2: 목록 컴포넌트 수정 (`PlanPricingList.tsx`)

**추가 사항:**
- `onRowClicked` 이벤트 핸들러 추가
- 종료 상태가 아닌 경우에만 수정 페이지로 이동
- `rowClassRules`로 클릭 가능 여부 시각적 구분

```typescript
const handleRowClicked = (event: RowClickedEvent<PlanPricing>) => {
    const data = event.data
    if (!data) return

    const status = getStatus(data)
    if (status !== '종료') {
        router.push(`/subscription/${planId}/pricing/${data.id}/edit`)
    }
}

// AgGrid에 추가
<AgGrid
    rowData={pricingList}
    columnDefs={columnDefs}
    onRowClicked={handleRowClicked}
    rowClassRules={{
        'cursor-pointer': (params) => getStatus(params.data as PlanPricing) !== '종료',
        'opacity-50': (params) => getStatus(params.data as PlanPricing) === '종료',
    }}
/>
```

### 단계 3: API Hook 추가 (`use-plans-queries.ts`)

**useUpdatePlanPricing 추가:**
```typescript
export const useUpdatePlanPricing = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            planId,
            pricingId,
            data,
        }: {
            planId: number
            pricingId: number
            data: UpdatePlanPricingRequest
        }) => {
            const response = await api.put<ApiResponse<CreatePlanPricingResponse>>(
                `/api/v1/subscription/plans/${planId}/pricings/${pricingId}`,
                data
            )
            return response.data.data
        },
        onSuccess: (_, { planId }) => {
            queryClient.invalidateQueries({ queryKey: plansKeys.detail(planId) })
        },
    })
}
```

**기간 중복 체크 수정 (자기 자신 제외):**
```typescript
export const useCheckPlanPricingDuplicate = () => {
    return useMutation({
        mutationFn: async ({
            planId,
            activeFrom,
            activeUntil,
            excludePricingId,  // 추가: 수정 시 자기 자신 제외
        }: {
            planId: number
            activeFrom: string
            activeUntil: string
            excludePricingId?: number
        }) => {
            const response = await api.get<ApiResponse<PlanPricing[]>>(
                `/api/v1/subscription/plans/${planId}/pricings`,
                { params: { activeFrom, activeUntil, excludePricingId } }
            )
            return {
                isDuplicate: response.data.data.length >= 1,
                duplicates: response.data.data,
            }
        },
    })
}
```

> **참고**: 서버 API에서 `excludePricingId` 파라미터 지원 여부 확인 필요. 미지원 시 클라이언트에서 필터링 처리.

### 단계 4: 타입 정의 보완 (`plans.ts`)

```typescript
// 수정 요청은 생성 요청과 동일
export type UpdatePlanPricingRequest = CreatePlanPricingRequest
```

### 단계 5: 수정 페이지 생성

**페이지 경로:** `src/app/(sub)/subscription/[id]/pricing/[pricingId]/edit/page.tsx`

```typescript
import { use } from 'react'
import { notFound } from 'next/navigation'
import PlanPricingForm from '@/components/subscription/detail/PlanPricingForm'
import { usePlanDetail } from '@/hooks/queries'

interface PageProps {
    params: Promise<{ id: string; pricingId: string }>
}

export default function PlanPricingEditPage({ params }: PageProps) {
    const { id, pricingId } = use(params)
    const planId = Number(id)
    const pricingIdNum = Number(pricingId)

    // Plan 상세에서 pricing 데이터 추출
    const { data: plan, isPending } = usePlanDetail(planId)

    if (isPending) return <div>로딩 중...</div>

    const pricing = plan?.pricings.find(p => p.id === pricingIdNum)
    if (!pricing) return notFound()

    return (
        <PlanPricingForm
            planId={planId}
            planTypeName={plan.planTypeName}
            mode="edit"
            initialData={pricing}
            pricingId={pricingIdNum}
        />
    )
}
```

### 단계 6: 기존 생성 페이지 수정

**페이지 경로:** `src/app/(sub)/subscription/[id]/pricing/create/page.tsx`

```typescript
// PlanPricingCreate → PlanPricingForm으로 변경
import PlanPricingForm from '@/components/subscription/detail/PlanPricingForm'

// ...

return (
    <PlanPricingForm
        planId={planId}
        planTypeName={planTypeName}
        mode="create"
    />
)
```

## 3. PlanPricingForm 주요 변경 로직

### 3.1 초기 상태 설정

```typescript
// mode가 edit이고 initialData가 있으면 초기값 설정
const [title, setTitle] = useState(initialData?.title ?? '')
const [monthlyPrice, setMonthlyPrice] = useState<number | undefined>(
    initialData?.monthlyPrice ?? undefined
)
const [fromDate, setFromDate] = useState<Date | null>(
    initialData?.startDate ? new Date(initialData.startDate) : null
)
// ... 나머지 필드들
```

### 3.2 저장 로직 분기

```typescript
const { mutateAsync: createPricing, isPending: isCreating } = useCreatePlanPricing()
const { mutateAsync: updatePricing, isPending: isUpdating } = useUpdatePlanPricing()

const isSaving = isCreating || isUpdating

const handleSave = async () => {
    // ... validation 로직

    try {
        if (mode === 'create') {
            await createPricing({ planId, data: requestData })
        } else {
            await updatePricing({ planId, pricingId: pricingId!, data: requestData })
        }
        router.push(`/subscription/${planId}`)
    } catch (error) {
        // 에러 처리
    }
}
```

### 3.3 기간 중복 체크 (자기 자신 제외)

```typescript
const handleDuplicateCheck = async () => {
    // ...
    const result = await checkDuplicate({
        planId,
        activeFrom: format(fromDate, 'yyyy-MM-dd'),
        activeUntil: format(toDate, 'yyyy-MM-dd'),
        excludePricingId: mode === 'edit' ? pricingId : undefined,
    })
    // ...
}
```

### 3.4 페이지 타이틀 분기

```typescript
const pageTitle = mode === 'create' ? '가격 정보 등록' : '가격 정보 수정'

return (
    <div className="data-wrap">
        <Location title={pageTitle} list={BREADCRUMBS} />
        // ...
    </div>
)
```

## 4. 사전 확인 필요 사항

- [ ] 서버 PUT API 엔드포인트 확인: `PUT /api/v1/subscription/plans/{planId}/pricings/{pricingId}`
- [ ] 기간 중복 체크 API에서 `excludePricingId` 파라미터 지원 여부
- [ ] 진행 상태에서 수정 가능한 필드 범위 (비즈니스 룰)

## 5. 다음 단계

이 계획이 승인되면 다음 순서로 구현을 진행합니다:

1. `PlanPricingCreate.tsx` → `PlanPricingForm.tsx` 리팩토링
2. 목록 컴포넌트에 클릭 이벤트 추가
3. `useUpdatePlanPricing` Hook 추가
4. 수정 페이지 생성
5. 기존 생성 페이지 수정
