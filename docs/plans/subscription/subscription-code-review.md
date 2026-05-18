# Subscription 모듈 코드 리뷰

Vercel React Best Practices 기반 코드 리뷰 (2026-02-11)

---

## 대상 파일 (15개)

| 경로 | 역할 |
|------|------|
| `src/app/(sub)/subscription/page.tsx` | 목록 페이지 (Server Component) |
| `src/app/(sub)/subscription/[id]/page.tsx` | 상세 페이지 (Server Component) |
| `src/app/(sub)/subscription/[id]/header/page.tsx` | 헤더 수정 (Server Component) |
| `src/app/(sub)/subscription/[id]/pricing/create/page.tsx` | 가격 생성 (Client Component) |
| `src/app/(sub)/subscription/[id]/pricing/[pricingId]/edit/page.tsx` | 가격 수정 (Client Component) |
| `src/components/subscription/Plans.tsx` | 목록 컨테이너 |
| `src/components/subscription/PlansList.tsx` | AG Grid 목록 |
| `src/components/subscription/PlansSearch.tsx` | 검색 필터 |
| `src/components/subscription/PlansComparisonPop.tsx` | 비교 팝업 |
| `src/components/subscription/detail/PlanDetail.tsx` | 상세 뷰 |
| `src/components/subscription/detail/PlanHeader.tsx` | 헤더 수정 폼 |
| `src/components/subscription/detail/PlanPricingForm.tsx` | 가격 폼 (생성/수정) |
| `src/components/subscription/detail/PlanPricingList.tsx` | 가격 목록 |
| `src/hooks/queries/use-plans-queries.ts` | TanStack Query 훅 |
| `src/types/plans.ts` | 타입 정의 |

---

## 1. CRITICAL - Bundle Size Optimization

### 1-1. ~~PlansComparisonPop 동적 임포트~~ (`bundle-dynamic-imports`) - DONE

**파일**: `PlansList.tsx:6-10`

~~`PlansComparisonPop`은 "요금제 비교" 버튼을 클릭할 때만 필요하지만, `PlansList`에 직접 import 되어 항상 번들에 포함됩니다.~~

`next/dynamic`으로 전환 완료.

```tsx
import dynamic from 'next/dynamic'

const PlansComparisonPop = dynamic(
    () => import('@/components/subscription/PlansComparisonPop'),
    { ssr: false }
)
```

**영향**: 비교 팝업 컴포넌트 + `useQueries` 로직이 초기 번들에서 제외됨

### 1-2. react-animate-height 동적 임포트 고려 (`bundle-conditional`) - SKIP

**파일**: `PlansSearch.tsx:3`, `PlanDetail.tsx:8`, `PlanHeader.tsx:5`

여러 컴포넌트에서 사용되므로 동적 임포트의 효과가 제한적.

**적용하지 않음**: 코드 스플리팅 효과 대비 변경 범위가 크고, 실질적 번들 감소 미미

---

## 2. HIGH - 데이터 페칭 패턴

### 2-1. ~~Client Component 페이지의 데이터 워터폴~~ (`async-suspense-boundaries`) - DONE

**파일**: `pricing/create/page.tsx`, `pricing/[pricingId]/edit/page.tsx`

~~이 페이지들은 `'use client'`로 선언되어 있어, 클라이언트에서 렌더링된 후 `usePlanDetail`로 데이터를 fetch합니다.~~

Server Component로 전환 완료. 데이터 페칭 로직은 클라이언트 컴포넌트로 분리.

- `pricing/create/page.tsx` → Server Component (`await params`)
- `pricing/[pricingId]/edit/page.tsx` → Server Component (`await params`)
- `PlanPricingCreate.tsx` — 생성 시 데이터 페칭 + 폼 렌더링 (Client Component)
- `PlanPricingEdit.tsx` — 수정 시 데이터 페칭 + pricing 조회 + 폼 렌더링 (Client Component)

기존 `[id]/page.tsx`, `[id]/header/page.tsx`와 동일한 패턴으로 통일됨.

### 2-2. useQueries 병렬 조회 - 좋은 패턴

**파일**: `use-plans-queries.ts:24-37`

`usePlansComparison`에서 `useQueries`를 사용하여 병렬 조회하는 것은 `async-parallel` 규칙을 잘 따르고 있습니다.

---

## 3. MEDIUM - Re-render 최적화

### 3-1. ~~columnDefs 매 렌더마다 재생성~~ (`rendering-hoist-jsx`) - DONE

**PlansList.tsx**: `COLUMN_DEFS`, `ROW_CLASS_RULES`를 컴포넌트 외부 상수로 호이스팅. `console.log` 제거.

**PlanPricingList.tsx**: `getStatus`를 컴포넌트 외부로 호이스팅, `handleDelete`를 `useCallback`으로 감싸고, `columnDefs`를 `useMemo`로 메모이제이션.

### 3-2. ~~PlansSearch 상태 중복~~ (`rerender-derived-state-no-effect`) - DONE

**파일**: `PlansSearch.tsx:45-51`

~~`filters` props와 로컬 `updater`, `planType` state가 중복됩니다. 부모의 `filters`가 변경되면 로컬 상태와 불일치가 발생할 수 있습니다.~~

렌더 중 상태 동기화 패턴 적용 완료. `useEffect` 없이 이전 props를 비교하여 로컬 상태를 동기화.

```tsx
const [prevFilters, setPrevFilters] = useState(filters)
if (prevFilters !== filters) {
    setPrevFilters(filters)
    setUpdater(filters.updater ?? '')
    setPlanType(filters.planType ?? '')
}
```

### 3-3. ~~PlanPricingForm 과도한 useState~~ (`rerender-lazy-state-init`) - DONE

**파일**: `PlanPricingForm.tsx:88-104`

~~약 20개의 `useState` 호출이 있습니다. 관련 상태를 그룹핑하면 관리가 용이합니다.~~

`PeriodPricing` 인터페이스를 도입하여 6개월/12개월 요금 상태를 각각 하나의 그룹 state로 통합 완료. `useState(() => ...)` lazy init 패턴 적용. useState 10개 → 2개로 감소.

```tsx
interface PeriodPricing {
    price: number | undefined
    discountEnabled: boolean
    discountType: 'rate' | 'amount'
    discountValue: number | undefined
    discountResult: { totalPrice: number; discountAmount: number; finalPrice: number } | null
}

const [sixMonth, setSixMonth] = useState<PeriodPricing>(() => ({ ... }))
const [twelveMonth, setTwelveMonth] = useState<PeriodPricing>(() => ({ ... }))
```

### 3-4. ~~인라인 콜백 안정화~~ (`rerender-functional-setstate`) - DONE

**파일**: `PlanPricingForm.tsx:284-312`

~~RangeDatePicker의 `onChange`에 복잡한 인라인 함수가 전달되어 매 렌더마다 새 참조가 생성됩니다.~~

`handleDateRangeChange`를 `useCallback`으로 추출 완료. `handleDuplicateCheck`도 `useCallback`으로 감싸서 안정적인 의존성 체인 구성.

```tsx
const handleDuplicateCheck = useCallback(async (...) => { ... }, [checkDuplicate, planId, mode, pricingId, fromDate, toDate, errors.dateCheck])
const handleDateRangeChange = useCallback((range: DateRange) => { ... }, [isInProgress, fromDate, handleDuplicateCheck])
```

---

## 4. MEDIUM - 렌더링 품질

### 4-1. ~~console.log 제거~~ - DONE

**파일**: `PlansComparisonPop.tsx:30`, `PlansList.tsx:24`

~~프로덕션 코드에 `console.log`가 남아있습니다.~~

`PlansList.tsx`는 3-1에서 이미 제거됨. `PlansComparisonPop.tsx:30`의 `console.log(detailQueries)` 제거 완료.

### 4-2. ~~조건부 렌더링 안전성~~ (`rendering-conditional-render`) - DONE

**파일**: `PlansComparisonPop.tsx:153`

~~`&&` 연산자를 사용한 조건부 렌더링~~ → ternary (`? :`)로 변경 완료.

### 4-3. ~~빈 로딩 상태~~ (`PlansList.tsx:71`) - DONE

~~빈 `<div>`는 사용자에게 아무 피드백을 주지 않습니다.~~ → "로딩중입니다" 문구 표시로 변경 완료.

---

## 5. LOW-MEDIUM - JavaScript 성능

### 5-1. ~~filter + map 결합~~ (`js-combine-iterations`) - DONE

**파일**: `PlanDetail.tsx:101-104`

~~filter + map (2회 순회)~~ → `reduce`로 1회 순회로 결합 완료.

### 5-2. Map 활용 - 좋은 패턴 (`js-index-maps`)

**파일**: `PlansComparisonPop.tsx:33-49`

`planDetailMap`, `planListMap`에서 `Map`을 사용하여 O(1) 룩업을 구현한 것은 `js-index-maps` 규칙을 잘 따르고 있습니다.

---

## 6. 타입 안전성

### 6-1. ~~PlanPricing 타입 nullable 필드 누락~~ - DONE

**파일**: `types/plans.ts:43-59`

~~`CreatePlanPricingRequest`에서는 `number | null`로 선언하면서, 응답 타입인 `PlanPricing`에서는 `number`만 선언되어 있어 런타임 에러 가능성이 있었습니다.~~

`PlanPricing` 인터페이스의 nullable 필드 8개를 `number` → `number | null`로 수정 완료. `CreatePlanPricingRequest` / `CreatePlanPricingResponse`와 타입 일관성 확보.

```typescript
export interface PlanPricing {
    sixMonthPrice: number | null
    sixMonthDiscountRate: number | null
    sixMonthDiscountPrice: number | null
    sixMonthDiscount: number | null
    yearlyPrice: number | null
    yearlyDiscountRate: number | null
    yearlyDiscountPrice: number | null
    yearlyDiscount: number | null
}
```

---

## 7. 잘 된 점

| 항목 | 파일 | 규칙 |
|------|------|------|
| `useQueries` 병렬 조회 | `use-plans-queries.ts` | `async-parallel` |
| Map을 활용한 O(1) 룩업 | `PlansComparisonPop.tsx` | `js-index-maps` |
| BREADCRUMBS 상수 호이스팅 | 전체 | `rendering-hoist-jsx` |
| `useState(() => ...)` lazy init | `PlanHeader.tsx` | `rerender-lazy-state-init` |
| Server Component 페이지 분리 | `page.tsx` 파일들 | `server-serialization` |
| `useMemo`로 rowClassRules 안정화 | `PlansList.tsx` | `rerender-memo` |
| TanStack Query 캐시 무효화 전략 | `use-plans-queries.ts` | `client-swr-dedup` |
| defaultListParams 상수 호이스팅 | `Plans.tsx` | `rerender-memo-with-default-value` |

---

## 우선순위 요약

| 우선순위 | 항목 | 영향도 | 난이도 |
|----------|------|--------|--------|
| ~~1~~ | ~~console.log 제거~~ | ~~낮음~~ | DONE |
| ~~2~~ | ~~PlansComparisonPop dynamic import~~ | ~~번들 크기 감소~~ | DONE |
| ~~3~~ | ~~PlanPricing 타입 nullable 수정~~ | ~~런타임 안전성~~ | DONE |
| ~~4~~ | ~~columnDefs 호이스팅/메모이제이션~~ | ~~AG Grid 재계산 방지~~ | DONE |
| ~~5~~ | ~~빈 로딩 상태 개선~~ | ~~UX~~ | DONE |
| ~~6~~ | ~~PlanPricingForm 상태 그룹핑~~ | ~~유지보수성~~ | DONE |
| ~~7~~ | ~~Pricing 페이지 Server Component 전환~~ | ~~초기 로딩 개선~~ | DONE |
