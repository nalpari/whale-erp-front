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
| TanStack Query | 5.90.x | 서버 상태 관리 |
| Zustand | 5.x | 클라이언트 상태 관리 |
| Axios | 1.13.x | HTTP 클라이언트 |
| Zod | 4.x | 스키마 유효성 검사 및 타입 추론 |
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
│   ├── layout.tsx                # 루트 레이아웃 (QueryProvider 설정)
│   ├── page.tsx                  # 홈 페이지
│   ├── globals.css               # 글로벌 스타일 (Tailwind CSS 4)
│   ├── (auth)/                   # 인증 라우트 그룹
│   │   └── login/
│   │       ├── page.tsx          # 로그인 페이지
│   │       └── login.css         # 로그인 전용 스타일
│   ├── editor/
│   │   └── page.tsx              # 에디터 페이지 (독립 레이아웃)
│   └── (sub)/                    # ERP 메인 라우트 그룹
│       ├── layout.tsx            # 공용 레이아웃 (LNB, Header)
│       ├── masterlist/
│       │   └── page.tsx          # 마스터리스트 페이지
│       ├── store/(manage)/
│       │   └── info/
│       │       ├── page.tsx      # 점포 목록
│       │       ├── detail/page.tsx  # 점포 상세
│       │       └── header/page.tsx  # 점포 헤더
│       ├── employee/             # 직원 관리
│       │   ├── manage/           # 직원 정보 관리 (목록, 상세)
│       │   ├── work-status/      # 근무 일정 관리
│       │   └── settings/         # 직원 설정
│       └── storybook/            # 공통 컴포넌트 데모
│           ├── datepicker/       # 날짜 선택 컴포넌트
│           ├── search-select/    # 검색 셀렉트 컴포넌트
│           ├── upload/           # 파일 업로드 컴포넌트
│           ├── editor/           # 에디터 컴포넌트
│           └── radio/            # 라디오 버튼 컴포넌트
├── components/
│   ├── common/                   # 공통 컴포넌트
│   │   ├── FileUploader.tsx      # 파일 업로드
│   │   ├── HeadOfficeFranchiseStoreSelect.tsx  # 본사-가맹점-점포 계층 선택
│   │   ├── DraggableTree.tsx     # 드래그 가능 트리
│   │   └── SearchableSelect.tsx  # 검색 가능 셀렉트
│   ├── editor/                   # 리치 텍스트 에디터
│   │   ├── Editor.tsx
│   │   ├── SlashCommand.tsx
│   │   └── slash-commands.ts
│   ├── employee/                 # 직원 관리 컴포넌트
│   │   ├── employeeinfo/         # 직원 정보 CRUD
│   │   │   ├── EmployeeList.tsx
│   │   │   ├── EmployeeSearch.tsx
│   │   │   ├── EmployeeEdit.tsx
│   │   │   └── EmployeeDetailData.tsx
│   │   ├── work-status/          # 근무 일정 관리
│   │   │   ├── WorkScheduleTable.tsx
│   │   │   ├── WorkSchedulePlan.tsx
│   │   │   └── WorkScheduleSearch.tsx
│   │   ├── settings/             # 직원 설정
│   │   └── popup/                # 직원 검색 팝업
│   ├── login/                    # 로그인 컴포넌트
│   │   ├── FindIdPw.tsx
│   │   └── find/
│   ├── masterlist/               # 마스터리스트 컴포넌트
│   │   ├── MasterList.tsx
│   │   └── MasterSearch.tsx
│   ├── program/                  # 프로그램 관리 컴포넌트
│   │   ├── ProgramList.tsx       # 프로그램 목록 및 계층 관리
│   │   └── ProgramFormModal.tsx  # 프로그램 등록/수정 모달
│   ├── store/manage/             # 점포 관리 컴포넌트
│   │   ├── StoreList.tsx
│   │   ├── StoreInfo.tsx
│   │   ├── StoreDetail.tsx
│   │   └── StoreHeader.tsx
│   └── ui/                       # 공용 UI 컴포넌트
│       ├── AgGrid.tsx            # AG Grid 래퍼
│       ├── Header.tsx            # 상단 헤더
│       ├── Location.tsx          # 현재 위치 표시
│       ├── Pagination.tsx        # 페이지네이션
│       └── common/               # 공통 컴포넌트
│           ├── DatePicker.tsx    # 단일 날짜 선택기
│           ├── RangeDatePicker.tsx  # 날짜 범위 선택기
│           ├── SearchSelect.tsx  # 검색 셀렉트
│           ├── FullDownMenu.tsx  # 풀다운 메뉴
│           ├── Lnb.tsx           # 좌측 네비게이션 바
│           ├── MyData.tsx        # 사용자 데이터
│           └── ServiceTab.tsx    # 서비스 탭
├── data/
│   └── HeaderMenu.ts             # 메뉴 데이터 (계층 구조)
├── hooks/
│   ├── queries/                  # TanStack Query 훅
│   │   ├── index.ts              # 통합 export
│   │   ├── query-keys.ts         # 쿼리 키 팩토리
│   │   ├── use-store-queries.ts  # 점포 쿼리/뮤테이션
│   │   ├── use-store-schedule-queries.ts  # 점포 스케줄 쿼리
│   │   ├── use-employee-queries.ts  # 직원 쿼리/뮤테이션
│   │   ├── use-employee-settings-queries.ts  # 직원 설정 쿼리
│   │   ├── use-file-queries.ts   # 파일 쿼리
│   │   ├── use-bp-queries.ts     # BP 쿼리
│   │   ├── use-common-code-queries.ts  # 공통코드 쿼리
│   │   └── use-program-queries.ts  # 프로그램 쿼리/뮤테이션
│   ├── store/                    # 도메인 특화 훅
│   │   ├── useStoreDetailForm.ts
│   │   └── useStoreFiles.ts
│   ├── useBp.ts                  # BP 래퍼 훅 (레거시 호환)
│   └── useCommonCode.ts          # 공통코드 래퍼 훅 (레거시 호환)
├── lib/
│   ├── api.ts                    # Axios 인스턴스 및 인터셉터
│   ├── query-client.ts           # QueryClient 설정
│   ├── zod-utils.ts              # Zod 유틸리티 함수
│   └── schemas/                  # Zod 스키마
│       ├── index.ts              # 통합 내보내기
│       ├── api.ts                # API 응답 스키마
│       ├── auth.ts               # 인증 관련 스키마
│       ├── env.ts                # 환경변수 스키마
│       ├── forms.ts              # 폼 유효성 검사 스키마
│       ├── menu.ts               # 메뉴 타입 스키마
│       └── program.ts            # 프로그램 스키마
├── providers/
│   └── query-provider.tsx        # QueryClientProvider 래퍼
├── stores/
│   ├── auth-store.ts             # Zustand 인증 스토어
│   ├── program-store.ts          # 프로그램 UI 상태 스토어
│   ├── store-search-store.ts     # 점포 검색 UI 상태
│   ├── store-schedule-store.ts   # 점포 스케줄 UI 상태
│   └── mypage-store.ts           # 마이페이지 UI 상태
├── styles/                       # Sass 스타일 (7-1 패턴)
│   ├── style.scss                # 메인 진입점
│   ├── abstracts/                # 변수, 믹스인
│   ├── base/                     # 리셋, 폰트, 폼 요소
│   ├── layout/                   # 헤더, LNB, AG Grid
│   └── components/               # 콘텐츠, 테이블, 팝업
└── types/                        # TypeScript 타입 정의
    ├── bp.ts                     # BP 관련 타입
    ├── store.ts                  # 점포 관련 타입
    ├── employee.ts               # 직원 관련 타입
    ├── work-schedule.ts          # 근무 일정 타입
    └── upload-files.ts           # 파일 업로드 타입
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

// 토큰과 조직 ID가 자동으로 첨부됩니다
const response = await api.get('/users/me');
```

- 요청 인터셉터: Bearer 토큰 및 `affiliation` 헤더 자동 첨부
- 응답 인터셉터: 401 에러 시 인증 상태 초기화

### 상태 관리

**서버 상태 (TanStack Query):**

```typescript
import { useStoreList, useCreateStore } from '@/hooks/queries';

// 데이터 조회
const { data, isPending, error } = useStoreList(params);

// 데이터 변경
const { mutateAsync, isPending } = useCreateStore();
await mutateAsync({ payload, files });
```

**클라이언트 상태 (Zustand):**

```typescript
import { useAuthStore } from '@/stores/auth-store';

// React 컴포넌트에서
const { accessToken, authority, affiliationId, clearAuth } = useAuthStore();

// React 외부에서
const { accessToken, affiliationId } = useAuthStore.getState();
```

**저장되는 상태:**
- `accessToken`, `refreshToken`: JWT 토큰
- `authority`: 선택된 조직의 권한 상세 정보
- `affiliationId`: 현재 선택된 조직 ID (API 헤더에 사용)
- `subscriptionPlan`: 구독 플랜 정보

**상태 관리 전략:**
- 서버에서 오는 데이터 → **TanStack Query** (점포, BP, 공통코드 등)
- 클라이언트 전용 데이터 → **Zustand** (인증 토큰, UI 상태)
- 서버 데이터용으로 Zustand 사용 금지 (TanStack Query 사용)

### TanStack Query 사용법

**조회 (Query):**

```typescript
import { useBpHeadOfficeTree, useCommonCodeHierarchy } from '@/hooks/queries';

// BP 트리 조회
const { data, isPending } = useBpHeadOfficeTree();

// 공통코드 조회
const { data, isPending } = useCommonCodeHierarchy('GENDER');
```

**변경 (Mutation):**

```typescript
import { useCreateStore, useUpdateStore } from '@/hooks/queries';

// 생성
const { mutateAsync: create } = useCreateStore();
await create({ payload, files });

// 수정
const { mutateAsync: update } = useUpdateStore();
await update({ storeId, payload, files });
```

**직원 쿼리:**

```typescript
import { useEmployeeList, useCreateEmployee } from '@/hooks/queries';

// 직원 목록 조회
const { data, isPending } = useEmployeeList(params);

// 직원 생성
const { mutateAsync } = useCreateEmployee();
await mutateAsync({ payload, files });
```

### 스키마 유효성 검사 (Zod)

Zod를 사용하여 런타임 유효성 검사와 TypeScript 타입 추론을 통합합니다.

**폼 유효성 검사:**

```typescript
import { loginRequestSchema } from '@/lib/schemas/auth';
import { formatZodFieldErrors } from '@/lib/zod-utils';

const handleSubmit = () => {
  const result = loginRequestSchema.safeParse({ loginId, password });
  if (!result.success) {
    const errors = formatZodFieldErrors(result.error);
    // errors: { loginId: '아이디를 입력해주세요', password: '...' }
  }
};
```

**API 응답 검증:**

```typescript
import { getWithSchema, postWithSchema } from '@/lib/api';
import { loginResponseSchema } from '@/lib/schemas/auth';

// 개발 모드에서 응답 스키마 불일치 시 콘솔 경고
const response = await postWithSchema('/api/auth/login', data, loginResponseSchema);
```

**스키마에서 타입 추론:**

```typescript
import { z } from 'zod';
import { loginRequestSchema } from '@/lib/schemas/auth';

// 스키마에서 타입 자동 추론
type LoginRequest = z.infer<typeof loginRequestSchema>;
// { loginId: string; password: string; }
```

**주요 스키마:**
- `loginRequestSchema`: 로그인 폼 검증
- `apiResponseSchema`: Backend API 응답 구조
- `pageResponseSchema`: 페이징된 응답 구조
- `commonFields`: 공통 필드 (이메일, 전화번호, 날짜 등)

### 인증 플로우

로그인 시 다중 조직(Authority) 선택을 지원합니다:

1. `/api/auth/login`으로 로그인 요청
2. 단일 조직: 자동 선택 후 메인 페이지로 이동
3. 다중 조직: 선택 모달 표시 → 사용자가 조직 선택
4. 선택된 조직의 상세 정보를 `/api/system/authorities/{id}`에서 조회
5. `affiliationId`가 모든 API 요청에 헤더로 첨부됨

### 레이아웃 구조

**라우트 그룹:**
- `(auth)`: 인증 페이지 (로그인) — 독립 레이아웃, 전용 CSS
- `(sub)`: ERP 메인 페이지 — 공용 레이아웃 공유

**`(sub)` 공용 레이아웃 구성:**
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

### Storybook (컴포넌트 데모)

`/storybook/*` 경로에서 공통 컴포넌트의 동작을 확인할 수 있습니다:

| 경로 | 컴포넌트 |
|------|----------|
| `/storybook/datepicker` | DatePicker, RangeDatePicker |
| `/storybook/search-select` | SearchSelect |
| `/storybook/upload` | FileUploader |
| `/storybook/image-upload` | ImageUploader |
| `/storybook/editor` | Tiptap Editor |
| `/storybook/radio` | RadioButtonGroup |
| `/storybook/input` | Input 컴포넌트 |
| `/storybook/postcode` | 주소 검색 |

새로운 공통 컴포넌트를 추가할 때는 해당 데모 페이지도 함께 만들어 주세요.

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

## 메뉴 데이터 구조

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

## 개발 가이드

### 코드 컨벤션

프로젝트의 코딩 컨벤션은 다음 문서를 참고하세요:
- `reference-docs/Conventions.md` - 기본 코딩 규칙
- `reference-docs/Tanstack-query-Development-guide.md` - TanStack Query 사용 가이드
- `reference-docs/Zustand-Development-guide.md` - Zustand 사용 가이드

### 새 기능 추가하기

1. **타입 정의**: `src/types/`에 필요한 타입 추가
2. **Zod 스키마**: `src/lib/schemas/`에 유효성 검사 스키마 추가
3. **API 훅**: `src/hooks/queries/`에 TanStack Query 훅 추가
   - 쿼리 키를 `query-keys.ts`에 팩토리 패턴으로 정의
4. **컴포넌트**: 적절한 폴더에 컴포넌트 생성
5. **라우트**: `src/app/(sub)/`에 페이지 추가

### TanStack Query 사용 시 주의사항

- 쿼리 키는 반드시 `query-keys.ts`에서 팩토리 패턴으로 정의
- 계층 구조로 키를 관리하여 캐시 무효화를 쉽게 처리
- `staleTime`을 데이터 특성에 맞게 설정
- 의존성 있는 쿼리는 `enabled` 옵션 활용

### Zustand 사용 시 주의사항

- 서버 데이터는 TanStack Query 사용 (Zustand 사용 금지)
- 클라이언트 전용 상태만 Zustand에 저장
- 필요한 상태만 선택하여 구독 (리렌더링 최소화)
- Persist가 필요한 경우 `persist` 미들웨어 사용

### 스타일링 가이드

- 간단한 유틸리티: **Tailwind CSS**
- 복잡한 컴포넌트: **Sass** (7-1 패턴)
- 클래스 네이밍: BEM-like 컨벤션 (`block-element-state`)

## 참고 문서

- [CLAUDE.md](./CLAUDE.md) - AI 개발 가이드
- [reference-docs/](./reference-docs/) - 상세 개발 가이드
  - Conventions.md
  - Tanstack-query-Development-guide.md
  - Zustand-Development-guide.md
