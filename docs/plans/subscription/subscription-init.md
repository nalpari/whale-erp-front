# 구독(Subscription) 기능 구현 계획

이 문서는 `whale-erp-front` 프로젝트에 구독 관리 기능을 추가하기 위한 초기 계획 및 구조 설계를 다룹니다.

## 1. 개요 (Overview)
사용자가 서비스의 구독 플랜을 확인하고, 현재 구독 상태를 관리하며, 결제 내역을 조회할 수 있는 기능을 구현합니다.
Next.js 14+ (App Router), TypeScript, Tailwind CSS를 기반으로 작성합니다.

## 2. 디렉토리 및 파일 구조 (Directory Structure)

### 2.1 페이지 (App Router)
- **파일 경로**: `src/app/(sub)/subscription/page.tsx`
- **역할**: 구독 관련 메인 페이지. `src/app/(sub)/masterlist/page.tsx`와 유사한 구조를 가집니다.
    - `Location`: 페이지 타이틀 및 경로 표시 (예: 'Subscription', ['설정', '구독 관리'])
    - `PlanSearch`: 플랜 검색 및 필터링
    - `PlanList`: 플랜 목록 표시

### 2.2 컴포넌트 (Components)
`src/components/subscription/` 디렉토리에 관련 컴포넌트를 모듈화하여 관리합니다.

- **`PlanSearch.tsx`**: 원하는 플랜을 검색하거나 필터링하는 컴포넌트.
- **`PlanList.tsx`**: 구독 플랜 목록을 보여주는 컴포넌트.

---

## 3. 상세 구현 단계 (Implementation Steps)

### Step 1: UI 컴포넌트 개발 (`src/components/subscription/`)
1. **PlanSearch**: 플랜 검색 및 필터 UI 구현.
2. **PlanList**: 디자인 시안에 맞게 가격표 및 플랜 목록 UI 구현.

### Step 2: 페이지 조립 (`src/app/(sub)/subscription/page.tsx`)
`src/app/(sub)/masterlist/page.tsx`의 구조를 참고하여 페이지를 조립합니다.

```tsx
import PlanSearch from '@/components/subscription/PlanSearch'
import Location from '@/components/ui/Location'
import PlanList from '@/components/subscription/PlanList'

export default function SubscriptionPage() {
  return (
    <div className="data-wrap">
      <Location title="Subscription" list={['설정', '구독 관리']} />
      <PlanSearch />
      <PlanList />
    </div>
  )
}
```
