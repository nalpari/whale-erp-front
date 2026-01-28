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
- `src/app/editor/` — Standalone rich text editor page

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
  - `refetchOnWindowFocus: false` (ERP 특성상 비활성화)
- **`src/hooks/queries/`**: 쿼리 훅 모음
  - `query-keys.ts` — 쿼리 키 팩토리 (타입 안전 invalidation)
  - `use-store-queries.ts` — 점포 CRUD 훅
  - `use-file-queries.ts` — 파일 관련 훅

```typescript
// 조회
const { data, isPending, error } = useStoreList(params)
const { data, isPending } = useStoreDetail(storeId)

// 생성/수정/삭제
const { mutateAsync, isPending } = useCreateStore()
await mutateAsync({ payload, files })
```

**Client State (Zustand)** — UI 상태

- **`src/stores/auth-store.ts`**: Zustand store with `persist` middleware (localStorage key: `auth-storage`)
  - Stores `accessToken`, `refreshToken`, `authority` (권한 상세), `affiliationId` (조직 ID)
  - Methods: `setTokens()`, `setAccessToken()`, `setAuthority()`, `setAffiliationId()`, `clearAuth()`
- Access state outside React: `useAuthStore.getState()`

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
- Tailwind 4 uses CSS `@import "tailwindcss"` syntax and `@theme` directive
- ESLint uses flat config with Next.js core-web-vitals and TypeScript presets
