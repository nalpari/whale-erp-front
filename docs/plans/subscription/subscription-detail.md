# 구독 요금제 상세 화면 구현 계획

## 1. 개요
구독 요금제 목록(PlansList)에서 특정 요금제를 선택했을 때, 해당 요금제의 상세 정보를 조회하고 수정할 수 있는 상세 화면을 구현한다.

## 2. 화면 이동 (Routing)
- **현재**: `PlansList.tsx`에서 요금제 목록을 보여줌.
- **변경**: 요금제명 컬럼(`planTypeName`)을 클릭 가능한 링크 또는 버튼으로 변경.
- **동작**: 클릭 시 `/subscription/[id]` (또는 `/subscription/plans/[id]`) 경로로 이동.
    - 예: `/subscription/1` 로 이동 시 ID가 1인 요금제 상세 조회.

## 3. 상세 화면 구성 (Layout)
상세 화면은 크게 상단(`PlanHeader`)과 하단(`PlanPricingList`)으로 나뉜다.

### 3.1 디렉토리 구조 및 파일
```
src/app/(sub)/subscription/[id]/page.tsx  # 상세 페이지 진입점
src/components/subscription/
  ├── PlanDetail.tsx          # 상세 페이지 메인 컨테이너
  ├── PlanHeader.tsx          # 상단: 요금제 기본 정보 (PricingPlan.tsx 참조)
  └── PlanPricingList.tsx     # 하단: 요금제 가격 목록 (예: 개월수별 할인 정책 등)
```

### 3.2 PlanHeader (상단)
- **참조 파일**: `/Users/jaeyounglee/IdeaProjects/whale-erp/whale-erp-pub/src/components/pricingplan/PricingPlan.tsx`
- **기능**:
    - 요금제 기본 정보 표시 및 수정 (요금제명, 점포 수 제한, 직원 수 제한 등).
    - `slidebox-wrap` 구조를 사용하여 접기/펼치기 기능 제공.
    - **입력 필드**:
        - 요금제명 (Text)
        - 점포 수 (Number + '제한없음' 스위치)
        - 직원 수 (Number + '제한없음' 스위치)
        - 포함 기능 (Toggle Buttons: 점포관리, 직원관리 등)

### 3.3 PlanPricingList (하단)
- **기능**:
    - 해당 요금제의 기간별 가격 정책 목록 표시.
    - (예상) 1개월, 6개월, 12개월 단위의 정상가/할인가 목록.
- **구성**:
    - 헤더: "가격 정책" 타이틀.
    - 내용: 그리드 또는 리스트 형태의 가격 정보.

## 4. 데이터 연동 (Data Fetching)
- **API**: 요금제 상세 조회 API 필요 (예: `GET /api/v1/plans/{id}`).
- **Hook**: `usePlanDetail(id)` 커스텀 훅 생성 (React Query 사용).

## 5. 작업 순서
1. **라우팅 설정**: `src/app/(sub)/subscription/[id]/page.tsx` 생성.
2. **PlansList 수정**: 요금제명 클릭 이벤트 추가 및 라우팅 연결.
3. **컴포넌트 개발**:
    - `PlanHeader`: `PricingPlan.tsx` UI를 참고하여 컴포넌트화.
    - `PlanPricingList`: 스켈레톤 또는 기본 구조 잡기.
4. **데이터 바인딩**: 상세 조회 API 연동 (Mock API 또는 실제 API).
