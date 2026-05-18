# 가격 기간 중복 체크 API 연동 계획

## 목표
`PlanPricingCreate` 컴포넌트의 `handleDuplicateCheck` 함수에서 API를 호출하여 선택한 기간이 기존 가격 정책과 중복되는지 확인

## API 스펙

| 항목 | 값 |
|------|-----|
| **Endpoint** | `GET /api/v1/subscription/plans/{planId}/pricings` |
| **Parameters** | `activeFrom` (시작일), `activeUntil` (종료일) |
| **응답 판단** | `data.length >= 1` → 중복 / `data.length === 0` → 중복 아님 |

## 구현 계획

### 1단계: 타입 정의 추가

**파일:** `src/types/plans.ts`

```typescript
// 가격 기간 중복 체크 요청 파라미터
export interface PlanPricingCheckParams {
    activeFrom: string   // YYYY-MM-DD
    activeUntil: string  // YYYY-MM-DD
}

// 가격 기간 중복 체크 응답 (기존 PlanPricing 배열 재사용)
export type PlanPricingCheckResponse = PlanPricing[]
```

### 2단계: 쿼리 키 추가

**파일:** `src/hooks/queries/query-keys.ts`

```typescript
export const plansKeys = {
  all: ['plans'] as const,
  lists: () => [...plansKeys.all, 'list'] as const,
  list: (params: PlansListParams) => [...plansKeys.lists(), params] as const,
  details: () => [...plansKeys.all, 'detail'] as const,
  detail: (id: number) => [...plansKeys.details(), id] as const,
  // 추가
  pricings: (planId: number) => [...plansKeys.all, 'pricings', planId] as const,
  pricingCheck: (planId: number, params: { activeFrom: string; activeUntil: string }) =>
    [...plansKeys.pricings(planId), 'check', params] as const,
}
```

### 3단계: 쿼리 훅 추가

**파일:** `src/hooks/queries/use-plans-queries.ts`

```typescript
import { PlanPricingCheckParams, PlanPricingCheckResponse } from '@/types/plans'

// 가격 기간 중복 체크
export const usePlanPricingCheck = (
    planId: number,
    params: PlanPricingCheckParams | null,
    enabled = true
) => {
    return useQuery({
        queryKey: plansKeys.pricingCheck(planId, params ?? { activeFrom: '', activeUntil: '' }),
        queryFn: async () => {
            const response = await api.get<ApiResponse<PlanPricingCheckResponse>>(
                `/api/v1/subscription/plans/${planId}/pricings`,
                { params }
            )
            return response.data.data
        },
        enabled: enabled && planId > 0 && params !== null,
    })
}
```

### 4단계: 컴포넌트 수정

**파일:** `src/components/subscription/detail/PlanPricingCreate.tsx`

```typescript
import { usePlanPricingCheck } from '@/hooks/queries/use-plans-queries'
import { format } from 'date-fns'

// 상태 추가
const [checkParams, setCheckParams] = useState<{ activeFrom: string; activeUntil: string } | null>(null)

// 쿼리 훅 사용
const { data: duplicateData, isFetching: isChecking } = usePlanPricingCheck(
    planId,
    checkParams,
    checkParams !== null
)

// useEffect로 결과 처리
useEffect(() => {
    if (duplicateData !== undefined && checkParams !== null) {
        if (duplicateData.length >= 1) {
            setShowDateError(true)
            setDateCheckMessage('해당 기간에 이미 가격 정책이 존재합니다.')
        } else {
            setShowDateError(false)
            setDateCheckMessage('사용 가능한 기간입니다.')
            // 성공 메시지 표시 상태 추가 필요
        }
        setCheckParams(null) // 리셋
    }
}, [duplicateData, checkParams])

// handleDuplicateCheck 수정
const handleDuplicateCheck = () => {
    if (!fromDate || !toDate) {
        setShowDateError(true)
        setDateCheckMessage('기간을 선택해주세요.')
        return
    }

    setCheckParams({
        activeFrom: format(fromDate, 'yyyy-MM-dd'),
        activeUntil: format(toDate, 'yyyy-MM-dd'),
    })
}
```

## 대안: useMutation 사용 (권장)

조회가 아닌 "체크" 액션이므로 mutation으로 구현하는 것이 더 적합:

**파일:** `src/hooks/queries/use-plans-queries.ts`

```typescript
// 가격 기간 중복 체크 (mutation 방식)
export const useCheckPlanPricingDuplicate = () => {
    return useMutation({
        mutationFn: async ({
            planId,
            activeFrom,
            activeUntil
        }: {
            planId: number
            activeFrom: string
            activeUntil: string
        }) => {
            const response = await api.get<ApiResponse<PlanPricing[]>>(
                `/api/v1/subscription/plans/${planId}/pricings`,
                { params: { activeFrom, activeUntil } }
            )
            return {
                isDuplicate: response.data.data.length >= 1,
                duplicates: response.data.data,
            }
        },
    })
}
```

**컴포넌트 사용:**

```typescript
const { mutateAsync: checkDuplicate, isPending: isChecking } = useCheckPlanPricingDuplicate()

const handleDuplicateCheck = async () => {
    if (!fromDate || !toDate) {
        setShowDateError(true)
        setDateCheckMessage('기간을 선택해주세요.')
        return
    }

    try {
        const result = await checkDuplicate({
            planId,
            activeFrom: format(fromDate, 'yyyy-MM-dd'),
            activeUntil: format(toDate, 'yyyy-MM-dd'),
        })

        if (result.isDuplicate) {
            setShowDateError(true)
            setDateCheckMessage('해당 기간에 이미 가격 정책이 존재합니다.')
        } else {
            setShowDateError(false)
            setDateCheckMessage(null)
            // 성공 상태 표시
            setDateCheckSuccess(true)
        }
    } catch (error) {
        setShowDateError(true)
        setDateCheckMessage('중복 확인 중 오류가 발생했습니다.')
    }
}
```

## 파일 수정 목록

| 파일 | 작업 |
|------|------|
| `src/types/plans.ts` | 타입 추가 (선택적) |
| `src/hooks/queries/use-plans-queries.ts` | `useCheckPlanPricingDuplicate` 훅 추가 |
| `src/components/subscription/detail/PlanPricingCreate.tsx` | 훅 연동 및 UI 피드백 |

## 예상 소요

- 타입/훅 작성: 간단
- 컴포넌트 연동: 간단
- 테스트: API 응답 확인 필요

## 참고사항

- `date-fns`의 `format` 함수 사용하여 날짜 포맷팅
- 로딩 상태 처리 (`isChecking`)
- 성공 메시지 표시를 위한 추가 상태 필요 (`dateCheckSuccess`)
