# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev       # 개발 서버 (localhost:3000)
pnpm build     # 프로덕션 빌드
pnpm start     # 프로덕션 서버 실행
pnpm lint      # ESLint 검사 (flat config, eslint.config.mjs)
```

## Tech Stack

- **Next.js 16** with App Router (`src/app/`)
- **React 19** with React Compiler enabled (`next.config.ts`)
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **TypeScript** in strict mode
- **TanStack Query** for server state (API data caching, loading/error states)
- **Zustand** for client state (auth, UI state)
- **Axios** for API calls
- **Zod 4** for schema validation and type inference
- **AG Grid** for data tables
- **Sass** for component styles (alongside Tailwind)

## Architecture

### Route Groups

- `src/app/(auth)/` — 인증 페이지 (로그인), 별도 레이아웃
- `src/app/(sub)/` — 메인 ERP 페이지 (LNB 사이드바, Header, FullDownMenu 공유 레이아웃)
  - `store/(manage)/info/` — 점포 관리
  - `employee/` — 직원 관리 (목록, 상세, 근무 일정)
  - `storybook/` — 공통 컴포넌트 데모 페이지
- `src/app/editor/` — 독립 Tiptap 에디터 페이지

### Component Domains

```
src/components/
├── common/              # 공통 컴포넌트
│   ├── FileUploader.tsx              # 파일 업로드
│   ├── HeadOfficeFranchiseStoreSelect.tsx  # 본사-가맹점-점포 계층 선택
│   ├── DraggableTree.tsx             # 드래그 가능 트리
│   └── SearchableSelect.tsx          # 검색 가능 셀렉트
├── editor/              # Tiptap 에디터
├── employee/            # 직원 관리
│   ├── employeeinfo/    # 직원 정보 CRUD
│   ├── work-status/     # 근무 일정 관리
│   ├── settings/        # 직원 설정
│   └── popup/           # 직원 검색 팝업
├── store/manage/        # 점포 관리
└── ui/common/           # 공통 UI 컴포넌트
    ├── DatePicker.tsx        # 단일 날짜 선택
    ├── RangeDatePicker.tsx   # 날짜 범위 선택
    ├── SearchSelect.tsx      # 검색 셀렉트
    ├── Lnb.tsx               # 좌측 네비게이션
    └── FullDownMenu.tsx      # 전체 메뉴
```

### Types

```
src/types/
├── bp.ts              # BP (본사/가맹점/점포)
├── store.ts           # 점포
├── employee.ts        # 직원
├── work-schedule.ts   # 근무 일정
└── upload-files.ts    # 파일 업로드
```

### API Layer

- **`src/lib/api.ts`**: Axios instance with request/response interceptors
  - Automatically attaches Bearer token from auth store
  - Automatically attaches `affiliation` header for multi-organization support
  - Handles 401 responses by clearing auth state
  - Base URL from `NEXT_PUBLIC_API_URL` environment variable
  - `getWithSchema()`, `postWithSchema()` for Zod-validated requests

- **Environment switching**:
  - `pnpm dev` → `.env.development` → dev API
  - `pnpm build && pnpm start` → `.env.production` → prod API

### Schema Validation (Zod)

- **`src/lib/schemas/`**: Zod schemas for runtime validation and type inference
  - `api.ts` — API response schemas (`apiResponseSchema`, `pageResponseSchema`)
  - `auth.ts` — Authentication schemas (login, authority, tokens)
  - `env.ts` — Environment variable validation
  - `forms.ts` — Form validation schemas (common fields, patterns)
  - `menu.ts` — Menu type schemas
  - `program.ts` — Program schemas (hierarchy, form validation, CRUD)
  - `index.ts` — Unified exports

- **`src/lib/zod-utils.ts`**: Utility functions
  - `formatZodError()` — Convert errors to user-friendly messages
  - `formatZodFieldErrors()` — Convert errors to field-keyed object
  - `validateApiResponse()` — Dev-only API response validation
  - `createFormValidator()` — Form validation helper
  - `createTypeGuard()` — Type guard generator

**Usage patterns:**
```typescript
// Form validation
import { loginRequestSchema } from '@/lib/schemas/auth';
const result = loginRequestSchema.safeParse({ loginId, password });

// API response validation
import { getWithSchema } from '@/lib/api';
const data = await getWithSchema('/api/users', userListSchema);

// Type inference from schema
import type { LoginRequest } from '@/lib/schemas/auth';
```

### State Management

**Server State (TanStack Query)** — API 데이터 캐싱

- **`src/lib/query-client.ts`**: QueryClient 설정
  - `staleTime: 5분` (적극적 캐싱)
  - `gcTime: 10분` (가비지 컬렉션 시간)
  - `refetchOnWindowFocus: false` (ERP 특성상 비활성화)
- **`src/providers/query-provider.tsx`**: QueryClientProvider 래퍼 (GlobalMutationSpinner + DevTools 포함)
- **`src/hooks/queries/`**: 쿼리 훅 모음
  - `query-keys.ts` — 쿼리 키 팩토리 (계층 구조)
  - `use-store-queries.ts` — 점포 CRUD
  - `use-store-schedule-queries.ts` — 점포 스케줄
  - `use-employee-queries.ts` — 직원 CRUD
  - `use-employee-settings-queries.ts` — 직원 설정
  - `use-bp-queries.ts` — BP 본사/가맹점/점포 트리
  - `use-common-code-queries.ts` — 공통코드 계층 조회
  - `use-program-queries.ts` — 프로그램 CRUD
  - `use-file-queries.ts` — 파일 다운로드 URL

```typescript
// 점포 조회/생성
const { data, isPending } = useStoreList(params)
const { mutateAsync } = useCreateStore()

// 직원 조회/생성
const { data } = useEmployeeList(params)
const { mutateAsync } = useCreateEmployee()

// BP 트리 조회
const { data } = useBpHeadOfficeTree()

// 공통코드 조회
const { data } = useCommonCodeHierarchy('GENDER')
```

**Client State (Zustand)** — UI 상태

- **`src/stores/auth-store.ts`**: Zustand store with `persist` middleware (localStorage key: `auth-storage`)
  - Stores `accessToken`, `refreshToken`, `authority` (권한 상세), `affiliationId` (조직 ID), `subscriptionPlan`
  - Methods: `setTokens()`, `setAccessToken()`, `setAuthority()`, `setAffiliationId()`, `setSubscriptionPlan()`, `clearAuth()`
- **`src/stores/program-store.ts`**: 프로그램 UI 상태
- **`src/stores/store-search-store.ts`**: 점포 검색 상태
- **`src/stores/store-schedule-store.ts`**: 점포 스케줄 UI 상태
- **`src/stores/mypage-store.ts`**: 마이페이지 UI 상태
- React 외부 접근: `useAuthStore.getState()`

**상태 관리 전략:**
- 서버에서 오는 데이터 → TanStack Query (점포, BP, 공통코드 등)
- 클라이언트 전용 데이터 → Zustand (인증 토큰, UI 상태)

### Authentication Flow

Login supports multi-authority (조직) selection:
1. User submits credentials to `/api/auth/login`
2. If single authority: auto-select and proceed
3. If multiple authorities: modal appears for user selection
4. Selected authority's details fetched from `/api/system/authorities/{id}`
5. `affiliationId` stored for API header injection

### Styling Architecture

Dual styling system:
1. **Tailwind CSS 4** — utility classes in JSX
2. **Sass modules** — `src/styles/style.scss` with 7-1 pattern:
   - `abstracts/` — variables, mixins
   - `base/` — reset, typography, form elements
   - `layout/` — header, lnb, ag-grid, popups
   - `components/` — content blocks, tables, slidebox

### Data Grids (AG Grid)

- Must register modules: `ModuleRegistry.registerModules([AllCommunityModule])`
- Use `'use client'` directive for AG Grid components
- Custom cell renderers return JSX directly

### Navigation

- **`src/data/HeaderMenu.ts`**: Defines menu structure with nested children
- LNB (Left Navigation Bar) renders this hierarchical menu

### Rich Text Editor (Tiptap)

`/editor` 경로에서 사용 가능:
- **Editor.tsx**: 이미지, 링크, 테이블, 코드 블록 확장 포함
- **SlashCommand**: "/" 트리거 커맨드 팔레트

### Storybook (컴포넌트 데모)

`/storybook/*` 경로에서 공통 컴포넌트 데모 확인:
- `/storybook/datepicker` — DatePicker, RangeDatePicker
- `/storybook/search-select` — SearchSelect
- `/storybook/upload` — FileUploader
- `/storybook/editor` — Tiptap Editor
- `/storybook/radio` — RadioButtonGroup

## Key Configuration

- Path alias: `@/*` maps to `./src/*`
- Tailwind 4 uses CSS `@import "tailwindcss"` syntax and `@theme` directive in `src/app/globals.css`
- ESLint uses flat config with Next.js core-web-vitals and TypeScript presets
- React Compiler enabled in `next.config.ts` for automatic memoization
- S3 image remote patterns configured for file uploads

## Best Practices

### State Management
- Use TanStack Query for all server-side data (API calls)
- Use Zustand only for client-side state (auth tokens, UI state)
- Avoid using deprecated stores (`bp-store.ts`, `common-code-store.ts`)

### API Calls
- Always use the `api` instance from `@/lib/api.ts`
- Prefer `getWithSchema()`, `postWithSchema()` for type-safe API calls
- Let interceptors handle authentication headers automatically

### Schema Validation
- Define Zod schemas in `src/lib/schemas/`
- Use `safeParse()` for form validation
- Use `z.infer<>` for type inference from schemas

### Component Organization
- Keep domain-specific components in their own folders (`store/`, `login/`, etc.)
- Reusable UI components go in `components/ui/`
- Use `'use client'` only when necessary (state, events, browser APIs)

### Styling
- Use Tailwind for simple utilities
- Use Sass for complex component styles
- Follow BEM-like naming in Sass: `block-element-state`
- **기존 CSS/Sass 파일 수정 금지** - pub 프로젝트 코드 참조 시에도 새로운 스타일은 Tailwind 클래스 사용 또는 컴포넌트 내 인라인 스타일로 처리

## Development Guidelines

### 새 기능 추가 순서
1. `src/types/`에 타입 정의
2. `src/lib/schemas/`에 Zod 스키마 작성
3. `src/hooks/queries/`에 API 훅 추가
4. 컴포넌트 생성
5. `src/app/(sub)/`에 라우트 추가
6. `/storybook/`에 데모 페이지 추가 (공통 컴포넌트인 경우)

### TanStack Query
- `query-keys.ts`에 쿼리 키 팩토리 패턴으로 정의
- 계층적 키 사용으로 캐시 무효화 관리
- 의존적 쿼리는 `enabled` 옵션 사용
- **글로벌 로딩 스피너**: `useMutation` 사용 시 `GlobalMutationSpinner`가 자동으로 CubeLoader 오버레이 표시
  - Query(조회): 각 컴포넌트에서 `isPending`으로 개별 로딩 처리
  - Mutation(변경): 글로벌 스피너 자동 적용 (별도 코드 불필요)
  - 상세: `reference-docs/Global-Loading-Spinner-guide.md`

### Code Quality
- 커밋 전 `pnpm lint` 실행
- TypeScript strict mode 준수
- `any` 타입 사용 금지

### Memo
- 태스크가 끝나면 린트체크, 타입체크, 빌드체크를 수행해줘.