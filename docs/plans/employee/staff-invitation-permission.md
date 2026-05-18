# 직원 초대 모달 권한별 본사/가맹점 자동선택 표준화

## 개요

- **목표**: `employee/info` 직원 초대 모달(`StaffInvitationPop`)에서 본사/가맹점/직원 소속 라디오를 권한 기반 표준 정책으로 자동선택 + 잠금한다.
- **대상 파일**:
  - `src/components/employee/employeeinfo/StaffInvitationPop.tsx`
- **브랜치**: `feature/role-based-form-display`
- **작성일**: 2026-04-30

## 배경

- 현재 모달은 `useAuthStore`에서 `accessToken`, `affiliationId`만 활용하고, 본사/가맹점 자동선택과 잠금 정책이 없음
- 같은 PR에서 표준화한 `BpForm`, `useStoreDetailForm`/`StoreDetailBasicInfo`와 정책 일관성 부족
- HEAD_OFFICE/FRANCHISE 사용자가 매번 본사/가맹점을 수동 선택해야 하고, 권한 외 옵션도 보이는 상태

## 표준 정책 (이미 정착된 정책 재사용)

`HeadOfficeFranchiseStoreSelect` + `BpForm` + `useStoreDetailForm` 와 동일.

### 자동선택 발동 조건 (`shouldAutoSelectOffice`)

다음 중 하나라도 만족 시 본사 자동선택:
- `ownerCode === HEAD_OFFICE`
- `ownerCode === FRANCHISE`
- `bpTree.length === 1` (단일 본사 폴백)
- `platformHasDefault`: `ownerCode === PLATFORM` AND `defaultHeadOfficeId`가 `bpTree`에 매핑됨

### 가맹점 강제 (`isFranchiseFixed`)

- `ownerCode === FRANCHISE` 일 때만
- 해당 본사의 `franchises.length === 1` 이면 가맹점 자동선택
- 가맹점이 여러 개면 사용자가 직접 선택 (단, 본인 권한 매핑된 가맹점만 응답에 포함되어야 함 — 백엔드 필터 가정)

## 권한별 동작 매트릭스 (목표)

| 권한 | bpTree | 본사 자동선택 | 가맹점 자동선택 | workplaceType 라디오 | 본사 잠금 | 가맹점 잠금 |
|------|--------|:-------------:|:---------------:|:-------------------:|:---------:|:-----------:|
| **HEAD_OFFICE** | 1개 | ✅ | ❌ | `HEAD_OFFICE` 강제 + 잠금 | ✅ | — |
| **FRANCHISE** | 1개 + 가맹점 1개 | ✅ | ✅ | `FRANCHISE` 강제 + 잠금 | ✅ | ✅ |
| **FRANCHISE** | 1개 + 가맹점 2+ | ✅ | ❌ | `FRANCHISE` 강제 + 잠금 | ✅ | (옵션 제한) |
| **PLATFORM** + 매핑 본사 | 매핑 본사 | ✅ | ❌ | 자유 선택 | ✅ | ❌ |
| **PLATFORM** + 매핑 없음 + 단일 본사 | 1개 | ✅ | ❌ | 자유 선택 | ❌ | ❌ |
| **PLATFORM** + 매핑 없음 + 다중 본사 (슈퍼 어드민) | 2+ | ❌ | ❌ | 자유 선택 | ❌ | ❌ |

### workplaceType 라디오 정책 (Q2=C)

- `HEAD_OFFICE` 사용자 → `workplaceType` 자동 `'HEAD_OFFICE'` + 라디오 disabled
- `FRANCHISE` 사용자 → `workplaceType` 자동 `'FRANCHISE'` + 라디오 disabled
- `PLATFORM` 사용자 → 자유 선택 (현재와 동일)

### 점포 select 정책 (Q3)

- 별도 잠금 없음
- `useStoreOptions(headOfficeId, franchiseId)`가 이미 본사/가맹점 기준으로 필터링
  → FRANCHISE 사용자: 자동 선택된 본사+가맹점 산하 점포만 응답
  → HEAD_OFFICE 사용자: 자동 선택된 본사 산하 점포만 응답

## 트리거 정책 (Q1)

**모달이 열릴 때마다 자동선택 재실행**.

- `useEffect([isOpen, bpTree, ownerCode, defaultHeadOfficeId])` 패턴
- `isOpen === false`로 닫히면 가드 리셋 (`bpAutoAppliedRef.current = false`)
- `isOpen === true`로 열릴 때 + `bpTree` 로드 완료 + 가드 미적용 + `shouldAutoSelectOffice` 만족 → 자동선택 1회

> `react-hooks/set-state-in-effect` 규칙 회피를 위해 `useRef + useEffect` 패턴 사용 (모달 컴포넌트는 부모와 무관하게 자체적으로 setState 가능).
> 단, 부모 onChange 호출이 없으니 `setHeadOfficeOrganizationId` 등을 직접 호출. **렌더 중 setState는 모달 열림 가드 처리가 어렵기 때문에 useEffect + useRef 패턴이 적합**.

## 구현 계획

### 1단계 — import 보강

```tsx
import { useState, useMemo, useEffect, useRef } from 'react'
import { OWNER_CODE } from '@/constants/owner-code'
```

### 2단계 — auth-store에서 ownerCode/defaultHeadOfficeId 추출

```tsx
const { accessToken, affiliationId, ownerCode, defaultHeadOfficeId } = useAuthStore()
```

### 3단계 — 표준 정책 변수 계산

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
const isWorkplaceTypeFixed =
  ownerCode === OWNER_CODE.HEAD_OFFICE || ownerCode === OWNER_CODE.FRANCHISE
```

### 4단계 — 모달 열릴 때 자동선택 useEffect

```tsx
const bpAutoAppliedRef = useRef(false)

useEffect(() => {
  if (!isOpen) {
    // 모달 닫히면 다음 열림 때 다시 적용되도록 가드 리셋
    bpAutoAppliedRef.current = false
    return
  }
  if (bpLoading || bpTree.length === 0) return
  if (bpAutoAppliedRef.current) return
  if (!shouldAutoSelectOffice) return

  bpAutoAppliedRef.current = true

  // PLATFORM 매핑 우선, 없으면 첫 번째 본사
  const targetOffice = platformHasDefault
    ? bpTree.find((o) => o.id === defaultHeadOfficeId) ?? bpTree[0]
    : bpTree[0]

  setHeadOfficeOrganizationId(targetOffice.id)

  // workplaceType 강제 (Q2=C)
  if (ownerCode === OWNER_CODE.HEAD_OFFICE) {
    setWorkplaceType('HEAD_OFFICE')
    setFranchiseOrganizationId(null)
  } else if (ownerCode === OWNER_CODE.FRANCHISE) {
    setWorkplaceType('FRANCHISE')
    if (targetOffice.franchises.length === 1) {
      setFranchiseOrganizationId(targetOffice.franchises[0].id)
    }
  }
  // PLATFORM은 workplaceType 그대로 (사용자 기본값 유지)
}, [isOpen, bpLoading, bpTree, shouldAutoSelectOffice, platformHasDefault, defaultHeadOfficeId, ownerCode])
```

### 5단계 — workplaceType 라디오 disabled

```tsx
<input
  type="radio"
  name="workplaceType"
  id="workplaceType-headoffice"
  checked={workplaceType === 'HEAD_OFFICE'}
  onChange={...}
  disabled={isWorkplaceTypeFixed}
/>
// label도 disabled 시 시각적으로 비활성 표시 (className 활용)

<input
  type="radio"
  name="workplaceType"
  id="workplaceType-franchise"
  checked={workplaceType === 'FRANCHISE'}
  onChange={...}
  disabled={isWorkplaceTypeFixed}
/>
```

### 6단계 — 본사 SearchSelect 잠금

```tsx
<SearchSelect
  options={headOfficeOptions}
  value={...}
  onChange={...}
  placeholder="본사 선택"
  isDisabled={bpLoading || isOfficeFixed}
  isSearchable={!isOfficeFixed}
  isClearable={!isOfficeFixed}
/>
```

### 7단계 — 가맹점 SearchSelect 잠금 (FRANCHISE 사용자 + 가맹점 자동선택된 경우)

```tsx
<SearchSelect
  options={franchiseOptions}
  value={...}
  onChange={...}
  placeholder="가맹점 선택"
  isDisabled={bpLoading || (isFranchiseFixed && franchiseOrganizationId !== null)}
  isSearchable={!isFranchiseFixed}
  isClearable={!isFranchiseFixed}
/>
```

> 가맹점이 여러 개일 때는 자동선택 안 되므로 사용자가 직접 선택 가능 (잠금 X). 단 FRANCHISE 사용자라면 백엔드에서 본인 권한 매핑 가맹점만 응답 — 옵션 자체가 제한.

### 8단계 — 점포 SearchSelect 변경 없음

`useStoreOptions(headOfficeId, franchiseId)` 자동 필터링으로 충분.

## 영향 범위

| 항목 | 변경 |
|------|------|
| `StaffInvitationPop.tsx` import | `OWNER_CODE` 추가 (`useEffect`, `useRef` 미사용) |
| `useAuthStore` 호출 | `ownerCode`, `defaultHeadOfficeId` 추가 추출 |
| 자동선택 로직 | 렌더 중 setState 패턴으로 구현 (`bpAutoApplied` + `lastIsOpen` state) |
| `workplaceType` 라디오 | `disabled={isWorkplaceTypeFixed}` prop 추가 |
| 본사/가맹점 SearchSelect | `isDisabled/isSearchable/isClearable` 권한 분기 |
| 점포 SearchSelect | 변경 없음 |
| `resetForm()` | 변경 없음 (가드 리셋은 `lastIsOpen !== isOpen` 감지로 처리) |

## React Compiler 규칙 (실제 적용 결과)

- `useEffect` 안에서 `setState` 직접 호출 → `react-hooks/set-state-in-effect` **에러 발생**
  - `HeadOfficeFranchiseStoreSelect`는 `onChangeRef.current()` 콜백 방식이라 에러 없음 (오해였음)
  - 계획 문서의 `useRef + useEffect` 패턴은 실제 lint에서 에러
- **실제 채택 패턴**: `useStoreDetailForm`과 동일한 렌더 중 setState 패턴
  - `bpAutoApplied` state + `lastIsOpen` state로 `isOpen` 변화 감지 + 1회 가드 구현
  - `if (lastIsOpen !== isOpen) { setLastIsOpen(isOpen); if (!isOpen) setBpAutoApplied(false) }` — 닫힘 시 가드 리셋
  - `if (isOpen && !bpLoading && bpTree.length > 0 && !bpAutoApplied && shouldAutoSelectOffice)` — 열림 시 1회 자동선택

## 후속 작업 (본 PR 제외)

- 다른 모달/팝업의 동일 패턴 적용 (직원 검색 팝업 등 — 필요 시)
- workplaceType 라디오 시각적 비활성 스타일 추가 검토 (label disabled 처리 등)

## 검증

- `pnpm lint` — 0 errors, 신규 경고 없음
- `pnpm build` — 성공
- 수동 테스트:
  - PLATFORM 사용자: 모달 열기/닫기 반복 → 매번 정상 자동선택 동작
  - HEAD_OFFICE 사용자: 본사 자동 + 라디오 `HEAD_OFFICE` 강제
  - FRANCHISE 사용자: 본사+가맹점 자동 + 라디오 `FRANCHISE` 강제
