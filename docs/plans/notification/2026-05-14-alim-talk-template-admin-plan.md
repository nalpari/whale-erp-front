# 알림톡 템플릿 관리 — 프론트 plan

- **작성일**: 2026-05-14
- **대상 프로젝트**: whale-erp-front (Next.js 16 + React 19 + TypeScript + Tailwind CSS 4)
- **연관 plan**: whale-erp-api `docs/plans/notification/2026-05-14-alim-talk-template-admin-plan.md`
- **기획서 참고**: 발송 템플릿 목록(p.31), 알림톡 템플릿 관리(p.32) — Version 0.72, 이현호, 2025.06.08
- **브랜치**: `feature/alim-talk` (develop 기준 분기 완료, 2026-05-14)

---

## 1. Executive Summary

| 항목 | 내용 |
|------|------|
| 기능 | 알림톡 템플릿 관리 화면 (목록 + 등록/수정/삭제) |
| 화면 컨셉 | **통합형** — 발송 구분 드롭다운에 알림톡/이메일/문자 노출. 본 PR은 알림톡 선택 시만 동작 |
| 권한 | 관리자(BP Master)만 접근 |
| 라우트 | `/notification/message-templates` *(미확정, 마지막 섹션 참조)* |
| 메뉴 등록 | ❌ 작업 범위 아님 (운영자가 프로그램 관리 UI에서 직접 등록) |
| 디자인 시스템 | shadcn/ui (기존 다른 도메인과 동일) + Tailwind CSS 4 + Sass |
| 작업 파일 | 약 8개 (page + Wrapper + Search + List + Form + Detail + types + api 클라이언트) |

---

## 2. 의사결정 결과 (재영 협의 완료, 2026-05-14 / 후속 갱신 2026-05-15)

| 항목 | 결정 |
|------|------|
| 발송 구분 드롭다운 | 3종(알림톡/이메일/문자) 노출, 알림톡 외 선택 시 빈 결과 또는 안내 메시지 |
| 변수 표기법 | `#{변수명}` 그대로 입력·표시. 자동 추출·하이라이트 없음 |
| 본문 검증 | ❌ 운영자 신뢰 |
| 삭제 정책 | **Hard delete** (백엔드 V82에서 `use_yn` 컬럼 자체 DROP, 2026-05-15) |
| 메뉴 등록 | 운영자 직접 (프론트는 정적 라우트만 추가) |
| 정렬 | 등록일(`createdAt`) 기준 내림차순 (기획서 명시) |
| 목록 컬럼 | 기획서(p.31) 그대로 — `# / 분류 / 코드 / 명 / 등록일` (사용 여부 컬럼 노출 안 함) |

---

## 3. 화면 구조

### 3.1 목록 화면 (페이지 31)

```
┌─────────────────────────────────────────────────────────────┐
│ 발송 템플릿 관리                                              │
├─────────────────────────────────────────────────────────────┤
│ [검색결과 N건]                                      [🔍 토글] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 발송구분 [선택▼] 템플릿분류 [선택▼] 코드[___] 제목[___] │ │
│ │                              [닫기][초기화][검색]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                          [등록] [50건/페이지▼] │
├─────────────────────────────────────────────────────────────┤
│ # │ 템플릿 분류 │ 템플릿 코드  │ 템플릿 명              │ 등록일 │
├───┼──────────────┼──────────────┼────────────────────────┼────────┤
│ 1 │ 회원가입     │ WHALEERP0001 │ 직원 회원 가입 요청    │ 25-01-01│
│ 2 │ 회원가입     │ WHALEERP0002 │ 임시 비밀번호 안내     │ 25-01-01│
├───┴──────────────┴──────────────┴────────────────────────┴────────┤
│                   < 1 2 3 4 ... 9 10 >                      │
└─────────────────────────────────────────────────────────────┘
```

**검색 영역 (5필드):**
1. 발송 구분 (드롭다운: 알림톡 / 이메일 / 문자) — 기본값 `알림톡`
2. 템플릿 분류 (드롭다운: `SNDCTG` 공통코드 자식 9종 — `SNDCTG_001`~`SNDCTG_009`)
3. 템플릿 코드 (인풋, like 검색)
4. 제목 (인풋, like 검색)
5. 액션: `닫기` / `초기화` / `검색`

**테이블:**
- 컬럼: `#` / 템플릿 분류 / 템플릿 코드 / 템플릿 명 / 등록일
- 클릭 시 상세 페이지로 이동
- 페이지 사이즈 선택: 50 (디폴트), 변경 시 즉시 재조회

### 3.2 등록/수정 화면 (페이지 32)

```
┌─────────────────────────────────────────────────────────────┐
│ 알림톡 템플릿 관리                                            │
├─────────────────────────────────────────────────────────────┤
│ 템플릿 분류* [회원가입            ▼]                          │
│ 템플릿 명*   [직원 회원 가입 요청                          ]  │
│ 템플릿 코드* [WHALEERP0001                                ]  │
│ 발송시점    [회원가입 완료 시 발송           ▼]              │
│ 내용*       ┌─────────────────────────────────────────────┐ │
│             │ [#{점포명}] 직원 회원 가입 안내             │ │
│             │                                              │ │
│             │ #{점포명}에서 근무하시게 된 것을 진심으로   │ │
│             │ 환영합니다.                                  │ │
│             │ ...                                          │ │
│             └─────────────────────────────────────────────┘ │
│                                  [목록][삭제][저장]          │
└─────────────────────────────────────────────────────────────┘
```

**필드:**
| # | 필드 | 필수 | 컴포넌트 | 비고 |
|---|------|------|----------|------|
| 1 | 템플릿 분류 | ✅ | `<Select>` (shadcn) | `SNDCTG` 자식 9종 (`SNDCTG_001`~`SNDCTG_009`) |
| 2 | 템플릿 명 | ✅ | `<Input>` max 200 | |
| 3 | 템플릿 코드 | ✅ | `<Input>` max 50 | **수정 모드에서는 readonly** |
| 4 | 발송 시점 | ❌ | `<Select>` | `SNDTMG` 옵션 (본 PR 미포함, 기획자 협의 후 추가) |
| 5 | 내용 | ✅ | `<Textarea>` 멀티라인 | `#{변수명}` 그대로 |

**액션 버튼:**
- 등록 모드: `[목록]` `[저장]`
- 수정 모드: `[목록]` `[삭제]` `[저장]`
- 삭제 클릭 시 confirm dialog → **hard delete** API 호출 (백엔드 V82 정책 전환, 2026-05-15)

---

## 4. 컴포넌트 설계

```
app/notification/message-templates/
├── page.tsx                                      (목록 페이지 진입점)
├── new/page.tsx                                  (등록 페이지)
└── [id]/page.tsx                                 (상세/수정 페이지)

components/message-templates/
├── AlimTalkTemplates.tsx                         (목록 래퍼 - Plans.tsx 패턴)
├── AlimTalkTemplateSearch.tsx                    (검색 폼)
├── AlimTalkTemplateList.tsx                      (테이블 + 페이징)
├── AlimTalkTemplateForm.tsx                      (등록/수정 공용 폼)
└── AlimTalkTemplateDetail.tsx                    (상세 화면 래퍼)

types/notification.ts                             (DTO 타입)

services/notification/
└── alimTalkTemplateApi.ts                        (백엔드 호출 모듈)

constants/notification.ts                         (SEND_TYPE 상수)
```

> 메모리 규칙(whale-erp-front 패턴): `page.tsx` → `<Component />` 단순 렌더링, 래퍼 컴포넌트가 상태 관리. Search + List 분리.

---

## 5. API 클라이언트 (`alimTalkTemplateApi.ts`)

```typescript
// services/notification/alimTalkTemplateApi.ts

import type {
  AlimTalkTemplateListItem,
  AlimTalkTemplateDetail,
  AlimTalkTemplateCreateRequest,
  AlimTalkTemplateUpdateRequest,
  AlimTalkTemplateSearchParams,
} from '@/types/notification';
import type { PageResponse, ApiResponse } from '@/types/common';

const BASE = '/api/v1/notifications/alim-talk/templates';  // codebase prefix 컨벤션 (다른 controller들과 일치)

export const alimTalkTemplateApi = {
  search: (params: AlimTalkTemplateSearchParams)
    : Promise<ApiResponse<PageResponse<AlimTalkTemplateListItem>>> => fetcher(BASE, params),

  getById: (id: number)
    : Promise<ApiResponse<AlimTalkTemplateDetail>> => fetcher(`${BASE}/${id}`),

  create: (body: AlimTalkTemplateCreateRequest)
    : Promise<ApiResponse<AlimTalkTemplateDetail>> => poster(BASE, body),

  update: (id: number, body: AlimTalkTemplateUpdateRequest)
    : Promise<ApiResponse<AlimTalkTemplateDetail>> => putter(`${BASE}/${id}`, body),

  remove: (id: number)
    : Promise<ApiResponse<void>> => deleter(`${BASE}/${id}`),
};
```

> 기존 다른 도메인의 fetcher/poster 패턴을 그대로 따름. 구체 utility는 작업 시점에 확인.

---

## 6. 타입 정의 (`types/notification.ts`)

```typescript
export type SendType = 'ALIM_TALK' | 'EMAIL' | 'SMS';

export interface AlimTalkTemplateSearchParams {
  sendType?: SendType;             // 디폴트 ALIM_TALK
  categoryCode?: string;
  templateCode?: string;
  title?: string;
  // useYn 제거됨 (백엔드 V82에서 컬럼 DROP, hard delete 전환)
  page?: number;
  size?: number;
  sort?: string;
}

export interface MessageTemplateListItem {
  id: number;
  categoryName: string | null;
  templateCode: string;
  title: string | null;
  createdAt: string;               // ISO datetime
}

export interface MessageTemplateDetail {
  id: number;
  categoryCodeId: number | null;
  categoryName: string | null;
  templateCode: string;
  sendTiming: string | null;       // V81: 자유 텍스트로 전환 (기획서 캡처 일치)
  title: string | null;
  body: string;
  // useYn 제거됨 (백엔드 V82에서 컬럼 DROP, hard delete 전환)
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MessageTemplateCreateRequest {
  sendType: SendType;              // 발송 구분 — 본 PR은 ALIM_TALK만 실제 처리
  categoryCodeId: number;
  templateCode: string;
  title: string;
  sendTiming?: string | null;
  body: string;
}

export interface MessageTemplateUpdateRequest {
  sendType: SendType;
  categoryCodeId: number;
  templateCode: string;            // 수정 가능 (운영자가 카카오 측 코드와 sync 책임)
  title: string;
  sendTiming?: string | null;
  body: string;
}
```

---

## 7. 화면 동작 규칙

### 7.1 발송 구분 드롭다운
- 디폴트 `알림톡` 선택
- `이메일` / `문자` 선택 시:
  - 본 PR에서는 검색 결과 빈 배열 + 안내 토스트("이메일/문자 템플릿은 후속 작업에서 지원됩니다")
  - 향후 PR에서 채널별 라우팅·필드 활성화

### 7.2 검색 + 페이징 + 정렬
- 검색 버튼 클릭 시 page=0으로 리셋
- 페이지 사이즈 변경 시 page=0으로 리셋
- 정렬 디폴트 `createdAt,DESC`
- 컬럼 헤더 클릭 정렬: P1 (기획서에 없음 — 본 PR 미포함)

### 7.3 등록·수정 폼
- 등록 시 `templateCode` 중복 에러 → 인라인 메시지 표시 ("이미 등록된 템플릿 코드입니다.")
- 필수 필드 미입력 시 입력 단계에서 disable된 `저장` 버튼
- 본문 textarea 최소 높이 12rem
- 변수 패턴 `#{...}` 표시 강조: P1 (별도 라이브러리 도입 부담)

### 7.4 삭제
- 확정 modal: "정말 삭제하시겠습니까?" — **hard delete** (백엔드 V82 정책 전환, 2026-05-15)
- 성공 시 목록으로 이동 + 토스트

---

## 8. 작업 항목 체크리스트

### Phase 1: 라우트 + 타입 + API 클라이언트
- [ ] `app/notification/message-templates/page.tsx` 신규
- [ ] `app/notification/message-templates/new/page.tsx` 신규
- [ ] `app/notification/message-templates/[id]/page.tsx` 신규
- [ ] `types/notification.ts` 작성
- [ ] `services/notification/alimTalkTemplateApi.ts` 작성

### Phase 2: 목록 화면
- [ ] `AlimTalkTemplates.tsx` 래퍼 (상태 관리: 검색 조건, 페이징)
- [ ] `AlimTalkTemplateSearch.tsx` (4필드 + 액션)
- [ ] `AlimTalkTemplateList.tsx` (테이블 + 페이지네이션 + 페이지사이즈)
- [ ] 공통코드 조회 (`SNDCTG` 자식 9종) 옵션 매핑
- [ ] 검색결과 카운트 표시 ("검색결과 N건")

### Phase 3: 등록/수정/삭제
- [ ] `AlimTalkTemplateForm.tsx` (등록·수정 공용)
- [ ] 필수 validation (client-side: NotNull / 길이 제한)
- [ ] `templateCode` 중복 에러 인라인 표시
- [ ] 삭제 confirm modal
- [ ] 성공 토스트·실패 토스트 처리

### Phase 4: 통합 테스트·검증
- [ ] `pnpm lint` + `pnpm build` 통과 (메모리 규칙)
- [ ] 백엔드 dev 환경 배포 후 통합 테스트
- [ ] 권한 분기 확인 (관리자 외 접근 시 403)
- [ ] Plans.tsx 패턴과 컴포넌트 구조 일치 검토

### Phase 5: 머지
- [ ] feature/alim-talk → develop PR 생성 (타겟 명시적으로 develop)
- [ ] 백엔드 PR과 동시 머지 시점 조율

### Phase 6: 후속 정리 (2026-05-15)
- [x] 라우트 일반화 — `alim-talk-templates` → `message-templates` rename + 폼 `sendType` prop 전파 (Step 2a/2b)
- [x] `send_timing` 자유 텍스트 전환 — UI/타입에서 `SNDTMG` 드롭다운 폐기, Input으로 교체
- [x] 검색 라벨 "제목" → "템플릿 명" 정정
- [x] 폼을 master/menu/create의 slidebox 패턴 + 표준 contents-btn 패턴으로 정렬
- [x] 템플릿 코드 수정 허용 (수정 모드 readonly 해제)
- [x] Boston review P0 대응 — 그리드 "사용 여부" 컬럼 추가 후 기획서 일치 위해 revert
- [x] `useYn` 타입/검색 파라미터 제거 (백엔드 V82 hard delete 전환 동기화)

### Phase 7: Boston Code Review HIGH 대응 (2026-05-18)
- [x] **#4 detail 캐시 좀비 제거** — `useDeleteMessageTemplate.onSuccess`에서 `removeQueries({ queryKey: messageTemplateKeys.detail(id) })` 추가. 삭제 후 같은 상세 URL 재방문 시 stale 캐시 노출 차단
- [x] **#2 NaN id 무한 로딩 가드** — `[id]/page.tsx`에서 `Number.isFinite` 검증 후 `notFound()` 분기 (TanStack Query v5의 `enabled:false` = `isPending:true` 회피)
- [x] **#3 `useAlert()` 교체** — `MessageTemplateForm.tsx`, `MessageTemplateList.tsx`의 `window.confirm`/`window.alert`를 프로젝트 표준 `useAlert()` 훅으로 교체. confirm 문구도 V82 hard delete 정책에 맞게 정정 ("(사용 여부 N으로 전환)" → "삭제 후 복구할 수 없습니다.")
- [x] **#5 update hook disabled 분기** — `MessageTemplateForm.tsx`의 submit 버튼 disabled 조건을 `isMutating` 변수로 추출하고 mode 별로 분기 (옵션 A — 훅 시그니처는 유지). 근본 개선(옵션 B: `mutateAsync({ id, request })`)은 다음 스프린트에서 다른 도메인과 함께 정리

---

## 9. TBD / 협의 필요

| 항목 | 내용 |
|------|------|
| 라우트 경로 | `/notification/message-templates` 확정 (백엔드 base URL `/api/v1/notifications/alim-talk/templates`는 컨벤션상 그대로 유지) |
| 페이지 타이틀 | "발송 템플릿 관리" vs "알림톡 템플릿 관리" — 기획서 모순. 통합 화면이면 전자, 알림톡 한정이면 후자. **본 PR은 후자로 작성**하고 향후 통합 시 변경. |
| 발신 프로필 선택 | 백엔드에서 NULL 허용으로 완화. 화면에 발신 프로필 드롭다운 추가 여부는 향후 결정. 본 PR 미포함. |
| 검수 상태 표시 | 카카오 검수 상태(승인/대기/반려) 표시 필요 여부 — 기획서 없음, 본 PR 미포함 |
| 변수 도움말 | 본문 입력 시 사용 가능한 변수 목록 가이드 — 기획서 없음. 본 PR 미포함 |

> **이력 정리 (2026-05-15)**:
> - "사용 여부 토글" 항목은 V82에서 `use_yn` 컬럼 자체가 DROP되어 폐기. 미래 토글 도입 시 별도 컬럼·정책 재설계 필요.
> - `SNDTMG` 공통코드는 V81에서 `send_timing` 자유 텍스트로 전환되어 폐기.

---

## 10. 의존 관계 / 머지 순서

1. 백엔드 PR (V79 + API)이 dev에 먼저 배포되어야 통합 테스트 가능
2. 프론트는 백엔드 명세 기반 mock fixture로 UI 선행 작업 가능
3. 머지 순서: **백엔드 PR → dev 배포 → 프론트 통합 테스트 → 프론트 PR 머지**

### 브랜치 정보
- 현재: `feature/alim-talk` (develop 기준 분기 완료, 2026-05-14)
- 타겟: develop (메모리 규칙: 비즈뿌리오 관련 핫픽스만 develop 우선이고 본 작업은 일반 feature이지만, 새 도메인 추가라 일관성 위해 develop 타겟으로 진행 권장 — PR 생성 시 타겟 재확인)
