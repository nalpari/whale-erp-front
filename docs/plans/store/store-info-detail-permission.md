# 점포 정보 상세 페이지 권한별 본사/가맹점 자동선택 표준화

## 개요

- **목표**: `store/info/detail` (점포 정보 등록/수정) 페이지의 본사/가맹점 자동선택 로직을 `HeadOfficeFranchiseStoreSelect`(검색 필터 표준)와 동일한 정책으로 표준화한다.
- **대상 파일**:
  - `src/hooks/store/useStoreDetailForm.ts` — 자동선택 로직
  - `src/components/store/manage/StoreDetailBasicInfo.tsx` — 잠금(`isOfficeFixed/isFranchiseFixed`) 정책 통일
- **브랜치**: `feature/role-based-form-display`
- **작성일**: 2026-04-30

## 배경

- 현재 `useStoreDetailForm.ts:447-477`의 자동선택은 **`bpTree.length === 1`** 데이터 의존
- 같은 프로젝트에서 검색 필터(`HeadOfficeFranchiseStoreSelect`)는 이미 `ownerCode + defaultHeadOfficeId` 기반의 표준 정책으로 운영 중
- 두 곳의 정책이 달라 일관성 부족
- 본사 사용자가 여러 본사를 보거나, 가맹점 사용자가 본인 가맹점이 자동선택되지 않는 케이스 발생 가능
- 코드 내 TODO 주석 존재(`useStoreDetailForm.ts:445`): "auth-store에 소속 조직 타입이 저장되면 bpTree 추론 대신 조직 타입 기반으로 변경"

## 표준 정책 (HeadOfficeFranchiseStoreSelect와 동일)

### 자동선택 발동 조건 (`shouldAutoSelectOffice`)

다음 중 하나라도 만족 시 본사 자동선택:
- `ownerCode === HEAD_OFFICE`
- `ownerCode === FRANCHISE`
- `bpTree.length === 1` (단일 본사 폴백)
- `platformHasDefault`: `ownerCode === PLATFORM` AND `defaultHeadOfficeId`가 `bpTree`에 매핑됨

### 가맹점 강제 (`isFranchiseFixed`)

- `ownerCode === FRANCHISE` 일 때만
- 해당 본사의 `franchises.length === 1` 이면 가맹점 자동선택
- 가맹점이 여러 개면 사용자가 직접 선택

### 잠금(disabled) 조건

- 본사 select: `isOfficeFixed = shouldAutoSelectOffice` (자동선택과 동일 조건)
- 가맹점 select: `isFranchiseFixed`

## 권한별 동작 매트릭스 (목표)

| 권한 | bpTree | 본사 자동선택 | 가맹점 자동선택 | 본사 잠금 | 가맹점 잠금 |
|------|--------|:-------------:|:---------------:|:---------:|:-----------:|
| **HEAD_OFFICE** | 1개 | ✅ | ❌ (사용자 선택) | ✅ | ❌ |
| **FRANCHISE** | 1개 + 가맹점 1개 | ✅ | ✅ | ✅ | ✅ |
| **FRANCHISE** | 1개 + 가맹점 2+ | ✅ | ❌ | ✅ | ✅ (잠금만) |
| **PLATFORM** + `defaultHeadOfficeId` 매핑 | 매핑 본사 | ✅ | ❌ | ✅ | ❌ |
| **PLATFORM** + 매핑 없음 + 단일 본사 | 1개 | ✅ | ❌ | ❌ (변경 가능) | ❌ |
| **PLATFORM** + 매핑 없음 + 다중 본사 (슈퍼 어드민) | 2+ | ❌ | ❌ | ❌ | ❌ |

## 구현 계획

### 1단계 — `useStoreDetailForm.ts` 자동선택 로직 표준화

**현재 (라인 447-477)**:
```tsx
const [bpAutoApplied, setBpAutoApplied] = useState(false)
if (!bpAutoApplied && bpTree.length === 1 && !(isEditMode && detail)) {
  // bpTree.length === 1 의존
}
```

**변경 후**:
```tsx
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'

const ownerCode = useAuthStore((s) => s.ownerCode)
const defaultHeadOfficeId = useAuthStore((s) => s.defaultHeadOfficeId)

// HeadOfficeFranchiseStoreSelect와 동일한 정책
const isPlatformAdmin = ownerCode === OWNER_CODE.PLATFORM
const platformHasDefault = isPlatformAdmin
  && defaultHeadOfficeId != null
  && bpTree.some((office) => office.id === defaultHeadOfficeId)
const shouldAutoSelectOffice =
  ownerCode === OWNER_CODE.HEAD_OFFICE
  || ownerCode === OWNER_CODE.FRANCHISE
  || bpTree.length === 1
  || platformHasDefault
const isFranchiseFixed = ownerCode === OWNER_CODE.FRANCHISE

const [bpAutoApplied, setBpAutoApplied] = useState(false)
if (!bpAutoApplied && bpTree.length > 0 && !(isEditMode && detail) && shouldAutoSelectOffice) {
  setBpAutoApplied(true)
  const targetOffice = platformHasDefault
    ? bpTree.find((o) => o.id === defaultHeadOfficeId) ?? bpTree[0]
    : bpTree[0]

  // FRANCHISE 사용자 + 가맹점 1개면 자동선택
  const autoFranchiseId = isFranchiseFixed && targetOffice.franchises.length === 1
    ? targetOffice.franchises[0].id
    : null

  setFormState((prev) => {
    const nextStoreOwner = isFranchiseFixed ? 'FRANCHISE' : prev.storeOwner
    const nextOrganizationId = isFranchiseFixed
      ? (autoFranchiseId ?? prev.organizationId)
      : (nextStoreOwner === 'HEAD_OFFICE' ? targetOffice.id : prev.organizationId)
    return {
      ...prev,
      officeId: targetOffice.id,
      franchiseId: autoFranchiseId ?? prev.franchiseId,
      storeOwner: nextStoreOwner,
      organizationId: nextOrganizationId,
    }
  })
}
```

### 2단계 — `StoreDetailBasicInfo.tsx` 잠금 정책 통일

**현재 (라인 158-165)**:
```tsx
const ownerCode = useAuthStore((s) => s.ownerCode)
const isOfficeFixed = ownerCode
  ? ownerCode === OWNER_CODE.HEAD_OFFICE || ownerCode === OWNER_CODE.FRANCHISE
  : bpTree.length === 1
const isFranchiseFixed = ownerCode
  ? ownerCode === OWNER_CODE.FRANCHISE
  : bpTree.length === 1 && bpTree[0]?.franchises.length === 1
const isOwnerFixed = bpTree.length === 1 && bpTree[0]?.franchises.length === 0
```

**변경 후**:
```tsx
const ownerCode = useAuthStore((s) => s.ownerCode)
const defaultHeadOfficeId = useAuthStore((s) => s.defaultHeadOfficeId)

const isPlatformAdmin = ownerCode === OWNER_CODE.PLATFORM
const platformHasDefault = isPlatformAdmin
  && defaultHeadOfficeId != null
  && bpTree.some((o) => o.id === defaultHeadOfficeId)
const isOfficeFixed =
  ownerCode === OWNER_CODE.HEAD_OFFICE
  || ownerCode === OWNER_CODE.FRANCHISE
  || bpTree.length === 1
  || platformHasDefault
const isFranchiseFixed = ownerCode === OWNER_CODE.FRANCHISE
const isOwnerFixed = bpTree.length === 1 && bpTree[0]?.franchises.length === 0
```

> `isOwnerFixed`(점포 소유자 라디오 잠금)는 기존 정책 유지 (별도 정책으로 다룰 수 있음).

## 영향 범위

| 항목 | 변경 |
|------|------|
| `useStoreDetailForm.ts` 자동선택 로직 | 데이터 의존 → 권한 기반 + 폴백 |
| `StoreDetailBasicInfo.tsx` 잠금 변수 | `platformHasDefault` 케이스 추가 |
| 수정 모드 (`isEditMode && detail`) | 변경 없음 (자동선택 미발동, 기존 데이터 유지) |
| FRANCHISE 사용자의 storeOwner | 자동으로 `FRANCHISE`로 강제 |
| 기존 PLATFORM 권한 가입자 (`ddarumIn11` 등) | `defaultHeadOfficeId` 매핑 있으면 본사 자동선택 + 잠금. 없으면 기존과 동일 |

## React Compiler 규칙 준수

- 렌더 중 setState 패턴 유지 (`react-hooks/set-state-in-effect` 회피)
- `useState`+`useState` 가드 (`bpAutoApplied`)로 1회만 발동
- `HeadOfficeFranchiseStoreSelect`는 부모 `onChange`를 호출해야 하므로 `useRef+useEffect` 패턴을 쓰지만, 본 hook은 직접 `setFormState`만 호출하면 되므로 렌더 중 setState 패턴이 적합

## signup 권한 정책 보류 건과의 관계

현재 일반 가입자는 PLATFORM 권한으로 들어오기 때문에 (`project_signup_authority_pending.md` 보류 건):
- 본 작업의 HEAD_OFFICE/FRANCHISE 분기는 즉시 효과 없음
- 단, **PLATFORM + `defaultHeadOfficeId` 매핑** 케이스는 기존 가입자에게도 적용 가능 (login 응답에 headOfficeId가 매핑되어 있다면)

→ signup 권한 정책 정상화되면 자연스럽게 모든 분기가 활성화됨. 본 PR은 미리 표준화해두는 의미.

## 후속 작업 (본 PR 제외)

- `isOwnerFixed`(점포 소유 라디오 잠금) 권한 기반 분기 검토
- 다른 페이지(직원 등록 등)의 자동선택 로직도 동일 표준 적용 검토

## 검증

- `pnpm lint` — 0 errors, 0 warnings (신규 코드 기준)
- `pnpm build` — 성공
- 권한별 시나리오 수동 테스트

## 구현 완료 (2026-04-30)

- `src/hooks/store/useStoreDetailForm.ts`: `useAuthStore`, `OWNER_CODE` import 추가 + 자동선택 로직 표준화 (라인 440~487)
- `src/components/store/manage/StoreDetailBasicInfo.tsx`: `defaultHeadOfficeId` 추가 + 잠금 정책 표준화 (라인 154~172)
- lint: 0 errors / 0 warnings (신규 코드 기준, 기존 경고 1건은 별개 파일)
- build: 성공
