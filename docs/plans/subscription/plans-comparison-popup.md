# ERP 요금제 비교 팝업 구현 계획

## 개요
PlansList 페이지에서 "요금제 비교" 버튼 클릭 시, 모든 요금제의 기능을 비교하는 모달 팝업을 표시합니다.

## 참고 자료
- **UI 참고**: `whale-erp-pub/src/components/popup/ComparisonPop.tsx`
- **기존 CSS**: `src/styles/components/_pop-contents.scss` - `.comparison-table`, `.comparison-btn`, `.comparison-check` 클래스 이미 존재
- **팝업 패턴**: `SalaryCalculationPop.tsx` - `isOpen/onClose` props 패턴

## 데이터 소스

### 테이블 컬럼 (요금제 타입) — 공통코드
- **`useCommonCodeHierarchy('PLNTYP')`** → `CommonCodeNode[]`
- 각 노드: `{ id, code, name, ... }` (예: FREE, STANDARD, ENTERPRISE, FRANCHISE)
- 이 목록이 비교 테이블의 **컬럼 헤더**가 됨

### 기능 목록 (행) — 공통코드
- **`useCommonCode('PLANFT')`** → `CommonCodeNode[]`
- 각 노드: `{ code, name, ... }` (예: 점포관리, 직원관리, ...)
- 이 목록이 비교 테이블의 **기능 행 라벨**이 됨

### 요금제별 상세 데이터 — API 조회
- **`usePlanDetail(planId)`** → `PlanDetailResponse`
- `storeLimit`, `employeeLimit`: 점포/직원 제한
- `features[]`: `{ featureCode, featureName, enabled }` — 기능 활성화 여부
- PlansListItem에서 `planId`와 `planTypeCode`로 공통코드 매칭

### 비교 테이블 구조

```
         | 요금제명 (PLNTYP)
         | FREE     | STANDARD | ENTERPRISE | FRANCHISE
─────────┼──────────┼──────────┼────────────┼──────────
수정버튼 | [수정]   | [수정]   | [수정]     | [수정]
점포     | 1        |          | 25         | 25
직원     | 1        |          | 제한없음   | 제한없음
기능     | 8        |          | 20         | 20
─────────┼──────────┼──────────┼────────────┼──────────  (PLANFT 기능 목록)
점포관리 | ✓        |          | ✓          | ✓
직원관리 | ✓        |          | ✓          | ✓
...      | ...      |          | ...        | ...
```

## 구현 계획

### Step 1: 비교 데이터 조회 훅 추가
**파일**: `src/hooks/queries/use-plans-queries.ts`

- `usePlansComparison()` 훅 추가
- `useQueries`를 사용하여 모든 요금제의 상세 정보를 병렬 조회
- PlansListItem의 `planId` 목록으로 각 plan 상세 호출

```typescript
import { useQueries } from '@tanstack/react-query'

// 비교 팝업에서 사용할 전체 요금제 상세 병렬 조회
export const usePlansComparison = (planIds: number[], enabled = true) => {
    return useQueries({
        queries: planIds.map(id => ({
            queryKey: plansKeys.detail(id),
            queryFn: async () => {
                const response = await api.get<ApiResponse<PlanDetailResponse>>(
                    `/api/v1/subscription/plans/${id}`
                )
                return response.data.data
            },
            enabled: enabled && id > 0,
        })),
    })
}
```

### Step 2: 비교 팝업 컴포넌트 생성
**파일**: `src/components/subscription/PlansComparisonPop.tsx`

**Props**:
```typescript
interface PlansComparisonPopProps {
    isOpen: boolean
    onClose: () => void
    plans: PlansListItem[]  // 목록 데이터에서 전달 (planId, planTypeCode 매핑용)
}
```

**데이터 조회**:
```typescript
// 컬럼 헤더: 요금제 타입 공통코드
const { children: planTypes, loading: planTypesLoading } = useCommonCode('PLNTYP')

// 기능 목록 행: 기능 공통코드
const { children: planFeatures, loading: planFeaturesLoading } = useCommonCode('PLANFT')

// 각 요금제 상세: 병렬 조회
const detailQueries = usePlansComparison(
    plans.map(p => p.planId),
    isOpen
)
```

**비교 테이블 데이터 구성 로직**:
1. `PLNTYP` 공통코드 → 컬럼 순서 결정 (sortOrder 또는 코드 순)
2. 각 planType.code와 PlansListItem.planTypeCode를 매칭 → 해당 plan의 상세 데이터 연결
3. `PLANFT` 공통코드 → 기능 행 순서 결정
4. 각 feature.code와 PlanDetailResponse.features[].featureCode를 매칭 → enabled 여부 확인

```typescript
// planTypeCode로 상세 데이터 매핑
const planDetailMap = useMemo(() => {
    const map = new Map<string, PlanDetailResponse>()
    plans.forEach((plan, idx) => {
        const detail = detailQueries[idx]?.data
        if (detail) map.set(plan.planTypeCode, detail)
    })
    return map
}, [plans, detailQueries])
```

**렌더링**:
- pub의 `ComparisonPop.tsx` 마크업 구조 참고
- CSS 클래스: `modal-popup`, `modal-dialog large`, `comparison-table`, `comparison-btn`, `comparison-check`
- **thead**:
  - 1행: "요금제명" + planTypes 각 name
  - 2행: 빈 th + planTypes 각 "수정" 버튼
- **tbody**:
  - data 행: 점포/직원/기능 수 (PlansListItem 또는 PlanDetailResponse에서)
  - 기능 행: PLANFT 순서대로, 각 plan의 enabled 여부에 따라 체크 아이콘 표시
- 수정 버튼 클릭 → `router.push('/subscription/${planId}/header')`

### Step 3: PlansList에서 팝업 연결
**파일**: `src/components/subscription/PlansList.tsx`

- `useState`로 `isComparisonOpen` 상태 추가
- "요금제 비교" 버튼에 `onClick` 핸들러 연결
- `PlansComparisonPop` 컴포넌트 렌더링

```diff
+ const [isComparisonOpen, setIsComparisonOpen] = useState(false)

  <button className="btn-form basic" type="button"
+   onClick={() => setIsComparisonOpen(true)}
  >요금제 비교</button>

+ <PlansComparisonPop
+     isOpen={isComparisonOpen}
+     onClose={() => setIsComparisonOpen(false)}
+     plans={rows}
+ />
```

## 파일 변경 요약

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/hooks/queries/use-plans-queries.ts` | 수정 | `usePlansComparison` 훅 추가 |
| `src/components/subscription/PlansComparisonPop.tsx` | **신규** | 비교 팝업 컴포넌트 |
| `src/components/subscription/PlansList.tsx` | 수정 | 팝업 상태 관리 및 연결 |

## 주의사항
- 기존 CSS/Sass 파일은 수정하지 않음 (CLAUDE.md 규칙)
- `comparison-table`, `comparison-btn`, `comparison-check` 클래스는 이미 존재하므로 그대로 사용
- 로딩 상태 처리: 공통코드 + 상세 데이터 조회 완료 전까지 로딩 표시
- 데이터가 없는 요금제(아직 상세 정보 미등록)도 빈 컬럼으로 표시
- `useCommonCode`는 `src/hooks/useCommonCode.ts`에서 import (기존 PlanHeader.tsx와 동일 패턴)
