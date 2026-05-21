# 직원 초대 권한 매핑 제거 + BP 관리자 관리 신설 설계

- **작성일**: 2026-05-21
- **작업 브랜치**: `feature/admin-and-invitation-refactor` (1번 + 2번 통합, PR 대상 `develop`)
- **DB/엔티티/Flyway 및 빌드 에러 fix**: 사용자 별도 지시 시마다 `develop` 직접 커밋·푸시 (브랜치 분리하지 않음)
- **관련 표준 정책**: `docs/plans/employee/staff-invitation-permission.md` (HeadOffice/Franchise 자동선택·잠금 정책)

## 1. 배경 및 목표

### 1.1 작업 1 — 직원 초대 권한 자동 매핑 삭제
- 현재 `StaffInvitationPop`에서 직원을 초대할 때 `invitedAuthorityId`를 전송하면, 초대받은 직원이 회원가입을 완료하는 시점에 BE가 해당 권한을 자동 매핑함.
- 이 동작을 폐기. 초대는 직원 기본 정보 + 근무 조건만 전송하고, 권한 부여는 가입 후 `/settings/admin` 또는 별도 권한 매핑 기능으로 분리.

### 1.2 작업 2 — `/settings/admin` BP 관리자 CRUD 신설
- 기존 `/system/admin`은 플랫폼 관리자(`PRGRP_001_001`)만 다룸.
- 본사(`PRGRP_002_001`) / 가맹(`PRGRP_002_002`) BP 관리자 CRUD를 신규 페이지(`/settings/admin`)로 분리. BE도 별도 컨트롤러/서비스로 신설.

## 2. 작업 범위 / 브랜치 전략

| 묶음 | 브랜치 | PR/푸시 |
|---|---|---|
| FE: 작업 1번 + 작업 2번 | `feature/admin-and-invitation-refactor` | PR → `develop` |
| BE: 엔티티/Flyway/컨트롤러·서비스 (사용자 별도 지시) | `develop` 직접 | 즉시 push |

PR은 1개, BE는 develop 직접 push.

## 3. 작업 1번 — 직원 초대 권한 매핑 삭제 (FE)

### 3.1 변경 파일

#### `src/components/employee/employeeinfo/StaffInvitationPop.tsx`
- import 제거: `useAuthorityOptionsForEmployeeInvitation`, 사용처가 사라진 `AUTHORITY_KIND` (다른 곳에서 안 쓰면 import만 제거).
- state 제거: `invitedAuthorityId`, `setInvitedAuthorityId`.
- 화이트리스트 가드(L247–251) 제거.
- payload 전송에서 `invitedAuthorityId` 키 제거(L326 부근).
- L420 부근 `useAuthorityOptionsForEmployeeInvitation` 호출 + `authorityOptionList`, `targetAuthority`, `authorityLoading`, `authorityError` 변수 일체 제거.
- L592, L618 — 가맹점/점포 변경 시 권한 후보 invalidate / reset useEffect 삭제.
- L630–660 — "Partner Office 권한" `<tr>` 전체 제거 (label, toggle, 안내 문구 모두).

#### `src/types/employee.ts`
- `PostEmployeeInfoRequest`에서 `invitedAuthorityId?: number | null` 필드와 위 주석 2줄 제거 (L69–71).

#### `src/hooks/queries/use-authority-queries.ts`
- `useAuthorityOptionsForEmployeeInvitation` export 제거 (L92 부근).
- 동일 hook이 의존하는 `AuthorityEmployeeInvitationParams` 타입도 더 이상 사용되지 않으면 제거.
- `query-keys.ts`에 직원 초대용 권한 키가 있으면 함께 제거.

#### `src/lib/api/employee.ts`
- L372 부근 `getEmployeeAuthorityOptions` (또는 동등 명칭) 함수와 endpoint 상수 제거.

#### `src/lib/schemas/authority.ts`
- L277 주석 갱신: "직원 초대 / BP 수정 selectbox 옵션 용도" → "BP 수정 selectbox 옵션 용도".
- `authorityCandidateSchema` / `authorityCandidateListResponseSchema`는 BP 수정에서 계속 사용하므로 **유지**.

### 3.2 BE 사이드(사용자 별도 지시 시 develop 직접 푸시)
- `member_invited_authority` 매핑 컬럼/테이블 제거 Flyway 작성.
- 회원가입 완료 트리거에서 자동 권한 매핑 로직 제거.
- `POST /api/employee/info`에서 `invitedAuthorityId` 수신 부분 제거.
- `GET /system/authorities/employee-invitation` endpoint 폐기.

### 3.3 검증
- `pnpm lint` 통과(unused import 0).
- `tsc --noEmit` / `pnpm build` 통과(`invitedAuthorityId` 잔존 0).
- 직원 초대 → 권한 row 없는 상태로 정상 등록 (점포/가맹 자동선택 정책은 유지).

## 4. 작업 2번 — `/settings/admin` BP 관리자 CRUD (FE)

### 4.1 라우팅 신설

```
src/app/(sub)/settings/admin/
├── page.tsx              # 목록/검색
├── create/
│   └── page.tsx          # 등록
└── [id]/
    └── page.tsx          # 상세/수정
```

기존 `/system/admin`(플랫폼 관리자)은 그대로 유지.

### 4.2 LNB 메뉴
- 등록 위치: **환경설정 > BP 관리자 관리**.
- 정확한 메뉴 데이터 파일 경로는 plan 단계에서 확정(`src/data/HeaderMenu.ts`가 CLAUDE.md에 명기되어 있으나 실제 경로 미발견 — plan 시 grep으로 정확히 잡음).

### 4.3 컴포넌트 신설 (`src/components/settings/admin/`)
- `BpAdminList.tsx` — AG Grid 목록. cols: 이름, 관리자종류, 소속 본사, 소속 가맹, 권한명, 로그인ID, 근무여부, 등록일.
- `BpAdminSearch.tsx` — 검색 (adminType select, 본사/가맹 select, 권한 select, 근무여부, 등록일 범위).
- `BpAdminForm.tsx` — 등록/수정 공통 폼.

### 4.4 타입/스키마
- `src/types/bp-admin.ts`
  - `type AdminType = 'HEAD_OFFICE' | 'FRANCHISE'`
  - `interface BpAdminFormData` (4.6 참조)
  - `interface BpAdminSearchParams`
  - `interface BpAdminDetail`
- `src/lib/schemas/bp-admin.ts` — Zod schema(form + 응답).

### 4.5 API 훅 (`src/hooks/queries/use-bp-admin-queries.ts`)
- query: `useBpAdminList`, `useBpAdminDetail`, `useBpAdminSelectOptions`, `useBpAuthorityOptionsForAdmin({adminType, headOfficeId, franchiseId})`.
- mutation: `useCreateBpAdmin`, `useUpdateBpAdmin`, `useDeleteBpAdmin`, `useCheckBpAdminLoginId`, `useResetBpAdminPassword`.
- `query-keys.ts`에 `bpAdmin` 계층 키 추가.
- `src/stores/search-stores`에 `bpAdminManageSearchStore` 추가(기존 `adminManageSearchStore`와 동일 패턴).

### 4.6 API 계약 가정 (BE 신규 컨트롤러)

| Method | Path | 용도 |
|---|---|---|
| GET | `/api/setting/bp-admins` | 목록. 필터: `adminType`, `headOfficeId`, `franchiseId`, `authorityId`, `userType`, `startDate`, `endDate`, `page`, `size` |
| POST | `/api/setting/bp-admins` | 등록 |
| GET | `/api/setting/bp-admins/{id}` | 상세 |
| PUT | `/api/setting/bp-admins/{id}` | 수정 |
| DELETE | `/api/setting/bp-admins/{id}` | 삭제 |
| GET | `/api/setting/bp-admins/login-id-check?loginId=` | 로그인ID 중복 |
| POST | `/api/setting/bp-admins/{id}/reset-password` | 비밀번호 초기화 |
| GET | `/api/setting/bp-admins/authorities?headOfficeId=&franchiseId=` | 해당 BP가 보유한 권한 전체 |

요청·응답 본문은 plan 단계에서 BE와 합의해 확정.

### 4.7 폼 필드 (AdminForm 대비 차이)

| 필드 | 기존 AdminForm | BpAdminForm |
|---|:---:|:---:|
| `inquiryResponderName` | O | **제거** |
| `adminType` (`HEAD_OFFICE` / `FRANCHISE`) | — | **신규**, select |
| `headOfficeOrganizationId` | — | **신규**, 필수 |
| `franchiseOrganizationId` | — | **신규**, `adminType=FRANCHISE`일 때 노출/필수 |
| `name`, `userType`, `department`, `rank`, `mobilePhone`, `officePhone`, `extensionNumber`, `loginId`, `password`, `authorityId`, `email` | O | **유지** (`userType` = 근무여부 그대로) |

`authorityId` 옵션:
- `useBpAuthorityOptionsForAdmin` 응답을 그대로 사용.
- 본사/가맹이 미선택이면 disabled + "본사/가맹 선택 후 권한 부여 가능" 안내.
- `adminType` 변경 시 `authorityId`, `franchiseOrganizationId` **자동 초기화**.

### 4.8 권한별 동작 (`staff-invitation-permission` 표준 재사용)

| 로그인 권한 | adminType | 본사 select | 가맹 select |
|---|---|---|---|
| PLATFORM (단일 본사) | 자유 | 자동선택, 잠금 X | 자유 |
| PLATFORM (다중 본사) | 자유 | 자유 | 자유 |
| HEAD_OFFICE | 자유 (본사/가맹 모두 생성 가능) | 자동선택 + 잠금 | adminType=FRANCHISE 시 노출, 산하 가맹 옵션만 |
| FRANCHISE | `FRANCHISE` 고정 + 잠금 | 자동선택 + 잠금 | 자동선택 (단일 시 잠금) |

데이터 격리는 BE가 강제. FE는 자동선택/잠금/옵션 노출만 담당.

### 4.9 검증
- `pnpm lint` / `tsc --noEmit` / `pnpm build` 통과.
- HEAD_OFFICE 계정: 본사 자동선택·잠금, 산하 가맹만 목록 노출.
- FRANCHISE 계정: 자기 가맹만 목록·옵션 노출.
- PLATFORM 계정: BP 자유 선택, 권한 옵션이 선택 BP가 보유한 권한만 노출.
- adminType 토글 시 권한·가맹 select 초기화 동작 확인.

## 5. 작업 순서

1. 작업 1번 FE 변경 → 단위 동작 확인 (직원 초대 정상)
2. 작업 2번 FE 스캐폴드: 타입/스키마/훅/스토어
3. 작업 2번 컴포넌트(List → Search → Form 순) + 라우트
4. LNB 메뉴 등록
5. BE와 API 합의 후 실제 연동 (BE 별도 develop 푸시 시점 기준)
6. lint/type/build 체크, e2e 수동 검증

## 6. 열린 항목 (plan 단계에서 확정)

- LNB 메뉴 데이터 파일의 실제 경로(`HeaderMenu.ts`가 미발견 — plan 시 확인).
- BE 컨트롤러 패키지/엔드포인트 prefix 최종 명칭(`/api/setting/bp-admins` 임시 가정).
- `BpAdminDetail` 응답에서 본사·가맹 표시 필드(이름/코드)의 정확한 명칭.
