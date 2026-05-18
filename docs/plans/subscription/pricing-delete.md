# Plan Pricing 삭제 기능 추가 계획

## 현재 상태 분석

### 이미 구현된 것
- `useDeletePlanPricing` 훅 (`use-plans-queries.ts:132-143`) — DELETE API 호출 및 캐시 무효화
- `PlanPricingList.tsx` — AG Grid 목록에서 "대기" 상태 항목에 삭제 버튼 존재

### 요구사항
- 상세 페이지(PlanPricingList)의 삭제 버튼이 실제 API response 구조에 맞게 동작하도록 수정

---

## 변경 대상 파일

### 1. `src/hooks/queries/use-plans-queries.ts` — useDeletePlanPricing 훅 수정

**이유**: 현재 DELETE 응답을 무시하고 있는데, 실제 API response 구조에 맞게 타입을 맞춰야 함

**변경 내용**:
- response 구조를 `ApiResponse<PlanPricing[]>`로 타입 지정
- 응답 데이터를 반환하도록 수정 (현재는 `void`)

```typescript
// Before
mutationFn: async ({ planId, pricingId }) => {
    await api.delete(`/api/v1/subscription/plans/${planId}/pricings/${pricingId}`)
}

// After
mutationFn: async ({ planId, pricingId }) => {
    const response = await api.delete<ApiResponse<PlanPricing[]>>(
        `/api/v1/subscription/plans/${planId}/pricings/${pricingId}`
    )
    return response.data.data
}
```

---

## 변경하지 않는 것

- `PlanPricingForm.tsx` — 수정 페이지에서 삭제 기능 추가하지 않음
- `PlanPricingList.tsx` — 이미 목록에서 삭제 기능 동작 중, 변경 불필요
- `src/types/plans.ts` — 기존 타입으로 충분
- 라우트 파일들 — 변경 불필요

---

## 작업 순서

1. `use-plans-queries.ts`의 `useDeletePlanPricing` 훅 response 타입 수정
2. 린트 체크 (`pnpm lint`)
3. 타입 체크 (`pnpm build`)
