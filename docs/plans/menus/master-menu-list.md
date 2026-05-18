# Master Menu 목록 페이지 구현 계획

## 목표

`app/(sub)/master/menu`에 마스터 메뉴 목록 페이지를 생성한다.

## 컴포넌트 구조

`Plans.tsx` 패턴을 따라 `Menus` 래퍼 컴포넌트가 상태 관리 + Search/List 조합을 담당하고, `page.tsx`는 단순 렌더링만 수행한다.

```
page.tsx (단순 렌더링)
└── Menus.tsx (상태 관리 + 레이아웃)
    ├── Location
    ├── MenuSearch (검색 폼, 내부 폼 상태 관리)
    └── MenuList (목록 표시, 껍데기)
```

### 참고: Plans.tsx 패턴

```
subscription/page.tsx → <Plans />
Plans.tsx → <Location /> + <PlansSearch /> + <PlansList />
```

- `page.tsx`: `'use client'` 불필요, 컴포넌트만 렌더링
- `Menus.tsx`: `'use client'`, 검색 상태/페이징/API 호출 관리
- `MenuSearch.tsx`: 내부 폼 상태 관리, `onSearch`/`onReset` 콜백으로 부모에 전달
- `MenuList.tsx`: props로 데이터 수신, 썸네일 카드 뷰 렌더링 (구현완료)

## 생성/수정 파일 목록

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/components/master/menu/Menus.tsx` | **구현완료** | 래퍼 컴포넌트 (상태 관리 + Search/List 조합, MenuList에 bpId props 전달) |
| `src/app/(sub)/master/menu/page.tsx` | 수정 | 단순 `<Menus />` 렌더링으로 변경 |
| `src/components/master/menu/MenuSearch.tsx` | 구현완료 | 메뉴 검색 컴포넌트 |
| `src/components/master/menu/MenuList.tsx` | **구현완료** | 썸네일 카드 뷰 (MenuCard, Pagination, CubeLoader, AddStoreMenuPop 팝업 상태 관리) |
| `src/components/master/menu/AddStoreMenuPop.tsx` | **구현완료** | 점포 메뉴 추가 팝업 (UI only, API 연결 추후) |

## 구현 상세

### `src/components/master/menu/Menus.tsx`

```tsx
'use client'

import { useState } from 'react'
import Location from '@/components/ui/Location'
import MenuSearch from '@/components/master/menu/MenuSearch'
import MenuList from '@/components/master/menu/MenuList'
import type { MenuSearchFormData } from '@/components/master/menu/MenuSearch'

const BREADCRUMBS = ['홈', 'Master data 관리', '메뉴 정보 관리', '마스터용 메뉴 Master']

export default function Menus() {
  // 검색 상태, 페이징, API 호출 관리
  // MenuSearch → onSearch → 상태 갱신
  // MenuList에 데이터 전달
}
```

### `src/app/(sub)/master/menu/page.tsx`

```tsx
import Menus from '@/components/master/menu/Menus'

export default function MasterMenuPage() {
  return <Menus />
}
```

## MenuSearch 검색 항목 설계

### 검색 폼 레이아웃 (3행 x 3열 테이블)

| 행 | 1열 (th+td) | 2열 (th+td) | 3열 (th+td) |
|----|-------------|-------------|-------------|
| 1행 | 본사 - SearchSelect (HeadOfficeFranchiseStoreSelect) | 가맹점 - SearchSelect (disabled) | 메뉴명 - Input |
| 2행 | 운영여부 - RadioButtonGroup (전체/운영/미운영) | 메뉴타입 - RadioButtonGroup (전체/메뉴/옵션) | 메뉴분류 - SearchSelect |
| 3행 | 카테고리 - SearchSelect | 사용가능 가맹점 - SearchSelect | 등록일 - RangeDatePicker (기본: 빈값) |

### 버튼 영역

닫기 | 초기화 | 검색

### 동작 규칙

- 모든 검색은 **검색 버튼 클릭 시에만** 실행
- 폼 상태는 MenuSearch 내부에서 관리
- 검색 클릭 시 `onSearch` 콜백으로 Menus 컴포넌트에 파라미터 전달
- **본사 미선택 시 검색 차단**: 검색 버튼 클릭 시 본사가 선택되지 않으면 `useAlert`로 경고 표시 후 검색 중단

### API 연동

- **API 엔드포인트**: `GET /api/master/menu/master`
- **API 수정사항** (whale-erp-api):
  - `MenuSearchRequest`: `createdAtFrom`/`createdAtTo` 기본값 제거 → `null` (등록일 미입력 시 날짜 조건 제외)
  - `MenuController`: Swagger `@SwaggerApiResponse`에 `content` 명시 (프로젝트 CLAUDE.md 규칙 준수)

### 폼 상태 (MenuSearch 내부)

```typescript
{
  headOfficeOrganizationId: number | null  // 본사
  franchiseOrganizationId: number | null   // 가맹점 (항상 disabled)
  menuName: string                         // 메뉴명
  operationStatus: string                  // 운영여부: '' | 'STOPR_001' | 'STOPR_002'
  menuType: string                         // 메뉴타입: '' | 'MNTYP_001' | 'MNTYP_002'
  menuClassificationCode: string           // 메뉴분류
  categoryId: string                       // 카테고리
  franchiseAvailableId: string             // 사용가능 가맹점
  registeredDateFrom: string               // 등록일 시작 (기본: 빈값)
  registeredDateTo: string                 // 등록일 종료 (기본: 빈값)
}
```

### 사용 컴포넌트

| 컴포넌트 | 출처 |
|----------|------|
| `HeadOfficeFranchiseStoreSelect` | `@/components/common/HeadOfficeFranchiseStoreSelect` |
| `SearchSelect` | `@/components/ui/common/SearchSelect` |
| `RadioButtonGroup` | `@/components/common/ui` |
| `Input` | `@/components/common/ui` |
| `RangeDatePicker` | `@/components/ui/common/RangeDatePicker` |
| `AnimateHeight` | `react-animate-height` |

## API 연동 상세

### 프론트엔드 → API 파라미터 매핑

| MenuSearchFormData (프론트) | MenuSearchRequest (API) | 비고 |
|---|---|---|
| `headOfficeOrganizationId` | `bpId` | 필수 |
| `menuName` | `menuName` | |
| `operationStatus` | `operationStatus` | |
| `menuType` | `menuType` | |
| `menuClassificationCode` | `menuClassificationCode` | |
| `categoryId` | `categoryId` | |
| `registeredDateFrom` | `createdAtFrom` | yyyy-MM-dd → yyyy-MM-ddT00:00:00 |
| `registeredDateTo` | `createdAtTo` | yyyy-MM-dd → yyyy-MM-ddT23:59:59 |
| `page` | `page` | Spring Pageable |
| `size` | `size` | Spring Pageable |

### 생성/수정 파일 (API 연동)

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/types/menu.ts` | **신규** | MenuResponse 프론트 타입 정의 |
| `src/hooks/queries/query-keys.ts` | 수정 | `masterMenuKeys` 추가 |
| `src/hooks/queries/use-master-menu-queries.ts` | **신규** | `useMasterMenuList` 훅 |
| `src/hooks/queries/index.ts` | 수정 | export 추가 |
| `src/components/master/menu/Menus.tsx` | 수정 | `useMasterMenuList` 연동, totalCount/data 전달 |

### TanStack Query 훅 패턴

`usePlansList` 패턴을 따름:
- `enabled`: `bpId`가 있을 때만 활성화
- `keepPreviousData`: 페이지 전환 시 깜빡임 방지
- 쿼리 키: `masterMenuKeys.list(params)`

### 응답 타입

```
ApiResponse<PageResponse<MenuResponse>>
```

- `response.data.data.content` → 메뉴 목록
- `response.data.data.totalElements` → 전체 건수

## 카테고리 Selectbox API 연동

### API

- **엔드포인트**: `GET /api/master/category/master`
- **파라미터**: `bpId` (본사 선택 ID), `depth=2`, `depth2IsActive=true` (운영 중인 2depth 카테고리 + 부모 1depth 트리 반환)
- **응답**: `ApiResponse<List<CategoryResponse>>` (트리 구조)

### 표시 패턴 (pub/popup/partnerselect 참고)

depth에 따라 `-` 접두사로 계층 표현:
- depth=1: `카테고리명` (dash 없음)
- depth=2: `- 카테고리명` (dash 1개)

### 데이터 변환

API 트리 응답 → `SelectOption[]` 플랫 리스트로 변환:
```typescript
// API 응답 (트리)
[{ id: 1, categoryName: "음료", depth: 1, children: [{ id: 3, categoryName: "커피" }, { id: 4, categoryName: "주스" }] }]

// SelectOption[] (플랫)
[{ value: "1", label: "음료" }, { value: "3", label: "- 커피" }, { value: "4", label: "- 주스" }]
```

### 동작 규칙

- 본사 선택 시 카테고리 API 호출
- 본사 변경 시 카테고리 선택 초기화
- 본사 미선택 시 빈 목록
- 선택한 카테고리의 `id` → `categoryId` 검색 조건에 반영

### 생성/수정 파일

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/types/menu.ts` | 수정 | `CategoryResponse` 타입 추가 |
| `src/hooks/queries/query-keys.ts` | 수정 | `masterCategoryKeys` 추가 |
| `src/hooks/queries/use-master-category-queries.ts` | **신규** | `useMasterCategoryList` 훅 |
| `src/hooks/queries/index.ts` | 수정 | export 추가 |
| `src/components/master/menu/MenuSearch.tsx` | 수정 | 카테고리 hook 사용, SelectOption 변환 |

## 사용가능 가맹점 Selectbox API 연동

### API

- **엔드포인트**: `GET /api/v1/stores` (기존 `useStoreList` 훅 재사용)
- **파라미터**: `office` (본사 선택 ID)
- **응답**: `ApiResponse<StoreListResponse>` → `content: StoreListItem[]`

### 데이터 변환

`StoreListItem[]` → `SelectOption[]`:
- `value`: `String(store.id)`
- `label`: `store.storeName`

### 동작 규칙

- 본사 선택 시 점포 목록 API 호출
- 본사 변경 시 선택값 초기화
- 선택한 점포의 `id` → `franchiseAvailableId` → API `storeId` 검색 조건에 반영

### 수정 파일

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/components/master/menu/MenuSearch.tsx` | 수정 | `useStoreList` 훅 사용, SelectOption 변환 |
| `src/components/master/menu/Menus.tsx` | 수정 | `franchiseAvailableId` → `storeId` API 매핑 추가 |
| `src/types/menu.ts` | 수정 | `MasterMenuListParams`에 `storeId` 추가 |
| `src/hooks/queries/query-keys.ts` | 수정 | `MasterMenuListParams`에 `storeId` 추가 |

## 메뉴분류 Selectbox 공통코드 연동

### API

- **훅**: `useCommonCodeHierarchy('MNCF')` (기존 공통코드 훅 재사용)
- **엔드포인트**: `GET /api/v1/common-codes/hierarchy/MNCF`
- **응답**: `CommonCodeNode[]` (MNCF 하위 코드 목록)

### 데이터 변환

`CommonCodeNode[]` → `SelectOption[]`:
- `value`: `code.code` (예: `MNCF_001`)
- `label`: `code.name` (예: `식품`)

### 동작 규칙

- 페이지 로드 시 자동 조회 (본사 선택과 무관)
- `staleTime: 10분` (공통코드 캐싱)
- 선택한 코드 → `menuClassificationCode` 검색 조건에 반영

### 수정 파일

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/components/master/menu/MenuSearch.tsx` | 수정 | `useCommonCodeHierarchy` 훅 사용, SelectOption 변환 |

## 참고 패턴

- **래퍼 패턴**: `src/components/subscription/Plans.tsx` + `src/app/(sub)/subscription/page.tsx`
- **쿼리 훅 패턴**: `src/hooks/queries/use-plans-queries.ts`
- Search 컴포넌트: `src/components/employee/employeeinfo/EmployeeSearch.tsx`
- RadioButtonGroup: `src/components/common/ui/RadioButtonGroup.tsx`
- RangeDatePicker: `src/components/ui/common/RangeDatePicker.tsx`
- HeadOfficeFranchiseStoreSelect: `src/components/common/HeadOfficeFranchiseStoreSelect.tsx`

## MenuList 썸네일 카드 뷰 (구현완료)

### Props

```typescript
interface MenuListProps {
  rows: MenuResponse[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  bpId: number | null
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onCheckedChange: (hasChecked: boolean) => void
  onOperationStatusChange: (menuIds: number[], operationStatus: string) => Promise<void>
}
```

### 컴포넌트 구조

```
MenuList (메인)
├── 헤더: 등록 버튼 (UI only) + pageSize select [20, 40, 60]
├── 로딩 시: CubeLoader
├── 빈 목록: "등록된 메뉴가 없습니다."
└── 데이터 있을 때:
    ├── thumb-list-wrap (4컬럼 그리드)
    │   └── MenuCard (각 카드) × N
    │       ├── 이미지 (next/image fill, S3 or placeholder)
    │       │   ├── MarketingBadges (NEW, BEST, EVENT)
    │       │   └── TemperatureBadges (HOT, COLD)
    │       └── 정보
    │           ├── 운영상태 배지 + 메뉴명 + 체크박스 (UI only)
    │           └── 테이블: 소속, mapping, 노출순서, 카테고리, 등록일, 가격
    └── Pagination
```

### 데이터 매핑

| MenuResponse 필드 | UI 요소 | 변환 |
|---|---|---|
| `menuImgFile?.fileUrl` | 카드 이미지 | null → placeholder |
| `marketingTags[]` | NEW/BEST/EVENT 배지 | tag → CSS class (new/best/event) |
| `temperatureTags[]` | HOT/COLD 배지 | tag → CSS class (hot/cold) |
| `operationStatus` | 운영/미운영 배지 | STOPR_001→운영(blue), STOPR_002→미운영(org) |
| `menuName` | 카드 제목 | 직접 표시 |
| `companyName` | 소속 | null → '-' |
| `masterMenuName` | mapping | null → '-' |
| `displayOrder` | 노출 순서 | null → '-' |
| `categories[]` | 카테고리 | categoryName join(', ') |
| `createdAt` | 등록일 | `formatDateYmd()` |
| `salePrice`/`discountPrice` | 가격 | 할인 시 원가 취소선 + 할인가 표시 |

### Menus.tsx 수정사항

- `pageSize` 기본값: 50 → 20, `setPageSize` 추가
- `handlePageSizeChange` 핸들러 추가 (pageSize 변경 시 page 0으로 리셋)
- `<MenuList />` → props 전달 (rows, page, pageSize, totalPages, loading, onPageChange, onPageSizeChange)
- `isPending` → `isLoading` 변경 (쿼리 disabled 시 로딩 표시 방지)
- 등록 버튼 추가 (`data-header-left`에 등록 버튼, `data-header-right`에도 등록 버튼)
- 카드 내 체크박스 추가 (메뉴명 오른쪽)
- 체크박스 선택 시 검색창 닫기: `searchOpen` 상태를 `Menus.tsx`로 lift up, 체크된 항목이 1개 이상이면 `setSearchOpen(false)` 호출
- `data-header-left` 버튼: 운영, 미운영, 점포메뉴 추가 (항상 표시, 체크박스 미선택 시 disabled)
- 점포메뉴 추가 버튼: 체크박스 선택 + bpId 존재 시 활성화, 클릭 시 `AddStoreMenuPop` 팝업 열림
- 코드 리뷰 이슈 수정:
  - `MasterMenuListParams` 중복 정의 제거: `types/menu.ts`에서 삭제, `query-keys.ts`에서만 유지
  - `UploadFileResponse` 이름 충돌 해소: `types/menu.ts`의 것을 `MenuImageFile`로 변경 (`lib/api/file.ts`의 풀 메타데이터 타입과 구분)
  - Zod 스키마 추가: `src/lib/schemas/menu.ts`에 `menuResponseSchema` 등 추가
  - `menu.id` non-null assertion 제거: 타입을 `id: number`로 변경 (API 목록 응답에서 id는 항상 존재)
  - `onCheckedChange` useEffect 의존성 안정화: ref 패턴 적용
- 운영/미운영 버튼 기능: `PATCH /api/master/menu/store/operation-status` 호출
  - Request: `{ bpId, menuIds, operationStatus }` (STOPR_001: 운영, STOPR_002: 미운영)
  - mutation hook: `useUpdateMenuOperationStatus` in `use-master-menu-queries.ts`
  - 성공 시 목록 캐시 무효화 + 체크 초기화

### 재사용 리소스

- `CubeLoader`: `@/components/common/ui/CubeLoader`
- `Pagination`: `@/components/ui/Pagination`
- `formatDateYmd`: `@/util/date-util`
- `Image`: `next/image` (S3 remotePatterns 설정 완료)
- SCSS: `_contents.scss` (thumb-* 클래스 모두 정의됨, 수정 불필요)

## 점포 메뉴 추가 팝업 (구현완료 - UI only)

### 컴포넌트: `AddStoreMenuPop.tsx`

pub 프로젝트의 `AddSotreMenuPop.tsx`를 참고하여 구현. 현재 UI만 구현, API 연결은 추후.

### Props

```typescript
interface AddStoreMenuPopProps {
  isOpen: boolean
  onClose: () => void
  bpId: number              // 본사 ID (점포 옵션 조회에 필요)
  checkedMenuIds: number[]  // 선택된 메뉴 ID 목록 (추후 API 연결 시 사용)
}
```

### 내부 상태

```typescript
const [syncOption, setSyncOption] = useState<'selected' | 'all'>('selected')
const [operationStatus, setOperationStatus] = useState<'STOPR_001' | 'STOPR_002'>('STOPR_002')
const [selectedStoreId, setSelectedStoreId] = useState<string>('')
const [isAllStores, setIsAllStores] = useState(false)       // "전체 점포" 선택 여부
const [addedStores, setAddedStores] = useState<StoreOption[]>([])  // 개별 선택 점포 (isAllStores=false일 때만 사용)
```

### 점포 목록 조회

`useStoreOptions(bpId, null, isOpen)` 훅 재사용 — 팝업 열릴 때만 조회.

### 팝업 구조

```
AddStoreMenuPop
├── modal-popup > modal-dialog large > modal-content
│   ├── modal-header (제목: "점포 메뉴 추가" + 닫기 버튼)
│   └── modal-body
│       ├── pop-guide (안내 텍스트)
│       ├── pop-table (3행 테이블)
│       │   ├── 옵션*: radio-wrap (선택한 메뉴만 추가 / 모든 마스터 메뉴 추가) + tooltip
│       │   ├── 운영여부 선택: radio-wrap (운영 / 미운영, 기본: 미운영) + tooltip
│       │   └── 점포 선택*: select-form ("전체 점포" + 개별 점포 옵션, 이미 추가된 점포 제외) + 추가 버튼
│       ├── add-store-list (추가된 점포 목록, 각 아이템 삭제 가능)
│       └── pop-btn-content (취소 / 동기화 버튼, 점포 미추가 시 동기화 disabled)
```

### 동작 흐름

1. MenuList에서 체크박스 선택 → "점포메뉴 추가" 버튼 클릭
2. MenuList 내부에서 `isAddStorePopOpen = true` 설정
3. AddStoreMenuPop 렌더링 (`isOpen` true → modal 표시, false → `return null`)
4. 옵션/운영여부 라디오 토글
5. 점포 select에서 점포 선택 후 "추가" 클릭:
   - "전체 점포" 선택 시 → `isAllStores = true`, 목록에 "전체 점포" 1건 표시, select disabled
   - 개별 점포 선택 시 → `addedStores`에 추가 (중복 방지, 이미 추가된 점포는 select에서 제외)
   - "전체 점포"가 선택된 상태에서는 개별 점포 선택 불가
6. 추가된 점포 목록에서 삭제 가능:
   - "전체 점포" 삭제 → `isAllStores = false`, 다시 개별/전체 선택 가능
   - 개별 점포 삭제 → 해당 점포만 `addedStores`에서 제거
7. "동기화" 버튼 클릭 → `isAllStores`면 `storeOptions` 전체 ID 전달, 아니면 `addedStores`의 ID만 전달
8. "취소" 또는 닫기 → 상태 초기화 + `onClose` 호출

### 재사용 리소스

- `useStoreOptions`: `@/hooks/queries/use-store-queries.ts`
- `StoreOption`: `@/types/store.ts` (`{ id: number, storeName: string }`)
- `react-tooltip`: `^5.30.0` (이미 설치됨)
- SCSS: `_pop-common.scss`, `_pop-contents.scss` (팝업 스타일 정의됨)

### Menus.tsx 수정사항

- `MenuList`에 `bpId={filters.headOfficeOrganizationId ?? null}` prop 전달

### MenuList.tsx 수정사항

- `bpId: number | null` prop 추가
- `isAddStorePopOpen` 상태 관리
- "점포메뉴 추가" 버튼에 `onClick` 연결 (`disabled={!hasChecked || !bpId}`)
- `bpId` 존재 시 `<AddStoreMenuPop>` 렌더링 (`checkedMenuIds={Array.from(checkedIds)}`)

### 동기화 API 연결 (구현완료)

#### API 엔드포인트

- **URL**: `POST /api/master/menu/master/sync-to-stores`
- **Content-Type**: `application/json`

#### Request Body

```typescript
interface SyncMenuToStoresRequest {
  bpId: number                          // 본사 ID
  menuIds: number[] | null              // 선택한 메뉴 ID 목록 (null이면 전체 마스터 메뉴 동기화)
  storeIds: number[]                    // 동기화할 점포 ID 목록
  operationStatus: 'STOPR_001' | 'STOPR_002'  // 동기화 후 운영 상태
}
```

#### 동작 방식

- `menuIds`가 `null`이면 BP의 전체 마스터 메뉴를 동기화
- `menuIds`가 있으면 선택한 메뉴만 동기화
- 점포별로 독립적인 트랜잭션으로 처리 (한 점포 실패해도 다른 점포는 성공)
- 기존에 매핑된 점포 메뉴가 있으면 업데이트, 없으면 신규 생성
- 카테고리, 옵션셋도 함께 동기화

#### 제약사항

- 마스터 메뉴가 미운영 상태인 경우 점포 메뉴를 운영 상태로 설정 불가

#### 옵션 ↔ menuIds 매핑

| syncOption | menuIds 값 |
|---|---|
| `'selected'` | `checkedMenuIds` (선택된 메뉴 ID 배열) |
| `'all'` | `null` (전체 마스터 메뉴) |

#### 생성/수정 파일

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/hooks/queries/use-master-menu-queries.ts` | 수정 | `useSyncMenuToStores` mutation 훅 추가 |
| `src/components/master/menu/AddStoreMenuPop.tsx` | 수정 | `handleSync`에 mutation 호출 연결, useAlert로 확인/결과 알림 |

#### `useSyncMenuToStores` 훅 설계

```typescript
interface SyncMenuToStoresRequest {
  bpId: number
  menuIds: number[] | null
  storeIds: number[]
  operationStatus: string
}

export const useSyncMenuToStores = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SyncMenuToStoresRequest) => {
      const response = await api.post<ApiResponse<void>>(
        '/api/master/menu/master/sync-to-stores',
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterMenuKeys.lists() })
    },
  })
}
```

#### `AddStoreMenuPop.tsx` handleSync 수정

```typescript
const { mutateAsync: syncMenuToStores } = useSyncMenuToStores()
const { alert, confirm } = useAlert()

const handleSync = async () => {
  const confirmed = await confirm('선택한 점포에 메뉴를 동기화하시겠습니까?')
  if (!confirmed) return

  try {
    await syncMenuToStores({
      bpId,
      menuIds: syncOption === 'all' ? null : checkedMenuIds,
      storeIds: isAllStores
        ? storeOptions.map((s) => s.id)
        : addedStores.map((s) => s.id),
      operationStatus,
    })
    await alert('동기화가 완료되었습니다.')
    handleClose()
  } catch (error) {
    await alert(getErrorMessage(error, '동기화에 실패했습니다.'))
  }
}
```

#### 구현 순서 (완료)

1. ~~`use-master-menu-queries.ts`에 `SyncMenuToStoresRequest` 타입 + `useSyncMenuToStores` 훅 추가~~
2. ~~`AddStoreMenuPop.tsx`에서 `_checkedMenuIds` → `checkedMenuIds`로 복원, mutation 훅 + useAlert 연결~~
3. ~~린트/빌드 검증~~

## 검색 조건 상태 유지 + 자동 검색 제거 (구현완료)

### 배경

검색 조건 입력 후 상세/수정 페이지 이동 → 뒤로가기 시 검색 조건 초기화 문제.
Zustand store로 검색 상태를 관리하여 페이지 이동 후에도 유지되도록 한다.
또한 본사 최초 선택 시 자동 검색되는 동작을 제거한다.

### 생성/수정 파일

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/stores/menu-search-store.ts` | **신규** | 검색 상태 Zustand store |
| `src/components/master/menu/Menus.tsx` | 수정 | useState → store 연동 |
| `src/components/master/menu/MenuSearch.tsx` | 수정 | store에서 formData 관리 + 자동 검색 제거 |

### `menu-search-store.ts` 설계

`program-store.ts` 패턴을 따른다.

```typescript
interface MenuSearchState {
  // 검색 폼 데이터 (입력 중인 값)
  formData: typeof INITIAL_FORM_DATA
  // 실행된 검색 필터 (검색 버튼 클릭 시 반영)
  filters: MenuSearchFormData
  // 페이징
  page: number
  pageSize: number
  // 검색 패널 열림 여부
  searchOpen: boolean

  // Actions
  setFormData: (updates: Partial<typeof INITIAL_FORM_DATA>) => void
  setFilters: (filters: MenuSearchFormData) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearchOpen: (open: boolean) => void
  reset: () => void
}
```

### `Menus.tsx` 변경 요약

- `useState`로 관리하던 `filters`, `page`, `pageSize`, `searchOpen` → store에서 가져오기
- `handleSearch`, `handleReset`, `handlePageSizeChange` → store 액션 호출
- `setFilters`, `setPage`, `setSearchOpen` → store 액션 직접 사용

### `MenuSearch.tsx` 변경 요약

- 로컬 `formData` state → store의 `formData` + `setFormData` 사용
- 자동 검색 `useEffect` (62~71행, `onSearchRef`/`initialSearchDoneRef` 포함) 삭제
- `handleReset` → store.reset() 호출 + onReset() 콜백
