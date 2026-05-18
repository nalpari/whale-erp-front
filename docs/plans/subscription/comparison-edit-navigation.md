# PlansComparisonPop 수정 버튼 네비게이션 변경

## 문제

`PlansComparisonPop`의 수정 버튼 클릭 시 `plan.planId`를 사용하여 라우팅하고 있음.

```tsx
// 현재 (PlansComparisonPop.tsx:58)
router.push(`/subscription/${plan.planId}/header`)
```

구독 상세 라우트(`/subscription/[id]`)는 `planTypeId`를 기준으로 동작하므로, `planId`가 아닌 `planTypeId`를 사용해야 함.

## 영향 범위

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/subscription/PlansComparisonPop.tsx` | `handleEdit` 함수의 라우팅 경로 수정 |

## 변경 사항

### PlansComparisonPop.tsx - `handleEdit` 함수 (Line 55~61)

**Before:**
```tsx
const handleEdit = (planTypeCode: string) => {
    const plan = planListMap.get(planTypeCode)
    if (plan) {
        router.push(`/subscription/${plan.planId}/header`)
        onClose()
    }
}
```

**After:**
```tsx
const handleEdit = (planTypeCode: string) => {
    const plan = planListMap.get(planTypeCode)
    if (plan) {
        router.push(`/subscription/${plan.planTypeId}/header`)
        onClose()
    }
}
```

## 근거

- `PlansListItem` 타입에 `planTypeId` 필드가 존재 (`src/types/plans.ts:4`)
- 구독 상세 페이지(`/subscription/[id]`)는 `planTypeId`를 URL 파라미터로 사용
- `PlanDetail` 컴포넌트는 `usePlanDetail(planTypeId)`로 조회
- 기존 `planId` 사용 시 잘못된 상세 페이지로 이동될 수 있음
