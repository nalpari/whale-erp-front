# BP/관리자 권한 수정 409 대응 + BP 관리자 폼 점포 필드 추가 (설계)

- 작성일: 2026-05-27
- 작성자: Dayoung
- 브랜치: `feature/bp-authority-409-and-admin-store` (base: `develop`)
- 관련: BE 동시 작업 PR 3건 (작업 1·2·3 각각)
- 머지 정책: BE PR 선행 머지 → 상사 리뷰 → 머지. 어시스턴트/사용자 직접 머지 금지.

## 1. 배경 / 문제

세 가지 독립적인 이슈를 한 PR로 묶어 처리한다. 모두 `/settings/admin` (PR #101)·`/master/bp/[id]/edit`·`/system/admin/[id]` 의 권한 관련 화면을 안정화하기 위한 작업이다.

1. **권한 수정 시 409 데이터 무결성 에러**
   - `PUT /api/v1/master/bp/{id}` 에서 `authorityId` 를 변경하면 409 가 떨어진다.
   - 동일 증상이 `PUT /api/v1/system/bp-admins/{id}` (`/settings/admin/[id]`), `PUT /api/v1/system/admins/{id}` (`/system/admin/[id]`) 에서도 보고됨.
   - BE 원인 미확정 → 본 스펙에서는 FE 측 진단 강화 + 사용자 메시지 개선 + 캐시 invalidate 가드를 표준화하고, BE 동시 작업으로 근본 수정.

2. **본사 BP 가입 계정이 BP 관리자 목록에 노출됨**
   - 본사 BP 회원가입 로직으로 만들어진 본사 BP 계정은 이미 `/master/...` 경로에서 플랫폼 관리자가 권한 수정/조회 가능.
   - 현재는 `/settings/admin` 에도 노출 → 본사 BP 본인이 자신의 권한을 수정할 수 있는 통제 누수.
   - **BE 에서 제외 처리**. FE 변경 없음. PR Description 회귀 테스트 항목만 추가.

3. **BP 관리자 등록/수정 폼에 점포 선택 필드 부재**
   - 관리자가 담당하는 점포를 등록·수정 시 지정할 수 있어야 함 (필수 아님).
   - 선택한 본사/가맹점 하위의 점포만 노출. 단일 선택. 기존 `/api/v1/stores/options` 재사용.

## 2. 목표 / 비범위

### 2.1 목표
- 409 발생 시 사용자에게 친절한 한국어 안내 + 폼 캐시 invalidate 로 즉시 새로고침 가능.
- dev 환경에서 409 페이로드 진단 로그 출력 → BE 분석 자료 확보.
- BP 관리자 폼에 `storeId` 필드 추가, 권한 정책(accountType 기반 자동선택/잠금)과 정합.
- 본사 BP 가입 계정 노출 누수 회귀 가드 (수동 테스트 항목 + 추후 추적).

### 2.2 비범위 (Out of scope)
- 권한 매트릭스 정책 자체 변경.
- BP 관리자 검색조건에 `storeId` 추가 (이번엔 폼만).
- 본사 BP 회원가입 로직 자체 수정.
- 다른 화면(직원, BP master 등) 의 점포 필드 도입.

## 3. 아키텍처 / 데이터 흐름

### 3.1 작업 1: 409 핸들러 흐름

```
[사용자] 권한 변경 → 폼 submit
  ↓
[FE] payload 정규화 (불필요 필드 제외)
  ↓
PUT /api/v1/master/bp/{id}   ←┐
PUT /api/v1/system/admins/{id}  ├─ 권한 변경 가능 3개 엔드포인트
PUT /api/v1/system/bp-admins/{id} ←┘
  ↓
[BE] 409 (CONFLICT) 시 ErrorResponse.message 포함
  ↓
[FE] 409 핸들러 (공통 유틸):
  1. dev: console.group + payload diff (이전 ↔ 신규) + ErrorResponse 출력
  2. 사용자: BE message 우선, 없으면 한국어 fallback alert
  3. 해당 entity 캐시 invalidate → 폼 stale 상태 차단
```

### 3.2 작업 3: 점포 필드 데이터 흐름

```
[BpAdminForm]
  본사 select         ── headOfficeOrganizationId
  가맹 select         ── franchiseOrganizationId (FRANCHISE 일 때만)
  점포 select (NEW)   ── storeId (optional)
  ↓
useStoreOptions(officeId, franchiseId)   // 이미 존재
  - HEAD_OFFICE: officeId = headOfficeOrganizationId, franchiseId = undefined
  - FRANCHISE:   officeId = headOfficeOrganizationId, franchiseId = franchiseOrganizationId
  ↓
GET /api/v1/stores/options?officeId&franchiseId  →  { id, storeName }[]
  ↓
사용자 선택 → form.storeId 갱신
  ↓
POST/PUT bp-admins  body에 storeId 포함 (null 가능)
```

### 3.3 초기화 흐름 (변경 의존성)

| 변경 필드 | 같이 초기화되는 필드 |
|---|---|
| adminType (본사 ↔ 가맹) | franchiseOrganizationId, **storeId**, authorityId |
| headOfficeOrganizationId | franchiseOrganizationId, **storeId**, authorityId |
| franchiseOrganizationId | **storeId**, authorityId |
| storeId | (없음) |

## 4. 컴포넌트 / 모듈

### 4.1 신규
- `src/lib/api/conflict-handler.ts`
  - `isConflictError(error: unknown): boolean`
  - `handleAuthorityConflict(error, opts): Promise<boolean>`

### 4.2 수정 (작업 1)
- `src/components/master/bp/BpForm.tsx` — `handleSave` catch 에서 핸들러 호출
- `src/components/settings/admin/BpAdminForm.tsx` 또는 부모 page — 동일
- `src/components/system/admin/...` (또는 동일 경로의 page) — 동일
- `src/hooks/queries/use-bp-queries.ts` — `useUpdateBp` onError dev 진단
- `src/hooks/queries/use-bp-admin-queries.ts` — `useUpdateBpAdmin` onError dev 진단
- `src/hooks/queries/use-admin-queries.ts` — `useUpdateAdmin` onError dev 진단

### 4.3 수정 (작업 3)
- `src/types/bp-admin.ts` — `BpAdminFormData.storeId: number | null` 추가
- `src/lib/schemas/bp-admin.ts`
  - `bpAdminItemSchema`, `bpAdminDetailSchema` 에 `storeId: number | null`, `storeName: string | null` 추가
  - `bpAdminCreateRequestSchema`, `bpAdminUpdateRequestSchema` 에 `storeId: number | null` 추가 (optional)
- `src/components/settings/admin/BpAdminForm.tsx`
  - 점포 row 추가 (본사/가맹점 row 다음 위치)
  - 본사·가맹 변경 핸들러에서 `storeId: null` 초기화
  - edit 진입 시 stale storeId 자동 null + dev warning
  - `useStoreOptions` 호출 분기

### 4.4 변경 없음 (작업 2)
- BE에서 본사 BP 가입 계정을 목록에서 제외 → FE 코드 변경 없음.

## 5. 에러 처리 / 예외 케이스

### 5.1 작업 1: 공통 유틸 명세

```ts
type ConflictContext = 'BP_AUTHORITY' | 'BP_ADMIN_AUTHORITY' | 'PLATFORM_ADMIN_AUTHORITY'

interface HandleConflictOptions {
  context: ConflictContext
  payload: unknown          // dev 진단용
  prevSnapshot?: unknown    // dev 진단용 (이전 값)
  alert: (msg: string) => Promise<void>
  invalidate?: () => void
}

export function isConflictError(error: unknown): boolean
export async function handleAuthorityConflict(error: unknown, opts: HandleConflictOptions): Promise<boolean>
```

- 반환 `boolean`: `true` = 핸들러가 처리(상위 catch fallthrough 차단), `false` = 상위 catch 일반 처리.
- BE message 우선, 없으면 컨텍스트별 한국어 fallback:
  - `BP_AUTHORITY`: "권한 변경이 BP의 기존 권한 관계와 충돌합니다. 화면을 새로고침한 뒤 다시 시도해 주세요."
  - `BP_ADMIN_AUTHORITY` / `PLATFORM_ADMIN_AUTHORITY`: "권한 변경이 다른 데이터와 충돌합니다. 화면을 새로고침한 뒤 다시 시도해 주세요."
- dev 진단:
  - `console.group('[Authority Conflict]', context)`
  - `error.response?.data` 출력
  - `prevSnapshot` ↔ `payload` 의 변경 키 diff 출력 (간단 key 비교)
  - `console.groupEnd()`

### 5.2 작업 1 예외

| 케이스 | 처리 |
|---|---|
| 409 외 에러 | `isConflictError` false → 핸들러 false 반환 → 상위 catch |
| network error (response 없음) | 동일 |
| BE message 친절 | fallback 미적용, 그대로 노출 |
| invalidate 후 재시도 | 정상 흐름 |

### 5.3 작업 3 예외

| 케이스 | 처리 |
|---|---|
| 본사 미선택 상태 (HEAD_OFFICE) / 가맹 미선택 (FRANCHISE) | 점포 selectbox `isDisabled` |
| 본사·가맹 변경 시 stale storeId | onChange 핸들러가 `storeId: null` 동시 세팅 |
| 옵션 API 로딩 실패 | 빈 옵션 + placeholder. 필수 아님이라 제출 가능 |
| 점포 옵션 0건 | "등록된 점포가 없습니다." placeholder + disabled |
| edit 진입 시 detail.storeId가 옵션에 없음 | 자동 null + dev warning (`console.warn('[BpAdminForm] stale storeId — auto reset', { storeId, options })`) |
| 옵션에 없는 storeId 가 submit 시도 (DOM 변조) | 화이트리스트 가드: 제출 거부, `errors.storeId = '선택한 점포가 유효하지 않습니다.'` |

### 5.4 폼 validate
- 점포는 필수 아님 → required check 미추가.
- 화이트리스트 가드만 추가.

## 6. 잠금 / 자동선택 정책 (accountType 기반)

작업 3 점포 필드는 기존 정책 매트릭스(PR #101)를 그대로 따른다.

| accountType | 종류 | 본사 | 가맹 | **점포** | 권한 |
|---|---|---|---|---|---|
| PLATFORM | 자유 | 자유 | 자유 | **자유** | 자유 |
| HEAD_OFFICE | 자유 | 자동선택 + 잠금 | 자유 | **자유** | 자유 |
| FRANCHISE | FRANCHISE 고정 + 잠금 | 자동선택 + 잠금 | 자동선택 + 잠금 | **자유** | 자유 |

점포는 항상 사용자 선택. 자동선택/잠금 대상 아님.

## 7. 테스트 전략

### 7.1 작업 1 회귀

| # | 시나리오 | 예상 |
|---|---|---|
| T1 | `/master/bp/{id}/edit` 권한 변경 저장 | (BE 수정 전) friendly alert + dev 로그 / (BE 수정 후) 200 |
| T2 | `/settings/admin/{id}` 권한 변경 저장 | 동일 |
| T3 | `/system/admin/{id}` 권한 변경 저장 | 동일 |
| T4 | 권한 외 필드만 변경 | 200, 핸들러 미동작 |
| T5 | network offline 시 저장 | 일반 에러 메시지 |
| T6 | 409 후 새로고침 → 재시도 | invalidate 동작 확인 |

### 7.2 작업 2 회귀 (BE)

| # | 시나리오 | 예상 |
|---|---|---|
| T7 | 본사 BP 계정 로그인 → `/settings/admin` | 자기 계정 row 미노출 |
| T8 | 플랫폼 계정 → `/settings/admin` | 본사 BP 가입 계정 미노출 |
| T9 | 본사 BP 계정 → `/master/bp/{id}` 자기 BP 조회 | 정상 (다른 화면 영향 없음) |

### 7.3 작업 3 회귀

| # | 시나리오 | 예상 |
|---|---|---|
| T10 | 신규 HEAD_OFFICE, 점포 미선택 저장 | 200, storeId null |
| T11 | 신규 HEAD_OFFICE, 점포 선택 저장 | 200, storeId 전송 |
| T12 | 신규 FRANCHISE, 본사·가맹·점포 모두 선택 | 200 |
| T13 | 본사 변경 시 점포 자동 초기화 | storeId null, disabled |
| T14 | 가맹 변경 시 점포 자동 초기화 | storeId null |
| T15 | 점포 0건 BP/가맹 선택 | disabled + placeholder |
| T16 | edit 모드 — storeId 있는 admin | 기존 점포 선택 표시 |
| T17 | edit 모드 — stale storeId | 자동 null + dev warning |
| T18 | PLATFORM — 본사·점포 자유 | 정상 |
| T19 | HEAD_OFFICE — 본사 잠금, 점포 자유 | 정상 |
| T20 | FRANCHISE — 본사·가맹 잠금, 점포 자유 | 정상 |

### 7.4 정적 검증
- `pnpm lint` — 통과 필수
- `pnpm build` — 통과 필수
- TypeScript strict 준수. `any`/`unknown` 미사용

### 7.5 Playwright (선택)
- 가맹 BP / 본사 BP / 플랫폼 3 계정 × `/settings/admin` 진입 스냅샷 1회씩 (PR #101 패턴 재사용)

## 8. BE 의존성

세 작업 모두 BE 동시 작업이 필요하다. 다음 BE PR 들이 선행 머지되어야 본 PR 의 회귀 테스트가 통과한다.

1. **BE PR A (작업 1)** — `PUT /api/v1/master/bp/{id}`, `PUT /api/v1/system/admins/{id}`, `PUT /api/v1/system/bp-admins/{id}` 권한 변경 시 409 무결성 충돌 원인 제거.
2. **BE PR B (작업 2)** — `GET /api/v1/system/bp-admins` 목록에서 본사 BP self-signup 계정 제외.
3. **BE PR C (작업 3)** — `bp-admins` 스키마에 `storeId` 추가 (POST/PUT body 수용, GET 응답에 `storeId`·`storeName` 포함).

## 9. 마이그레이션 / 커밋 그룹

한 PR 내 커밋 그룹:

- **Group A (작업 1)**
  - `feat(lib/api): 권한 변경 409 conflict-handler 유틸 추가`
  - `fix(master/bp): BpForm 409 핸들러 + dev payload diff 진단`
  - `fix(settings/admin): BpAdminForm 409 핸들러 + dev payload diff 진단`
  - `fix(system/admin): AdminForm 409 핸들러 + dev payload diff 진단`
- **Group B (작업 3)**
  - `feat(settings/admin): BpAdminFormData/스키마에 storeId 추가`
  - `feat(settings/admin): BpAdminForm 점포 selectbox + 자동 초기화 + 잠금 정책`
  - `fix(settings/admin): edit 모드 stale storeId 자동 null + dev warning`
- **Group C (작업 2)** — 코드 변경 없음. PR description 에 BE 의존성·회귀 테스트만 명시.

## 10. 머지 정책

- 머지는 상사가. 어시스턴트/사용자 직접 머지 금지.
- BE PR A/B/C 선행 머지 후 본 PR 머지.

## 11. 관련 문서

- Plan: `docs/superpowers/plans/2026-05-27-bp-authority-409-and-admin-store.md` (후속 작성)
- 기존 정책: `docs/superpowers/specs/2026-05-21-admin-and-invitation-refactor-design.md`
- 정책: `docs/plans/employee/staff-invitation-permission.md`
