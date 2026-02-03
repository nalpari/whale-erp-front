# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev       # Start development server on http://localhost:3000
pnpm build     # Production build
pnpm start     # Start production server
pnpm lint      # Run ESLint (flat config, eslint.config.mjs)
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

- `src/app/(auth)/` — Authentication pages (login) with dedicated CSS, no shared layout
- `src/app/(sub)/` — Main ERP pages with shared layout (LNB sidebar, Header, FullDownMenu)
  - `masterlist/` — Master list page
  - `store/(manage)/info/` — Store management pages (list, detail, header)
- `src/app/editor/` — Standalone rich text editor page

### Component Structure

```
src/components/
├── common/                        # 공통 컴포넌트
│   ├── FileUploader.tsx           # 파일 업로드
│   └── HeadOfficeFranchiseStoreSelect.tsx  # 본사-가맹점-점포 계층 선택
├── editor/                        # Tiptap 에디터
│   ├── Editor.tsx
│   ├── SlashCommand.tsx
│   └── slash-commands.ts
├── login/                         # 로그인 관련
│   ├── FindIdPw.tsx
│   └── find/
├── masterlist/                    # 마스터리스트
│   ├── MasterList.tsx
│   └── MasterSearch.tsx
├── program/                       # 프로그램 관리
│   ├── ProgramList.tsx            # 프로그램 목록 및 계층 관리
│   └── ProgramFormModal.tsx       # 프로그램 등록/수정 모달
├── store/manage/                  # 점포 관리
│   ├── StoreList.tsx
│   ├── StoreInfo.tsx
│   ├── StoreDetail.tsx
│   └── StoreHeader.tsx
└── ui/                            # 공통 UI
    ├── AgGrid.tsx
    ├── Header.tsx
    ├── Location.tsx
    ├── Pagination.tsx
    └── common/
        ├── DatePicker.tsx
        ├── FullDownMenu.tsx
        ├── Lnb.tsx
        ├── MyData.tsx
        └── ServiceTab.tsx
```

### Types

```
src/types/
├── bp.ts              # BP (본사/가맹점/점포) 타입
├── store.ts           # 점포 관련 타입
└── upload-files.ts    # 파일 업로드 타입
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
- **`src/providers/query-provider.tsx`**: QueryClientProvider 래퍼 (DevTools 포함)
- **`src/hooks/queries/`**: 쿼리 훅 모음
  - `query-keys.ts` — 쿼리 키 팩토리 (계층 구조: storeKeys, fileKeys, bpKeys, commonCodeKeys, programKeys)
  - `use-store-queries.ts` — 점포 CRUD 훅
  - `use-file-queries.ts` — 파일 다운로드 URL 조회
  - `use-bp-queries.ts` — BP 본사/가맹점/점포 트리 조회
  - `use-common-code-queries.ts` — 공통코드 계층 조회 및 캐시 유틸
  - `use-program-queries.ts` — 프로그램 CRUD 훅 (menuKind 필터링)

```typescript
// 점포 조회
const { data, isPending, error } = useStoreList(params)
const { data, isPending } = useStoreDetail(storeId)

// 점포 생성/수정/삭제
const { mutateAsync, isPending } = useCreateStore()
await mutateAsync({ payload, files })

// BP 트리 조회
const { data, isPending } = useBpHeadOfficeTree()

// 공통코드 조회
const { data, isPending } = useCommonCodeHierarchy('GENDER')

// 프로그램 조회
const { data, isPending } = useProgramList('MNKND_001')

// 프로그램 생성/수정/삭제
const { mutateAsync } = useCreateProgram()
await mutateAsync({ parent_id, menu_kind, name, path, icon_url, is_active })

// 레거시 호환 래퍼 훅
import { useBp } from '@/hooks/useBp'
import { useCommonCode } from '@/hooks/useCommonCode'
```

**Client State (Zustand)** — UI 상태

- **`src/stores/auth-store.ts`**: Zustand store with `persist` middleware (localStorage key: `auth-storage`)
  - Stores `accessToken`, `refreshToken`, `authority` (권한 상세), `affiliationId` (조직 ID), `subscriptionPlan`
  - Methods: `setTokens()`, `setAccessToken()`, `setAuthority()`, `setAffiliationId()`, `setSubscriptionPlan()`, `clearAuth()`
- **`src/stores/program-store.ts`**: Zustand store for program UI state
  - Stores `selectedMenuKind`, `inputKeyword`, `searchKeyword`, `searchResults`, `openItems`, `isModalOpen`, `modalMode`, `modalProgram`
  - Search state separation: `inputKeyword` (입력창 값, 초기화 버튼) ≠ `searchKeyword` (실행된 검색어, 검색 버튼)
  - `setSelectedMenuKind()` auto-clears all search states (입력창 + 검색결과)
  - Methods: `setInputKeyword()`, `setSearchKeyword()`, `clearSearch()`, `toggleItem()`, `openModal()`, `closeModal()`
- **`src/stores/bp-store.ts`**: ⚠️ **@deprecated** — TanStack Query로 마이그레이션 완료 (use `useBpHeadOfficeTree` instead)
- **`src/stores/common-code-store.ts`**: ⚠️ **@deprecated** — TanStack Query로 마이그레이션 완료 (use `useCommonCodeHierarchy` instead)
- Access state outside React: `useAuthStore.getState()`

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

Available at `/editor`:

- **Editor.tsx**: Main editor with extensions (images, links, tables, code blocks with lowlight)
- **SlashCommand extension**: Custom Tiptap extension triggered by "/" character
- **slash-commands.ts**: Command definitions — add new commands to `slashCommands` array
- **SlashCommand.tsx**: Command palette UI with keyboard navigation

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

### Adding New Features
1. Define types in `src/types/` if needed
2. Create Zod schemas in `src/lib/schemas/`
3. Add API hooks in `src/hooks/queries/`
4. Create components in appropriate folders
5. Add routes in `src/app/(sub)/`

### Working with TanStack Query
- Always define query keys in `query-keys.ts` using factory pattern
- Use hierarchical keys for proper cache invalidation
- Set appropriate `staleTime` based on data volatility
- Use `enabled` option for dependent queries

### Code Quality
- Run `pnpm lint` before committing
- Follow TypeScript strict mode
- Avoid `any` types
- Keep components focused and single-purpose
