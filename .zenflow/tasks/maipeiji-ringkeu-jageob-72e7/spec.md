# Technical Specification: MyPage Link Integration

## Task Summary

연결: Header의 MyData 영역 메뉴 클릭 시 MyPageLayout 팝업이 열리고, 클릭한 메뉴에 해당하는 탭이 활성화되어야 함.

## Difficulty Assessment

**Difficulty: Easy**

- 기존 컴포넌트들이 모두 구현되어 있음
- 단순히 상태 공유 및 이벤트 연결만 필요
- 아키텍처 변경 없음, 새로운 의존성 없음

## Technical Context

| Item | Value |
|------|-------|
| Language | TypeScript |
| Framework | Next.js 16 (App Router), React 19 |
| State Management | Zustand (client state) |
| Styling | Tailwind CSS 4, Sass |

## Current State Analysis

### MyData Component (`src/components/ui/common/MyData.tsx`)

현재 6개의 메뉴 버튼이 있으나 클릭 이벤트가 연결되어 있지 않음:
- 사업자정보 확인/수정 → Tab 0
- 서비스 구독 현황 확인 → Tab 1
- 구독료 청구 및 납부 현황 → Tab 2
- 정산 현황 → Tab 3
- 결제수단 관리 → Tab 4
- 비밀번호 변경 → Tab 5
- 로그아웃 (별도 처리 - 이미 구현됨)

### MyPageLayout Component (`src/components/mypage/MyPageLayout.tsx`)

- 6개의 탭을 가진 모달 팝업
- 로컬 `activeTab` state로 탭 관리
- 팝업 열기/닫기 상태 관리 없음
- props로 초기 탭 인덱스를 받지 않음

## Implementation Approach

### Option A: Zustand Store (Recommended)

새로운 UI state store 생성하여 팝업 상태 관리:

```typescript
// src/stores/mypage-store.ts
interface MyPageStore {
  isOpen: boolean;
  activeTab: number;
  openMyPage: (tabIndex?: number) => void;
  closeMyPage: () => void;
  setActiveTab: (tabIndex: number) => void;
}
```

**장점:**
- 프로젝트의 기존 패턴과 일치 (auth-store 참고)
- React 컴포넌트 외부에서도 접근 가능
- 확장성 좋음

### Option B: Props + Callback

MyPageLayout에 props 추가:
- `initialTab?: number`
- `isOpen: boolean`
- `onClose: () => void`

MyData에서 상태 관리 후 MyPageLayout 렌더링.

**단점:** MyData와 MyPageLayout이 같은 레이아웃 내에 있어야 함

---

**선택: Option A (Zustand Store)**

프로젝트 패턴 일관성 및 컴포넌트 독립성 유지를 위해 Zustand store 사용.

## Source Code Changes

### 1. New File: `src/stores/mypage-store.ts`

MyPage 팝업 상태 관리를 위한 새 Zustand store:

```typescript
import { create } from 'zustand';

interface MyPageStore {
  isOpen: boolean;
  activeTab: number;
  openMyPage: (tabIndex?: number) => void;
  closeMyPage: () => void;
  setActiveTab: (tabIndex: number) => void;
}

export const useMyPageStore = create<MyPageStore>((set) => ({
  isOpen: false,
  activeTab: 0,
  openMyPage: (tabIndex = 0) => set({ isOpen: true, activeTab: tabIndex }),
  closeMyPage: () => set({ isOpen: false }),
  setActiveTab: (tabIndex) => set({ activeTab: tabIndex }),
}));
```

### 2. Modify: `src/components/ui/common/MyData.tsx`

- `useMyPageStore` import
- 각 메뉴 버튼에 `onClick` 핸들러 추가
- 클릭 시 `openMyPage(tabIndex)` 호출
- 드롭다운 닫기 (선택적)

### 3. Modify: `src/components/mypage/MyPageLayout.tsx`

- `useMyPageStore` import
- 로컬 `activeTab` state를 store의 `activeTab`으로 대체
- 닫기 버튼에 `closeMyPage()` 연결
- 조건부 렌더링 또는 부모에서 렌더링 제어

### 4. Modify: Layout/Parent Component

MyPageLayout을 렌더링하는 위치 결정:
- `src/app/(sub)/layout.tsx`에서 조건부 렌더링
- 또는 별도 Portal 사용

## Tab Index Mapping

| Menu Item (MyData) | Tab Index | Tab Name (MyPageLayout) |
|--------------------|-----------|-------------------------|
| 사업자정보 확인/수정 | 0 | 사업자정보 확인 및 수정 |
| 서비스 구독 현황 확인 | 1 | 서비스 구독현황 |
| 구독료 청구 및 납부 현황 | 2 | 구독료청구 및 납부현황 |
| 정산 현황 | 3 | 정산현황 |
| 결제수단 관리 | 4 | 결제수단관리 |
| 비밀번호 변경 | 5 | 비밀번호변경 |

## Data Model / API Changes

없음. 순수 클라이언트 사이드 UI 상태 변경만 필요.

## Verification Approach

1. **Lint Check**
   ```bash
   pnpm lint
   ```

2. **Build Check**
   ```bash
   pnpm build
   ```

3. **Manual Testing**
   - 각 MyData 메뉴 아이템 클릭 시 MyPageLayout 팝업 열림 확인
   - 클릭한 메뉴에 해당하는 탭이 활성화됨 확인
   - 팝업 내 탭 전환 정상 동작 확인
   - 팝업 닫기 버튼 동작 확인
   - 로그아웃 버튼은 기존 동작 유지 확인

## Implementation Checklist

- [ ] `src/stores/mypage-store.ts` 생성
- [ ] `src/components/ui/common/MyData.tsx` 수정 (메뉴 클릭 핸들러)
- [ ] `src/components/mypage/MyPageLayout.tsx` 수정 (store 연동, 닫기 기능)
- [ ] 레이아웃에 MyPageLayout 렌더링 추가
- [ ] lint/build 확인
- [ ] 수동 테스트
