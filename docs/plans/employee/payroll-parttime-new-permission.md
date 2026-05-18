# 파트타이머 급여명세서 등록 페이지 권한별 본사/가맹점 자동선택 표준화

## 개요

- **목표**: `employee/payroll/parttime/new` 파트타이머 급여명세서 등록 페이지(`PartTimePayStub`)에서 본사/가맹점 SearchSelect를 권한 기반 표준 정책으로 자동선택 + 잠금한다.
- **대상 파일**:
  - `src/components/employee/payroll/PartTimePayStub.tsx`
- **브랜치**: `feature/role-based-form-display`
- **작성일**: 2026-04-30

## 배경

- 같은 PR에서 표준화한 `BpForm`, `StoreDetail`, `StaffInvitationPop`, `EmployContractEdit`, `FullTimePayStub`와 정책 일관성 부족
- 현재 `useAuthStore`에서 `accessToken`, `affiliationId`만 활용 → 권한별 자동선택/잠금 미적용
- 등록 모드(`isNewMode === true`)에서 사용자가 매번 본사/가맹점을 수동 선택해야 함
- 상세 모드(`isEditMode === false`)는 이미 `<input readOnly>`로 표시 → 영향 없음

## 페이지 특이사항

- state는 `string` 타입 (`selectedHeadquarter`, `selectedFranchise`) — 다른 페이지(number)와 다름. setState 시 `String(...)` 변환 필요
- lazy 초기화로 `existingStatement?.headOfficeId` 사용 (수정 모드 데이터 매핑)
- **`fromWorkTimeEdit` 흐름** — 근무시간 편집 후 sessionStorage에서 `selectedHeadquarter`/`selectedFranchise` 복원 (라인 304~318) → 자동선택과 충돌하지 않게 가드 필요
- **"파트타이머 소속" 라디오** — `state 미연결` 죽은 UI. 본 PR에서 변경하지 않음 (옵션 A)
- 본사 변경 시 가맹점/점포/직원/기간 모두 리셋 (라인 1387~1394)

## 표준 정책 (이미 정착된 정책 재사용)

`HeadOfficeFranchiseStoreSelect` + `BpForm` + `useStoreDetailForm` + `StaffInvitationPop` + `EmployContractEdit` + `FullTimePayStub`와 동일.

### 자동선택 발동 조건 (`shouldAutoSelectOffice`)

다음 중 하나라도 만족 시 본사 자동선택:
- `ownerCode === HEAD_OFFICE`
- `ownerCode === FRANCHISE`
- `bpTree.length === 1` (단일 본사 폴백)
- `platformHasDefault`: `ownerCode === PLATFORM` AND `defaultHeadOfficeId`가 `bpTree`에 매핑됨

### 가맹점 강제 (`isFranchiseFixed`)

- `ownerCode === FRANCHISE` 일 때만
- 해당 본사의 `franchises.length === 1` 이면 가맹점 자동선택

## 권한별 동작 매트릭스 (목표)

| 권한 | bpTree | 본사 자동선택 | 가맹점 자동선택 | 본사 잠금 | 가맹점 잠금 |
|------|--------|:-------------:|:---------------:|:---------:|:-----------:|
| **HEAD_OFFICE** | 1개 | ✅ | ❌ | ✅ | — |
| **FRANCHISE** | 1개 + 가맹점 1개 | ✅ | ✅ | ✅ | ✅ |
| **FRANCHISE** | 1개 + 가맹점 2+ | ✅ | ❌ | ✅ | (옵션 제한) |
| **PLATFORM** + 매핑 본사 | 매핑 본사 | ✅ | ❌ | ✅ | ❌ |
| **PLATFORM** + 단일 본사 | 1개 | ✅ | ❌ | ❌ | ❌ |
| **PLATFORM** + 다중 본사 (슈퍼 어드민) | 2+ | ❌ | ❌ | ❌ | ❌ |

### 라디오 정책 (옵션 A — 현재 그대로)

- "파트타이머 소속" 라디오는 `state 미연결` 죽은 UI
- 본 PR에서는 변경하지 않음 (별도 후속 작업으로 분리)

### 점포 select 정책

- 별도 잠금 없음 (현재와 동일)
- `useStoreOptions(headOfficeId, franchiseId)`가 본사/가맹점 기준 필터링 → 본인 산하만 응답

## 트리거 정책

**등록 모드(`isNewMode === true`) + `!fromWorkTimeEdit` + bpTree 로드 후 1회 자동선택**.

- `bpAutoApplied` state 가드로 1회만 실행
- 수정 모드 또는 상세 모드 시 미발동
- `fromWorkTimeEdit === true` 케이스에서는 sessionStorage 복원 흐름 우선 → 자동선택 미발동
- 렌더 중 setState 패턴 (`react-hooks/set-state-in-effect` 회피)

## 구현 계획

### 1단계 — import 추가

```tsx
import { OWNER_CODE } from '@/constants/owner-code'
```

### 2단계 — useAuthStore 추가 추출 (라인 147)

**기존**:
```tsx
const { accessToken, affiliationId } = useAuthStore()
```

**변경**:
```tsx
const { accessToken, affiliationId, ownerCode, defaultHeadOfficeId } = useAuthStore()
```

### 3단계 — 표준 정책 변수 (bpTree 선언 직후, 라인 149 근방)

```tsx
const isPlatformAdmin = ownerCode === OWNER_CODE.PLATFORM
const platformHasDefault = isPlatformAdmin
  && defaultHeadOfficeId != null
  && bpTree.some((office) => office.id === defaultHeadOfficeId)
const shouldAutoSelectOffice =
  ownerCode === OWNER_CODE.HEAD_OFFICE
  || ownerCode === OWNER_CODE.FRANCHISE
  || bpTree.length === 1
  || platformHasDefault
const isOfficeFixed = shouldAutoSelectOffice
const isFranchiseFixed = ownerCode === OWNER_CODE.FRANCHISE
```

### 4단계 — 자동선택 로직 (state 변환에 String 사용)

```tsx
const [bpAutoApplied, setBpAutoApplied] = useState(false)
if (
  !bpAutoApplied
  && isNewMode
  && !fromWorkTimeEdit
  && bpTree.length > 0
  && shouldAutoSelectOffice
) {
  setBpAutoApplied(true)
  const targetOffice = platformHasDefault
    ? bpTree.find((o) => o.id === defaultHeadOfficeId) ?? bpTree[0]
    : bpTree[0]

  const autoFranchiseId = isFranchiseFixed && targetOffice.franchises.length === 1
    ? targetOffice.franchises[0].id
    : null

  setSelectedHeadquarter(String(targetOffice.id))
  if (autoFranchiseId !== null) {
    setSelectedFranchise(String(autoFranchiseId))
  }
}
```

### 5단계 — 본사 SearchSelect 잠금 (라인 1383~1397)

```tsx
<SearchSelect
  options={headquarterOptions}
  value={headquarterOptions.find(o => o.value === selectedHeadquarter) || null}
  onChange={(opt) => {
    setSelectedHeadquarter(opt?.value || '')
    setSelectedFranchise('')
    setSelectedStore('')
    setEmployeeInfoId(null)
    setPayrollMonth('')
    setStartDate('')
    setEndDate('')
    setPaymentDate('')
  }}
  placeholder="본사 선택"
  isDisabled={isOfficeFixed}
  isSearchable={!isOfficeFixed}
  isClearable={!isOfficeFixed}
/>
```

### 6단계 — 가맹점 SearchSelect 잠금 (라인 1404~1417)

```tsx
<SearchSelect
  options={franchiseOptions}
  value={franchiseOptions.find(o => o.value === selectedFranchise) || null}
  onChange={(opt) => {
    setSelectedFranchise(opt?.value || '')
    setSelectedStore('')
    setEmployeeInfoId(null)
    setPayrollMonth('')
    setStartDate('')
    setEndDate('')
    setPaymentDate('')
  }}
  placeholder="가맹점 선택"
  isDisabled={isFranchiseFixed && selectedFranchise !== ''}
  isSearchable={!isFranchiseFixed}
  isClearable={!isFranchiseFixed}
/>
```

### 7단계 — 점포 SearchSelect 변경 없음

`useStoreOptions(headOfficeId, franchiseId)` 자동 필터링.

### 8단계 — 라디오 변경 없음

"파트타이머 소속" 라디오는 옵션 A 정책에 따라 현재 그대로 유지.

## 영향 범위

| 항목 | 변경 |
|------|------|
| `PartTimePayStub.tsx` import | `OWNER_CODE` 추가 |
| `useAuthStore` 호출 | `ownerCode`, `defaultHeadOfficeId` 추가 추출 |
| 자동선택 로직 | 렌더 중 setState 패턴 신규 추가 (`bpAutoApplied` 가드, `fromWorkTimeEdit` 가드 포함) |
| 본사/가맹점 SearchSelect | `isDisabled/isSearchable/isClearable` 권한 분기 |
| 점포 SearchSelect | 변경 없음 |
| 파트타이머 소속 라디오 | 변경 없음 (별도 작업) |
| `fromWorkTimeEdit` sessionStorage 복원 흐름 | 변경 없음 (자동선택과 가드로 충돌 회피) |

## React Compiler 규칙

- 렌더 중 setState 패턴 (`react-hooks/set-state-in-effect` 회피)
- `bpAutoApplied` state 가드로 1회만 발동, 무한 루프 방지
- BpForm + useStoreDetailForm + EmployContractEdit + FullTimePayStub와 동일한 패턴 채택

## signup 권한 정책 보류 건과의 관계

현재 일반 가입자는 PLATFORM 권한으로 들어오기 때문에:
- HEAD_OFFICE/FRANCHISE 분기는 즉시 효과 없음
- `PLATFORM + defaultHeadOfficeId` 매핑 케이스만 즉시 활성화
- signup 권한 정책 정상화되면 자연스럽게 모든 분기 활성화

## 후속 작업 (본 PR 제외)

- "파트타이머 소속" 라디오 의도 정리 (state 연결 또는 UI 제거)

## 검증

- `pnpm lint` — 0 errors, 신규 경고 없음 ✅ (2026-04-30 확인)
- `pnpm build` — 성공 ✅ (2026-04-30 확인)
- 수동 테스트:
  - PLATFORM 사용자: 등록/상세/수정 모드 정상 동작
  - HEAD_OFFICE 사용자: 등록 시 본사 자동 + 잠금
  - FRANCHISE 사용자: 등록 시 본사+가맹점 자동 + 잠금
  - `fromWorkTimeEdit` 흐름: 자동선택 미발동, sessionStorage 복원 정상

## 구현 완료 (2026-04-30)

- `PartTimePayStub.tsx` 수정 완료
  - `OWNER_CODE` import 추가
  - `useAuthStore`에서 `ownerCode`, `defaultHeadOfficeId` 추가 추출
  - 표준 정책 변수 (`isPlatformAdmin`, `platformHasDefault`, `shouldAutoSelectOffice`, `isOfficeFixed`, `isFranchiseFixed`) 추가
  - `bpAutoApplied` 가드 + `fromWorkTimeEdit` 가드로 렌더 중 1회 자동선택 로직 추가
  - 본사 SearchSelect에 `isDisabled/isSearchable/isClearable` 권한 분기 적용
  - 가맹점 SearchSelect에 `isDisabled/isSearchable/isClearable` 권한 분기 적용
