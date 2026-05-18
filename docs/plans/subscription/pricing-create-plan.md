# Plan Pricing Create - handleSave TODO 구현 계획

`PlanPricingCreate.tsx` 컴포넌트의 `handleSave` 함수에서 누락된 API 호출(mutation) 로직을 구현하기 위한 계획입니다.

## 1. 개요
현재 `PlanPricingCreate.tsx`는 UI와 유효성 검사 로직은 구현되어 있으나, 실제 데이터를 서버에 저장하는 Mutation 호출 부분이 `TODO`로 남아 있습니다. 이를 해결하기 위해 필요한 타입 정의, Hook 추가 및 컴포넌트 수정을 진행합니다.

## 2. 상세 작업 단계

### 단계 1: 타입 정의 추가 (`src/types/plans.ts`)
서버로 보낼 요청 데이터 구조를 정의합니다.

```typescript
// 가격 정책 생성 요청
export interface CreatePlanPricingRequest {
  title: string                        // 필수
  startDate: string                    // 필수, 'yyyy-MM-dd'
  endDate: string                      // 필수, 'yyyy-MM-dd'
  monthlyPrice: number                 // 필수, 1개월 요금
  sixMonthPrice: number | null         // 6개월 월 요금 (비활성화 시 null)
  sixMonthDiscountRate: number | null  // 할인율 선택 시 값, 할인금액 선택 시 null
  sixMonthDiscountPrice: number | null // 할인금액 선택 시 값, 할인율 선택 시 null
  yearlyPrice: number | null           // 12개월 월 요금 (비활성화 시 null)
  yearlyDiscountRate: number | null    // 할인율 선택 시 값, 할인금액 선택 시 null
  yearlyDiscountPrice: number | null   // 할인금액 선택 시 값, 할인율 선택 시 null
}

// 가격 정책 생성 응답
export interface CreatePlanPricingResponse {
  id: number
  planId: number
  title: string
  startDate: string
  endDate: string
  monthlyPrice: number
  sixMonthPrice: number | null
  sixMonthDiscountRate: number | null
  sixMonthDiscountPrice: number | null
  yearlyPrice: number | null
  yearlyDiscountRate: number | null
  yearlyDiscountPrice: number | null
}
```

> **할인 유형별 필드 사용 규칙** (배타적):
> | 할인 유형 | discountRate | discountPrice |
> |----------|--------------|---------------|
> | 할인율(rate) | 사용자 입력값 | `null` |
> | 할인금액(amount) | `null` | 사용자 입력값 |
> | 할인 미적용 | `null` | `null` |

### 단계 2: API Hook 추가 (`src/hooks/queries/use-plans-queries.ts`)
TanStack Query를 사용하여 생성 Mutation을 추가합니다.

```typescript
export const useCreatePlanPricing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      planId,
      data
    }: {
      planId: number
      data: CreatePlanPricingRequest
    }) => {
      const response = await api.post<ApiResponse<PlanPricing>>(
        `/api/v1/subscription/plans/${planId}/pricings`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, { planId }) => {
      // 상세 페이지 캐시 무효화
      queryClient.invalidateQueries({ queryKey: plansKeys.detail(planId) })
    },
  })
}
```

### 단계 3: 컴포넌트 수정 (`src/components/subscription/detail/PlanPricingCreate.tsx`)

#### 3.1 Hook 가져오기
```typescript
const { mutateAsync: createPricing, isPending: isSaving } = useCreatePlanPricing()
```

#### 3.2 handleSave 함수 구현
```typescript
const handleSave = async () => {
  if (!validate()) {
    return
  }

  // 6개월 할인 필드 설정 (배타적)
  let sixMonthDiscountRate: number | null = null
  let sixMonthDiscountPrice: number | null = null
  if (enableSixMonth && sixMonthDiscountEnabled && sixMonthDiscountValue) {
    if (sixMonthDiscountType === 'rate') {
      sixMonthDiscountRate = sixMonthDiscountValue  // 할인율만 설정
    } else {
      sixMonthDiscountPrice = sixMonthDiscountValue // 할인금액만 설정
    }
  }

  // 12개월 할인 필드 설정 (배타적)
  let yearlyDiscountRate: number | null = null
  let yearlyDiscountPrice: number | null = null
  if (enableTwelveMonth && twelveMonthDiscountEnabled && twelveMonthDiscountValue) {
    if (twelveMonthDiscountType === 'rate') {
      yearlyDiscountRate = twelveMonthDiscountValue  // 할인율만 설정
    } else {
      yearlyDiscountPrice = twelveMonthDiscountValue // 할인금액만 설정
    }
  }

  // 요청 데이터 구성
  const requestData: CreatePlanPricingRequest = {
    title: title.trim(),
    startDate: format(fromDate!, 'yyyy-MM-dd'),
    endDate: format(toDate!, 'yyyy-MM-dd'),
    monthlyPrice: monthlyPrice!,
    sixMonthPrice: enableSixMonth ? sixMonthPrice! : null,
    sixMonthDiscountRate,
    sixMonthDiscountPrice,
    yearlyPrice: enableTwelveMonth ? twelveMonthPrice! : null,
    yearlyDiscountRate,
    yearlyDiscountPrice,
  }

  try {
    await createPricing({ planId, data: requestData })
    // TODO: 토스트 메시지 표시 (프로젝트에 토스트 라이브러리 있으면 사용)
    // toast.success('가격 정책이 등록되었습니다.')
    router.push(`/subscription/${planId}`)
  } catch (error) {
    // 에러 처리
    console.error('가격 정책 등록 실패:', error)
    // TODO: 토스트 또는 alert로 에러 메시지 표시
    // toast.error('가격 정책 등록에 실패했습니다.')
    alert('가격 정책 등록에 실패했습니다. 다시 시도해주세요.')
  }
}
```

#### 3.3 저장 버튼 UI 수정
```tsx
<button
  className="slidebox-btn"
  onClick={handleSave}
  disabled={isSaving}
>
  {isSaving ? '저장 중...' : '저장'}
</button>
```

## 3. 예상 데이터 구조 (Request/Response)

### Request - 기본 예시 (1개월만, 할인 없음)
```json
{
  "title": "2024 상반기 프로모션",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "monthlyPrice": 50000,
  "sixMonthPrice": null,
  "sixMonthDiscountRate": null,
  "sixMonthDiscountPrice": null,
  "yearlyPrice": null,
  "yearlyDiscountRate": null,
  "yearlyDiscountPrice": null
}
```

### Request - 할인율(rate) 사용 예시
```json
{
  "title": "2024 상반기 프로모션",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "monthlyPrice": 50000,
  "sixMonthPrice": 45000,
  "sixMonthDiscountRate": 10,
  "sixMonthDiscountPrice": null,
  "yearlyPrice": 40000,
  "yearlyDiscountRate": 20,
  "yearlyDiscountPrice": null
}
```

### Request - 할인금액(amount) 사용 예시
```json
{
  "title": "2024 상반기 프로모션",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "monthlyPrice": 50000,
  "sixMonthPrice": 45000,
  "sixMonthDiscountRate": null,
  "sixMonthDiscountPrice": 27000,
  "yearlyPrice": 40000,
  "yearlyDiscountRate": null,
  "yearlyDiscountPrice": 96000
}
```

### Request - 혼합 사용 예시 (6개월: 할인율, 12개월: 할인금액)
```json
{
  "title": "2024 상반기 프로모션",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "monthlyPrice": 50000,
  "sixMonthPrice": 45000,
  "sixMonthDiscountRate": 10,
  "sixMonthDiscountPrice": null,
  "yearlyPrice": 40000,
  "yearlyDiscountRate": null,
  "yearlyDiscountPrice": 96000
}
```

## 4. 고려사항

### 4.1 할인 필드 사용 규칙 (배타적)
| 할인 유형 | `discountRate` | `discountPrice` |
|----------|----------------|-----------------|
| 할인율 선택 | 사용자 입력값 (0-100) | `null` |
| 할인금액 선택 | `null` | 사용자 입력값 (원) |
| 할인 미적용 | `null` | `null` |

> 두 필드 중 하나만 값을 가지며, 서버에서 어떤 할인 방식인지 구분 가능

### 4.2 토스트 라이브러리
프로젝트에 토스트 라이브러리가 없다면 `react-hot-toast` 또는 `sonner` 도입 검토

## 5. 다음 단계
이 계획이 승인되면 즉시 단계 1부터 구현을 시작하겠습니다.
