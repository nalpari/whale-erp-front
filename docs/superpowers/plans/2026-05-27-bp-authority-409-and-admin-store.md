# BP/관리자 권한 수정 409 대응 + BP 관리자 폼 점포 필드 추가 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BP/관리자 권한 수정 시 409 무결성 충돌에 대한 FE 핸들러 표준화 + BP 관리자 폼에 `storeId` 점포 필드 추가, BE 동시 작업으로 본사 BP 자기참조 노출 누수까지 정리.

**Architecture:** 작업 1 — 새로운 `conflict-handler.ts` 유틸을 도입해 3개 권한 수정 화면(BpForm, BpAdminEditContent, AdminEditContent) catch 블록에서 공통 호출. 작업 3 — `BpAdminFormData`에 `storeId` 필드를 추가하고 BpAdminForm에 본사/가맹점 row 다음 점포 selectbox를 끼워 넣되 기존 자동선택/잠금 정책 매트릭스는 그대로 유지. 작업 2는 BE 처리이며 FE 변경 없음. 본 PR은 develop 기준 한 브랜치(`feature/bp-authority-409-and-admin-store`)에서 3개 커밋 그룹으로 진행.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query v5, Zod 4, TypeScript strict, Axios, ESLint flat config. 단위 테스트 인프라 없음 → 검증은 `pnpm lint` + `pnpm build` + 수동 회귀(`pnpm dev`).

---

## File Structure

**Create**
- `src/lib/api/conflict-handler.ts` — 409 감지 + dev 진단 + 한국어 fallback alert + 캐시 invalidate 콜백을 묶은 유틸 (작업 1)

**Modify (작업 1 — 409 핸들러 연결)**
- `src/components/master/bp/BpForm.tsx` — `handleSave` catch 블록
- `src/app/(sub)/settings/admin/[id]/page.tsx` — `BpAdminEditContent.handleSave` catch 블록
- `src/app/(sub)/system/admin/[id]/page.tsx` — `AdminEditContent.handleSave` catch 블록

**Modify (작업 3 — 점포 필드)**
- `src/types/bp-admin.ts` — `BpAdminFormData.storeId` 추가
- `src/lib/schemas/bp-admin.ts` — `bpAdminItemSchema`, `bpAdminDetailSchema`, `bpAdminCreateRequestSchema`, `bpAdminUpdateRequestSchema` 에 `storeId` (+ list/detail 응답엔 `storeName`) 추가
- `src/components/settings/admin/BpAdminForm.tsx` — 점포 row UI + 본사/가맹 변경 시 자동 초기화 + edit 모드 stale storeId 가드 + 점포 화이트리스트 가드
- `src/app/(sub)/settings/admin/create/page.tsx` — `handleSave` 의 Zod payload에 `storeId` 매핑
- `src/app/(sub)/settings/admin/[id]/page.tsx` — `handleSave` 의 Zod payload에 `storeId` 매핑

**No change (작업 2 — BE 처리)**
- 변경 파일 없음. PR description에 회귀 항목만 명시.

---

## Task 1: 409 핸들러 공통 유틸 추가

**Files:**
- Create: `src/lib/api/conflict-handler.ts`

- [ ] **Step 1: 새 유틸 파일 작성**

```ts
// src/lib/api/conflict-handler.ts
import { AxiosError } from 'axios'

export type ConflictContext =
  | 'BP_AUTHORITY'
  | 'BP_ADMIN_AUTHORITY'
  | 'PLATFORM_ADMIN_AUTHORITY'

interface ErrorResponseBody {
  message?: string
  code?: string
}

interface HandleConflictOptions {
  context: ConflictContext
  payload: unknown
  prevSnapshot?: unknown
  alert: (msg: string) => Promise<void> | void
  invalidate?: () => void
}

const FALLBACK_MESSAGE: Record<ConflictContext, string> = {
  BP_AUTHORITY:
    '권한 변경이 BP의 기존 권한 관계와 충돌합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
  BP_ADMIN_AUTHORITY:
    '권한 변경이 다른 데이터와 충돌합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
  PLATFORM_ADMIN_AUTHORITY:
    '권한 변경이 다른 데이터와 충돌합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
}

/**
 * 409 (CONFLICT) 응답인지 검사.
 */
export function isConflictError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 409
}

/**
 * 권한 변경 시 발생하는 409 무결성 충돌을 표준 처리한다.
 *
 * 반환값:
 *  - true  → 본 함수가 사용자 알림과 invalidate를 수행함. 상위 catch는 추가 처리 불필요.
 *  - false → 409가 아니거나 처리 불가능 → 상위 catch가 일반 에러 메시지로 처리.
 *
 * dev 환경에서만 console.group 으로 payload diff + ErrorResponse 진단 출력.
 */
export async function handleAuthorityConflict(
  error: unknown,
  opts: HandleConflictOptions,
): Promise<boolean> {
  if (!isConflictError(error)) return false

  const axiosError = error as AxiosError<ErrorResponseBody>
  const body = axiosError.response?.data
  const beMessage = body?.message?.trim()
  const message = beMessage && beMessage.length > 0
    ? beMessage
    : FALLBACK_MESSAGE[opts.context]

  if (process.env.NODE_ENV === 'development') {
    console.group(`[Authority Conflict] ${opts.context}`)
    console.warn('status:', axiosError.response?.status)
    console.warn('errorBody:', body)
    console.warn('payload:', opts.payload)
    if (opts.prevSnapshot !== undefined) {
      console.warn('prevSnapshot:', opts.prevSnapshot)
      console.warn('changedKeys:', diffKeys(opts.prevSnapshot, opts.payload))
    }
    console.groupEnd()
  }

  opts.invalidate?.()
  await opts.alert(message)
  return true
}

function diffKeys(prev: unknown, next: unknown): string[] {
  if (
    prev == null ||
    next == null ||
    typeof prev !== 'object' ||
    typeof next !== 'object'
  ) {
    return []
  }
  const prevObj = prev as Record<string, unknown>
  const nextObj = next as Record<string, unknown>
  const keys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)])
  const changed: string[] = []
  for (const key of keys) {
    if (!shallowEqual(prevObj[key], nextObj[key])) {
      changed.push(key)
    }
  }
  return changed
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (
    a != null &&
    b != null &&
    typeof a === 'object' &&
    typeof b === 'object'
  ) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  return false
}
```

- [ ] **Step 2: lint 통과 확인**

Run: `pnpm lint`
Expected: no errors related to new file.

- [ ] **Step 3: 빌드 통과 확인**

Run: `pnpm build`
Expected: build success, 새 모듈 포함됨.

- [ ] **Step 4: 커밋**

```bash
git add src/lib/api/conflict-handler.ts
git commit -m "$(cat <<'EOF'
feat(lib/api): 권한 변경 409 conflict-handler 유틸 추가

- isConflictError + handleAuthorityConflict 공통 처리
- ConflictContext 별 한국어 fallback 메시지
- dev 환경에서 payload diff + ErrorResponse 진단 로그
EOF
)"
```

---

## Task 2: BpForm 409 핸들러 연결 (master/bp/[id]/edit)

**Files:**
- Modify: `src/components/master/bp/BpForm.tsx`
- Modify: `src/hooks/queries/use-bp-queries.ts` (invalidate 콜백용 — 기존 onSuccess invalidate 유지)

- [ ] **Step 1: BpForm.tsx 의 import 영역에 핸들러 추가**

`src/components/master/bp/BpForm.tsx` 의 기존 import 블록(상단)에서 `@/lib/api` 와 동일한 라인 또는 그 아래에 다음 import를 추가한다:

```ts
import { handleAuthorityConflict } from '@/lib/api/conflict-handler'
import { useQueryClient } from '@tanstack/react-query'
import { bpKeys } from '@/hooks/queries/query-keys'
```

(기존 `import api, { getErrorMessage } from '@/lib/api'` 는 그대로 유지.)

- [ ] **Step 2: 컴포넌트 본문 상단에 queryClient + prevSnapshot 추가**

`const BpForm = (...) => {` 직후, `useAlert()` 호출 라인 근처에 다음을 추가한다:

```ts
  const queryClient = useQueryClient()
  // 409 진단용 — 폼이 시작될 때의 권한 ID 스냅샷
  const initialAuthorityId = bp?.authorityId ?? null
```

- [ ] **Step 3: handleSave catch 블록을 409 분기로 교체**

기존 `handleSave` 의 `catch` 블록을 다음으로 교체한다. (전후 `try { ... await updateBp(...)` 부분은 그대로 유지)

```ts
    } catch (error) {
      if (isEditMode) {
        const handled = await handleAuthorityConflict(error, {
          context: 'BP_AUTHORITY',
          payload: { ...form, id },
          prevSnapshot: { authorityId: initialAuthorityId },
          alert,
          invalidate: () => {
            queryClient.invalidateQueries({ queryKey: bpKeys.detail(id!) })
            queryClient.invalidateQueries({ queryKey: bpKeys.lists() })
          },
        })
        if (handled) return
      }
      await alert(
        getErrorMessage(error, isEditMode ? '수정에 실패했습니다.' : '등록에 실패했습니다.'),
      )
    }
```

상단 import 영역에서 `handleAuthorityConflict` 옆에 `isConflictError` 가 필요하다면 같이 추가한다. (위 패턴에선 `handleAuthorityConflict` 만 사용)

- [ ] **Step 4: lint + build**

Run: `pnpm lint && pnpm build`
Expected: both pass.

- [ ] **Step 5: 수동 회귀 (dev)**

```bash
pnpm dev
```

브라우저에서:
- `/master/bp/{id}/edit` 진입 → 권한 변경 → 저장
- BE 가 409 를 내려주면: 한국어 fallback alert + dev console 의 `[Authority Conflict] BP_AUTHORITY` 그룹 + payload/changedKeys 출력 확인
- 권한 외 다른 필드만 변경 시 409 안 떨어지면 핸들러 미발동 + 기존 성공 alert 그대로 표시 확인

- [ ] **Step 6: 커밋**

```bash
git add src/components/master/bp/BpForm.tsx
git commit -m "$(cat <<'EOF'
fix(master/bp): BpForm 권한 변경 409 핸들러 + dev 진단 연결

- handleAuthorityConflict 로 BP_AUTHORITY 컨텍스트 처리
- 409 시 BE message 우선 노출, 없으면 한국어 fallback alert
- 처리 후 bpKeys.detail/lists invalidate 로 stale 폼 차단
EOF
)"
```

---

## Task 3: BpAdminEditContent 409 핸들러 연결 (settings/admin/[id])

**Files:**
- Modify: `src/app/(sub)/settings/admin/[id]/page.tsx`

- [ ] **Step 1: import 영역에 핸들러 + queryClient 추가**

`src/app/(sub)/settings/admin/[id]/page.tsx` 의 기존 import 블록에 다음을 추가한다:

```ts
import { handleAuthorityConflict } from '@/lib/api/conflict-handler'
import { useQueryClient } from '@tanstack/react-query'
import { bpAdminKeys } from '@/hooks/queries/query-keys'
```

- [ ] **Step 2: BpAdminEditContent 내부에 queryClient + prevSnapshot 추가**

`function BpAdminEditContent(...) {` 본문 상단의 `const { mutateAsync: updateBpAdmin } = useUpdateBpAdmin()` 라인 위 혹은 아래에 다음 코드를 추가한다:

```ts
  const queryClient = useQueryClient()
  const initialAuthorityId = admin.authorityId
```

- [ ] **Step 3: handleSave catch 블록 교체**

기존 `handleSave` 의 마지막 `try { ... await updateBpAdmin(...) ... } catch { ... }` 를 다음으로 교체한다:

```ts
    try {
      await updateBpAdmin({ id: adminId, data: result.data })
      router.push('/settings/admin')
    } catch (error) {
      const handled = await handleAuthorityConflict(error, {
        context: 'BP_ADMIN_AUTHORITY',
        payload: { id: adminId, ...result.data },
        prevSnapshot: { authorityId: initialAuthorityId },
        alert,
        invalidate: () => {
          queryClient.invalidateQueries({ queryKey: bpAdminKeys.detail(adminId) })
          queryClient.invalidateQueries({ queryKey: bpAdminKeys.lists() })
        },
      })
      if (handled) return
      await alert('저장에 실패하였습니다. 잠시 후 다시 시도해주세요.')
    }
```

(기존 `catch {}` 의 인자 없는 형태에서 `catch (error)` 로 바뀐다는 점에 주의)

- [ ] **Step 4: lint + build**

Run: `pnpm lint && pnpm build`
Expected: both pass.

- [ ] **Step 5: 수동 회귀**

브라우저에서:
- `/settings/admin/{id}` 진입 → 권한 변경 → 저장
- 409 발생 시 한국어 alert + dev console `[Authority Conflict] BP_ADMIN_AUTHORITY` 그룹 출력 확인
- 권한 외 필드만 변경 → 핸들러 미발동, 기존 성공 흐름 유지

- [ ] **Step 6: 커밋**

```bash
git add src/app/\(sub\)/settings/admin/\[id\]/page.tsx
git commit -m "$(cat <<'EOF'
fix(settings/admin): BP 관리자 수정 409 핸들러 연결

- BP_ADMIN_AUTHORITY 컨텍스트로 handleAuthorityConflict 호출
- 처리 후 bpAdminKeys.detail/lists invalidate
EOF
)"
```

---

## Task 4: AdminEditContent 409 핸들러 연결 (system/admin/[id])

**Files:**
- Modify: `src/app/(sub)/system/admin/[id]/page.tsx`

- [ ] **Step 1: import 영역 보강**

`src/app/(sub)/system/admin/[id]/page.tsx` 에 다음 import 추가:

```ts
import { handleAuthorityConflict } from '@/lib/api/conflict-handler'
import { useQueryClient } from '@tanstack/react-query'
import { adminKeys } from '@/hooks/queries/query-keys'
```

- [ ] **Step 2: AdminEditContent 내부에 queryClient + prevSnapshot 추가**

`function AdminEditContent(...) {` 본문 상단에 다음 추가:

```ts
  const queryClient = useQueryClient()
  const initialAuthorityId = admin.authorityId ?? null
```

- [ ] **Step 3: handleSave catch 블록 교체**

기존 catch 블록을 다음으로 교체:

```ts
    try {
      await updateAdmin({ id: adminId, data: result.data })
      router.push('/system/admin')
    } catch (error) {
      const handled = await handleAuthorityConflict(error, {
        context: 'PLATFORM_ADMIN_AUTHORITY',
        payload: { id: adminId, ...result.data },
        prevSnapshot: { authorityId: initialAuthorityId },
        alert,
        invalidate: () => {
          queryClient.invalidateQueries({ queryKey: adminKeys.detail(adminId) })
          queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
        },
      })
      if (handled) return
      await alert('저장에 실패하였습니다. 잠시 후 다시 시도해주세요.')
    }
```

`AdminDetail` 타입에 `authorityId` 가 nullable이 아니면 `admin.authorityId` 그대로 사용, nullable이면 `?? null` 유지. 모르면 그대로 두면 됨.

- [ ] **Step 4: lint + build**

Run: `pnpm lint && pnpm build`
Expected: both pass.

- [ ] **Step 5: 수동 회귀**

브라우저에서:
- `/system/admin/{id}` 진입 → 권한 변경 → 저장
- 409 발생 시 한국어 alert + `[Authority Conflict] PLATFORM_ADMIN_AUTHORITY` 그룹 출력 확인

- [ ] **Step 6: 커밋**

```bash
git add src/app/\(sub\)/system/admin/\[id\]/page.tsx
git commit -m "$(cat <<'EOF'
fix(system/admin): 플랫폼 관리자 수정 409 핸들러 연결

- PLATFORM_ADMIN_AUTHORITY 컨텍스트로 handleAuthorityConflict 호출
- 처리 후 adminKeys.detail/lists invalidate
EOF
)"
```

---

## Task 5: BpAdminFormData 타입에 storeId 추가

**Files:**
- Modify: `src/types/bp-admin.ts`

- [ ] **Step 1: BpAdminFormData 인터페이스에 storeId 추가**

`src/types/bp-admin.ts` 의 `BpAdminFormData` 인터페이스에 마지막 필드로 `storeId` 추가:

```ts
export interface BpAdminFormData {
  adminType: AdminType
  headOfficeOrganizationId: number | null
  franchiseOrganizationId: number | null
  storeId: number | null   // ← 신규 (optional). 단일 선택, 미선택 시 null.
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

(필드 순서는 본사/가맹 다음, 인적정보 앞이 자연스럽다. 위치만 맞추면 됨.)

- [ ] **Step 2: lint 확인 — 이 시점에 BpAdminForm/page 두 군데에서 컴파일 에러가 나야 정상**

Run: `pnpm lint`

Expected: 후속 Task 6, 7, 8 에서 처리할 예정인 `getInitialFormData` 호출/사용처에서 missing property 에러가 발생할 수 있음. Task 6 에서 함께 보완.

Note: 빌드는 후속 Task 6 이후에 통과시킨다. 본 Step에서는 lint 결과만 확인 후 다음 Task로 넘어간다.

- [ ] **Step 3: 본 Task는 다음 Task와 함께 커밋 (분리 커밋 시 컴파일 깨짐)**

(별도 커밋 없이 Task 6 으로 진행)

---

## Task 6: bp-admin Zod 스키마에 storeId 추가

**Files:**
- Modify: `src/lib/schemas/bp-admin.ts`

- [ ] **Step 1: bpAdminItemSchema, bpAdminDetailSchema 에 storeId/storeName 추가**

`src/lib/schemas/bp-admin.ts` 의 `bpAdminItemSchema` 에 두 필드 추가:

```ts
export const bpAdminItemSchema = z.object({
  id: z.number(),
  memberId: z.number().nullable(),
  name: z.string(),
  loginId: z.string(),
  userType: z.string().nullable(),
  userTypeName: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  email: z.string().nullable(),
  organizationId: z.number(),
  organizationName: z.string(),
  organizationType: adminTypeSchema,
  parentOrganizationName: z.string().nullable(),
  authorityId: z.number().nullable(),
  authorityName: z.string().nullable(),
  storeId: z.number().nullable(),         // ← 신규
  storeName: z.string().nullable(),       // ← 신규
  createdAt: z.string().nullable(),
})
```

`bpAdminDetailSchema` 는 `bpAdminItemSchema.extend(...)` 로 정의되어 있어 자동 상속됨 → 별도 수정 불필요.

- [ ] **Step 2: bpAdminCreateRequestSchema, bpAdminUpdateRequestSchema 에 storeId 추가**

`bpAdminCreateRequestSchema` 끝에 다음 한 줄 추가 (`authorityId` 다음):

```ts
  storeId: z.number().nullable().optional(),
```

`bpAdminUpdateRequestSchema` 는 `.omit({...})` 형태라 자동 상속됨 → 별도 수정 불필요.

수정 후 형태:

```ts
export const bpAdminCreateRequestSchema = z.object({
  // ...(기존 필드 유지)
  organizationId: z.number({ message: '소속 조직을 선택해주세요.' }),
  authorityId: z.number({ message: '권한을 선택해주세요.' }),
  storeId: z.number().nullable().optional(),
})
```

- [ ] **Step 3: lint 확인 (스키마 단독 OK)**

Run: `pnpm lint`
Expected: 본 파일 자체 OK. BpAdminForm/page 에서 missing property 에러는 아직 남아있음 → Task 7 에서 해결.

---

## Task 7: BpAdminForm 점포 selectbox + 자동 초기화 + stale 가드

**Files:**
- Modify: `src/components/settings/admin/BpAdminForm.tsx`

- [ ] **Step 1: import 추가**

`src/components/settings/admin/BpAdminForm.tsx` 의 import 영역에 `useStoreOptions` 와 자동 초기화 핸들러 분리를 위한 `useEffect`(이미 import 됨) 를 활용한다.

다음 import 를 `useBpHeadOfficeTree` 옆에 추가:

```ts
import { useStoreOptions } from '@/hooks/queries/use-store-queries'
```

- [ ] **Step 2: getInitialFormData 에서 storeId 초기화**

기존 `getInitialFormData` 함수의 두 반환 객체에 `storeId` 매핑 추가:

```ts
export function getInitialFormData(admin?: BpAdminDetail | null): BpAdminFormData {
  if (admin) {
    const adminType: AdminType = admin.organizationType ?? 'HEAD_OFFICE'
    const headOfficeOrganizationId =
      adminType === 'HEAD_OFFICE' ? admin.organizationId : null
    const franchiseOrganizationId =
      adminType === 'FRANCHISE' ? admin.organizationId : null

    return {
      adminType,
      headOfficeOrganizationId,
      franchiseOrganizationId,
      storeId: admin.storeId,   // ← 신규. 임시값. stale 가드는 Task 7 Step 6 에서 적용
      name: admin.name || '',
      userType: admin.userType || 'MSTWK_001',
      department: admin.department || '',
      rank: admin.rank || '',
      mobilePhone: admin.mobilePhone?.replace(/\D/g, '') || '',
      officePhone: admin.officePhone?.replace(/\D/g, '') || '',
      extensionNumber: admin.extensionNumber || '',
      loginId: admin.loginId || '',
      password: '',
      authorityId: admin.authorityId,
      email: admin.email || '',
    }
  }
  return {
    adminType: 'HEAD_OFFICE',
    headOfficeOrganizationId: null,
    franchiseOrganizationId: null,
    storeId: null,   // ← 신규
    name: '',
    userType: 'MSTWK_001',
    department: '',
    rank: 'RNK_001',
    mobilePhone: '',
    officePhone: '',
    extensionNumber: '',
    loginId: '',
    password: '',
    authorityId: null,
    email: '',
  }
}
```

- [ ] **Step 3: useStoreOptions 훅 호출 + 옵션 가공**

`BpAdminForm` 함수 본문 안, `useBpAdminAuthorityCandidates` 호출 직후 또는 그 근처에 다음 코드를 추가:

```ts
  // 점포 옵션 — 본사(officeId)와 가맹(franchiseId) 둘 다 전달
  // - HEAD_OFFICE 관리자: officeId 만 전달
  // - FRANCHISE 관리자: officeId + franchiseId 둘 다 전달
  const storeQueryOfficeId = formData.headOfficeOrganizationId
  const storeQueryFranchiseId =
    formData.adminType === 'FRANCHISE' ? formData.franchiseOrganizationId : null

  const storeOptionsEnabled =
    storeQueryOfficeId != null &&
    (formData.adminType !== 'FRANCHISE' || storeQueryFranchiseId != null)

  const { data: storeOptionsData = [] } = useStoreOptions(
    storeQueryOfficeId,
    storeQueryFranchiseId,
    storeOptionsEnabled,
  )

  const storeOptions = storeOptionsData.map((s) => ({
    value: String(s.id),
    label: s.storeName,
  }))
```

- [ ] **Step 4: edit 모드 stale storeId 자동 null + dev warning**

`useEffect` 블록 추가. 기존 `franchiseParentResolvedRef` useEffect 아래에 다음 추가:

```ts
  // edit 모드 진입 후 storeId 가 옵션 목록에 없으면 자동 null 처리.
  // BP 소속 변경 이력 등으로 storeId 가 stale 한 경우 대비 (mass-assignment 방지 보조).
  const storeStaleResolvedRef = useRef(false)
  useEffect(() => {
    if (
      mode !== 'edit' ||
      storeStaleResolvedRef.current ||
      !storeOptionsEnabled ||
      formData.storeId == null
    ) {
      return
    }
    // 로딩 중이면 다음 effect 사이클까지 대기 — storeOptionsData 가 도착하면 다시 평가됨
    if (storeOptionsData.length === 0 && storeOptionsEnabled) {
      return
    }
    const found = storeOptionsData.some((s) => s.id === formData.storeId)
    if (!found) {
      storeStaleResolvedRef.current = true
      if (process.env.NODE_ENV === 'development') {
        console.warn('[BpAdminForm] stale storeId — auto reset', {
          storeId: formData.storeId,
          options: storeOptionsData,
        })
      }
      onChange({ storeId: null })
    } else {
      storeStaleResolvedRef.current = true
    }
  }, [mode, storeOptionsEnabled, storeOptionsData, formData.storeId, onChange])
```

(`useRef` 가 이미 import 되어 있는지 확인 — 본 파일은 이미 `import { useState, useRef, useEffect } from 'react'`)

- [ ] **Step 5: 본사·가맹 변경 핸들러에서 storeId 자동 초기화 추가**

기존 `onChange` 호출들 중 본사/가맹 변경 부분에 `storeId: null` 추가:

본사 SearchSelect 의 `onChange`:

```ts
                          onChange={(opt) =>
                            onChange({
                              headOfficeOrganizationId: opt?.value ? Number(opt.value) : null,
                              franchiseOrganizationId: null,
                              storeId: null,        // ← 추가
                              authorityId: null,
                            })
                          }
```

가맹 SearchSelect 의 `onChange`:

```ts
                            onChange={(opt) =>
                              onChange({
                                franchiseOrganizationId: opt?.value ? Number(opt.value) : null,
                                storeId: null,      // ← 추가
                                authorityId: null,
                              })
                            }
```

관리자 종류 라디오 두 군데 onChange:

```ts
                          onChange={() =>
                            onChange({
                              adminType: 'HEAD_OFFICE',
                              franchiseOrganizationId: null,
                              storeId: null,        // ← 추가
                              authorityId: null,
                            })
                          }
```

```ts
                          onChange={() =>
                            onChange({
                              adminType: 'FRANCHISE',
                              storeId: null,        // ← 추가
                              authorityId: null,
                            })
                          }
```

또한 FRANCHISE 계정 자동선택 effect의 `onChange` 와 HEAD_OFFICE 자동선택 effect의 `onChange` 에도 `storeId: null` 추가:

```ts
    if (isFranchiseUser) {
      const targetOffice = bpTree[0]
      const targetFranchise = targetOffice?.franchises[0]
      if (targetOffice && targetFranchise) {
        autoAppliedRef.current = true
        onChange({
          adminType: 'FRANCHISE',
          headOfficeOrganizationId: targetOffice.id,
          franchiseOrganizationId: targetFranchise.id,
          storeId: null,        // ← 추가
          authorityId: null,
        })
      }
    } else if (isHeadOfficeUser) {
      const targetOffice = bpTree[0]
      if (targetOffice) {
        autoAppliedRef.current = true
        onChange({
          headOfficeOrganizationId: targetOffice.id,
          franchiseOrganizationId: null,
          storeId: null,        // ← 추가
          authorityId: null,
        })
      }
    } else {
      autoAppliedRef.current = true
    }
```

- [ ] **Step 6: 점포 row UI 삽입**

본사/가맹점 row(`{/* 본사 / 가맹점 — 표준 filed-flx + block 패턴 */}`) 의 닫는 `</tr>` 직후에 다음 `<tr>` 추가:

```tsx
                {/* 점포 — optional, 단일 선택 */}
                <tr>
                  <th>점포</th>
                  <td>
                    <div className="filed-flx">
                      <div className="block">
                        <SearchSelect
                          options={storeOptions}
                          value={
                            formData.storeId != null
                              ? storeOptions.find(
                                  (opt) => opt.value === String(formData.storeId),
                                ) ?? null
                              : null
                          }
                          onChange={(opt) =>
                            onChange({
                              storeId: opt?.value ? Number(opt.value) : null,
                            })
                          }
                          isDisabled={!storeOptionsEnabled}
                          error={!!errors.storeId}
                          placeholder={
                            !storeOptionsEnabled
                              ? formData.adminType === 'FRANCHISE'
                                ? '가맹점을 먼저 선택해 주세요.'
                                : '본사를 먼저 선택해 주세요.'
                              : storeOptions.length === 0
                              ? '등록된 점포가 없습니다.'
                              : '점포 선택 (선택 사항)'
                          }
                        />
                        {errors.storeId && (
                          <div className="warning-txt mt5" role="alert">* {errors.storeId}</div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
```

`<th>점포</th>` 옆에 `<span className="red">*</span>` 는 붙이지 않는다 (필수 아님).

- [ ] **Step 7: lint + build**

Run: `pnpm lint && pnpm build`
Expected: both pass. (이 시점에 Task 5, 6 의 storeId 가 합쳐져 컴파일이 정상화된다.)

- [ ] **Step 8: 수동 회귀 (dev)**

```bash
pnpm dev
```

다음 시나리오 확인:
- `/settings/admin/create` 진입 (PLATFORM 계정)
  - 본사 미선택 상태에서 점포 selectbox 가 disabled + "본사를 먼저 선택해 주세요." 표시
  - 본사 선택 후 점포 옵션 로드, 선택 가능
  - 종류 = FRANCHISE 로 바꾸면 점포가 다시 disabled + "가맹점을 먼저 선택해 주세요."
  - 가맹 선택 시 점포 활성화
  - 본사/가맹/종류 변경 시 점포 선택값이 자동으로 비워짐
- `/settings/admin/{id}` 진입 (storeId 있는 admin)
  - 기존 점포가 selectbox 에 표시되는지 확인 (BE가 응답을 줘야 동작; BE 미준비 시 null 로 보이는 게 정상)
- 본사 BP/가맹 BP 계정 로그인 시
  - 본사·가맹은 잠금되지만 점포는 자유 선택 가능 (잠금 아님)

- [ ] **Step 9: 커밋 — Task 5/6/7 를 한 묶음 단위 커밋**

```bash
git add src/types/bp-admin.ts src/lib/schemas/bp-admin.ts src/components/settings/admin/BpAdminForm.tsx
git commit -m "$(cat <<'EOF'
feat(settings/admin): BpAdminFormData/스키마에 storeId 추가

- BpAdminFormData.storeId (단일, optional)
- bpAdminItemSchema/detail 에 storeId, storeName
- bpAdminCreateRequestSchema 에 storeId (optional)
- BpAdminForm 에 점포 row + useStoreOptions 연동
- 본사/가맹/종류 변경 시 storeId 자동 초기화
- edit 모드 stale storeId 자동 null + dev warning
EOF
)"
```

---

## Task 8: BP 관리자 등록/수정 페이지에서 storeId payload 매핑

**Files:**
- Modify: `src/app/(sub)/settings/admin/create/page.tsx`
- Modify: `src/app/(sub)/settings/admin/[id]/page.tsx`

- [ ] **Step 1: create/page.tsx 의 handleSave Zod payload 에 storeId 추가**

`src/app/(sub)/settings/admin/create/page.tsx` 의 `bpAdminCreateRequestSchema.safeParse({...})` 객체에 마지막 라인으로 `storeId` 추가:

```ts
    const result = bpAdminCreateRequestSchema.safeParse({
      name: formData.name.trim(),
      userType: formData.userType,
      department: formData.department.trim() || null,
      rank: formData.rank || null,
      mobilePhone: formData.mobilePhone.replace(/\D/g, '') || '',
      officePhone: formData.officePhone.replace(/\D/g, '') || null,
      extensionNumber: formData.extensionNumber.trim() || null,
      loginId: formData.loginId,
      password: formData.password,
      email: formData.email.trim() || null,
      organizationId: effectiveOrganizationId ?? undefined,
      authorityId: formData.authorityId ?? undefined,
      storeId: formData.storeId,   // ← 추가. null 도 허용 (optional + nullable)
    })
```

- [ ] **Step 2: [id]/page.tsx 의 handleSave Zod payload 에 storeId 추가**

`src/app/(sub)/settings/admin/[id]/page.tsx` 의 `bpAdminUpdateRequestSchema.safeParse({...})` 객체에 동일하게 추가:

```ts
    const result = bpAdminUpdateRequestSchema.safeParse({
      name: formData.name.trim(),
      userType: formData.userType,
      department: formData.department.trim() || null,
      rank: formData.rank || null,
      mobilePhone: formData.mobilePhone.replace(/\D/g, '') || '',
      officePhone: formData.officePhone.replace(/\D/g, '') || null,
      extensionNumber: formData.extensionNumber.trim() || null,
      email: formData.email.trim() || null,
      authorityId: formData.authorityId ?? undefined,
      storeId: formData.storeId,   // ← 추가
    })
```

- [ ] **Step 3: lint + build**

Run: `pnpm lint && pnpm build`
Expected: both pass.

- [ ] **Step 4: 수동 회귀**

```bash
pnpm dev
```

- `/settings/admin/create` 에서 점포 선택 후 저장 → Network 탭에서 POST body 에 `storeId: <number>` 포함 확인
- 점포 미선택 후 저장 → POST body 에 `storeId: null` 포함 (BE 수용 가정)
- `/settings/admin/{id}` 에서 점포 변경 후 저장 → PUT body 에 `storeId` 반영

- [ ] **Step 5: 커밋**

```bash
git add src/app/\(sub\)/settings/admin/create/page.tsx src/app/\(sub\)/settings/admin/\[id\]/page.tsx
git commit -m "$(cat <<'EOF'
feat(settings/admin): BP 관리자 등록/수정 payload 에 storeId 매핑

- POST/PUT body 에 storeId (null 가능) 포함
- Zod 스키마는 optional + nullable 로 BE 미준비 상태도 허용
EOF
)"
```

---

## Task 9: 통합 회귀 + lint/build 최종 통과

**Files:** (변경 없음, 검증만)

- [ ] **Step 1: 전체 lint + build 통과 확인**

Run: `pnpm lint && pnpm build`
Expected: errors 0, warnings 줄어들면 좋지만 신규 도입 0 이 최소 기준.

- [ ] **Step 2: 수동 회귀 시나리오 일괄 실행**

`pnpm dev` 후 다음 체크리스트:

작업 1 (409 핸들러):
- [ ] T1 `/master/bp/{id}/edit` 권한 변경 저장 — friendly alert + dev 로그 (BE 미수정 시) 또는 200 OK (BE 수정 후)
- [ ] T2 `/settings/admin/{id}` 권한 변경 저장 — 동일
- [ ] T3 `/system/admin/{id}` 권한 변경 저장 — 동일
- [ ] T4 권한 외 필드만 변경 — 200 OK, 핸들러 미동작
- [ ] T6 409 후 새로고침 → 재시도 — invalidate 정상 동작

작업 2 (BE):
- [ ] T7 본사 BP 계정 로그인 → `/settings/admin` — 자기 계정 미노출 (BE 처리)
- [ ] T8 플랫폼 계정 → `/settings/admin` — 본사 BP 가입 계정 미노출 (BE 처리)
- [ ] T9 본사 BP 계정 → `/master/bp/{id}` — 정상

작업 3 (점포 필드):
- [ ] T10 HEAD_OFFICE 등록, 점포 미선택 — storeId null
- [ ] T11 HEAD_OFFICE 등록, 점포 선택 — storeId 전송
- [ ] T12 FRANCHISE 등록, 본사·가맹·점포 모두 선택 — 정상
- [ ] T13 본사 변경 시 점포 자동 초기화
- [ ] T14 가맹 변경 시 점포 자동 초기화
- [ ] T15 점포 0건 BP/가맹 — disabled + "등록된 점포가 없습니다."
- [ ] T16 edit 모드 storeId 있는 admin — 기존 선택 표시
- [ ] T17 edit stale storeId — 자동 null + console.warn
- [ ] T18 PLATFORM — 점포 자유
- [ ] T19 HEAD_OFFICE — 점포 자유 (본사는 잠금)
- [ ] T20 FRANCHISE — 점포 자유 (본사·가맹 잠금)

- [ ] **Step 3: 커밋 없음**

검증만. 회귀 항목이 모두 통과해야 PR 작성으로 넘어간다.

---

## Task 10: PR 생성

**Files:** (없음)

- [ ] **Step 1: 변경 사항 확인**

Run: `git log develop..HEAD --oneline`
Expected: Task 1 / 2 / 3 / 4 / 7 / 8 까지 총 6개 커밋 + docs 커밋 1개 (총 7개).

- [ ] **Step 2: 원격 푸시**

```bash
git push -u origin feature/bp-authority-409-and-admin-store
```

- [ ] **Step 3: gh pr create — base 는 develop**

```bash
gh pr create --base develop --title "fix: BP/관리자 권한 변경 409 핸들러 + BP 관리자 폼 storeId 필드" --body "$(cat <<'EOF'
## Summary
- 권한 변경 시 BE가 내려주는 409 (CONFLICT) 를 표준 핸들러로 처리 (사용자 친화 메시지 + dev 진단 + 폼 캐시 invalidate)
- /settings/admin BP 관리자 폼에 점포 (storeId) 선택 필드 추가 — optional, 단일 선택
- 본사 BP 가입 계정의 BP 관리자 목록 노출은 BE 처리. FE 측은 회귀 항목만 보강

## BE 의존성 (선행 머지 필수)
- BE PR A — PUT /api/v1/master/bp/{id}, /api/v1/system/admins/{id}, /api/v1/system/bp-admins/{id} 권한 변경 시 409 무결성 충돌 원인 제거
- BE PR B — GET /api/v1/system/bp-admins 목록에서 본사 BP self-signup 계정 제외
- BE PR C — bp-admins 스키마에 storeId 추가, GET 응답에 storeId/storeName 포함, POST/PUT body 수용

## 변경 요약
**Phase 1 (409 핸들러):**
- 신규 src/lib/api/conflict-handler.ts — isConflictError + handleAuthorityConflict
- 수정 BpForm.tsx, settings/admin/[id]/page.tsx, system/admin/[id]/page.tsx — 각각 BP_AUTHORITY / BP_ADMIN_AUTHORITY / PLATFORM_ADMIN_AUTHORITY 컨텍스트로 핸들러 호출
- 409 시 BE message 우선, 없으면 한국어 fallback alert + 캐시 invalidate

**Phase 2 (점포 필드):**
- BpAdminFormData / bpAdminItemSchema / bpAdminCreateRequestSchema 에 storeId 추가
- BpAdminForm 본사/가맹점 row 다음에 점포 selectbox row 신규
- 본사/가맹/종류 변경 시 storeId 자동 초기화
- edit 모드 stale storeId 자동 null + dev warning
- create/edit page handleSave 에서 payload 에 storeId 매핑

**Phase 3 (BE 처리 — FE 변경 없음):**
- 본사 BP 가입 계정 BP 관리자 목록 제외 — BE에서 처리. 회귀 항목만 본 PR 에 명시.

## Test plan
작업 1 (409 핸들러):
- [x] /master/bp/{id}/edit 권한 변경 → friendly alert + dev 로그
- [x] /settings/admin/{id} 권한 변경 → 동일
- [x] /system/admin/{id} 권한 변경 → 동일
- [x] 권한 외 필드만 변경 → 200, 핸들러 미동작
- [x] 409 후 새로고침 → 재시도 정상

작업 2 (BE):
- [ ] 본사 BP 계정 로그인 → /settings/admin 자기 계정 미노출 (BE PR B 머지 후 검증)
- [ ] 플랫폼 계정 → /settings/admin 본사 BP 가입 계정 미노출

작업 3 (점포):
- [x] HEAD_OFFICE 등록, 점포 미선택/선택 — storeId null/number 전송
- [x] FRANCHISE 등록, 점포 선택 — 정상
- [x] 본사/가맹/종류 변경 시 점포 자동 초기화
- [x] 점포 0건 BP — disabled + placeholder
- [x] edit 모드 stale storeId — 자동 null + console.warn
- [x] PLATFORM/HEAD_OFFICE/FRANCHISE 계정별 점포 자유 선택 확인

## Related
- Spec: docs/superpowers/specs/2026-05-27-bp-authority-409-and-admin-store-design.md
- Plan: docs/superpowers/plans/2026-05-27-bp-authority-409-and-admin-store.md

## 머지 정책
어시스턴트/사용자 직접 머지 X. BE PR A/B/C 선행 머지 + 상사 리뷰 후 머지.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: PR URL 사용자에게 전달**

PR URL 을 출력 후, 머지 정책 준수를 상기시키고 사용자/상사 리뷰 대기.

---

## Self-Review Notes

- 스펙 모든 섹션 (1~10) 에 대해 Task 매핑됨:
  - 작업 1 → Task 1, 2, 3, 4
  - 작업 2 → Task 9 회귀 + Task 10 PR body 내 BE 의존성 명시 (FE 코드 변경 없음)
  - 작업 3 → Task 5, 6, 7, 8
  - 통합 회귀 → Task 9
  - PR → Task 10
- 잠금 정책 매트릭스 (스펙 §6) 는 Task 7 Step 5/6 에서 점포는 잠금 대상 아님 정책으로 정합.
- 에러 처리 (스펙 §5) 의 모든 케이스 (5.2 / 5.3) 는 Task 1 + Task 2/3/4 + Task 7 Step 4·5·6 에서 커버.
- 테스트 시나리오 (스펙 §7.1 / 7.2 / 7.3) 는 Task 9 Step 2 에서 일괄 체크리스트화.
- 작업 1 의 `BE 의존성` 문구는 Task 10 PR body 에 명시.

## Placeholder Scan

- 모든 코드 블록에 실제 코드 포함됨.
- "TODO / TBD / fill in later" 없음.
- 메서드 이름 일관성: `handleAuthorityConflict`, `isConflictError`, `ConflictContext` 가 Task 1 에 정의 후 Task 2/3/4 에서 동일 형태로 호출됨.
- 쿼리키 일관성: `bpKeys.detail/lists`, `bpAdminKeys.detail/lists`, `adminKeys.detail/lists` — query-keys.ts 의 정의와 일치.
