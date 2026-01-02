# Whale ERP Frontend

Whale ERP 시스템의 프론트엔드 애플리케이션입니다.

## 기술 스택

| 기술 | 버전 | 비고 |
|------|------|------|
| Next.js | 16.1.1 | App Router |
| React | 19.2.3 | React Compiler 활성화 |
| TypeScript | 5.x | Strict 모드 |
| Tailwind CSS | 4.x | PostCSS 통합 |
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
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 실행 |
| `pnpm lint` | ESLint 검사 |

## 프로젝트 구조

```
src/
├── app/                      # App Router 페이지 및 레이아웃
│   ├── layout.tsx            # 루트 레이아웃 (Geist 폰트 설정)
│   ├── page.tsx              # 홈 페이지
│   ├── globals.css           # 글로벌 스타일 (Tailwind CSS)
│   └── editor/
│       └── page.tsx          # 에디터 페이지
└── components/
    └── editor/               # 리치 텍스트 에디터 컴포넌트
        ├── Editor.tsx        # 메인 에디터 (Tiptap)
        ├── SlashCommand.tsx  # 슬래시 명령어 UI
        └── slash-commands.ts # 명령어 정의
```

## 주요 설정

### React Compiler

`next.config.ts`에서 React Compiler가 활성화되어 있습니다. 컴포넌트 메모이제이션이 자동으로 적용되어 불필요한 리렌더링이 최소화됩니다.

```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
}
```

### Tailwind CSS 4

Tailwind CSS 4는 새로운 `@import` 문법을 사용합니다:

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

### 경로 별칭

`@/*`는 `./src/*`에 매핑됩니다:

```typescript
import { Component } from '@/components/Component'
```

## 기능

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
