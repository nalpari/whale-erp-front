# 연장근무 수당명세서 등록 페이지 권한별 본사/가맹점 자동선택 표준화

## 개요

- **목표**: `employee/payroll/overtime/new` 연장근무 수당명세서 등록 페이지(`OvertimePayStub`)에서 본사/가맹점 SearchSelect를 권한 기반 표준 정책으로 자동선택 + 잠금한다.
- **대상 파일**:
  - `src/components/employee/payroll/OvertimePayStub.tsx`
- **브랜치**: `feature/role-based-form-display`
- **작성일**: 2026-04-30

## 배경

- 같은 PR에서 표준화한 6개 페이지(`BpForm`, `StoreDetail`, `StaffInvitationPop`, `EmployContractEdit`, `FullTimePayStub`, `PartTimePayStub`)와 정책 일관성 부족
- 현재 `useAuthStore`에서 `accessToken`, `affiliationId`만 활용 → 권한별 자동선택/잠금 미적용
- PartTimePayStub와 거의 동일한 구조이므로 동일 패턴 적용

## 페이지 특이사항

- state는 `string` 타입 (`selectedHeadquarter`, `selectedFranchise`, `selectedStore`)
- **`fromWorkTimeEdit` 흐름** — sessionStorage에서 복원 (라인 185~245) → 자동선택과 충돌 방지 가드 필요
- **"직원 소속" 라디오** — `state 미연결` 죽은 UI. 본 PR에서 변경하지 않음 (옵션 A)
- 본사 변경 시 가맹점/점포/직원/기간 모두 리셋 (라인 1028~1037)
- `isNewMode = isEditMode && id === 'new'` (라인 75)

## 표준 정책 (이미 정착된 정책 재사용)

`HeadOfficeFranchiseStoreSelect` + 6개 페이지와 동일.

### 자동선택 발동 조건 (`shouldAutoSelectOffice`)

다음 중 하나라도 만족 시 본사 자동선택:
- `ownerCode === HEAD_OFFICE`
- `ownerCode === FRANCHISE`
- `bpTree.length === 1` (단일 본사 폴백)
- `platformHasDefault`

### 가맹점 강제 (`isFranchiseFixed`)

- `ownerCode === FRANCHISE` AND 해당 본사의 `franchises.length === 1`

## 권한별 동작 매트릭스

| 권한 | bpTree | 본사 자동선택 | 가맹점 자동선택 | 본사 잠금 | 가맹점 잠금 |
|------|--------|:-------------:|:---------------:|:---------:|:-----------:|
| **HEAD_OFFICE** | 1개 | ✅ | ❌ | ✅ | — |
| **FRANCHISE** + 가맹점 1개 | 1개 + 가맹점 1개 | ✅ | ✅ | ✅ | ✅ |
| **FRANCHISE** + 가맹점 2+ | 1개 + 가맹점 2+ | ✅ | ❌ | ✅ | (옵션 제한) |
| **PLATFORM** + 매핑 본사 | 매핑 본사 | ✅ | ❌ | ✅ | ❌ |
| **PLATFORM** + 단일 본사 | 1개 | ✅ | ❌ | ❌ | ❌ |
| **PLATFORM** + 다중 본사 (슈퍼 어드민) | 2+ | ❌ | ❌ | ❌ | ❌ |

## 트리거 정책

**등록 모드(`isNewMode === true`) + `!fromWorkTimeEdit` + bpTree 로드 후 1회 자동선택**.

## 구현 계획

### 1단계 — import 추가
```tsx
import { OWNER_CODE } from '@/constants/owner-code'
```

### 2단계 — useAuthStore 추가 추출 (라인 123)
```tsx
const { accessToken, affiliationId, ownerCode, defaultHeadOfficeId } = useAuthStore()
```

### 3단계 — 표준 정책 변수 (bpTree 선언 직후, 라인 125 근방)
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

### 4단계 — 자동선택 로직 (state 변환 String 사용)
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

### 5단계 — 본사 SearchSelect 잠금 (라인 1025~1039)
```tsx
isDisabled={isOfficeFixed}
isSearchable={!isOfficeFixed}
isClearable={!isOfficeFixed}
```

### 6단계 — 가맹점 SearchSelect 잠금 (라인 1046~1059)
```tsx
isDisabled={isFranchiseFixed && selectedFranchise !== ''}
isSearchable={!isFranchiseFixed}
isClearable={!isFranchiseFixed}
```

### 7단계 — 점포/라디오 변경 없음

## 영향 범위

| 항목 | 변경 |
|------|------|
| `OvertimePayStub.tsx` import | `OWNER_CODE` 추가 |
| `useAuthStore` 호출 | `ownerCode`, `defaultHeadOfficeId` 추가 추출 |
| 자동선택 로직 | 렌더 중 setState 패턴 신규 추가 (`bpAutoApplied` + `fromWorkTimeEdit` 가드) |
| 본사/가맹점 SearchSelect | `isDisabled/isSearchable/isClearable` 권한 분기 |
| 점포 SearchSelect | 변경 없음 |
| 직원 소속 라디오 | 변경 없음 (별도 작업) |

## React Compiler 규칙

- 렌더 중 setState 패턴 (`react-hooks/set-state-in-effect` 회피)
- `bpAutoApplied` 가드로 1회만 발동
- BpForm + PartTimePayStub와 동일 패턴

## 후속 작업

- "직원 소속" 라디오 의도 정리 (PartTimePayStub와 동일 — state 연결 또는 UI 제거)

## 검증

- `pnpm lint` — 0 errors, 신규 경고 없음 ✅ (2026-04-30 완료)
- `pnpm build` — 성공 ✅ (2026-04-30 완료)
- 수동 테스트:
  - PLATFORM/HEAD_OFFICE/FRANCHISE 사용자 권한별 동작
  - `fromWorkTimeEdit` 흐름: 자동선택 미발동, sessionStorage 복원 정상

## 구현 완료 (2026-04-30)

- `OvertimePayStub.tsx` 구현 완료
  - `OWNER_CODE` import 추가 (라인 34)
  - `useAuthStore`에서 `ownerCode`, `defaultHeadOfficeId` 추가 추출 (라인 124)
  - 권한 기반 표준 정책 변수 추가 (라인 128~163)
  - 자동선택 로직 추가 (`bpAutoApplied` 가드 + `fromWorkTimeEdit` 가드)
  - 본사 SearchSelect: `isDisabled/isSearchable/isClearable` 잠금 적용
  - 가맹점 SearchSelect: `isDisabled/isSearchable/isClearable` 잠금 적용

## Boston Code Review HIGH #1 검토 (2026-05-04) — 후속 작업으로 보류

PR #96 nalpari 리뷰 코멘트의 🟠 HIGH #1: "수정 모드 진입 시 본사·가맹점 셀렉트가 빈 값 + 비활성으로 잠김".

### 검토 결과: 본 PR 적용 불가 (백엔드 응답 스키마 한계)

PartTimePayStub은 `PartTimerPayrollStatementResponse`에 `headOfficeId`/`franchiseId` 필드가 있어 lazy 초기화 가능.
**OvertimePayStub은** 사용 중인 `OvertimeAllowanceStatementDetailResponse`(`src/lib/api/overtimeAllowanceStatement.ts:39`) 에
`headOfficeName`/`franchiseName`/`storeName`만 있고 **ID 필드가 없음**.

ID 없이 Name만으로 lazy 초기화하려면 bpTree에서 이름 매칭으로 ID를 역산해야 하는데:
- 동명 본사/가맹점 가능성
- bpTree 로드 타이밍 의존
- React Compiler 규칙(렌더 중 setState) 추가 위반 가능
→ 현 시점에서는 **lazy 초기화 미적용**, 후속 PR로 박제.

### 후속 작업

| 항목 | 작업 |
|------|------|
| API 응답 확장 | `OvertimeAllowanceStatementDetailResponse`에 `headOfficeId?: number`, `franchiseId?: number` 추가 (백엔드 동시) |
| Overtime lazy 초기화 | API 확장 후 PartTime/FullTime 패턴 동일 적용 |

### 본 PR에 남긴 박제

```ts
// NOTE: lazy 초기화는 OvertimeAllowanceStatementDetailResponse에 headOfficeId/franchiseId 필드가 추가된 후 가능.
// 현재 응답에는 *Name만 있고 ID가 없어 PartTimePayStub와 같은 패턴 적용 불가.
// 후속 작업: 백엔드 응답에 ID 필드 추가 후 PartTime 패턴 적용 (HIGH #1 잔여)
```
