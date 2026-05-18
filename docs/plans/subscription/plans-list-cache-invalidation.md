# PlanHeader 수정 후 PlansList 데이터 갱신 계획

## 문제

PlanHeader에서 요금제 헤더를 수정하면 `PlansList` 목록 데이터가 갱신되지 않음.

## 원인

`useUpdatePlanHeader` 훅의 `onSuccess`에서 `plansKeys.detail(id)`만 무효화하고 있어서, 목록 쿼리 캐시(`plansKeys.lists()`)는 그대로 남아있음.

```typescript
// 현재 코드 (use-plans-queries.ts:49-51)
onSuccess: (_, { id }) => {
    queryClient.invalidateQueries({ queryKey: plansKeys.detail(id) })
}
```

## 해결 방법

`onSuccess`에서 목록 캐시도 함께 무효화.

```typescript
// 수정 후
onSuccess: (_, { id }) => {
    queryClient.invalidateQueries({ queryKey: plansKeys.detail(id) })
    queryClient.invalidateQueries({ queryKey: plansKeys.lists() })
}
```

`plansKeys.lists()`는 모든 목록 쿼리의 상위 키이므로, 파라미터에 관계없이 목록 캐시가 모두 무효화됨.

## 변경 대상

- `src/hooks/queries/use-plans-queries.ts` — `useUpdatePlanHeader`의 `onSuccess`에 1줄 추가

## 참고

동일한 패턴으로 가격 정책 CRUD(`useCreatePlanPricing`, `useUpdatePlanPricing`, `useDeletePlanPricing`)도 목록 캐시를 무효화하면 좋지만, 현재 목록에 표시되는 가격 정보(monthlyPrice 등)가 pricings에서 오므로 필요하다면 추가 가능.
