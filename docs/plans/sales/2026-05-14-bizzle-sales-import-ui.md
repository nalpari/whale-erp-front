# Bizzle 카드매출 가져오기 UI (Front)

- 작성일: 2026-05-14
- 최종 갱신: 2026-05-28 (자격증명 브라우저 캐시 재설계 반영)
- 상태: 초안 (검토 대기 — grill-me 9개 결정 + 자격증명 캐시 재설계 반영)
- 출처: `~/IdeaProjects/sales-rader/frontend` (Next.js 16 PoC)
- 관련 api plan: `whale-erp-api/docs/plans/sales/2026-05-14-bizzle-sales-scraper-integration.md`
- 관련 재설계 spec: `docs/plans/sales/2026-05-28-bizzle-credential-cache-redesign.md`
- 관련 구현 plan: `docs/plans/sales/2026-05-28-bizzle-credential-cache-impl.md`

## 결정 이력

### 2026-05-28 자격증명 캐시 재설계 (brainstorming)

| 항목 | 결정 | 본문 반영 위치 |
|------|------|----------------|
| 자격증명 저장 | **localStorage 암호화 저장** (Web Crypto 디바이스 키, 7일 sliding 만료), "기억하기" 체크박스 default OFF | §2, §4, §6, §8 |
| 배치/자동 수집 | **폐기** — 사용자 트리거 only. 저장된 자격증명이 있어도 자동 호출 X | §4, §10 |
| 기존 "저장 안 함" 정책 | **뒤집힘** — 위 재설계로 대체 (상세: redesign spec) | §2, §6 |

### 2026-05-27 grill-me

> 본 front plan 에 영향이 큰 결정만 발췌. 전체 결정 표는 api plan 의 결정 이력 섹션 참조.

| # | 항목 | 결정 | 본문 반영 위치 |
|---|------|------|----------------|
| 2 | 수집 기간 ≤31일 강제 | Zod refine 으로 클라이언트 사전 검증 + 백엔드 최종 검증 | §2, §5.1, §8 |
| 5 | 동시 호출 가드 | mutation `isPending` 동안 버튼/입력/close 잠금. `BIZZLE_SCRAPE_IN_PROGRESS`(409) 응답 분기 | §2, §4, §6, §8 |
| 6 | 메뉴 권한 시드 | 운영자 수동 등록 필요 (본 plan 범위 외) — PoC 시작 전 선행 작업 | §2, §8 |
| 9 | 수집 중 UX | 모달 안내 텍스트 추가 ("최대 2분 소요"). 경과 시간 카운터/SSE 는 비동기화 마이그레이션 시점에 | §4, §8 |

## 1. 목적

whale-erp 내부 사용자가 자신의 Bizzle 자격증명을 직접 입력하여, **즉석 카드매출 가져오기 + 조회/요약** 흐름을 whale-erp-front에서 수행할 수 있도록 한다. sales-rader가 가지고 있던 별도 디자인을 **whale-erp 디자인 토큰/컴포넌트로 재이식**한다.

## 2. 핵심 정책 (결정됨)

| 항목 | 결정 |
|------|------|
| 자격증명 입력 방식 | **모달 폼**. 저장된 자격증명이 있으면 hydrate(prefill), 없으면 직접 입력 |
| 자격증명 저장 | **localStorage 암호화 저장** (Web Crypto AES-GCM + IndexedDB non-extractable 디바이스 키), **7일 sliding 만료**, "이 브라우저에 7일 동안 기억하기" 체크박스 **default OFF**. 비번은 절대 평문 저장 X, 아이디는 평문 허용. 상세: `2026-05-28-bizzle-credential-cache-redesign.md` |
| 비밀번호 필드 | `type="password"`, autocomplete `current-password`. 모달 unmount 시 메모리(평문) state + query 캐시 클리어. localStorage 의 암호문은 체크박스 ON 이면 유지 |
| 자동 수집 | **하지 않음** (배치 폐기) — 자격증명이 prefill 돼도 사용자가 "가져오기"를 명시적으로 눌러야 호출 |
| 모달 구현 | **whale-erp-front 자체 모달 패턴** (예: `CategoryFormModal`, `ProgramFormModal`) — shadcn `Dialog` 미사용 |
| 폼 검증 | **Zod 4 + `formatZodFieldErrors`** (whale-erp 표준), react-hook-form 미사용 |
| 서버 상태 | **TanStack Query** (`useQuery`/`useMutation`) — `src/hooks/queries/`에 훅 추가 |
| API 호출 | **`@/lib/api.ts`의 axios 인스턴스** — Bearer/affiliation 자동, `postWithSchema()` 권장 |
| 라우팅 | **`src/app/(sub)/sales/` 신규** — `(sub)/layout.tsx`의 LNB/Header 자동 적용 |
| 메뉴 권한 | **본 plan 범위 외** — 권한 관리 화면에서 별도 추가, sales 도메인 코드에서는 처리하지 않음. **단, PoC 진행 전에 운영자가 권한 관리 화면에서 sales 메뉴/프로그램 권한을 PoC 대상 사용자에게 수동 등록해야 메뉴가 LNB에 노출됨** (등록 누락 시 기능 자체가 동작하지 않으므로, 코드 머지 후 PoC 시작 사이에 반드시 선행 작업) |
| **데이터 소유** | **현재 로그인 사용자(memberId) 데이터만 조회** — 백엔드가 JWT로 격리하므로 front에서 별도 필터 파라미터 보내지 않음 |
| **수집 기간 제한** | **요청당 최대 31일** — Zod refine 으로 클라이언트에서 1차 검증, 백엔드(`BIZZLE_SCRAPE_PERIOD_EXCEEDED`)에서 최종 검증. 동기 호출의 분 단위 점유를 막기 위한 강제 가드 |
| **동시 호출 가드** | **mutation `isPending` 동안 "가져오기" 버튼/모달 입력 잠금** + 백엔드 `BIZZLE_SCRAPE_IN_PROGRESS` (409) 응답 시 "이미 수집이 진행 중입니다" 메시지 표시 |

## 3. 라우팅 구조

```
src/app/(sub)/sales/
├── page.tsx                    # 매출 요약 + 가져오기 진입점 — <SalesDashboard /> 렌더
└── list/
    └── page.tsx                # 상세 목록 — <SalesList /> 렌더
```

`(sub)/layout.tsx`가 LNB/Header/FullDownMenu를 제공하므로 별도 layout 불필요.

기존 패턴(메모리: 래퍼 패턴 — `page.tsx` → `<Component />` 단순 렌더링)에 맞춰:
```
src/components/sales/
├── SalesDashboard.tsx          # page.tsx 래퍼, 상태 관리
├── SalesSummary.tsx            # 매입사별 카드 (요약)
├── SalesSearch.tsx             # 기간 필터 + 가져오기 버튼
├── SalesList.tsx               # 상세 목록 (페이지네이션)
└── BizzleImportModal.tsx       # 자격증명 입력 모달
```

## 4. 사용자 흐름

1. 사이드바 메뉴에서 "매출" 진입 → `SalesDashboard`가 기본 기간(최근 30일)으로 `/api/sales/summary` 호출
2. "Bizzle에서 가져오기" 버튼 클릭 → `BizzleImportModal` 오픈
   - **hydrate**: `useBizzleCredential` 로 localStorage 조회 → 미만료 자격증명 있으면 아이디/비번 prefill + "기억하기" 체크박스 ON. 없거나 만료/복호화 실패면 빈 폼 + 체크박스 OFF (만료/손상값은 자동 제거)
3. 모달 입력:
   - 아이디 (text)
   - 비밀번호 (password)
   - 시작일/종료일 (date) — Zod refine 으로 **최대 31일 차이** 검증 (서버 측 `BIZZLE_SCRAPE_PERIOD_EXCEEDED` 와 매칭)
   - **"이 브라우저에 7일 동안 기억하기" 체크박스** (default OFF)
   - **"저장 해제" 버튼** (저장된 자격증명이 있을 때 노출) → 클릭 시 localStorage 항목 즉시 제거 + 폼 비번 비움
4. "가져오기" 클릭 → 먼저 자격증명 캐시 처리 후 `POST /api/sales/scrape` 호출
   - 체크박스 ON → `useBizzleCredential.save({loginId, loginPw})` (7일 sliding 갱신)
   - 체크박스 OFF → `useBizzleCredential.clear()` (이전 저장값 제거)
   - **mutation `isPending` 동안 "가져오기" 버튼 disable + 모달 입력 필드 disable + 모달 close 차단** (중복 호출/실수 입력 방지)
   - 모달 내 안내 영역에 정적 텍스트 노출: **"Bizzle에서 매출 데이터를 가져오고 있습니다. 최대 2분 정도 소요될 수 있습니다."**
     - 진행률/경과 시간 카운터는 본 plan 범위 외 (동기 호출 결정과 충돌, 비동기화 마이그레이션 시점에 추가)
   - GlobalMutationSpinner 는 자동으로 상위 오버레이 표시 (기존 패턴 그대로)
5. 응답 수신 (api 재시도 정책과 매칭):
   - **`status: SUCCESS`** → 성공 토스트 ("X건 저장") + summary/list 재조회
   - **`status: PARTIAL`** → 경고 토스트 ("X건 저장, Y건 실패") + 그래도 재조회 (보존된 데이터 표시)
   - **`status: FAILED`** → 모달 안 에러 메시지, 모달 유지하여 사용자가 비번 재입력/재시도 가능
   - 에러 단계별 메시지 구분 (백엔드 ErrorCode 기준):
     - `BIZZLE_LOGIN_FAILED` → "아이디/비밀번호를 확인해 주세요"
     - `BIZZLE_SESSION_EXPIRED` → "Bizzle 세션이 만료되었습니다. 다시 시도해 주세요"
     - `BIZZLE_SCRAPE_FAILED` → "잠시 후 다시 시도해 주세요" (api에서 1회 재시도는 이미 했음)
     - 저장 오류 (PARTIAL 의 failedCount) → "일부 데이터 저장에 실패했습니다, X건 보존됨"
     - `BIZZLE_SCRAPE_PERIOD_EXCEEDED` (400) → "한 번에 최대 31일까지 가져올 수 있습니다" (클라이언트 Zod에서 사전 차단되지만 백엔드 응답도 동일 메시지로 처리)
     - `BIZZLE_SCRAPE_IN_PROGRESS` (409) → "이미 수집이 진행 중입니다. 잠시 후 다시 시도해 주세요" (다른 디바이스/탭에서 진입 시 발생 가능)
   - **사용자가 "가져오기"를 다시 누르는 것은 안전** (api가 idempotent 보장 — UNIQUE + upsert)
6. 모달 닫힐 때 또는 응답 직후 **메모리상 비밀번호 state 를 빈 문자열로 클리어** + `useBizzleCredential.removeCredentialCache()` 로 query 캐시의 평문 비번 제거 (`useEffect` cleanup). localStorage 암호문은 체크박스 ON 이면 유지

## 5. API/쿼리 레이어

### 5.1 Zod 스키마 (`src/lib/schemas/sales.ts`)

```ts
import { z } from 'zod'

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다')

// 백엔드 §6 검증 표와 1:1 매칭 (BIZZLE_SCRAPE_PERIOD_*)
export const bizzleScrapeRequestSchema = z.object({
  loginId: z.string().min(1),
  loginPw: z.string().min(1),
  startDate: ymd,
  endDate: ymd,
})
  .refine(({ startDate, endDate }) => startDate <= endDate, {
    message: '시작일은 종료일보다 이후일 수 없습니다',
    path: ['endDate'],
  })
  .refine(
    ({ startDate, endDate }) => {
      // YYYY-MM-DD 문자열 차이를 일수로 환산 (Date 파싱은 timezone 안전성을 위해 UTC 기준)
      const start = Date.UTC(+startDate.slice(0, 4), +startDate.slice(5, 7) - 1, +startDate.slice(8, 10))
      const end = Date.UTC(+endDate.slice(0, 4), +endDate.slice(5, 7) - 1, +endDate.slice(8, 10))
      const diffDays = (end - start) / (1000 * 60 * 60 * 24)
      return diffDays <= 31
    },
    {
      message: '한 번에 최대 31일까지 가져올 수 있습니다',
      path: ['endDate'],
    },
  )
  .refine(
    ({ endDate }) => {
      // 미래 날짜 차단 (KST 오늘 기준)
      const today = new Date().toISOString().slice(0, 10)
      return endDate <= today
    },
    {
      message: '종료일은 오늘 이전이어야 합니다',
      path: ['endDate'],
    },
  )
export type BizzleScrapeRequest = z.infer<typeof bizzleScrapeRequestSchema>

export const cardSaleSchema = z.object({ /* ... */ })
export const salesSummarySchema = z.object({ /* ... */ })
```

> 클라이언트 측 refine 은 UX 보조이고, 최종 무결성은 백엔드(`BIZZLE_SCRAPE_PERIOD_INVALID` / `BIZZLE_SCRAPE_PERIOD_EXCEEDED`)가 책임.
> 두 검증이 어긋나지 않도록 메시지 문구도 API plan §6 표와 동일하게 맞췄다.

### 5.2 TanStack Query 훅 (`src/hooks/queries/use-sales-queries.ts`)

```ts
export const useSalesSummary = (params: { startDate: string; endDate: string }) =>
  useQuery({ queryKey: salesKeys.summary(params), queryFn: () => api.get(...) })

export const useSalesList = (params) =>
  useQuery({ queryKey: salesKeys.list(params), queryFn: ... })

export const useImportBizzleSales = () =>
  useMutation({
    mutationFn: (body: BizzleScrapeRequest) =>
      postWithSchema('/api/sales/scrape', body, scrapeResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all })
    },
  })
```

- `src/hooks/queries/query-keys.ts`에 `salesKeys` 팩토리 추가 (계층 구조)
- **글로벌 로딩 스피너**: `useMutation`이므로 자동으로 `GlobalMutationSpinner`가 표시됨 — 별도 코드 불필요
- API 호출 시 `memberId` 미전송 (백엔드가 JWT에서 추출)
- axios `api` 인스턴스가 Bearer/affiliation 자동 부착, 401 시 auth store 클리어

### 5.3 자격증명 캐시 레이어 (별도 구현 plan)

자격증명 저장/조회/만료는 별도 모듈로 분리한다 (구현: `2026-05-28-bizzle-credential-cache-impl.md`):

- `src/lib/crypto/credential-cipher.ts` — Web Crypto(AES-GCM) + IndexedDB non-extractable 디바이스 키. `saveCredential` / `loadCredential` / `clearCredential` + 7일 sliding 만료. **TDD (vitest + fake-indexeddb)**
- `src/hooks/queries/use-bizzle-credential.ts` — 위 모듈을 TanStack Query 로 감싼 `useBizzleCredential` hook. `{ credential, isLoading, save, clear, removeCredentialCache }`

`BizzleImportModal` 은 이 hook 인터페이스만 소비한다. 자격증명을 직접 localStorage 에 쓰지 않는다.

## 6. 보안 체크리스트

- [ ] **자격증명 저장은 `credential-cipher.ts` 를 통해서만** — 비번 평문을 localStorage/sessionStorage/zustand/recoil/context 에 직접 쓰지 않기. 비번은 AES-GCM 암호문으로만, 키는 IndexedDB non-extractable
- [ ] 메모리상 평문 비번은 컴포넌트 state + TanStack Query 캐시에만 존재, **모달 unmount 시 둘 다 클리어** (`removeCredentialCache`)
- [ ] axios/fetch 인터셉터 로그에 body 출력 금지 (혹은 마스킹)
- [ ] 비밀번호 입력 영역에 `data-private`/`aria-autocomplete="off"`/`autoComplete="current-password"`
- [ ] 응답 객체에 자격증명이 절대 포함되지 않는지 (백엔드 책임이지만 front에서도 schema 검증)
- [ ] localStorage 의 저장값에 **평문 비번이 없는지** 확인 (개발자도구) — 아이디는 평문 허용
- [ ] 만료/복호화 실패 시 자동 제거 동작 확인 (다른 브라우저로 값만 복사 시 복호화 불가 → 빈 폼)
- [ ] "기억하기" 체크박스 **default OFF** — 공용 PC 무심코 저장 방지
- [ ] ⚠️ **한계 인지**: 디바이스 키는 "탈취 후 다른 환경 재사용"만 막음. 같은 페이지 XSS 는 복호화 가능 — XSS 방어(CSP/sanitize)는 앱 전반 책임 (redesign spec §6.2)

### 중복 호출 방지 / 동시 진입 응답 처리

- [ ] `useImportBizzleSales` mutation 의 `isPending` 동안:
  - "가져오기" 버튼 `disabled`
  - 모달 입력 필드 전체 `disabled`
  - 모달 close (ESC / 배경 클릭 / X 버튼) 차단 — 진행 중 종료 시 사용자 혼란 + state 불일치 위험
- [ ] 백엔드 `409 BIZZLE_SCRAPE_IN_PROGRESS` 응답을 별도 에러 케이스로 분기:
  - 같은 사용자가 다른 디바이스/탭에서 이미 진행 중일 때 발생
  - 모달 내 에러 메시지 영역에 "이미 수집이 진행 중입니다. 잠시 후 다시 시도해 주세요" 표시
  - 모달은 유지 (사용자가 잠시 후 재시도 가능)
- [ ] `BIZZLE_SCRAPE_PERIOD_EXCEEDED` (400) 응답:
  - 클라이언트 Zod refine 이 통과한 경우에도 백엔드 응답이 올 수 있음 (이론상 일치, 실수 방어용)
  - 동일하게 endDate 필드 에러로 표시

## 7. 디자인 가이드

- sales-rader 컬러/카드 디자인은 **버리고** whale-erp Tailwind 4 유틸 + Sass 7-1 패턴 사용
- **모달**: whale-erp-front 자체 모달 컴포넌트 패턴 (예: `CategoryFormModal.tsx` 참고)
  - `isOpen / onClose / onSubmit / mode / editData` 인터페이스
  - `useState`로 form state, **`useEffect`에서 setState 금지** (React Compiler 규칙)
  - 자격증명 hydrate(prefill)도 `useEffect` 내 setState 로 하지 않는다 — `useBizzleCredential` 의 TanStack Query 결과를 파생값/`key` prop 리마운트로 폼 초기값에 주입 (CLAUDE.md React Compiler 규칙)
  - `'@/components/common/custom-css/FormHelper.css'` 등 기존 form helper 재사용 가능
- **폼 검증**: Zod 스키마 `safeParse()` → `formatZodFieldErrors()`로 필드별 에러 객체 변환 (whale-erp 표준)
- **AG Grid**: 매출 리스트가 데이터 테이블이면 기존 `AgGrid.tsx` 래퍼 + `ModuleRegistry.registerModules([AllCommunityModule])` 사용
- **공통 컴포넌트 재사용**: `RangeDatePicker` (기간 필터), `Pagination`, `SearchSelect` 등
- 로딩 상태: Mutation은 `GlobalMutationSpinner` 자동 / Query는 컴포넌트별 `isPending`

## 8. 작업 순서

> whale-erp-front 신 기능 추가 표준 순서: **types → schemas → query hooks → 컴포넌트 → 라우트 → storybook** (CLAUDE.md).
> Next.js 16 작업 전 `node_modules/next/dist/docs/` 관련 문서 먼저 확인 (AGENTS.md).

1. [ ] **[별도 구현 plan]** 자격증명 캐시 레이어 — `2026-05-28-bizzle-credential-cache-impl.md` 의 Task 1~5
   - vitest + fake-indexeddb 셋업, `credential-cipher.ts` (TDD), `useBizzleCredential` hook
   - **이 단계가 BizzleImportModal(9번) 의 선행 의존성**
2. [ ] `src/types/sales.ts` — `CardSale`, `SalesSummary`, `BizzleScrapeRequest` 등 타입
3. [ ] `src/lib/schemas/sales.ts` — Zod 스키마 (요청/응답)
   - `bizzleScrapeRequestSchema` 에 §5.1 명세대로 3개 refine 적용 (start≤end, ≤31일, end≤today)
4. [ ] `src/hooks/queries/query-keys.ts`에 `salesKeys` 팩토리 추가
5. [ ] `src/hooks/queries/use-sales-queries.ts` — `useSalesSummary`, `useSalesList`, `useImportBizzleSales`
   - `useImportBizzleSales` 의 `onError`: 백엔드 ErrorCode (`BIZZLE_*`) 별 메시지 분기 (§4·§6 참조)
6. [ ] `src/components/sales/SalesDashboard.tsx` 래퍼 — 기존 `Plans.tsx` 패턴
7. [ ] `src/components/sales/SalesSummary.tsx` (mock → 실 데이터)
8. [ ] `src/components/sales/SalesSearch.tsx` (`RangeDatePicker` 재사용)
9. [ ] `src/components/sales/BizzleImportModal.tsx` — 자체 모달 패턴 (`CategoryFormModal` 참조)
   - `useBizzleCredential` 로 **hydrate(prefill) + "7일 동안 기억하기" 체크박스(default OFF) + "저장 해제" 버튼** (§4 + impl plan Task 6)
   - 제출 시 체크박스 ON→`save`, OFF→`clear`. 자동 수집 안 함 (사용자 클릭만)
   - `isPending` 동안: 버튼/입력 필드 disable + close 차단 + "최대 2분 소요" 안내 텍스트 노출 (§4·§6 참조)
   - `BIZZLE_SCRAPE_IN_PROGRESS` (409) 응답 시 모달 유지 + 별도 에러 메시지 표시
   - unmount 시 `removeCredentialCache()` (평문 비번 캐시 정리)
10. [ ] `src/components/sales/SalesList.tsx` (AG Grid 또는 기존 테이블)
11. [ ] `src/app/(sub)/sales/page.tsx`, `list/page.tsx` 라우트 등록
12. [ ] 메뉴 등록 (`src/data/HeaderMenu.ts`)
    - ⚠️ **권한 부여는 권한 관리 화면에서 운영자가 수동 등록 (본 plan 범위 외)**. PoC 시작 전 등록 누락 시 메뉴가 LNB에 안 보임 → §2 핵심 정책 참조
13. [ ] api와 통합 동작 확인 (dev 환경, axios 인스턴스 자동 Bearer)
    - 31일 초과 케이스, 동시 호출(409) 케이스, **자격증명 hydrate/저장/해제/만료** 케이스 포함 (impl plan Task 6 Step 3 체크리스트)
14. [ ] **`pnpm lint` + `pnpm build` + `pnpm test` 통과 확인** (메모리 규칙: 코드 수정 후 항상. cipher 테스트 포함)
15. [ ] React Compiler 규칙 위반 점검 (`useEffect` 내 setState 등 — hydrate 는 TanStack Query 로 처리하여 회피)
16. [ ] 공통 컴포넌트가 생기면 `/storybook/`에 데모 추가 (선택)
17. [ ] 작업 완료 후 plan 문서 상태 `초안 → 구현 완료`로 갱신

## 9. 회피 / 비교: sales-rader 대비 변경점

| sales-rader | whale-erp 이식본 |
|-------------|------------------|
| 자격증명을 backend `.env`에 고정 | 사용자 입력 + 브라우저 localStorage 암호화 캐시 (서버 DB 비저장) |
| 자체 컬러 토큰 (`bg-surface`, `text-navy` 등) | whale-erp 디자인 토큰 |
| ScrapeButton 단독 트리거 | 모달 내 자격증명 입력과 결합된 트리거 |
| 단일 사용자 가정 | UI 자체는 동일(사용자가 자기 계정 입력), 다중 계정은 자연스럽게 지원 |

## 10. 미해결 / 후속

- [ ] 본사/가맹점 관리자 모드 (본사가 하위 멤버 매출을 묶어서 볼 때의 화면 분기 — api 후속 Flyway 버전에서 head_office_id/franchise_id 보강 이후)
- [x] ~~"자격증명 저장하기" 옵션 (저장형 정책 협의 후)~~ → **2026-05-28 재설계로 해결** (브라우저 localStorage 암호화 캐시, 7일 sliding, 체크박스 default OFF). 단 **서버 저장형 자동 수집(배치)은 폐기** — 본 옵션은 "브라우저 측 저장"으로만 구현

> 메뉴 권한 정책은 본 plan 범위 외 — whale-erp 권한 관리 화면에서 sales 메뉴/프로그램 권한을 추가하는 방식으로 처리됨.
