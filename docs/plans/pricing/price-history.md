# 마스터용 가격 이력 페이지 구현 계획

## 상태: 구현 완료

## Context

PriceController의 `GET /api/master/price/master/history` API를 활용하여 가격 변동 이력 조회 페이지를 프론트엔드에 추가한다.
기존 `price-master` 페이지와 동일한 패턴(Manage → Search + List, 이중 필터 상태, TanStack Query)을 따른다.

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-02-27 | 초기 구현 완료 (프론트엔드 7개 파일 생성, 2개 수정) |
| 2026-02-27 | HeaderMenu에 '마스터용 가격 이력' 링크 추가 (id: 53) |
| 2026-02-27 | [API 버그 수정] `priceAppliedAt` 반영일시가 `menu.priceAppliedAt`(현재값)을 참조 → `menuPriceHistory.updatedAt`으로 변경 |
| 2026-02-27 | [API 버그 수정] Repository 날짜 필터도 `menuPriceHistory.updatedAt` 기준으로 변경 |
| 2026-02-27 | [API] 정렬 조건 `menuPriceHistory.id DESC`로 변경 |
| 2026-02-27 | [API+Front] 수정자 필드를 ID(`updatedBy: Long`) → 이름(`updatedByName: String`)으로 변경, Service에서 MemberRepository로 이름 조회 |

---

## 프론트엔드 파일 구조

### 생성 파일 (7개)

| # | 파일 | 설명 |
|---|------|------|
| 1 | `src/types/price-history.ts` | 타입 정의 (PriceHistoryListItem, PriceHistoryListParams) |
| 2 | `src/lib/schemas/price-history.ts` | Zod 스키마 (커스텀 페이징 응답) |
| 3 | `src/hooks/queries/use-price-history-queries.ts` | TanStack Query 훅 (usePriceHistoryList) |
| 4 | `src/components/master/pricing/price-history/PriceHistoryManage.tsx` | 래퍼 (상태 관리, 이중 필터) |
| 5 | `src/components/master/pricing/price-history/PriceHistorySearch.tsx` | 검색 영역 (본사/가맹점/운영여부/메뉴분류/메뉴명/반영일) |
| 6 | `src/components/master/pricing/price-history/PriceHistoryList.tsx` | AgGrid 조회 전용 목록 (10컬럼) |
| 7 | `src/app/(sub)/master/pricing/price-history/page.tsx` | 라우트 진입점 |

### 수정 파일 (3개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/hooks/queries/query-keys.ts` | `priceHistoryKeys` 추가 |
| `src/hooks/queries/index.ts` | `use-price-history-queries` re-export 추가 |
| `src/data/HeaderMenu.ts` | 가격 Master > 마스터용 가격 이력 메뉴 추가 (id: 53) |

---

## 백엔드 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `PriceHistoryResponse.kt` | `updatedBy: Long?` → `updatedByName: String?`, `from()`에 `memberNameMap` 파라미터 추가, `priceAppliedAt`을 `entity.updatedAt` 기반으로 변경 |
| `PriceService.kt` | `MemberRepository` 주입, `findPriceHistoryList`에서 member ID → 이름 맵 구성 |
| `MenuPriceHistoryRepositoryImpl.kt` | 날짜 필터를 `menuPriceHistory.updatedAt` 기준으로 변경, 정렬을 `id DESC`로 변경, 불필요한 ZoneId/priceSchedule 조인 제거 |

---

## 검색 필터

| 필드 | 컴포넌트 | 비고 |
|------|----------|------|
| 본사 | HeadOfficeFranchiseStoreSelect | 필수 |
| 가맹점 | SearchSelect (disabled) | - |
| 운영여부 | RadioButtonGroup (STOPR) | 전체 포함 |
| 메뉴분류 | SearchSelect (MNCF) | - |
| 메뉴명 | Input | - |
| 반영일 | RangeDatePicker | updatedAt 기준 필터 |

## AgGrid 컬럼 (10개)

| field | headerName | 비고 |
|-------|-----------|------|
| id | ID | width: 80 |
| menuName | 메뉴명 | flex: 1 |
| menuClassificationCode | 메뉴분류 | codeMap 변환 |
| operationStatus | 운영여부 | codeMap 변환 |
| salePrice | 현재 판매가 | 가격 포맷 |
| previousSalePrice | 이전 판매가 | 가격 포맷 |
| discountPrice | 현재 할인가 | 가격 포맷 |
| previousDiscountPrice | 이전 할인가 | 가격 포맷 |
| priceAppliedAt | 반영 일시 | 날짜 포맷 |
| updatedByName | 수정자 | 이름 표시 |

## API 엔드포인트

- `GET /api/master/price/master/history`
- 정렬: `menu_price_histories.id DESC`
- 반영일시: `menu_price_histories.updated_at`
- 수정자: `members.name` (updatedBy 우선, createdBy fallback)
