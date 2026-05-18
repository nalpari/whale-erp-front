# 휴일 관리 검색 필터 권한별 본사 자동선택 활성화

## 개요

- **목표**: `system/holiday` 검색 필터(`HolidaySearch`)의 `HeadOfficeFranchiseStoreSelect`에서 `autoSelect={false}` 비활성화를 제거하여 다른 검색 필터들과 일관된 권한 기반 자동선택을 적용한다.
- **대상 파일**:
  - `src/components/system/holiday/HolidaySearch.tsx`
- **브랜치**: `feature/role-based-form-display`
- **작성일**: 2026-04-30

## 배경

- `HolidaySearch`는 이미 표준 컴포넌트 `HeadOfficeFranchiseStoreSelect`를 사용 중이지만 `autoSelect={false}` 로 명시적으로 자동선택을 비활성화
- 다른 검색 필터들(`CommonCodeSearch`, `StoreMenuSearch`, `PromotionSearch`, `BpMasterSearch`, `AttendanceSearch` 등)은 `autoSelect` 프롭 미지정(=기본값 true)으로 자동선택이 정상 작동
- 결과: HEAD_OFFICE/FRANCHISE 사용자가 본인 본사/가맹점만 보이는데도 매번 수동 선택해야 하는 불편

## 정책 (다른 검색 필터와 동일)

`HeadOfficeFranchiseStoreSelect`의 표준 자동선택 정책 그대로 적용:
- HEAD_OFFICE → 본사 자동선택 + 잠금
- FRANCHISE → 본사+가맹점 자동선택 + 잠금
- PLATFORM + `defaultHeadOfficeId` 매핑 → 매핑 본사 자동선택 + 잠금
- PLATFORM + 단일 본사 폴백 → 본사 자동선택 (잠금 없음)
- PLATFORM + 다중 본사 (슈퍼 어드민) → 자동선택 없음 (전역 검색 가능)

## 구현

### 변경 (1줄 제거)

**파일**: `src/components/system/holiday/HolidaySearch.tsx` 라인 130

**기존**:
```tsx
<HeadOfficeFranchiseStoreSelect
  isHeadOfficeRequired={false}
  autoSelect={false}
  officeId={filters.officeId ?? null}
  ...
/>
```

**변경**:
```tsx
<HeadOfficeFranchiseStoreSelect
  isHeadOfficeRequired={false}
  officeId={filters.officeId ?? null}
  ...
/>
```

→ `autoSelect` prop 제거 (기본값 `true` 사용).

## 영향 범위

| 항목 | 변경 |
|------|------|
| `HolidaySearch.tsx` | `autoSelect={false}` 1줄 제거 |
| 다른 파일 | 변경 없음 |
| HEAD_OFFICE/FRANCHISE 사용자 | 본인 본사/가맹점 자동선택 + 잠금 적용됨 |
| PLATFORM 사용자 | 매핑 본사 또는 단일 본사 시 자동선택, 다중 본사 시 변화 없음 |
| 검색 동작 | year(필수) 외 본사/가맹점/점포는 선택적 필터 — 자동선택돼도 검색 자체에 영향 없음 |

## 검증

- `pnpm lint` — 0 errors, 신규 경고 없음
- `pnpm build` — 성공

## 후속 보강 (2026-04-30)

### 문제

`autoSelect={false}` 제거만으로는 다음 흐름이 발생:

1. 페이지 로드 → `appliedFilters = { year: currentYear, officeId: null, ... }`
2. `canFetchList = !!appliedFilters.year` → true → **즉시 1차 fetch (전역 검색)**
3. `bpTree` 로드 완료 → `HeadOfficeFranchiseStoreSelect` 자동선택 → `filters.officeId`만 갱신
4. 사용자가 "검색" 버튼 클릭 → `appliedFilters` 갱신 → 2차 fetch

→ HEAD_OFFICE/FRANCHISE 사용자도 자동선택 적용 *전*에 한 번 전역 검색이 실행되는 문제.

### 보강 방향 (옵션 2)

`HolidayInfo`에서 자동선택 발동 가능성을 미리 판단해서, **자동선택 사용자라면 `bpTree` 로드 + officeId 세팅 후에야 첫 fetch**.

### 변경 (`HolidayInfo.tsx`)

1. `useBpHeadOfficeTree`, `useAuthStore`, `OWNER_CODE` import 추가
2. 자동선택 발동 가능성(`willAutoSelect`) 판단
3. `canFetchList`에 가드 추가 — 자동선택 사용자는 `officeId`가 채워질 때까지 대기

```tsx
const { data: bpTree = [], isPending: bpLoading } = useBpHeadOfficeTree()
const ownerCode = useAuthStore((s) => s.ownerCode)
const defaultHeadOfficeId = useAuthStore((s) => s.defaultHeadOfficeId)

const isPlatformAdmin = ownerCode === OWNER_CODE.PLATFORM
const platformHasDefault = isPlatformAdmin
  && defaultHeadOfficeId != null
  && bpTree.some((o) => o.id === defaultHeadOfficeId)
const willAutoSelect =
  ownerCode === OWNER_CODE.HEAD_OFFICE
  || ownerCode === OWNER_CODE.FRANCHISE
  || bpTree.length === 1
  || platformHasDefault

const canFetchList = !!appliedFilters.year && !bpLoading && (
  !willAutoSelect || appliedFilters.officeId != null
)
```

> `appliedFilters.officeId`가 채워지려면 `HeadOfficeFranchiseStoreSelect`의 자동선택 후 부모로 onChange가 전파되어야 함. `HolidaySearch`의 `onChange` → `handleFilterChange`는 `filters`만 갱신하므로 `appliedFilters`도 반영하기 위해 `onAutoSelect` prop 추가 필요.

### 추가 변경 (`HolidaySearch.tsx`)

`HeadOfficeFranchiseStoreSelect`의 `onAutoSelect` prop 전파:

```tsx
interface HolidaySearchProps {
  ...
  onAutoSelect?: (value: { head_office: number | null; franchise: number | null; store: number | null }) => void
}

<HeadOfficeFranchiseStoreSelect
  ...
  onAutoSelect={onAutoSelect}
/>
```

### `HolidayInfo`의 onAutoSelect 핸들러

```tsx
const handleAutoSelect = (value: { head_office: number | null; franchise: number | null; store: number | null }) => {
  const next: HolidaySearchFilters = {
    ...filters,
    officeId: value.head_office,
    franchiseId: value.franchise,
    storeId: value.store ?? filters.storeId,
  }
  setFilters(next)
  setAppliedFilters(next)
  setPage(0)
}
```

### 동작 시나리오

| 사용자 | 흐름 |
|--------|------|
| HEAD_OFFICE | bpLoading=true → fetch 대기 → 자동선택 → onAutoSelect → appliedFilters 갱신 → 1차 fetch (정확) |
| FRANCHISE | 동일 |
| PLATFORM + 매핑 | 동일 |
| PLATFORM + 단일 본사 | 동일 |
| PLATFORM + 다중 본사 | willAutoSelect=false → 즉시 fetch (현재처럼 전역) |

## Boston Code Review HIGH #2 처리 (2026-05-04)

PR #96 nalpari 리뷰 코멘트의 🟠 HIGH #2: "PLATFORM+매핑 사용자 첫 렌더에서 1차 무필터 fetch 발생".

### 문제

기존 `canFetchList` 로직:

```ts
const canFetchList = !!appliedFilters.year && (
  !willAutoSelect
    ? true                                              // 자동선택 미발동: 즉시 fetch
    : !bpLoading && appliedFilters.officeId != null     // 자동선택 발동: 로드 완료 + officeId 세팅 후
)
```

`willAutoSelect`는 `bpTree.length === 1 || platformHasDefault`에 의존하지만, 둘 다 bpTree 로드 완료 전에는 false.
- HEAD_OFFICE/FRANCHISE 사용자는 ownerCode 기반이라 첫 렌더부터 willAutoSelect=true ✅
- **PLATFORM + 매핑 사용자** / **단일 본사 fallback 사용자**의 첫 렌더에서는 bpTree 미로드 상태라 willAutoSelect=false → `canFetchList=true` 분기 진입 → **officeId 없이 1차 fetch** → bpTree 로드 후 자동선택 적용되어 2차 fetch
- 결과: 무필터 1차 결과로 잠깐 오염된 화면 노출

### 수정 방향

`!bpLoading` 가드를 자동선택 사용자 여부와 무관하게 외부로 끌어올림:

```ts
const canFetchList = !!appliedFilters.year && !bpLoading && (
  !willAutoSelect || appliedFilters.officeId != null
)
```

- bpTree 로드 완료까지 대기 → 모든 사용자 케이스에서 willAutoSelect 평가가 정확해짐
- HEAD_OFFICE/FRANCHISE 사용자는 첫 렌더부터 willAutoSelect=true → bpTree 로드 후 officeId 세팅 시점에 fetch (현재와 동일)
- PLATFORM + 매핑/단일 본사 사용자는 bpTree 로드 후 willAutoSelect=true가 되어 동일 흐름
- PLATFORM + 다중 본사(미매핑) 사용자는 bpTree 로드 후 willAutoSelect=false → 즉시 fetch (현재처럼 전역)

### 트레이드오프

- bpTree 로드가 미완료인 매우 짧은 시간 동안 모든 사용자가 fetch 대기 → 미세한 추가 지연
- 단점보다 무필터 1차 fetch로 인한 화면 오염이 더 큰 문제라 채택
