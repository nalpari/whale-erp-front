# 정직원 급여명세서 등록 페이지 권한별 본사/가맹점 자동선택 표준화

## 개요

- **목표**: `employee/payroll/regular/new` 정직원 급여명세서 등록 페이지(`FullTimePayStub`)에서 본사/가맹점 SearchSelect를 권한 기반 표준 정책으로 자동선택 + 잠금한다.
- **대상 파일**:
  - `src/components/employee/payroll/FullTimePayStub.tsx`
- **브랜치**: `feature/role-based-form-display`
- **작성일**: 2026-04-30

## 배경

- 같은 PR에서 표준화한 `BpForm`, `StoreDetail`, `StaffInvitationPop`, `EmployContractEdit`와 정책 일관성 부족
- 현재 `useAuthStore`에서 `accessToken`, `affiliationId`만 활용 → 권한별 자동선택/잠금 미적용
- 등록 모드(`id === 'new'` + `isEditMode === true`)에서 사용자가 매번 본사/가맹점을 수동 선택해야 함
- 상세 모드(`isEditMode === false`)는 이미 `<input readOnly>`로 표시 → 영향 없음

## 페이지 특이사항

- 직원 소속 라디오 없음 — 본사 + 가맹점 + 점포 + 직원명 select만 존재
- 본사 변경 시 가맹점/점포/직원/payrollData 모두 null로 리셋 (라인 1313~1317)
- 수정 모드에서 `existingPayrollData?.headOfficeId`를 `selectedHeadOfficeId` fallback으로 사용 (라인 191)

## 표준 정책 (이미 정착된 정책 재사용)

`HeadOfficeFranchiseStoreSelect` + `BpForm` + `useStoreDetailForm` + `StaffInvitationPop` + `EmployContractEdit`와 동일.

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

### 점포 select 정책

- 별도 잠금 없음 (현재와 동일)
- `useStoreOptions(headOfficeId, franchiseId)`가 본사/가맹점 기준 필터링 → 본인 산하만 응답
- 사용자가 점포를 직접 선택하여 직원 목록을 좁히는 흐름 유지

## 트리거 정책

**등록 모드(`isNewMode === true`) + bpTree 로드 후 1회 자동선택**.

- `isNewMode = isEditMode && id === 'new'` (이미 코드에 정의됨, 라인 173)
- `bpAutoApplied` state 가드로 1회만 실행
- 수정 모드 또는 상세 모드 시 미발동 (이미 다른 데이터 흐름이 있음)
- 렌더 중 setState 패턴 (`react-hooks/set-state-in-effect` 회피)

## 구현 계획

### 1단계 — import 추가

```tsx
import { OWNER_CODE } from '@/constants/owner-code'
```

### 2단계 — useAuthStore 추가 추출 (라인 182)

**기존**:
```tsx
const { accessToken, affiliationId } = useAuthStore()
```

**변경**:
```tsx
const { accessToken, affiliationId, ownerCode, defaultHeadOfficeId } = useAuthStore()
```

### 3단계 — 표준 정책 변수 (bpTree 선언 직후, 라인 184 근방)

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

### 4단계 — 자동선택 로직 (렌더 중 setState 패턴)

`selectedHeadOfficeId/selectedFranchiseStoreId` 선언 직후:

```tsx
const [bpAutoApplied, setBpAutoApplied] = useState(false)
if (!bpAutoApplied && isNewMode && bpTree.length > 0 && shouldAutoSelectOffice) {
  setBpAutoApplied(true)
  const targetOffice = platformHasDefault
    ? bpTree.find((o) => o.id === defaultHeadOfficeId) ?? bpTree[0]
    : bpTree[0]

  const autoFranchiseId = isFranchiseFixed && targetOffice.franchises.length === 1
    ? targetOffice.franchises[0].id
    : null

  setSelectedHeadOfficeId(targetOffice.id)
  if (autoFranchiseId !== null) {
    setSelectedFranchiseStoreId(autoFranchiseId)
  }
}
```

### 5단계 — 본사 SearchSelect 잠금 (라인 1308~1320)

```tsx
<SearchSelect
  options={headOfficeSelectOptions}
  value={headOfficeSelectOptions.find(opt => opt.value === String(selectedHeadOfficeId ?? '')) || null}
  onChange={(opt) => {
    const id = opt?.value ? Number(opt.value) : null
    setSelectedHeadOfficeId(id)
    setSelectedFranchiseStoreId(null)
    setSelectedStoreId(null)
    setSelectedEmployeeId(null)
    setPayrollData(null)
  }}
  placeholder="본사 선택"
  isDisabled={isOfficeFixed}
  isSearchable={!isOfficeFixed}
  isClearable={!isOfficeFixed}
/>
```

### 6단계 — 가맹점 SearchSelect 잠금 (라인 1330~1341)

```tsx
<SearchSelect
  options={franchiseSelectOptions}
  value={franchiseSelectOptions.find(opt => opt.value === String(selectedFranchiseStoreId ?? '')) || null}
  onChange={(opt) => {
    const id = opt?.value ? Number(opt.value) : null
    setSelectedFranchiseStoreId(id)
    setSelectedStoreId(null)
    setSelectedEmployeeId(null)
    setPayrollData(null)
  }}
  placeholder="가맹점 선택"
  isDisabled={isFranchiseFixed && selectedFranchiseStoreId !== null}
  isSearchable={!isFranchiseFixed}
  isClearable={!isFranchiseFixed}
/>
```

### 7단계 — 점포 SearchSelect 변경 없음

`useStoreOptions(headOfficeId, franchiseId)` 자동 필터링으로 충분.

## 영향 범위

| 항목 | 변경 |
|------|------|
| `FullTimePayStub.tsx` import | `OWNER_CODE` 추가 |
| `useAuthStore` 호출 | `ownerCode`, `defaultHeadOfficeId` 추가 추출 |
| 자동선택 로직 | 렌더 중 setState 패턴 신규 추가 (`bpAutoApplied` 가드) |
| 본사/가맹점 SearchSelect | `isDisabled/isSearchable/isClearable` 권한 분기 |
| 점포 SearchSelect | 변경 없음 |
| 수정 모드 / 상세 모드 | 변경 없음 |

## React Compiler 규칙

- 렌더 중 setState 패턴 (`react-hooks/set-state-in-effect` 회피)
- `bpAutoApplied` state 가드로 1회만 발동, 무한 루프 방지
- BpForm + useStoreDetailForm + EmployContractEdit와 동일한 패턴 채택

## signup 권한 정책 보류 건과의 관계

현재 일반 가입자는 PLATFORM 권한으로 들어오기 때문에 (`project_signup_authority_pending.md` 보류 건):
- HEAD_OFFICE/FRANCHISE 분기는 즉시 효과 없음
- `PLATFORM + defaultHeadOfficeId` 매핑 케이스만 즉시 활성화
- signup 권한 정책 정상화되면 자연스럽게 모든 분기 활성화

## 검증

- `pnpm lint` — 0 errors, 신규 경고 없음 ✅ (2026-04-30)
- `pnpm build` — 성공 ✅ (2026-04-30)
- 수동 테스트:
  - PLATFORM 사용자: 등록/상세/수정 모드 정상 동작
  - HEAD_OFFICE 사용자: 등록 시 본사 자동 + 잠금
  - FRANCHISE 사용자: 등록 시 본사+가맹점 자동 + 잠금

## 구현 완료 (2026-04-30)

- `import { OWNER_CODE }` 추가 (라인 34 근방)
- `useAuthStore`에서 `ownerCode`, `defaultHeadOfficeId` 추가 추출 (라인 183)
- 권한 기반 표준 정책 변수 추가: `isPlatformAdmin`, `platformHasDefault`, `shouldAutoSelectOffice`, `isOfficeFixed`, `isFranchiseFixed` (라인 187-198)
- 자동선택 로직 추가: `bpAutoApplied` state 가드 + 렌더 중 setState 패턴 (라인 200-216)
- 본사 SearchSelect에 `isDisabled={isOfficeFixed}`, `isSearchable={!isOfficeFixed}`, `isClearable={!isOfficeFixed}` 추가
- 가맹점 SearchSelect에 `isDisabled={isFranchiseFixed && selectedFranchiseStoreId !== null}`, `isSearchable={!isFranchiseFixed}`, `isClearable={!isFranchiseFixed}` 추가

## Boston Code Review HIGH #1 처리 (2026-05-04)

PR #96 nalpari 리뷰 코멘트의 🟠 HIGH #1: "수정 모드 진입 시 본사·가맹점 셀렉트가 빈 값 + 비활성으로 잠김".

### 문제

`isOfficeFixed`/`isFranchiseFixed`가 모드 무관 disabled로 적용. 자동선택 로직은 `isNewMode` 가드로만 발동.
`useState<number | null>(null)` 초기값 + 자동선택 사용자가 **기존 명세서 수정**에 진입하면 셀렉트가 빈 값인 채로 잠김.
파생 쿼리(`useStoreOptions`, `useEmployeeListByType` 등)가 본사/가맹점 ID 없이 호출되는 부수 효과.

### 수정 방향

PartTimePayStub과 동일한 lazy 초기화 패턴 적용:

```ts
// useFullTimePayrollDetail 호출을 useState 선언 위로 이동 (선언 순서 의존성 해결)
const { data: existingPayrollData, isPending: isDetailLoading } = useFullTimePayrollDetail(statementId)

const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState<number | null>(
  () => existingPayrollData?.headOfficeId ?? null
)
const [selectedFranchiseStoreId, setSelectedFranchiseStoreId] = useState<number | null>(
  () => existingPayrollData?.franchiseId ?? null
)
```

### 영향 범위

- `useFullTimePayrollDetail` 호출 위치만 변경 (기존 의존성: `statementId` 단일)
- `settingsHeadOfficeId = selectedHeadOfficeId ?? existingPayrollData?.headOfficeId ?? null` 등 이미 fallback 패턴이라 lazy 초기화 후에도 안전
- 신규 모드(`isNewMode === true`)는 `existingPayrollData === undefined` → 초기값 null 유지 → 기존 자동선택 로직 정상 발동
