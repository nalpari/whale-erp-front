# Agent Guidelines for whale-erp-front

## Commands

```bash
pnpm dev       # Development server at http://localhost:3000
pnpm build     # Production build
pnpm start     # Production server
pnpm lint      # ESLint check (flat config: eslint.config.mjs)
```

**Testing**: No test framework. Do NOT write tests without explicit setup request.

---

## Critical Rules (MUST follow)

1. **TypeScript Strict**: Never use `any`, `@ts-ignore`, `@ts-expect-error`
2. **Single Quotes**: `'string'` not `"string"` (Prettier enforced)
3. **No Semicolons**: Let Prettier handle ASI
4. **Client Directive**: `'use client'` at file top for interactive components
5. **Path Alias**: Use `@/*` for all src imports

---

## Formatting (Prettier - .prettierrc)

```json
{
  "singleQuote": true,
  "semi": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 120,
  "arrowParens": "always"
}
```

---

## Imports

```tsx
'use client'                                    // Directive first (if needed)

import { useState } from 'react'                // React/Next.js
import { format } from 'date-fns'               // Third-party
import { useAuthStore } from '@/stores/auth-store'  // Local (@/* alias)
```

---

## TypeScript

- **Strict mode** enabled
- Use `interface` for object shapes, `type` for unions
- Define props interface before component
- Explicit returns for complex logic only

```tsx
interface ButtonProps {
  label: string
  onClick: () => void
}

export default function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components/Files | PascalCase | `DatePicker.tsx` |
| Utilities | kebab-case | `auth-store.ts` |
| Functions/Variables | camelCase | `handleClick` |
| Constants | UPPER_SNAKE | `MONTHS` |
| Types/Interfaces | PascalCase | `AuthState` |

---

## Component Patterns

- `'use client'` directive at top for client components
- Default exports for pages/components
- Named exports for utilities
- Keep under 200 lines

---

## State Management (Zustand)

```tsx
// In React component
const { accessToken } = useAuthStore()

// Outside React (e.g., interceptors)
const token = useAuthStore.getState().accessToken
```

Store pattern: `src/stores/auth-store.ts`

---

## API Layer (src/lib/api.ts)

```tsx
import api from '@/lib/api'

const response = await api.get('/endpoint')
```

- Base URL: `NEXT_PUBLIC_API_URL`
- Auto Bearer token attachment
- 401 → auto auth clear
- Timeout: 10000ms

---

## AG Grid (CRITICAL)

**Must register modules BEFORE component declaration:**

```tsx
'use client'

import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, ColDef } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])  // Required!

interface IRow { /* ... */ }

const colDefs: ColDef<IRow>[] = [
  { field: 'name', headerName: '이름' },
  { cellRenderer: () => <button>Action</button> },
]

const defaultColDef = {
  sortable: false,
  resizable: false,
  cellStyle: { textAlign: 'center' },
  autoHeight: true,
}
```

---

## Styling (Dual System)

### 1. Tailwind CSS 4
- Utility classes in JSX
- Dark mode: `dark:` prefix
- Typography: `prose` classes

### 2. Sass (7-1 Pattern) at `src/styles/`
- `abstracts/` - variables, mixins
- `base/` - reset, fonts, form elements
- `layout/` - header, LNB, AG Grid
- `components/` - tables, popups, contents

**Variable naming**: `$prefix-category-property` (e.g., `$font-ds-16`)

---

## Date Handling

```tsx
import { format, getYear, getMonth } from 'date-fns'
// OR
import * as DateFNS from 'date-fns'

const formatted = format(new Date(), 'yyyy-MM-dd')
```

For timezones: `date-fns-tz`

---

## Editor (Tiptap)

Extensions: `StarterKit`, `CodeBlockLowlight`, `Link`, `Image`, `Table` family, `Placeholder`

Slash commands: `src/components/editor/slash-commands.ts`

---

## Environment

| Env | File | API |
|-----|------|-----|
| Dev | `.env.development` | dev-api.whaleerp.co.kr |
| Prod | `.env.production` | api.whaleerp.co.kr |

**Never commit `.env.*` files**

---

## Next.js

- **App Router**: `src/app/`
- Route groups: `(sub)` for shared layouts
- Server components default; `'use client'` for interactivity
- React Compiler enabled (`next.config.ts`)

---

## Project Structure

```
src/
├── app/                    # Pages & layouts
│   ├── (sub)/              # ERP routes with shared layout
│   └── editor/             # Standalone editor page
├── components/
│   ├── ui/                 # Common UI (Header, AgGrid, Pagination)
│   │   └── common/         # LNB, DatePicker, etc.
│   ├── editor/             # Tiptap editor
│   └── masterlist/         # Domain components
├── data/                   # Static data (HeaderMenu.ts)
├── lib/                    # Utilities (api.ts)
├── stores/                 # Zustand stores
└── styles/                 # Sass (7-1 pattern)
```

---

## Error Handling

```tsx
try {
  const res = await api.get('/users')
} catch (error) {
  // Handle at call site
  // 401 auto-handled by interceptor
}
```

---

## Memo

- 모든 답변과 추론과정은 한국어로 작성한다.