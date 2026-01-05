# Whale ERP Frontend

Whale ERP 시스템의 프론트엔드 애플리케이션입니다.

## 기술 스택

| 기술 | 버전 | 비고 |
|------|------|------|
| Next.js | 16.1.1 | App Router |
| React | 19.2.3 | React Compiler 활성화 |
| TypeScript | 5.x | Strict 모드 |
| Tailwind CSS | 4.x | PostCSS 통합 |
| Sass | 1.93.x | 7-1 패턴 스타일 구조 |
| Zustand | 5.x | 상태 관리 |
| Axios | 1.x | HTTP 클라이언트 |
| AG Grid | 35.x | 데이터 그리드 |
| Tiptap | 3.14.x | 리치 텍스트 에디터 |
| ESLint | 9.x | Flat Config |

## 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (http://localhost:3000)
pnpm dev
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 (dev API 사용) |
| `pnpm build` | 프로덕션 빌드 (prod API 사용) |
| `pnpm start` | 프로덕션 서버 실행 |
| `pnpm lint` | ESLint 검사 |

## 프로젝트 구조

```
src/
├── app/                          # App Router 페이지 및 레이아웃
│   ├── layout.tsx                # 루트 레이아웃 (Geist 폰트 설정)
│   ├── page.tsx                  # 홈 페이지
│   ├── globals.css               # 글로벌 스타일 (Tailwind CSS)
│   ├── editor/
│   │   └── page.tsx              # 에디터 페이지 (독립 레이아웃)
│   └── (sub)/                    # ERP 메인 라우트 그룹
│       ├── layout.tsx            # 공용 레이아웃 (LNB, Header)
│       └── masterlist/
│           └── page.tsx          # 마스터리스트 페이지
├── components/
│   ├── editor/                   # 리치 텍스트 에디터
│   │   ├── Editor.tsx
│   │   ├── SlashCommand.tsx
│   │   └── slash-commands.ts
│   ├── masterlist/               # 마스터리스트 컴포넌트
│   │   ├── MasterList.tsx
│   │   └── MasterSearch.tsx
│   └── ui/                       # 공용 UI 컴포넌트
│       ├── AgGrid.tsx            # AG Grid 래퍼
│       ├── Header.tsx            # 상단 헤더
│       ├── Location.tsx          # 현재 위치 표시
│       ├── Pagination.tsx        # 페이지네이션
│       └── common/               # 공통 컴포넌트
│           ├── DatePicker.tsx    # 날짜 선택기
│           ├── FullDownMenu.tsx  # 풀다운 메뉴
│           ├── Lnb.tsx           # 좌측 네비게이션 바
│           ├── MyData.tsx        # 사용자 데이터
│           └── ServiceTab.tsx    # 서비스 탭
├── data/
│   └── HeaderMenu.ts             # 메뉴 데이터 (계층 구조)
├── lib/
│   └── api.ts                    # Axios 인스턴스 및 인터셉터
├── stores/
│   └── auth-store.ts             # Zustand 인증 스토어
└── styles/                       # Sass 스타일 (7-1 패턴)
    ├── style.scss                # 메인 진입점
    ├── abstracts/                # 변수, 믹스인
    ├── base/                     # 리셋, 폰트, 폼 요소
    ├── layout/                   # 헤더, LNB, AG Grid
    └── components/               # 콘텐츠, 테이블, 팝업
```

## 환경 설정

### API 환경 변수

| 환경 | 파일 | API URL |
|------|------|---------|
| 개발 | `.env.development` | https://dev-api.whaleerp.co.kr |
| 운영 | `.env.production` | https://api.whaleerp.co.kr |

```bash
# .env.example
NEXT_PUBLIC_API_URL=
```

### React Compiler

`next.config.ts`에서 React Compiler가 활성화되어 있습니다. 컴포넌트 메모이제이션이 자동으로 적용됩니다.

```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
}
```

### 경로 별칭

`@/*`는 `./src/*`에 매핑됩니다:

```typescript
import { Component } from '@/components/Component'
```

## 주요 기능

### API 레이어

Axios 기반의 API 클라이언트가 구성되어 있습니다:

```typescript
import api from '@/lib/api';

// 토큰이 자동으로 첨부됩니다
const response = await api.get('/users/me');
```

- 요청 인터셉터: Bearer 토큰 자동 첨부
- 응답 인터셉터: 401 에러 시 인증 상태 초기화

### 상태 관리

Zustand를 사용한 인증 상태 관리:

```typescript
import { useAuthStore } from '@/stores/auth-store';

// React 컴포넌트에서
const { accessToken, setAccessToken, clearAuth } = useAuthStore();

// React 외부에서
const token = useAuthStore.getState().accessToken;
```

### 레이아웃 구조

`(sub)` 라우트 그룹 내 페이지는 공용 레이아웃을 공유합니다:
- **LNB (Left Navigation Bar)**: 접기/펼치기 가능한 3단 계층 메뉴
- **Header**: 상단 헤더
- **FullDownMenu**: 풀다운 메뉴

### 데이터 그리드 (AG Grid)

AG Grid 사용 시 필수 설정:

```typescript
'use client'

import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'

// 모듈 등록 (필수)
ModuleRegistry.registerModules([AllCommunityModule])
```

### 리치 텍스트 에디터

`/editor` 경로에서 Notion 스타일의 리치 텍스트 에디터를 사용할 수 있습니다.

**지원 기능:**
- 제목 (H1, H2, H3)
- 불릿/번호 리스트
- 인용문
- 코드 블록 (구문 강조 지원)
- 이미지, 링크
- 테이블
- 구분선

**슬래시 명령어:**

에디터에서 `/`를 입력하면 명령어 팔레트가 표시됩니다. 방향키로 선택하고 Enter로 실행합니다.

새로운 명령어를 추가하려면 `src/components/editor/slash-commands.ts`의 `slashCommands` 배열에 항목을 추가하세요:

```typescript
{
  title: "명령어 이름",
  description: "설명",
  icon: "아이콘",
  command: (editor) => {
    // Tiptap 에디터 명령 실행
  },
}
```

## 스타일링

### 듀얼 스타일 시스템

1. **Tailwind CSS 4**: 유틸리티 클래스
   ```css
   @import "tailwindcss";

   @theme inline {
     --color-background: var(--background);
     --color-foreground: var(--foreground);
   }
   ```

2. **Sass (7-1 패턴)**: 컴포넌트 스타일
   - `abstracts/`: 변수, 믹스인
   - `base/`: 리셋, 폰트, 폼 요소 (버튼, 인풋, 체크박스 등)
   - `layout/`: 레이아웃 (헤더, LNB, AG Grid)
   - `components/`: UI 컴포넌트

### 메뉴 데이터 구조

`src/data/HeaderMenu.ts`에서 메뉴 계층 구조를 정의합니다:

```typescript
interface HeaderMenuItem {
  id: string
  name: string
  icon?: string
  link: string
  children?: HeaderMenuItem[]
}
```
