# Bizzle 카드매출 가져오기 UI (Front)

- 작성일: 2026-05-14
- 상태: 초안 (검토 대기)
- 출처: `~/IdeaProjects/sales-rader/frontend` (Next.js 16 PoC)
- 관련 api plan: `whale-erp-api/docs/plans/sales/2026-05-14-bizzle-sales-scraper-integration.md`

## 1. 목적

whale-erp 내부 사용자가 자신의 Bizzle 자격증명을 직접 입력하여, **즉석 카드매출 가져오기 + 조회/요약** 흐름을 whale-erp-front에서 수행할 수 있도록 한다. sales-rader가 가지고 있던 별도 디자인을 **whale-erp 디자인 토큰/컴포넌트로 재이식**한다.

## 2. 핵심 정책 (결정됨)

| 항목 | 결정 |
|------|------|
| 자격증명 입력 방식 | **모달 폼, 사용자가 매 호출마다 입력** |
| 자격증명 저장 | **저장하지 않음** — sessionStorage/localStorage 모두 금지, React state(메모리)만 |
| 비밀번호 필드 | `type="password"`, autocomplete `current-password`, 입력값 응답 후 즉시 클리어 |
| 모달 구현 | **whale-erp-front 자체 모달 패턴** (예: `CategoryFormModal`, `ProgramFormModal`) — shadcn `Dialog` 미사용 |
| 폼 검증 | **Zod 4 + `formatZodFieldErrors`** (whale-erp 표준), react-hook-form 미사용 |
| 서버 상태 | **TanStack Query** (`useQuery`/`useMutation`) — `src/hooks/queries/`에 훅 추가 |
| API 호출 | **`@/lib/api.ts`의 axios 인스턴스** — Bearer/affiliation 자동, `postWithSchema()` 권장 |
| 라우팅 | **`src/app/(sub)/sales/` 신규** — `(sub)/layout.tsx`의 LNB/Header 자동 적용 |
| 메뉴 권한 | **본 plan 범위 외** — 권한 관리 화면에서 별도 추가, sales 도메인 코드에서는 처리하지 않음 |
| **데이터 소유** | **현재 로그인 사용자(memberId) 데이터만 조회** — 백엔드가 JWT로 격리하므로 front에서 별도 필터 파라미터 보내지 않음 |

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
3. 모달 입력:
   - 아이디 (text)
   - 비밀번호 (password)
   - 시작일/종료일 (date)
4. "가져오기" 클릭 → `POST /api/sales/scrape` 호출, 로딩 상태 표시
5. 응답 수신 (api 재시도 정책과 매칭):
   - **`status: SUCCESS`** → 성공 토스트 ("X건 저장") + summary/list 재조회
   - **`status: PARTIAL`** → 경고 토스트 ("X건 저장, Y건 실패") + 그래도 재조회 (보존된 데이터 표시)
   - **`status: FAILED`** → 모달 안 에러 메시지, 모달 유지하여 사용자가 비번 재입력/재시도 가능
   - 에러 단계별 메시지 구분:
     - 로그인 실패 → "아이디/비밀번호를 확인해 주세요"
     - 세션 만료 → "다시 시도해 주세요"
     - 네트워크 오류 → "잠시 후 다시 시도해 주세요" (api에서 1회 재시도는 이미 했음)
     - 저장 오류 → "데이터 저장 중 오류 발생, 관리자 문의"
   - **사용자가 "가져오기"를 다시 누르는 것은 안전** (api가 idempotent 보장)
6. 모달 닫힐 때 또는 응답 직후 **state의 비밀번호 필드를 빈 문자열로 클리어** (`useEffect` cleanup)

## 5. API/쿼리 레이어

### 5.1 Zod 스키마 (`src/lib/schemas/sales.ts`)

```ts
import { z } from 'zod'

export const bizzleScrapeRequestSchema = z.object({
  loginId: z.string().min(1),
  loginPw: z.string().min(1),
  startDate: z.string(),  // YYYY-MM-DD
  endDate: z.string(),
})
export type BizzleScrapeRequest = z.infer<typeof bizzleScrapeRequestSchema>

export const cardSaleSchema = z.object({ /* ... */ })
export const salesSummarySchema = z.object({ /* ... */ })
```

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

## 6. 보안 체크리스트

- [ ] `BizzleImportModal`에서 input 값을 컴포넌트 state로만 보관, **store(zustand/recoil)·context·storage 사용 금지**
- [ ] axios/fetch 인터셉터 로그에 body 출력 금지 (혹은 마스킹)
- [ ] 모달 close/unmount 시 state 클리어
- [ ] 비밀번호 입력 영역에 `data-private`/`aria-autocomplete="off"`/`autoComplete="current-password"`
- [ ] 응답 객체에 자격증명이 절대 포함되지 않는지 (백엔드 책임이지만 front에서도 schema 검증)

## 7. 디자인 가이드

- sales-rader 컬러/카드 디자인은 **버리고** whale-erp Tailwind 4 유틸 + Sass 7-1 패턴 사용
- **모달**: whale-erp-front 자체 모달 컴포넌트 패턴 (예: `CategoryFormModal.tsx` 참고)
  - `isOpen / onClose / onSubmit / mode / editData` 인터페이스
  - `useState`로 form state, **`useEffect`에서 setState 금지** (React Compiler 규칙)
  - `'@/components/common/custom-css/FormHelper.css'` 등 기존 form helper 재사용 가능
- **폼 검증**: Zod 스키마 `safeParse()` → `formatZodFieldErrors()`로 필드별 에러 객체 변환 (whale-erp 표준)
- **AG Grid**: 매출 리스트가 데이터 테이블이면 기존 `AgGrid.tsx` 래퍼 + `ModuleRegistry.registerModules([AllCommunityModule])` 사용
- **공통 컴포넌트 재사용**: `RangeDatePicker` (기간 필터), `Pagination`, `SearchSelect` 등
- 로딩 상태: Mutation은 `GlobalMutationSpinner` 자동 / Query는 컴포넌트별 `isPending`

## 8. 작업 순서

> whale-erp-front 신 기능 추가 표준 순서: **types → schemas → query hooks → 컴포넌트 → 라우트 → storybook** (CLAUDE.md).
> Next.js 16 작업 전 `node_modules/next/dist/docs/` 관련 문서 먼저 확인 (AGENTS.md).

1. [ ] `src/types/sales.ts` — `CardSale`, `SalesSummary`, `BizzleScrapeRequest` 등 타입
2. [ ] `src/lib/schemas/sales.ts` — Zod 스키마 (요청/응답)
3. [ ] `src/hooks/queries/query-keys.ts`에 `salesKeys` 팩토리 추가
4. [ ] `src/hooks/queries/use-sales-queries.ts` — `useSalesSummary`, `useSalesList`, `useImportBizzleSales`
5. [ ] `src/components/sales/SalesDashboard.tsx` 래퍼 — 기존 `Plans.tsx` 패턴
6. [ ] `src/components/sales/SalesSummary.tsx` (mock → 실 데이터)
7. [ ] `src/components/sales/SalesSearch.tsx` (`RangeDatePicker` 재사용)
8. [ ] `src/components/sales/BizzleImportModal.tsx` — 자체 모달 패턴 (`CategoryFormModal` 참조)
9. [ ] `src/components/sales/SalesList.tsx` (AG Grid 또는 기존 테이블)
10. [ ] `src/app/(sub)/sales/page.tsx`, `list/page.tsx` 라우트 등록
11. [ ] 메뉴 등록 (`src/data/HeaderMenu.ts`)  ※ 권한 부여는 권한 관리 화면에서 별도 처리 (본 plan 범위 외)
12. [ ] api와 통합 동작 확인 (dev 환경, axios 인스턴스 자동 Bearer)
13. [ ] **`pnpm lint` + `pnpm build` 통과 확인** (메모리 규칙: 코드 수정 후 항상)
14. [ ] React Compiler 규칙 위반 점검 (`useEffect` 내 setState 등)
15. [ ] 공통 컴포넌트가 생기면 `/storybook/`에 데모 추가 (선택)
16. [ ] 작업 완료 후 plan 문서 상태 `초안 → 구현 완료`로 갱신

## 9. 회피 / 비교: sales-rader 대비 변경점

| sales-rader | whale-erp 이식본 |
|-------------|------------------|
| 자격증명을 backend `.env`에 고정 | 사용자가 매 호출마다 모달에 입력 |
| 자체 컬러 토큰 (`bg-surface`, `text-navy` 등) | whale-erp 디자인 토큰 |
| ScrapeButton 단독 트리거 | 모달 내 자격증명 입력과 결합된 트리거 |
| 단일 사용자 가정 | UI 자체는 동일(사용자가 자기 계정 입력), 다중 계정은 자연스럽게 지원 |

## 10. 미해결 / 후속

- [ ] 본사/가맹점 관리자 모드 (본사가 하위 멤버 매출을 묶어서 볼 때의 화면 분기 — api V79 이후)
- [ ] "자격증명 저장하기" 옵션 (저장형 정책 협의 후)

> 메뉴 권한 정책은 본 plan 범위 외 — whale-erp 권한 관리 화면에서 sales 메뉴/프로그램 권한을 추가하는 방식으로 처리됨.
