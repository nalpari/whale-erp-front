# 요금제 헤더 수정(저장) API 구현 계획

> **작성일**: 2026-01-30  
> **목표**: 요금제 헤더 정보(점포 수, 직원 수, 포함 기능)를 서버에 저장하고 데이터 정합성을 유지한다.

---

## 1. 개요

- **기능**: 사용자가 수정한 요금제 헤더 정보를 저장한다.
- **방식**: `TanStack Query`의 `useMutation`을 사용.
- **후처리**:
  - 저장 성공 시 `invalidateQueries`를 통해 상세 데이터 캐시를 무효화하여, 상세 페이지로 복귀했을 때 최신 데이터를 자동으로 불러오도록 한다.
  - 사용자에게 성공/실패 피드백(Toast 등)을 제공한다.

---

## 2. API 명세 및 데이터 구조

### Request Body (`UpdatePlanHeaderRequest`)

기존 `PlanDetailResponse`의 구조를 참고하여 수정 요청에 필요한 데이터 구조를 정의합니다.
(사용자가 수정한 `PlanFeature`의 `id` 필드명 변경 사항 반영)

```typescript
export interface UpdatePlanHeaderRequest {
    storeLimit: number | null;      // 점포 수 제한 (null: 제한없음)
    employeeLimit: number | null;   // 직원 수 제한 (null: 제한없음)
    features: {
        id: number;                 // 기능 ID
        enabled: boolean;           // 활성화 여부
    }[];
}
```

### API Endpoint

- **Method**: `PUT` (또는 `PATCH`)
- **URL**: `/api/v1/subscription/plans/{planId}`
- **설명**: 해당 요금제의 헤더 정보를 수정합니다.

---

## 3. 구현 단계

### Step 1: 타입 정의 (`src/types/plans.ts`)

- `UpdatePlanHeaderRequest` 인터페이스 추가
- `features` 배열 내부 객체 타입 정의

### Step 2: Mutation Hook 구현 (`src/hooks/queries/use-plans-queries.ts`)

- **Hook 이름**: `useUpdatePlanHeader`
- **기능**:
  - `api.put`을 사용하여 서버에 데이터 전송
  - **`onSuccess`**:
    - `queryClient.invalidateQueries` 호출로 `['plans', 'detail', id]` 키 무효화
    - (선택) 성공 Toast 메시지 출력
  - **`onError`**:
    - 실패 Toast 메시지 출력

```typescript
export const useUpdatePlanHeader = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePlanHeaderRequest }) => 
            api.put(`/api/v1/subscription/plans/${id}`, data),
        onSuccess: (_, { id }) => {
            // 캐시 무효화 -> 상세 페이지 진입 시 자동 갱신
            queryClient.invalidateQueries({ queryKey: plansKeys.detail(id) });
        }
    });
}
```

### Step 3: 컴포넌트 연동 (`src/components/subscription/detail/PlanHeader.tsx`)

- `useUpdatePlanHeader` 훅 import 및 사용
- `handleSave` 함수 수정:
  1. `features` 배열에서 필요한 정보(`id`, `enabled`)만 추출하여 payload 구성
  2. `mutate` 함수 호출
  3. `onSuccess` 콜백에서 `router.push`로 페이지 이동 (Mutation 내부가 아닌 컴포넌트 레벨에서 이동 처리 권장, 또는 Mutation onSuccess에서 처리)
- 저장 중(`isPending`)일 때 버튼 비활성화 처리 (중복 클릭 방지)

---

## 4. 체크리스트

- [ ] **Step 1**: `src/types/plans.ts`에 Request 타입 정의
- [ ] **Step 2**: `src/hooks/queries/use-plans-queries.ts`에 `useUpdatePlanHeader` 구현
- [ ] **Step 3**: `src/components/subscription/detail/PlanHeader.tsx`에 저장 로직 연결
- [ ] **테스트**:
  - 저장 요청 시 Payload가 올바른지 확인 (Network 탭)
  - 성공 시 상세 페이지로 이동하며 데이터가 갱신되는지 확인
  - 실패 시 에러 메시지가 표시되는지 확인
