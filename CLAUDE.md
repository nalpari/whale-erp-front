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
- **Zustand** for state management
- **Axios** for API calls
- **AG Grid** for data tables
- **Sass** for component styles (alongside Tailwind)

## Architecture

### Route Groups

- `src/app/(auth)/` — Authentication pages (login) with no shared layout
- `src/app/(sub)/` — Main ERP pages with shared layout (LNB sidebar, Header, FullDownMenu)
- `src/app/editor/` — Standalone rich text editor page

### API Layer

- **`src/lib/api.ts`**: Axios instance with request/response interceptors
  - Automatically attaches Bearer token from auth store
  - Handles 401 responses by clearing auth state
  - Base URL from `NEXT_PUBLIC_API_URL` environment variable

- **Environment switching**:
  - `pnpm dev` → `.env.development` → dev API
  - `pnpm build && pnpm start` → `.env.production` → prod API

### State Management

- **`src/stores/auth-store.ts`**: Zustand store with `persist` middleware (localStorage key: `auth-storage`)
  - Stores `accessToken` and `refreshToken`
  - Methods: `setTokens(access, refresh)`, `setAccessToken(token)`, `clearAuth()`
- Access token outside React: `useAuthStore.getState().accessToken`

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
