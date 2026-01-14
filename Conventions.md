# Whale ERP Frontend - Coding Conventions

이 문서는 Whale ERP Frontend 프로젝트의 코딩 컨벤션을 정의합니다.

## 1. 기술 스택 개요

| 카테고리 | 기술 |
|---------|------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 (React Compiler 활성화) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 + Sass |
| State | Zustand |
| HTTP Client | Axios |
| Data Grid | AG Grid |

---

## 2. 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 라우트
│   ├── (auth)/            # 인증 관련 페이지 (로그인)
│   ├── (sub)/             # 메인 ERP 페이지 (공통 레이아웃)
│   └── editor/            # 독립 에디터 페이지
├── components/            # 재사용 컴포넌트
│   ├── ui/               # 공통 UI 컴포넌트
│   │   └── common/       # 레이아웃 컴포넌트 (Lnb, Header 등)
│   ├── editor/           # 에디터 관련 컴포넌트
│   └── [feature]/        # 기능별 컴포넌트
├── data/                  # 정적 데이터 (메뉴 등)
├── lib/                   # 유틸리티, API 설정
├── stores/                # Zustand 스토어
└── styles/                # Sass 스타일 (7-1 패턴)
```

---

## 3. 파일/폴더 네이밍 컨벤션

### 파일명

| 유형 | 컨벤션 | 예시 |
|-----|--------|------|
| 컴포넌트 | PascalCase | `Header.tsx`, `MasterList.tsx` |
| 스토어 | kebab-case + `-store` 접미사 | `auth-store.ts` |
| 유틸리티/라이브러리 | kebab-case | `api.ts`, `slash-commands.ts` |
| 데이터 파일 | PascalCase | `HeaderMenu.ts` |
| 스타일 | kebab-case | `login.css`, `style.scss` |

### 폴더명

- **소문자 kebab-case** 사용: `masterlist/`, `ui/`, `common/`
- Next.js 라우트 그룹: 괄호 사용 `(auth)/`, `(sub)/`

---

## 4. 컴포넌트 작성 규칙

### 4.1 기본 구조

```tsx
'use client' // 클라이언트 컴포넌트인 경우에만

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import './component.css' // 스타일 (선택사항)

interface ComponentProps {
  title: string
  children: React.ReactNode
}

export default function Component({ title, children }: ComponentProps) {
  const [state, setState] = useState('')

  return (
    <div className="component-wrapper">
      <h1>{title}</h1>
      {children}
    </div>
  )
}
```

### 4.2 Server vs Client Component

| 유형 | 사용 시점 |
|-----|----------|
| Server Component (기본) | 데이터 fetching, 정적 UI |
| Client Component | 상태(useState), 이벤트 핸들러, 브라우저 API, 서드파티 라이브러리 |

- **Client Component**: 파일 최상단에 `'use client'` 지시어 추가
- AG Grid, react-tooltip 등 브라우저 API 사용 컴포넌트는 반드시 Client Component

### 4.3 Props Interface

- Props 타입은 컴포넌트 바로 위에 정의
- 네이밍: `[ComponentName]Props`

```tsx
interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  // ...
}
```

### 4.4 export 방식

- 컴포넌트: `export default function`
- 유틸리티/훅: named export 허용

```tsx
// 컴포넌트
export default function Header() { ... }

// 유틸리티
export const formatDate = (date: Date) => { ... }
```

---

## 5. TypeScript 사용 규칙

### 5.1 타입 정의

```tsx
// 인터페이스 - 객체 타입에 사용
interface User {
  id: string
  name: string
  email: string
}

// 타입 별칭 - 유니온, 교차 타입에 사용
type Status = 'pending' | 'active' | 'inactive'
type UserWithRole = User & { role: string }
```

### 5.2 any 타입 지양

```tsx
// BAD
const authority: any = null

// GOOD
interface Authority {
  id: string
  name: string
  permissions: string[]
}
const authority: Authority | null = null
```

### 5.3 이벤트 타입

```tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  // ...
}

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value)
}
```

---

## 6. 스타일링 규칙

### 6.1 Tailwind CSS + Sass 혼용

- **Tailwind**: 간단한 유틸리티 스타일
- **Sass**: 복잡한 컴포넌트 스타일, 레이아웃

### 6.2 클래스 네이밍 (Sass)

BEM-like 컨벤션 사용:

```
[블록]-[요소]-[상태]
```

예시:
- `login-form-header`
- `data-list-wrap`
- `btn-form basic`
- `input-frame small`

### 6.3 스타일 Import

```tsx
// 컴포넌트 전용 스타일
import './login.css'

// 전역 스타일은 layout.tsx에서 import
import '@/styles/style.scss'
```

---

## 7. 상태 관리 규칙 (Zustand)

### 7.1 스토어 생성

```tsx
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  setAccessToken: (token: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () => set({ accessToken: null }),
    }),
    {
      name: 'auth-storage', // localStorage 키
    }
  )
)
```

### 7.2 스토어 네이밍

- 파일명: `[domain]-store.ts`
- 훅 이름: `use[Domain]Store`
- localStorage 키: `[domain]-storage`

### 7.3 스토어 사용

```tsx
// 컴포넌트 내부
const setTokens = useAuthStore((state) => state.setTokens)
const accessToken = useAuthStore((state) => state.accessToken)

// React 외부 (인터셉터 등)
const { accessToken } = useAuthStore.getState()
```

---

## 8. API 통신 규칙

### 8.1 API 인스턴스 사용

```tsx
import api from '@/lib/api'

// GET
const response = await api.get('/api/users')

// POST
const response = await api.post('/api/auth/login', {
  loginId,
  password,
})
```

### 8.2 에러 처리

```tsx
try {
  const response = await api.post('/api/auth/login', data)
  // 성공 처리
} catch (error: unknown) {
  const axiosError = error as { response?: { data?: { message?: string } } }
  const message = axiosError.response?.data?.message ?? '알 수 없는 오류가 발생했습니다.'
  alert(message)
}
```

### 8.3 환경별 API URL

- 개발: `.env.development` → `NEXT_PUBLIC_API_URL`
- 운영: `.env.production` → `NEXT_PUBLIC_API_URL`

---

## 9. Import 순서

```tsx
// 1. React/Next.js
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. 외부 라이브러리
import { AgGridReact } from 'ag-grid-react'
import { Tooltip } from 'react-tooltip'

// 3. 내부 모듈 - lib
import api from '@/lib/api'

// 4. 내부 모듈 - stores
import { useAuthStore } from '@/stores/auth-store'

// 5. 내부 모듈 - components
import Header from '@/components/ui/Header'
import MyData from './common/MyData'

// 6. 스타일
import './component.css'
```

---

## 10. AG Grid 사용 규칙

### 10.1 모듈 등록 필수

```tsx
'use client'

import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, ColDef } from 'ag-grid-community'

// 필수!
ModuleRegistry.registerModules([AllCommunityModule])
```

### 10.2 커스텀 셀 렌더러

```tsx
const colDefs: ColDef[] = [
  {
    headerName: '액션',
    cellRenderer: () => {
      return (
        <button className="btn-form outline grid">변환</button>
      )
    },
  },
]
```

---

## 11. Git 커밋 규칙

### 11.1 커밋 메시지 형식

```
<type>: <subject>

<body> (선택사항)
```

### 11.2 Type 종류

| Type | 설명 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| docs | 문서 수정 |
| style | 코드 포맷팅 (세미콜론 등) |
| refactor | 코드 리팩토링 |
| test | 테스트 추가/수정 |
| chore | 빌드, 설정 파일 수정 |

### 11.3 예시

```
feat: Adds pricing and subscription UI components

fix: Handles 401 response in API interceptor

docs: Updates CLAUDE.md with new architecture info
```

---

## 12. ESLint 설정

프로젝트는 ESLint flat config를 사용합니다:

- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`

```bash
pnpm lint  # ESLint 실행
```

---

## 13. 체크리스트

PR 성성하기 전 개발자 확인 사항:

- [ ] 'use client' 지시어가 필요한 곳에 추가되었는가?
- [ ] TypeScript 타입이 적절히 정의되었는가?
- [ ] Import 순서가 올바른가?
- [ ] 클래스 네이밍이 BEM-like 컨벤션을 따르는가?
- [ ] API 에러 처리가 적절히 되어있는가?
- [ ] Zustand 스토어가 올바르게 사용되었는가?
- [ ] AG Grid 모듈이 등록되었는가? (AG Grid 사용 시)
- [ ] PR 성성전에 린트체크, 타입체크, 빌드체크는 하였는가?
- [ ] Git Commit 메세지는 규칙대로 작성 하였는가?