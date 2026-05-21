# 직원 초대 권한 매핑 제거 + BP 관리자 관리 신설 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `invitedAuthorityId` 자동 매핑 흐름을 FE에서 완전히 제거하고, `/settings/admin` 신규 페이지에 본사/가맹 BP 관리자 CRUD를 추가한다.

**Architecture:** 단일 브랜치 `feature/admin-and-invitation-refactor` (이미 체크아웃 완료). Phase 1은 기존 `StaffInvitationPop` 등 5개 파일에서 권한 토글 관련 코드만 제거. Phase 2는 `system/admin` 모듈을 청사진으로 삼아 `settings/admin` 모듈을 신규 작성하되, `staff-invitation-permission.md` 표준 자동선택/잠금 정책을 폼/검색 양쪽에 적용. BE 컨트롤러(`/api/v1/setting/bp-admins`)는 사용자가 별도 `develop` 푸시.

**Tech Stack:** Next.js 16 App Router, TanStack Query, Zustand, Zod 4, AG Grid, Axios. 테스트 프레임워크 없음 → 검증은 `pnpm lint` + `pnpm build` + 브라우저 수동 QA.

**참고 문서:** `docs/superpowers/specs/2026-05-21-admin-and-invitation-refactor-design.md`, `docs/plans/employee/staff-invitation-permission.md`.

**LNB 메뉴:** 본 프로젝트의 LNB는 `src/util/lnb-adapter.ts`가 DB `programs` 테이블 응답을 변환해 동적으로 만든다. 따라서 `/settings/admin` LNB 노출은 **BE programs seed 작업**으로 처리한다. FE plan에서는 라우트만 추가.

---

## Phase 0 — 준비

### Task 0: 브랜치/작업환경 확인

**Files:**
- Read only: 없음 (git 상태만 확인)

- [ ] **Step 1: 현재 브랜치/HEAD 확인**

Run: `git status -sb && git log -1 --oneline`
Expected: 첫 줄 `## feature/admin-and-invitation-refactor`, HEAD 커밋이 `docs: 직원 초대 권한 매핑 제거 + BP 관리자 관리 신설 설계 작성` (스펙 커밋).

- [ ] **Step 2: 로컬 워킹트리 깨끗 + 기존 dev 서버 충돌 없는지 확인**

Run: `git status -s | grep -v '^??' || echo CLEAN`
Expected: `CLEAN`. (untracked 파일은 무시.)

- [ ] **Step 3: dev 서버 백그라운드 동작 확인 (이미 띄워져 있음)**

Run: `lsof -i :3000 -sTCP:LISTEN -t || true`
Expected: 비어 있어도 됨 (Phase 1·2 코드 수정 중에는 자동 재컴파일 확인용으로만 사용).

---

## Phase 1 — 작업 1번: 직원 초대 권한 매핑 삭제 (FE)

### Task 1: `StaffInvitationPop.tsx` 정리

**Files:**
- Modify: `src/components/employee/employeeinfo/StaffInvitationPop.tsx`

이 task는 한 파일에서 5개 영역을 제거한다. 각 영역마다 step 1개씩.

- [ ] **Step 1: import 라인 정리 (L1–L20)**

Edit `src/components/employee/employeeinfo/StaffInvitationPop.tsx`:

기존:
```tsx
import { useState, useMemo } from 'react'
import { OWNER_CODE } from '@/constants/owner-code'
import { AUTHORITY_KIND } from '@/constants/authority-kind'
```
→ 교체:
```tsx
import { useState, useMemo } from 'react'
import { OWNER_CODE } from '@/constants/owner-code'
```

기존:
```tsx
import { useAuthorityOptionsForEmployeeInvitation } from '@/hooks/queries/use-authority-queries'
```
→ **줄 전체 삭제**.

- [ ] **Step 2: state 제거 (L96)**

기존:
```tsx
  const [invitedAuthorityId, setInvitedAuthorityId] = useState<number | null>(null)
```
→ **줄 전체 삭제**.

- [ ] **Step 3: 화이트리스트 가드 제거 (L247–253)**

기존:
```tsx
    // 권한 ID 화이트리스트 가드 — 토글이 매핑하는 targetAuthority.id 외의 임의 값 차단 (mass-assignment 방지).
    // (진짜 방어선은 BE 의 호출자 affiliation 검증이며 FE 가드는 회귀/변조 차단 및 UX 강건성용)
    if (invitedAuthorityId != null && invitedAuthorityId !== targetAuthority?.id) {
      await alert('선택한 권한이 유효하지 않습니다. 다시 시도해주세요.')
      setInvitedAuthorityId(null)
      return
    }

```
→ **블록 전체 삭제** (앞 빈 줄 1개 유지).

- [ ] **Step 4: payload에서 `invitedAuthorityId` 키 제거 (~L326)**

`requestData: PostEmployeeInfoRequest = { … }` 객체 안에서:
```tsx
        invitedAuthorityId,
```
→ **줄 전체 삭제**.

- [ ] **Step 5: hook 호출 + 파생 변수 일괄 제거 (~L420–L435)**

기존:
```tsx
  const { data: authorityOptionList = [], isPending: authorityLoading, isError: authorityError } =
    useAuthorityOptionsForEmployeeInvitation({
      storeId: storeId ?? undefined,
      headOfficeOrganizationId: headOfficeOrganizationId ?? undefined,
    })

  // 직원 초대 권한 후보는 BE 가 is_deleted=false + is_used=true + is_default=true 인 권한만 내림.
  // 점포 선택 여부에 따라 매핑할 권한 종류가 정해짐:
  //   - 점포 선택 O → PRKND_004 (점포관리자)
  //   - 점포 선택 X → PRKND_003 (본사직원)
  // 각 종류에 기초 권한은 최대 1건만 존재. 토글 UI 로 권한 부여 여부만 결정.
  const targetAuthorityKind = storeId != null ? AUTHORITY_KIND.STORE_MANAGER : AUTHORITY_KIND.HEAD_OFFICE_EMPLOYEE
  const targetAuthority = authorityOptionList.find(
    (a) => a.authority_kind === targetAuthorityKind && a.is_used && a.is_default === true
  )
```
→ **블록 전체 삭제**.

- [ ] **Step 6: 가맹점 onChange에서 `setInvitedAuthorityId(null)` 제거 (~L592)**

기존:
```tsx
                              onChange={(opt) => {
                                setFranchiseOrganizationId(opt?.value ? Number(opt.value) : null)
                                // 가맹점 변경 시 점포 자동 초기화 + 권한 후보 무효화
                                setStoreId(null)
                                setInvitedAuthorityId(null)
                              }}
```
→ 교체:
```tsx
                              onChange={(opt) => {
                                setFranchiseOrganizationId(opt?.value ? Number(opt.value) : null)
                                // 가맹점 변경 시 점포 자동 초기화
                                setStoreId(null)
                              }}
```

- [ ] **Step 7: 점포 onChange에서 `setInvitedAuthorityId(null)` 제거 (~L618)**

기존:
```tsx
                          onChange={(opt) => {
                            setStoreId(opt?.value ? Number(opt.value) : null)
                            // 점포 변경 시 권한 후보 본사가 바뀔 수 있으므로 reset
                            setInvitedAuthorityId(null)
                          }}
```
→ 교체:
```tsx
                          onChange={(opt) => {
                            setStoreId(opt?.value ? Number(opt.value) : null)
                          }}
```

- [ ] **Step 8: "Partner Office 권한" `<tr>` 전체 제거 (~L630–L660)**

기존 `<tr>` 시작 `<th>Partner Office 권한</th>` 부터 닫는 `</tr>` 까지 **블록 전체 삭제**. 다음 `<tr>`(직원명 row)이 자연스럽게 이어지도록 유지.

- [ ] **Step 9: `tsc` 에러 0인지 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음. (`invitedAuthorityId` / `useAuthorityOptionsForEmployeeInvitation` / `AUTHORITY_KIND` 잔존 시 컴파일러가 잡아냄.)

- [ ] **Step 10: 잔존 참조 grep**

Run: `grep -n "invitedAuthorityId\|useAuthorityOptionsForEmployeeInvitation\|AUTHORITY_KIND" src/components/employee/employeeinfo/StaffInvitationPop.tsx || echo CLEAN`
Expected: `CLEAN`.

---

### Task 2: `types/employee.ts` 정리

**Files:**
- Modify: `src/types/employee.ts` (L69–71)

- [ ] **Step 1: `invitedAuthorityId` 필드 + 주석 2줄 제거**

기존:
```ts
  // 직원이 초대 후 가입 완료 시 자동으로 매핑될 권한 ID.
  // null 또는 생략 시 권한 없음 (whaleerp 접근 불가).
  invitedAuthorityId?: number | null
```
→ **블록 전체 삭제** (앞뒤 빈 줄 정리).

- [ ] **Step 2: 잔존 참조 grep**

Run: `grep -rn "invitedAuthorityId" src/ || echo CLEAN`
Expected: `CLEAN`.

---

### Task 3: 권한 queries 훅 + query-keys 정리

**Files:**
- Modify: `src/hooks/queries/use-authority-queries.ts` (L90~)
- Modify: `src/hooks/queries/query-keys.ts` (L271~)

- [ ] **Step 1: `useAuthorityOptionsForEmployeeInvitation` 훅 제거**

`src/hooks/queries/use-authority-queries.ts` 파일에서 `useAuthorityOptionsForEmployeeInvitation` 라는 이름의 export 함수 블록 전체를 삭제. 동일 파일에서 그 함수만 사용하는 import (예: `getEmployeeAuthorityOptions`, `AuthorityEmployeeInvitationParams`)가 더 이상 안 쓰이면 함께 정리.

검증 Run: `grep -n "EmployeeInvitation\|employee-invitation" src/hooks/queries/use-authority-queries.ts || echo CLEAN`
Expected: `CLEAN`.

- [ ] **Step 2: `query-keys.ts`에서 `employeeInvitation` 키 + `AuthorityEmployeeInvitationParams` 인터페이스 제거**

`src/hooks/queries/query-keys.ts` L271–L289:

기존:
```ts
export interface AuthorityEmployeeInvitationParams {
  storeId?: number
  headOfficeOrganizationId?: number
}

export const authorityKeys = {
  all: ['authorities'] as const,
  lists: () => [...authorityKeys.all, 'list'] as const,
  list: (params: AuthorityListParams) => [...authorityKeys.lists(), params] as const,
  details: () => [...authorityKeys.all, 'detail'] as const,
  detail: (id: number) => [...authorityKeys.details(), id] as const,
  // 권한 후보 (selectbox 옵션) — Approach C 전용 endpoint × 2
  candidatesAll: () => [...authorityKeys.all, 'candidates'] as const,
  employeeInvitation: (params: AuthorityEmployeeInvitationParams) =>
    [...authorityKeys.candidatesAll(), 'employee-invitation', {
      storeId: params.storeId,
      headOfficeOrganizationId: params.headOfficeOrganizationId,
    }] as const,
  bpEdit: (bpId: number | null) =>
    [...authorityKeys.candidatesAll(), 'bp-edit', bpId] as const,
```
→ 교체:
```ts
export const authorityKeys = {
  all: ['authorities'] as const,
  lists: () => [...authorityKeys.all, 'list'] as const,
  list: (params: AuthorityListParams) => [...authorityKeys.lists(), params] as const,
  details: () => [...authorityKeys.all, 'detail'] as const,
  detail: (id: number) => [...authorityKeys.details(), id] as const,
  // 권한 후보 (selectbox 옵션) — BP 수정 전용 endpoint
  candidatesAll: () => [...authorityKeys.all, 'candidates'] as const,
  bpEdit: (bpId: number | null) =>
    [...authorityKeys.candidatesAll(), 'bp-edit', bpId] as const,
```

검증 Run: `grep -n "employeeInvitation\|AuthorityEmployeeInvitationParams" src/ -r || echo CLEAN`
Expected: `CLEAN`.

- [ ] **Step 3: `pnpm exec tsc --noEmit` 통과 확인**

Expected: 에러 없음.

---

### Task 4: `lib/api/employee.ts` 정리

**Files:**
- Modify: `src/lib/api/employee.ts` (L370~)

- [ ] **Step 1: 직원 초대용 권한 후보 fetch 함수 + endpoint 상수 제거**

`getEmployeeAuthorityOptions` (또는 동등 명칭) 함수 블록과 해당 endpoint 상수를 삭제. `authorityCandidateSchema` import는 BP 수정 fetch가 같은 파일에서 쓰면 유지, 아니면 정리.

검증 Run: `grep -n "EmployeeAuthorityOptions\|employee-invitation\|authorities/employee" src/lib/api/employee.ts || echo CLEAN`
Expected: `CLEAN`.

- [ ] **Step 2: `pnpm exec tsc --noEmit` 통과 확인**

Expected: 에러 없음. 다른 파일에서 이 함수를 import하던 곳은 Task 1·3에서 이미 제거되어야 정상.

---

### Task 5: `lib/schemas/authority.ts` 주석 정리

**Files:**
- Modify: `src/lib/schemas/authority.ts` (L275~)

- [ ] **Step 1: 주석 한 줄 갱신**

기존:
```ts
// 권한 후보 응답 스키마 (직원 초대 / BP 수정 selectbox 옵션 용도).
// BE 가 신규 endpoint /system/authorities/employee-invitation, /system/authorities/bp-edit 에서 반환.
```
→ 교체:
```ts
// 권한 후보 응답 스키마 (BP 수정 selectbox 옵션 용도).
// BE 가 신규 endpoint /system/authorities/bp-edit 에서 반환.
```

스키마 자체(`authorityCandidateSchema`, `authorityCandidateListResponseSchema`)는 **유지**.

---

### Task 6: Phase 1 검증 + 커밋

**Files:** 없음 (검증 + commit)

- [ ] **Step 1: lint 통과**

Run: `pnpm lint`
Expected: 에러 0 / warning 0. warning 발생 시 모두 해결.

- [ ] **Step 2: 빌드 통과**

Run: `pnpm build`
Expected: 빌드 성공. (BE 의 invitedAuthorityId 필드는 아직 살아있어도 FE는 그냥 안 보내고 끝 — 빌드 영향 없음.)

- [ ] **Step 3: dev 서버에서 직원 초대 화면 수동 확인**

브라우저: `http://localhost:3000/employee/info` → "초대" 모달 오픈.

확인 사항:
- "Partner Office 권한" row가 사라졌는지
- 본사/가맹점/점포 자동선택·잠금 정책은 그대로 동작하는지
- 직원명/연락처/계약 필드 입력 후 등록 시 권한 관련 에러 없이 200 응답인지 (BE가 아직 invitedAuthorityId를 받는 상태라도 무시되어 통과해야 함)

- [ ] **Step 4: 커밋**

Run:
```bash
git add -A
git status -s
```

스테이지에 Phase 1 변경 파일들만 잡혔는지 확인 (`StaffInvitationPop.tsx`, `types/employee.ts`, `use-authority-queries.ts`, `query-keys.ts`, `lib/api/employee.ts`, `lib/schemas/authority.ts`).

```bash
git commit -m "$(cat <<'EOF'
refactor: 직원 초대 권한 자동 매핑 UI/타입/훅 제거

invitedAuthorityId 및 useAuthorityOptionsForEmployeeInvitation 등
직원 초대 모달의 Partner Office 권한 토글 관련 코드를 일괄 제거.
authorityCandidateSchema 는 BP 수정에서 계속 사용하므로 유지.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — 작업 2번: `/settings/admin` BP 관리자 CRUD (FE)

> Phase 2 전체에서 BE 컨트롤러(`/api/v1/setting/bp-admins`)는 사용자가 별도 `develop` 푸시. FE는 계약을 가정한 채 스캐폴드 후, 실제 호출 검증은 Phase 3에서 BE 푸시 완료 시 수행.

### Task 7: `types/bp-admin.ts` 신설

**Files:**
- Create: `src/types/bp-admin.ts`

- [ ] **Step 1: 타입 파일 생성**

Write `src/types/bp-admin.ts`:

```ts
export type AdminType = 'HEAD_OFFICE' | 'FRANCHISE'

export interface BpAdminSearchParams {
  admin_id?: number
  admin_type?: AdminType
  head_office_organization_id?: number
  franchise_organization_id?: number
  authority_id?: number
  user_type?: string
  start_date?: string
  end_date?: string
  page?: number
  size?: number
}

export interface BpAdminFormData {
  adminType: AdminType
  headOfficeOrganizationId: number | null
  franchiseOrganizationId: number | null
  name: string
  userType: string
  department: string
  rank: string
  mobilePhone: string
  officePhone: string
  extensionNumber: string
  loginId: string
  password: string
  authorityId: number | null
  email: string
}
```

---

### Task 8: `lib/schemas/bp-admin.ts` 신설

**Files:**
- Create: `src/lib/schemas/bp-admin.ts`

- [ ] **Step 1: Zod 스키마 작성**

Write `src/lib/schemas/bp-admin.ts`:

```ts
import { z } from 'zod'
import { apiResponseSchema, pageResponseSchema } from '@/lib/schemas/api'
import { loginIdRegex } from '@/lib/schemas/admin'

export const adminTypeSchema = z.enum(['HEAD_OFFICE', 'FRANCHISE'])
export type AdminType = z.infer<typeof adminTypeSchema>

export const bpAdminItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  adminType: adminTypeSchema,
  headOfficeOrganizationId: z.number().nullable(),
  headOfficeOrganizationName: z.string().nullable(),
  franchiseOrganizationId: z.number().nullable(),
  franchiseOrganizationName: z.string().nullable(),
  authorityId: z.number().nullable(),
  authorityName: z.string().nullable(),
  loginId: z.string(),
  userType: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.string().nullable(),
})

export const bpAdminDetailSchema = bpAdminItemSchema.extend({
  department: z.string().nullable(),
  rank: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  officePhone: z.string().nullable(),
  extensionNumber: z.string().nullable(),
})

export type BpAdminItem = z.infer<typeof bpAdminItemSchema>
export type BpAdminDetail = z.infer<typeof bpAdminDetailSchema>

export const bpAdminListResponseSchema = apiResponseSchema(pageResponseSchema(bpAdminItemSchema))
export const bpAdminDetailResponseSchema = apiResponseSchema(bpAdminDetailSchema)
export const bpAdminIdCheckResponseSchema = apiResponseSchema(z.object({ available: z.boolean() }))

export const bpAdminCreateRequestSchema = z.object({
  adminType: adminTypeSchema,
  headOfficeOrganizationId: z.number(),
  franchiseOrganizationId: z.number().nullable(),
  name: z.string().min(1, '이름을 입력해주세요.'),
  userType: z.string(),
  department: z.string().optional().nullable(),
  rank: z.string(),
  mobilePhone: z.string().optional().nullable(),
  officePhone: z.string().optional().nullable(),
  extensionNumber: z.string().optional().nullable(),
  loginId: z.string().regex(loginIdRegex, '로그인 ID 형식이 올바르지 않습니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  authorityId: z.number(),
  email: z.string().email('이메일 형식이 올바르지 않습니다.'),
})

export const bpAdminUpdateRequestSchema = bpAdminCreateRequestSchema
  .omit({ loginId: true, password: true })
  .extend({
    password: z.string().min(8).optional().nullable(),
  })

export type BpAdminCreateRequest = z.infer<typeof bpAdminCreateRequestSchema>
export type BpAdminUpdateRequest = z.infer<typeof bpAdminUpdateRequestSchema>

export const bpAdminAuthorityCandidateSchema = z.object({
  id: z.number(),
  name: z.string(),
  authorityKind: z.string().nullable(),
  authorityKindName: z.string().nullable(),
  isUsed: z.boolean(),
})

export type BpAdminAuthorityCandidate = z.infer<typeof bpAdminAuthorityCandidateSchema>

export const bpAdminAuthorityCandidateListResponseSchema = apiResponseSchema(
  z.array(bpAdminAuthorityCandidateSchema),
)
```

> 응답 키 casing(camelCase 가정)은 BE 합의 시점에 한 번 정합성 확인이 필요. snake_case로 내려오면 본 스키마와 fetch 함수에서 변환 처리.

---

### Task 9: `lib/api/bp-admin.ts` 신설

**Files:**
- Create: `src/lib/api/bp-admin.ts`

- [ ] **Step 1: API 클라이언트 작성**

Write `src/lib/api/bp-admin.ts`:

```ts
import api, { getWithSchema, postWithSchema, putWithSchema } from '@/lib/api'
import {
  bpAdminListResponseSchema,
  bpAdminDetailResponseSchema,
  bpAdminIdCheckResponseSchema,
  bpAdminAuthorityCandidateListResponseSchema,
} from '@/lib/schemas/bp-admin'
import type {
  BpAdminCreateRequest,
  BpAdminUpdateRequest,
  BpAdminDetail,
  BpAdminAuthorityCandidate,
} from '@/lib/schemas/bp-admin'
import type { BpAdminSearchParams } from '@/types/bp-admin'

const BASE = '/api/v1/setting/bp-admins'

export async function fetchBpAdmins(params: BpAdminSearchParams, signal?: AbortSignal) {
  const response = await getWithSchema(BASE, bpAdminListResponseSchema, {
    params: {
      admin_id: params.admin_id,
      admin_type: params.admin_type,
      head_office_organization_id: params.head_office_organization_id,
      franchise_organization_id: params.franchise_organization_id,
      authority_id: params.authority_id,
      user_type: params.user_type,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      size: params.size ?? 50,
    },
    signal,
  })
  return response.data
}

export async function fetchBpAdminDetail(id: number, signal?: AbortSignal): Promise<BpAdminDetail> {
  const response = await getWithSchema(`${BASE}/${id}`, bpAdminDetailResponseSchema, { signal })
  return response.data
}

export async function createBpAdmin(data: BpAdminCreateRequest): Promise<BpAdminDetail> {
  const response = await postWithSchema(BASE, data, bpAdminDetailResponseSchema)
  return response.data
}

export async function updateBpAdmin(id: number, data: BpAdminUpdateRequest): Promise<BpAdminDetail> {
  const response = await putWithSchema(`${BASE}/${id}`, data, bpAdminDetailResponseSchema)
  return response.data
}

export async function deleteBpAdmin(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}

export async function checkBpAdminLoginId(loginId: string, signal?: AbortSignal): Promise<boolean> {
  const response = await getWithSchema(`${BASE}/login-id-check`, bpAdminIdCheckResponseSchema, {
    params: { loginId },
    signal,
  })
  return response.data.available
}

export async function resetBpAdminPassword(id: number): Promise<void> {
  await api.post(`${BASE}/${id}/reset-password`)
}

export interface BpAdminAuthorityCandidateParams {
  headOfficeOrganizationId: number
  franchiseOrganizationId?: number | null
}

export async function fetchBpAdminAuthorityCandidates(
  params: BpAdminAuthorityCandidateParams,
  signal?: AbortSignal,
): Promise<BpAdminAuthorityCandidate[]> {
  const response = await getWithSchema(
    `${BASE}/authorities`,
    bpAdminAuthorityCandidateListResponseSchema,
    {
      params: {
        headOfficeId: params.headOfficeOrganizationId,
        franchiseId: params.franchiseOrganizationId ?? undefined,
      },
      signal,
    },
  )
  return response.data
}
```

---

### Task 10: `query-keys.ts`에 `bpAdminKeys` 추가

**Files:**
- Modify: `src/hooks/queries/query-keys.ts`

- [ ] **Step 1: 키 팩토리 추가**

`adminKeys` 정의 바로 아래에 추가:

```ts
import type { BpAdminSearchParams } from '@/types/bp-admin'

export interface BpAdminListParams extends BpAdminSearchParams {
  page?: number
  size?: number
}

export const bpAdminKeys = {
  all: ['bp-admins'] as const,
  lists: () => [...bpAdminKeys.all, 'list'] as const,
  list: (params: BpAdminListParams) => [...bpAdminKeys.lists(), params] as const,
  details: () => [...bpAdminKeys.all, 'detail'] as const,
  detail: (id: number) => [...bpAdminKeys.details(), id] as const,
  selectOptions: () => [...bpAdminKeys.all, 'select-options'] as const,
  authorityCandidates: (headOfficeId: number, franchiseId?: number | null) =>
    [...bpAdminKeys.all, 'authority-candidates', { headOfficeId, franchiseId: franchiseId ?? null }] as const,
}
```

> `import` 라인은 파일 상단의 기존 type import 블록에 합친다.

---

### Task 11: `hooks/queries/use-bp-admin-queries.ts` 신설

**Files:**
- Create: `src/hooks/queries/use-bp-admin-queries.ts`

- [ ] **Step 1: 훅 작성**

Write `src/hooks/queries/use-bp-admin-queries.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bpAdminKeys, type BpAdminListParams } from './query-keys'
import {
  fetchBpAdmins,
  fetchBpAdminDetail,
  createBpAdmin,
  updateBpAdmin,
  deleteBpAdmin,
  checkBpAdminLoginId,
  resetBpAdminPassword,
  fetchBpAdminAuthorityCandidates,
  type BpAdminAuthorityCandidateParams,
} from '@/lib/api/bp-admin'
import type { BpAdminCreateRequest, BpAdminUpdateRequest } from '@/lib/schemas/bp-admin'

export function useBpAdminList(params: BpAdminListParams) {
  return useQuery({
    queryKey: bpAdminKeys.list(params),
    queryFn: ({ signal }) => fetchBpAdmins(params, signal),
  })
}

export function useBpAdminDetail(id: number) {
  return useQuery({
    queryKey: bpAdminKeys.detail(id),
    queryFn: ({ signal }) => fetchBpAdminDetail(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useCreateBpAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BpAdminCreateRequest) => createBpAdmin(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bpAdminKeys.lists() })
    },
  })
}

export function useUpdateBpAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BpAdminUpdateRequest }) => updateBpAdmin(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: bpAdminKeys.lists() })
      qc.invalidateQueries({ queryKey: bpAdminKeys.detail(vars.id) })
    },
  })
}

export function useDeleteBpAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteBpAdmin(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: bpAdminKeys.lists() })
      qc.removeQueries({ queryKey: bpAdminKeys.detail(id) })
    },
  })
}

export function useCheckBpAdminLoginId() {
  return useMutation({
    mutationFn: (loginId: string) => checkBpAdminLoginId(loginId),
  })
}

export function useResetBpAdminPassword() {
  return useMutation({
    mutationFn: (id: number) => resetBpAdminPassword(id),
  })
}

export function useBpAdminAuthorityCandidates(params: BpAdminAuthorityCandidateParams | null) {
  return useQuery({
    queryKey: bpAdminKeys.authorityCandidates(
      params?.headOfficeOrganizationId ?? 0,
      params?.franchiseOrganizationId,
    ),
    queryFn: ({ signal }) => fetchBpAdminAuthorityCandidates(params!, signal),
    enabled: params != null && Number.isFinite(params.headOfficeOrganizationId) && params.headOfficeOrganizationId > 0,
  })
}
```

- [ ] **Step 2: `tsc` 통과 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 0.

---

### Task 12: `search-stores.ts`에 `useBpAdminManageSearchStore` 추가

**Files:**
- Modify: `src/stores/search-stores.ts`

- [ ] **Step 1: 검색 스토어 추가**

기존 `// 관리자 관리 (system/admin)` 블록 바로 아래에 추가:

```ts
// BP 관리자 관리 (settings/admin)
import type { BpAdminSearchParams } from '@/types/bp-admin'
export const useBpAdminManageSearchStore = createFilterStore<BpAdminSearchParams>({})
```

> `import` 라인은 파일 상단의 기존 type import 블록과 합치는 것이 일관성 있음. 위 예시는 위치 이해용.

---

### Task 13: `BpAdminList.tsx` 컴포넌트 신설

**Files:**
- Create: `src/components/settings/admin/BpAdminList.tsx`

- [ ] **Step 1: 컴포넌트 작성**

> 청사진: `src/components/system/admin/AdminList.tsx`. cols와 데이터 형태만 다르고 AG Grid 구조/페이지네이션/등록 버튼은 동일 패턴 사용. 직접 그 파일을 옆에 열고 다음 매핑으로 적응:

| AdminList 필드 | BpAdminList 필드 |
|---|---|
| `admin_id` 등 컬럼 | `name`, `adminType`(셀 렌더러로 "본사 관리자"/"가맹 관리자" 변환), `headOfficeOrganizationName`, `franchiseOrganizationName`, `authorityName`, `loginId`, `userType`, `createdAt` |
| props `admins: AdminItem[]` | `admins: BpAdminItem[]` |

Write `src/components/settings/admin/BpAdminList.tsx`를 위 매핑으로 작성. 등록 버튼은 부모 `onRegister` 콜백 호출. row 클릭 시 `onRowClick(id)` 콜백.

핵심 가드:
- `adminType` 셀 렌더러:
  ```tsx
  ({ value }: { value: 'HEAD_OFFICE' | 'FRANCHISE' }) =>
    value === 'HEAD_OFFICE' ? '본사 관리자' : '가맹 관리자'
  ```
- AG Grid는 `'use client'` + `ModuleRegistry.registerModules([AllCommunityModule])` 가져오기.

- [ ] **Step 2: `pnpm exec tsc --noEmit` 통과**

Expected: 에러 0.

---

### Task 14: `BpAdminSearch.tsx` 컴포넌트 신설

**Files:**
- Create: `src/components/settings/admin/BpAdminSearch.tsx`

- [ ] **Step 1: 컴포넌트 작성**

> 청사진: `src/components/system/admin/AdminSearch.tsx`. 검색 필드만 갈아끼움.

검색 필드 구성:
- `adminType` (SearchSelect: 본사 관리자 / 가맹 관리자 / 전체)
- `headOfficeOrganizationId` (SearchSelect: `useBpHeadOfficeTree()` 옵션)
- `franchiseOrganizationId` (SearchSelect: 선택된 본사의 franchises)
- `authorityId` (SearchSelect: 단순 전체 권한 목록 — 검색용은 BE 필터링과 무관하게 사용자 보유 권한 select)
- `userType` (SearchSelect: `WORK_STATUS_OPTIONS` 그대로 재사용)
- 등록일 범위 (`RangeDatePicker`)

자동선택/잠금 (`staff-invitation-permission` 표준 재사용):
```tsx
import { OWNER_CODE } from '@/constants/owner-code'
import { useAuthStore } from '@/stores/auth-store'

// 안에서:
const ownerCode = useAuthStore((s) => s.authority?.ownerCode ?? null)
const isPlatformAdmin = ownerCode === OWNER_CODE.PLATFORM
const isHeadOfficeUser = ownerCode === OWNER_CODE.HEAD_OFFICE
const isFranchiseUser = ownerCode === OWNER_CODE.FRANCHISE

const isOfficeFixed = isHeadOfficeUser || isFranchiseUser // PLATFORM 단일본사 케이스는 옵션이 1개라 자연 잠금
const isFranchiseFixed = isFranchiseUser
const isAdminTypeFixed = isFranchiseUser // FRANCHISE 사용자는 FRANCHISE 고정
```

`isFranchiseUser` 시 컴포넌트 마운트 동안 `params.admin_type = 'FRANCHISE'` 강제. 본사/가맹 select는 자동선택 + `isDisabled`.

> 자동선택 트리거: bpTree 로드 완료 시점에서 `useEffect + useRef` 1회 적용 패턴 (`StaffInvitationPop` L460 부근 참조).

- [ ] **Step 2: `pnpm exec tsc --noEmit` 통과**

Expected: 에러 0.

---

### Task 15: `BpAdminForm.tsx` 컴포넌트 신설

**Files:**
- Create: `src/components/settings/admin/BpAdminForm.tsx`

- [ ] **Step 1: 컴포넌트 작성**

> 청사진: `src/components/system/admin/AdminForm.tsx`를 거의 그대로 가져오되 차이점만 적용.

**제거:**
- `inquiryResponderName` 필드 + 관련 JSX/onChange.

**신규 필드 (폼 최상단 그룹):**
```tsx
// 관리자 종류
<tr>
  <th>관리자 종류 <span className="red">*</span></th>
  <td>
    <SearchSelect
      options={[
        { value: 'HEAD_OFFICE', label: '본사 관리자' },
        { value: 'FRANCHISE', label: '가맹 관리자' },
      ]}
      value={...}
      onChange={(opt) => {
        const next = (opt?.value ?? 'HEAD_OFFICE') as AdminType
        onChange({
          adminType: next,
          // adminType 변경 시 자동 초기화
          franchiseOrganizationId: null,
          authorityId: null,
        })
      }}
      isDisabled={isAdminTypeFixed}
    />
  </td>
</tr>
```

```tsx
// 소속 본사
<tr>
  <th>소속 본사 <span className="red">*</span></th>
  <td>
    <SearchSelect
      options={headOfficeOptions}
      value={...}
      onChange={(opt) => onChange({
        headOfficeOrganizationId: opt?.value ? Number(opt.value) : null,
        // 본사 변경 시 가맹/권한 초기화
        franchiseOrganizationId: null,
        authorityId: null,
      })}
      isDisabled={isOfficeFixed}
    />
  </td>
</tr>
```

```tsx
// 소속 가맹 (adminType === 'FRANCHISE' 일 때만)
{formData.adminType === 'FRANCHISE' && (
  <tr>
    <th>소속 가맹 <span className="red">*</span></th>
    <td>
      <SearchSelect
        options={franchiseOptions}
        value={...}
        onChange={(opt) => onChange({
          franchiseOrganizationId: opt?.value ? Number(opt.value) : null,
          authorityId: null, // 가맹 변경 시 권한 초기화
        })}
        isDisabled={isFranchiseFixed && formData.franchiseOrganizationId != null}
      />
    </td>
  </tr>
)}
```

**권한 select 데이터:**
```tsx
const authorityCandidatesParams =
  formData.headOfficeOrganizationId != null &&
  (formData.adminType === 'HEAD_OFFICE' || formData.franchiseOrganizationId != null)
    ? {
        headOfficeOrganizationId: formData.headOfficeOrganizationId,
        franchiseOrganizationId:
          formData.adminType === 'FRANCHISE' ? formData.franchiseOrganizationId : null,
      }
    : null

const { data: authorityCandidates = [], isPending: authorityLoading } =
  useBpAdminAuthorityCandidates(authorityCandidatesParams)
```

**권한 select JSX:**
```tsx
<SearchSelect
  options={authorityCandidates.map((a) => ({ value: String(a.id), label: a.name }))}
  value={...}
  onChange={(opt) => onChange({ authorityId: opt?.value ? Number(opt.value) : null })}
  isDisabled={authorityCandidatesParams == null || authorityLoading}
  placeholder={
    authorityCandidatesParams == null
      ? '본사/가맹 선택 후 권한 부여 가능'
      : '권한 선택'
  }
/>
```

**자동선택/잠금 (mount 시):**
- ownerCode 기반 분기는 `BpAdminSearch`와 동일. mode='create'일 때만 자동선택 적용 (edit에서는 서버 응답값으로 init되므로 별도 적용 X).

**`getInitialFormData(admin?: BpAdminDetail | null): BpAdminFormData`** — 기존 `AdminForm`의 `getInitialFormData`를 참조하되 신규/제거 필드 반영.

- [ ] **Step 2: `pnpm exec tsc --noEmit` 통과**

Expected: 에러 0.

---

### Task 16: 라우트 페이지 3개 신설

**Files:**
- Create: `src/app/(sub)/settings/admin/page.tsx`
- Create: `src/app/(sub)/settings/admin/create/page.tsx`
- Create: `src/app/(sub)/settings/admin/[id]/page.tsx`

- [ ] **Step 1: `page.tsx` (목록) 작성**

> 청사진: `src/app/(sub)/system/admin/page.tsx`.

다음 매핑으로 적응:
- `useAdminList` → `useBpAdminList`
- `useAdminManageSearchStore` → `useBpAdminManageSearchStore`
- `AdminSearchParams` → `BpAdminSearchParams`
- `AdminSearch` → `BpAdminSearch`
- `AdminList` → `BpAdminList`
- 라우터 push: `/system/admin/create` → `/settings/admin/create`
- 라우터 push (row click): `/system/admin/{id}` → `/settings/admin/{id}`
- `Location title="관리자 관리"` → `Location title="BP 관리자 관리" list={['홈', '환경설정', 'BP 관리자 관리']}`

- [ ] **Step 2: `create/page.tsx` 작성**

> 청사진: `src/app/(sub)/system/admin/create/page.tsx`.

매핑:
- `useCreateAdmin` → `useCreateBpAdmin`
- `useCheckAdminLoginId` → `useCheckBpAdminLoginId`
- `AdminForm` → `BpAdminForm`
- 등록 성공 시 router push: `/settings/admin`
- Location: `BP 관리자 등록`

submit payload는 `BpAdminFormData` → `BpAdminCreateRequest` 매핑 (mobilePhone digit-only 처리 등 기존 패턴 그대로).

- [ ] **Step 3: `[id]/page.tsx` (상세/수정) 작성**

> 청사진: `src/app/(sub)/system/admin/[id]/page.tsx`.

매핑:
- `useAdminDetail` → `useBpAdminDetail`
- `useUpdateAdmin` → `useUpdateBpAdmin`
- `useDeleteAdmin` → `useDeleteBpAdmin`
- `useResetAdminPassword` → `useResetBpAdminPassword`
- `AdminForm mode="edit"` → `BpAdminForm mode="edit"`
- 라우터 백/리스트: `/system/admin` → `/settings/admin`
- Location: `BP 관리자 상세`

- [ ] **Step 4: `pnpm exec tsc --noEmit` 통과**

Expected: 에러 0.

---

### Task 17: Phase 2 검증 + 커밋

**Files:** 없음 (검증 + commit)

- [ ] **Step 1: lint**

Run: `pnpm lint`
Expected: 에러 0 / warning 0. (`react-hooks/set-state-in-effect` 위반 시 `useEffect + useRef + isOpen 가드` 패턴으로 재작성 — `StaffInvitationPop` L460 참조.)

- [ ] **Step 2: 빌드**

Run: `pnpm build`
Expected: 성공.

- [ ] **Step 3: dev 서버 라우트 진입 확인**

브라우저: `http://localhost:3000/settings/admin` 직접 접근 (LNB 미등록 상태). 목록 페이지가 렌더되고 검색 폼이 보이는지 확인. (BE 미배포 상태면 데이터 fetch는 실패해도 OK — UI 렌더 자체만 확인.)

- [ ] **Step 4: 커밋**

Run:
```bash
git add -A
git status -s
```

스테이지 확인 후:
```bash
git commit -m "$(cat <<'EOF'
feat(settings): /settings/admin 본사/가맹 BP 관리자 CRUD 신설

- types/bp-admin, schemas/bp-admin, api/bp-admin 등 데이터 레이어 추가
- useBpAdmin* 쿼리 훅 + bpAdminKeys + useBpAdminManageSearchStore 추가
- BpAdminList/Search/Form 컴포넌트 + /settings/admin 라우트 3종 신설
- 권한별 자동선택/잠금 정책은 staff-invitation-permission 표준 재사용
- LNB 노출은 BE programs seed 작업으로 처리 (FE plan 범위 외)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — 통합 검증 + PR

### Task 18: BE 연동 후 수동 QA 매트릭스

> Phase 3은 BE 컨트롤러가 `develop`에 푸시되고 develop을 머지 받은 시점에 수행.

**Files:** 없음 (브라우저 QA)

- [ ] **Step 1: develop 동기화**

Run:
```bash
git fetch origin develop
git merge origin/develop
```

충돌 발생 시 해결 후 `pnpm install && pnpm build` 재확인.

- [ ] **Step 2: 직원 초대 정상 동작 (Phase 1 회귀 확인)**

`PLATFORM` / `HEAD_OFFICE` / `FRANCHISE` 권한 계정 각각으로 로그인 → 직원 초대 모달 → 권한 row 없음 + 정상 등록.

- [ ] **Step 3: BP 관리자 CRUD QA 매트릭스**

| 계정 권한 | 시나리오 | 기대 |
|---|---|---|
| PLATFORM (다중본사) | 본사 자유 선택 후 본사 관리자 등록 | 권한 옵션이 선택 본사가 보유한 권한만 노출, 등록 성공 |
| PLATFORM (다중본사) | adminType=가맹 → 본사·가맹 자유 선택 → 등록 | franchiseOrganizationId 필수, 등록 성공 |
| HEAD_OFFICE | 본사/adminType 자동선택+잠금, adminType=가맹으로 변경 → 산하 가맹만 노출 | 옵션 제한 + 등록 성공 |
| HEAD_OFFICE | 검색에서 adminType=본사+자기본사 외 → 자기본사 데이터만 응답 | 데이터 격리 (BE 검증) |
| FRANCHISE | adminType=FRANCHISE 고정, 본사·가맹 자동선택+잠금 | 등록 성공 (자기 가맹) |
| FRANCHISE | 검색 결과 자기 가맹만 노출 | 격리 (BE 검증) |
| 공통 | adminType 토글 → 권한 select / 가맹 select 자동 초기화 | 값이 null로 리셋됨 |
| 공통 | 본사 변경 → 권한 select / 가맹 select 자동 초기화 | 값이 null로 리셋됨 |
| 공통 | 가맹 변경 → 권한 select 자동 초기화 | 값이 null로 리셋됨 |
| 공통 | 로그인 ID 중복 체크 | 정상 동작 |
| 공통 | 수정/삭제/비밀번호 초기화 | 정상 동작 |
| 공통 | LNB에서 `환경설정 > BP 관리자 관리` 진입 | 라우트 진입 가능 (BE seed 완료 시) |

- [ ] **Step 4: 발견 이슈 fix**

발견된 버그는 같은 브랜치에서 `fix(settings):` 접두사 커밋으로 push.

---

### Task 19: PR 작성

**Files:** 없음 (gh CLI)

- [ ] **Step 1: 브랜치 push**

Run:
```bash
git push -u origin feature/admin-and-invitation-refactor
```

- [ ] **Step 2: PR 생성**

Run:
```bash
gh pr create --base develop --title "feat: 직원 초대 권한 매핑 제거 + /settings/admin BP 관리자 CRUD 신설" --body "$(cat <<'EOF'
## Summary
- 직원 초대 모달의 invitedAuthorityId 자동 매핑 UI/타입/훅 일괄 제거
- /settings/admin 신규 페이지에 본사/가맹 BP 관리자 CRUD 구현 (목록·검색·등록·수정·삭제·비밀번호 초기화)
- 권한별 자동선택/잠금 정책은 staff-invitation-permission 표준 재사용

## Test plan
- [ ] PLATFORM/HEAD_OFFICE/FRANCHISE 각 계정으로 직원 초대 모달 정상 동작
- [ ] /settings/admin 목록/검색이 권한별 데이터 격리(BE) 동작
- [ ] BpAdminForm: adminType/본사/가맹 변경 시 하위 필드 자동 초기화
- [ ] 권한 select가 선택된 BP의 권한만 노출
- [ ] 로그인 ID 중복 체크, 수정, 삭제, 비밀번호 초기화 정상 동작
- [ ] LNB 'BP 관리자 관리' 항목 진입 가능 (BE programs seed 완료 후)

## Related
- Spec: docs/superpowers/specs/2026-05-21-admin-and-invitation-refactor-design.md
- Plan: docs/superpowers/plans/2026-05-21-admin-and-invitation-refactor.md
- 표준 정책: docs/plans/employee/staff-invitation-permission.md

## BE 의존성 (develop 직접 푸시 항목)
- member_invited_authority 관련 컬럼/테이블 제거 Flyway + 자동 매핑 로직 제거
- /api/v1/setting/bp-admins 컨트롤러/서비스 신규
- programs 테이블 '환경설정 > BP 관리자 관리' seed
EOF
)"
```

- [ ] **Step 3: PR URL 출력**

Run: `gh pr view --json url -q .url`

머지는 상사가 수행. 어시스턴트/사용자는 직접 머지하지 않음.

---

## 자체 검토 결과 (writing-plans self-review)

1. **Spec coverage:**
   - Spec §3.1 (StaffInvitationPop 정리) → Task 1
   - Spec §3.1 (types/employee.ts) → Task 2
   - Spec §3.1 (use-authority-queries + query-keys) → Task 3
   - Spec §3.1 (lib/api/employee.ts) → Task 4
   - Spec §3.1 (lib/schemas/authority.ts 주석) → Task 5
   - Spec §3.3 검증 → Task 6
   - Spec §4.1 (라우트 3종) → Task 16
   - Spec §4.2 (LNB) → Plan 헤더 + Task 18 Step 3 (BE seed 작업으로 명시)
   - Spec §4.3 (컴포넌트 3종) → Task 13/14/15
   - Spec §4.4 (타입/스키마) → Task 7/8
   - Spec §4.5 (API 훅 + store) → Task 11/12
   - Spec §4.6 (API 계약) → Task 9
   - Spec §4.7 (폼 필드 차이) → Task 15
   - Spec §4.8 (권한별 동작) → Task 14/15에 분기 명시
   - Spec §4.9 검증 → Task 17, Task 18
   - Spec §6 열린 항목: LNB 데이터 파일 → 해결(programs DB seed), endpoint prefix → `/api/v1/setting/bp-admins`로 확정, BpAdminDetail 표시 필드 → 스키마에서 `headOfficeOrganizationName`/`franchiseOrganizationName`/`authorityName`로 가정

2. **Placeholder scan:** "TBD"/"implement later"/"add appropriate" 없음. 청사진 참조형 step(Task 13/14/15/16)은 매핑 표로 구체화함.

3. **Type consistency:** `BpAdminItem`/`BpAdminDetail`/`BpAdminCreateRequest`/`BpAdminUpdateRequest`/`BpAdminAuthorityCandidate`/`BpAdminAuthorityCandidateParams`/`BpAdminFormData`/`BpAdminSearchParams`/`BpAdminListParams`/`AdminType` — Task 7~11 사이 명칭·시그니처 일관. `bpAdminKeys.authorityCandidates(headOfficeId, franchiseId)`는 `useBpAdminAuthorityCandidates`/`fetchBpAdminAuthorityCandidates`에서 동일 키로 사용됨.
