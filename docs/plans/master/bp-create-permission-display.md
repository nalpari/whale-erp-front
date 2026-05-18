# BP 등록 페이지 권한별 표기 차별화

## 개요

- **목표**: `master/bp/create`(BP 등록) 페이지에서 로그인 사용자의 `ownerCode`에 따라 표기/입력 가능 옵션을 차별화한다.
- **대상 컴포넌트**: `src/components/master/bp/BpForm.tsx`
- **대상 라우트**: `src/app/(sub)/master/bp/create/page.tsx`
- **브랜치**: `feature/role-based-form-display`
- **작성일**: 2026-04-30

## 배경

- 기존 BP 등록 페이지는 모든 사용자에게 동일한 옵션을 노출하고 있어, 권한 외 옵션을 사용자가 선택할 수 있는 상태.
- 운영자(PLATFORM)는 본사/가맹점 BP를 모두 등록할 수 있지만, 본사(HEAD_OFFICE) 사용자는 본사만, 가맹점(FRANCHISE) 사용자는 가맹점만 등록할 수 있도록 UX를 명확히 한다.
- 등록 시점에서 의미 없는 운영여부 옵션(`종료`)을 제거하여 잘못된 입력을 사전에 방지한다.

## 전제

- `useAuthStore`의 `ownerCode` 필드 (PLATFORM / HEAD_OFFICE / FRANCHISE) 활용
- `src/constants/owner-code.ts`의 `OWNER_CODE` 상수 사용
- 로그인 직후 `ownerCode`는 `setOwnerCode()`로 저장되어 있음 (`src/app/(auth)/login/page.tsx`)
- 기존 사용처 패턴 참고: `StoreMenuSearch.tsx`, `PromotionSearch.tsx`, `HeadOfficeFranchiseStoreSelect.tsx`

## 확정 정책

### 권한별 표기 매트릭스

| 영역 | PLATFORM (운영자) | HEAD_OFFICE (본사) | FRANCHISE (가맹점) |
|------|-------------------|---------------------|---------------------|
| **운영여부** (등록) | 상담중/운영 (종료 제외) | 동일 | 동일 |
| **운영여부** (수정) | 상담중/운영/종료 (전체) | 동일 | 동일 |
| **대표 Partner Function** | 전체 옵션 | `PF_001`(본사) 고정 + readonly | `PF_002`(가맹점) 고정 + readonly |
| **본사 select** (가맹점 등록 시) | 전체 본사 검색 | 본인 본사 자동선택 + 잠금 | 본인 본사 자동선택 + 잠금 |
| **BP 타입** | 전체 노출 | 동일 (차별화 없음) | 동일 (차별화 없음) |
| **Master ID** | 입력 가능 | 동일 (차별화 없음) | 동일 (차별화 없음) |

### 공통코드 BPOPR (운영여부)

DB 조회 결과 (`common_codes` 테이블, `code_group = 'platform'`, `parent` = `BPOPR`):

| code | name | 등록 노출 | 수정 노출 |
|------|------|-----------|-----------|
| `BPOPR_001` | 상담중 | ✅ (기본값) | ✅ |
| `BPOPR_002` | 운영 | ✅ | ✅ |
| `BPOPR_003` | 종료 | ❌ | ✅ |

### 공통코드 PF (Partner Function)

| code | name | 의미 |
|------|------|------|
| `PF_001` | 본사 | HEAD_OFFICE 사용자 시 고정 |
| `PF_002` | 가맹점 | FRANCHISE 사용자 시 고정 |

## 구현 계획

### 1단계 — 운영여부 종료 옵션 제외 (등록 모드)

**파일**: `src/components/master/bp/BpForm.tsx`

```tsx
// 상수 추가
const BPOPR_TERMINATED = 'BPOPR_003' // 종료

// 등록 모드: 종료 제외 / 수정 모드: 전체 노출
const visibleBpoprCodes = isEditMode
  ? bpoprCodes
  : bpoprCodes.filter((c) => c.code !== BPOPR_TERMINATED)

// 렌더링은 visibleBpoprCodes 사용
{visibleBpoprCodes.map((code) => ( ... ))}
```

- `INITIAL_FORM.bpoprType`은 기존 `'BPOPR_001'` (상담중) 유지

### 2단계 — `ownerCode` 기반 권한 분기 도입

**파일**: `src/components/master/bp/BpForm.tsx`

```tsx
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'

const ownerCode = useAuthStore((s) => s.ownerCode)
const isPlatform        = ownerCode === OWNER_CODE.PLATFORM
const isHeadOfficeUser  = ownerCode === OWNER_CODE.HEAD_OFFICE
const isFranchiseUser   = ownerCode === OWNER_CODE.FRANCHISE
const isOfficeFixed     = isHeadOfficeUser || isFranchiseUser
```

### 3단계 — 대표 Partner Function (`pfType`) 분기

```tsx
// PF 옵션 필터링
const visiblePfCodes = isPlatform
  ? pfCodes
  : pfCodes.filter((c) =>
      isHeadOfficeUser ? c.code === 'PF_001' : c.code === 'PF_002'
    )

// 등록 모드 + 비-운영자 → pfType 강제 세팅
const initialPfType = isEditMode
  ? '' // 수정 모드는 bp.pfType 사용 (mapBpToForm에서 처리)
  : isHeadOfficeUser ? 'PF_001'
    : isFranchiseUser  ? 'PF_002'
    : ''

// INITIAL_FORM 적용 시점에 initialPfType 반영 필요
const [form, setForm] = useState<BpFormData>(() =>
  bp ? mapBpToForm(bp) : { ...INITIAL_FORM, pfType: initialPfType }
)

// select disabled (등록 모드 + 비-운영자)
<select
  className="select-form"
  value={form.pfType}
  onChange={(e) => handlePfTypeChange(e.target.value)}
  disabled={!isPlatform && !isEditMode}
>
  <option value="">선택</option>
  {visiblePfCodes.map((code) => (
    <option key={code.code} value={code.code}>{code.name}</option>
  ))}
</select>
```

### 4단계 — 본사 select 자동선택 + 잠금

**조건**: 가맹점 등록(`isFranchise === true`)일 때 본사 선택 UI 노출 중.

```tsx
// auth-store의 defaultHeadOfficeId 활용
const defaultHeadOfficeId = useAuthStore((s) => s.defaultHeadOfficeId)

// 비-운영자는 본인 본사 자동 적용
useEffect(() => {
  if (!isPlatform && isFranchise && defaultHeadOfficeId && form.pfSaveRequest.length === 0) {
    setForm((prev) => ({
      ...prev,
      pfSaveRequest: [{
        partnerBusinessPartnerId: defaultHeadOfficeId,
      }],
    }))
  }
}, [isPlatform, isFranchise, defaultHeadOfficeId])

// SearchSelect 잠금
<SearchSelect
  options={headOfficeOptions}
  value={selectedHeadOffice}
  onChange={(opt) => handlePartnerBpChange(opt?.value ?? '')}
  placeholder="본사 선택"
  isClearable={isPlatform}
  isSearchable={isPlatform}
  isDisabled={!isPlatform}
  error={!!errors.partnerBp}
/>
```

> **⚠️ React Compiler 규칙 주의**: `react-hooks/set-state-in-effect` 규칙 위반 가능. 대안은 `useEffect` 대신 폼 초기 state 계산 시점에 자동선택 값을 함께 세팅 (`useState` initializer 안에서 처리).

```tsx
const computeInitialForm = (): BpFormData => {
  if (bp) return mapBpToForm(bp)

  const base = { ...INITIAL_FORM, pfType: initialPfType }

  // 가맹점 등록 + 본사/가맹점 사용자 → 본사 자동 적용
  if (!isPlatform && initialPfType === 'PF_002' && defaultHeadOfficeId) {
    base.pfSaveRequest = [{ partnerBusinessPartnerId: defaultHeadOfficeId }]
  }
  return base
}

const [form, setForm] = useState<BpFormData>(computeInitialForm)
```

### 5단계 — 라우팅 가드 (선택적, 차후 검토)

`master/bp/create` 페이지 자체는 이미 `LoginAuthorityProgram.canCreateDelete`로 라우팅이 통제되고 있음. 본 PR에서는 폼 내부 분기만 다루고, 진입 차단은 별도 작업으로 분리.

## 영향 범위

| 항목 | 변경 |
|------|------|
| `BpForm.tsx` | 권한 분기, BPOPR 종료 제외, PF 옵션 필터링, 본사 자동선택 |
| `BpForm.tsx` 사용처 | `app/(sub)/master/bp/create/page.tsx`, `app/(sub)/master/bp/[id]/page.tsx` (수정 모드 영향 없음) |
| 타입 정의 | 변경 없음 (`BpFormData` 그대로 사용) |
| API 훅 | 변경 없음 |

## 테스트 시나리오

### 등록 모드

| 시나리오 | 예상 동작 |
|----------|-----------|
| PLATFORM 로그인 → BP 등록 진입 | 운영여부: 상담중/운영, 대표 PF: 전체 옵션, 본사 select: 자유 검색 |
| HEAD_OFFICE 로그인 → BP 등록 진입 | 대표 PF: `PF_001` 고정 + disabled |
| FRANCHISE 로그인 → BP 등록 진입 | 대표 PF: `PF_002` 고정 + disabled, 본사 select: 본인 본사 자동선택 + 잠금 |
| 종료 옵션 노출 여부 | 등록 모드에서 비노출 |

### 수정 모드

| 시나리오 | 예상 동작 |
|----------|-----------|
| 모든 권한 → 수정 모드 진입 | 운영여부: 종료 포함 전체 노출 |
| HEAD_OFFICE → 수정 모드 진입 | 기존 `bp.pfType` 그대로 표시 (강제 변경 없음) |

## 후속 작업 (백엔드)

본 작업과 짝을 이루는 백엔드 검증은 `whale-erp-api/docs/plans/master-bp-2026-04-30-create-permission-validation.md` 참조.

## 검증

- `pnpm lint` — 무경고 통과
- `pnpm build` — 성공
- 권한별 시나리오 수동 테스트 (위 테스트 시나리오 표 따라)

## Boston Code Review HIGH #3 처리 (2026-05-04)

PR #96 nalpari 리뷰 코멘트의 🟠 HIGH #3: "BpForm 클라이언트 second-line 검증 부재 → 우회 시 IDOR/Privilege Escalation".

### 문제

`visibleBpoprCodes`/`visiblePfCodes` 필터링과 `disabled={!isPlatform && !isEditMode}`는 DOM/React state 변조로 우회 가능.
`validate()`에 권한별 허용값(`pfType`, `bpoprType`, `partnerBusinessPartnerId`) 일치 검증이 없어 변조된 페이로드가 그대로 서버에 전송됨.

### 수정 방향 (본 PR)

`validate()`에 클라이언트 second-line 권한 매트릭스 가드 추가.
서버(API PR #140)가 1차 가드 — 클라이언트는 빠른 피드백 + 정상 사용자 보호 목적의 보조 가드.

```ts
if (!isEditMode) {
  if (form.bpoprType === BPOPR_TERMINATED) {
    newErrors.bpoprType = '등록 시 운영여부 종료는 선택할 수 없습니다.'
  }
  if (isHeadOfficeUser && form.pfType !== 'PF_001') {
    newErrors.pfType = '본사 권한으로는 본사(PF_001)만 등록할 수 있습니다.'
  }
  if (isFranchiseUser && form.pfType !== 'PF_002') {
    newErrors.pfType = '가맹점 권한으로는 가맹점(PF_002)만 등록할 수 있습니다.'
  }
  if (
    !isPlatform
    && form.pfType === 'PF_002'
    && defaultHeadOfficeId != null
    && form.pfSaveRequest[0]?.partnerBusinessPartnerId !== defaultHeadOfficeId
  ) {
    newErrors.partnerBp = '권한이 없는 본사로는 등록할 수 없습니다.'
  }
}
```

### API ErrorCode 연동 (API PR #140 동기)

API PR #140이 신규 ErrorCode 도입:
- `ERR3061` `BP_CREATE_TERMINATED_NOT_ALLOWED` (400) — 등록 시 운영여부 '종료' 차단
- `ERR3062` `BP_CREATE_PF_NOT_ALLOWED` (403) — 권한에 맞지 않는 pfType 등록 시도

`getErrorMessage(error, fallback)` 패턴이 axios 응답의 `data.message`를 자동 노출하므로 별도 매핑은 불필요.
서버가 신규 ErrorCode로 친절한 메시지를 내려주면 `alert(getErrorMessage(...))`가 그대로 표시.

### 본 PR 제외 (후속 PR)

| 항목 | 사유 |
|------|------|
| 🟠 #4 `defaultHeadOfficeId` localStorage 신뢰 | PR 본문에 명시된 후속 트랙(`useAutoSelectPolicy` 훅 + httpOnly Cookie 마이그레이션) |
| 🟡 `initialPfType` 첫 렌더 고정 (PLATFORM PF 토글) | 별도 정리 PR |
| 🟡 정책 변수 9곳 중복 → `useAutoSelectPolicy` 훅 단일화 | 후속 단기 PR |
