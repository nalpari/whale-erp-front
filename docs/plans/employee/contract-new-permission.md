# 직원 계약 등록 페이지 권한별 본사/가맹점 자동선택 표준화

## 개요

- **목표**: `employee/contract/new` 직원 계약 등록 페이지(`EmployContractEdit`)에서 본사/가맹점/직원 소속 라디오를 권한 기반 표준 정책으로 자동선택 + 잠금한다.
- **대상 파일**:
  - `src/components/employee/employcontract/EmployContractEdit.tsx`
- **브랜치**: `feature/role-based-form-display`
- **작성일**: 2026-04-30

## 배경

- 같은 PR에서 표준화한 `BpForm`, `StoreDetail`, `StaffInvitationPop`과 정책 일관성 부족
- 현재 `useAuthStore`에서 `accessToken`, `affiliationId`만 활용 → 권한별 자동선택/잠금 미적용
- 등록 모드(`id === 'new'`)에서 사용자가 매번 본사/가맹점/직원 소속을 수동 선택해야 함
- 수정 모드(`!isCreateMode`)는 이미 모든 SearchSelect가 `isDisabled={!isCreateMode}` 잠금 처리됨 → 변경 영향 없음

## 표준 정책 (이미 정착된 정책 재사용)

`HeadOfficeFranchiseStoreSelect` + `BpForm` + `useStoreDetailForm` + `StaffInvitationPop`와 동일.

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

| 권한 | bpTree | 본사 자동선택 | 가맹점 자동선택 | employeeAffiliation | 본사 잠금 | 가맹점 잠금 |
|------|--------|:-------------:|:---------------:|:-------------------:|:---------:|:-----------:|
| **HEAD_OFFICE** | 1개 | ✅ | ❌ | `HEAD_OFFICE` 강제 + 잠금 | ✅ | — |
| **FRANCHISE** | 1개 + 가맹점 1개 | ✅ | ✅ | `FRANCHISE` 강제 + 잠금 | ✅ | ✅ |
| **FRANCHISE** | 1개 + 가맹점 2+ | ✅ | ❌ | `FRANCHISE` 강제 + 잠금 | ✅ | (옵션 제한) |
| **PLATFORM** + 매핑 본사 | 매핑 본사 | ✅ | ❌ | 자유 선택 | ✅ | ❌ |
| **PLATFORM** + 단일 본사 | 1개 | ✅ | ❌ | 자유 선택 | ❌ | ❌ |
| **PLATFORM** + 다중 본사 (슈퍼 어드민) | 2+ | ❌ | ❌ | 자유 선택 | ❌ | ❌ |

### employeeAffiliation 라디오 정책

- `HEAD_OFFICE` 사용자 → `employeeAffiliation` 자동 `'HEAD_OFFICE'` + 라디오 disabled
- `FRANCHISE` 사용자 → `employeeAffiliation` 자동 `'FRANCHISE'` + 라디오 disabled
- `PLATFORM` 사용자 → 자유 선택 (현재와 동일)

> 현재 코드에서 `employeeAffiliation` 라디오는 버튼 형태(`btn-form`)이며 수정 모드에서 `disabled={!isCreateMode}` 적용 중. 권한 기반 잠금 추가.

### 점포 select 정책

- 별도 잠금 없음 (현재와 동일)
- `useStoreOptions(headOfficeId, franchiseId)`가 본사/가맹점 기준 필터링 → 본인 산하만 응답

## 트리거 정책

**컴포넌트 마운트 후 bpTree 로드 완료 시 1회 자동선택** (`isCreateMode === true` 일 때만).

- `bpAutoApplied` state 가드로 1회만 실행 (BpForm/useStoreDetailForm와 동일 패턴)
- 수정 모드(`!isCreateMode`) 또는 자동선택 조건 미충족 시 미발동
- 렌더 중 setState 패턴 (`react-hooks/set-state-in-effect` 회피)

## 구현 계획

### 1단계 — import 보강

```tsx
import { OWNER_CODE } from '@/constants/owner-code'
```

### 2단계 — useAuthStore 추가 추출

**기존 (라인 47)**:
```tsx
const { accessToken, affiliationId } = useAuthStore()
```

**변경**:
```tsx
const { accessToken, affiliationId, ownerCode, defaultHeadOfficeId } = useAuthStore()
```

### 3단계 — 표준 정책 변수 계산

`bpTree` 선언 직후 추가:

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
const isAffiliationFixed =
  ownerCode === OWNER_CODE.HEAD_OFFICE || ownerCode === OWNER_CODE.FRANCHISE
```

### 4단계 — 자동선택 로직 (렌더 중 setState 패턴)

formData 선언 직후, useStoreDetailForm와 동일한 패턴:

```tsx
const [bpAutoApplied, setBpAutoApplied] = useState(false)
if (!bpAutoApplied && isCreateMode && bpTree.length > 0 && shouldAutoSelectOffice) {
  setBpAutoApplied(true)
  const targetOffice = platformHasDefault
    ? bpTree.find((o) => o.id === defaultHeadOfficeId) ?? bpTree[0]
    : bpTree[0]

  const autoFranchiseId = isFranchiseFixed && targetOffice.franchises.length === 1
    ? targetOffice.franchises[0].id
    : null

  setFormData((prev) => ({
    ...prev,
    headOfficeId: String(targetOffice.id),
    franchiseId: autoFranchiseId !== null ? String(autoFranchiseId) : prev.franchiseId,
    employeeAffiliation: ownerCode === OWNER_CODE.FRANCHISE
      ? 'FRANCHISE'
      : ownerCode === OWNER_CODE.HEAD_OFFICE
        ? 'HEAD_OFFICE'
        : prev.employeeAffiliation,
  }))
}
```

### 5단계 — employeeAffiliation 라디오 잠금 (라인 547~568)

```tsx
<button
  type="button"
  className={`btn-form ${formData.employeeAffiliation === 'HEAD_OFFICE' ? 'basic' : 'outline'}`}
  onClick={() => handleInputChange('employeeAffiliation', 'HEAD_OFFICE')}
  disabled={!isCreateMode || isAffiliationFixed}
>
  본사
</button>
<button
  type="button"
  className={`btn-form ${formData.employeeAffiliation === 'FRANCHISE' ? 'basic' : 'outline'}`}
  onClick={() => handleInputChange('employeeAffiliation', 'FRANCHISE')}
  disabled={!isCreateMode || isAffiliationFixed}
>
  가맹점
</button>
```

### 6단계 — 본사 SearchSelect 잠금 (라인 575~581)

```tsx
<SearchSelect
  options={headOfficeOptions}
  value={headOfficeOptions.find(opt => opt.value === formData.headOfficeId) || null}
  onChange={(option) => handleInputChange('headOfficeId', option?.value || '')}
  className={isHeadOfficeRequired ? 'border-red-500' : ''}
  isDisabled={!isCreateMode || isOfficeFixed}
/>
```

### 7단계 — 가맹점 SearchSelect 잠금 (라인 583~588)

```tsx
<SearchSelect
  options={franchiseOptions}
  value={franchiseOptions.find(opt => opt.value === formData.franchiseId) || null}
  onChange={(option) => handleInputChange('franchiseId', option?.value || '')}
  isDisabled={!isCreateMode || (isFranchiseFixed && formData.franchiseId !== '')}
/>
```

### 8단계 — 점포 SearchSelect 변경 없음

`useStoreOptions(headOfficeId, franchiseId)` 자동 필터링으로 충분.

## 영향 범위

| 항목 | 변경 |
|------|------|
| `EmployContractEdit.tsx` import | `OWNER_CODE` 추가 |
| `useAuthStore` 호출 | `ownerCode`, `defaultHeadOfficeId` 추가 추출 |
| 자동선택 로직 | 렌더 중 setState 패턴 신규 추가 (`bpAutoApplied` 가드) |
| `employeeAffiliation` 버튼 | `disabled` 권한 분기 추가 |
| 본사/가맹점 SearchSelect | `isDisabled` 권한 분기 추가 |
| 점포 SearchSelect | 변경 없음 |
| 수정 모드 (`!isCreateMode`) | 변경 없음 (이미 isDisabled 처리됨) |

## React Compiler 규칙

- 렌더 중 setState 패턴 (`react-hooks/set-state-in-effect` 회피)
- `bpAutoApplied` state 가드로 무한 루프 방지
- BpForm + useStoreDetailForm와 동일한 패턴 채택

## signup 권한 정책 보류 건과의 관계

현재 일반 가입자는 PLATFORM 권한으로 들어오기 때문에 (`project_signup_authority_pending.md` 보류 건):
- HEAD_OFFICE/FRANCHISE 분기는 즉시 효과 없음
- `PLATFORM + defaultHeadOfficeId` 매핑 케이스만 즉시 활성화
- signup 권한 정책 정상화되면 자연스럽게 모든 분기 활성화

## 후속 작업 (본 PR 제외)

- 다른 등록 페이지(점포 메뉴 등)도 동일 표준 적용 검토

## 검증

- `pnpm lint` — 0 errors, 신규 경고 없음
- `pnpm build` — 성공
- 수동 테스트:
  - PLATFORM 사용자: 등록/수정 모드 정상 동작
  - HEAD_OFFICE 사용자: 등록 시 본사 자동 + employeeAffiliation `HEAD_OFFICE` 강제
  - FRANCHISE 사용자: 등록 시 본사+가맹점 자동 + employeeAffiliation `FRANCHISE` 강제
