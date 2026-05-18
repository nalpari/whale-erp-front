# BP Master 목록 화면 개발 계획

## 개요

Business Partner Master 목록 화면 (검색 + 목록) 프론트엔드 + API 수정 개발

- **라우트**: `/app/(sub)/master/bp/page.tsx`
- **Location**: `title='Business Partner Master'`, `list={['Home', '파트너 정보 관리']}`
- **참조 UI**: pub `MasterSearch.tsx` (검색 영역), front `PriceMasterSearch.tsx` (search-result-wrap)
- **메뉴 링크**: HeaderMenu 파트너 정보 관리 → `/master/bp`

---

## 결정 사항

| # | 항목 | 결정 |
|---|------|------|
| 1 | 운영여부 | `BPOPR` 공통코드 — `BPOPR_001`(상담중), `BPOPR_002`(운영), `BPOPR_003`(종료) |
| 2 | 구독정보 selectbox | `PLNTYP` 공통코드 — `PLNTYP_001`(무료), `PLNTYP_002`(스탠다드), `PLNTYP_003`(엔터프라이즈), `PLNTYP_004`(프랜차이즈) |
| 3 | 등록자 표시 | API 수정 — `BpResponse`에 `createdByName` 추가 (MenuResponse 패턴: `memberMap[createdBy]?.name`) |
| 4 | 구독정보 컬럼 | 구독 요금제명 표시 (프론트 구조만 선 작업, API 구독 조회는 추후) |
| 5 | 가맹점 초대 | 별도 페이지 이동, pub `InvitationForm.tsx` 참조 |
| 6 | 행 클릭 | 수정 페이지(`/masterlist/[id]/edit`)로 이동 (등록/수정 동일 form — 별도 작업) |
| 7 | 구독정보 필터 | API `BpSearchRequest`에 구독 필터 필드 추가 |

---

## 파일 구조

### Front (`whale-erp-front`)

```
src/
├── app/(sub)/master/bp/
│   └── page.tsx                          # [신규] 래퍼 → BpMasterManage 렌더링 ✅
├── components/master/bp/
│   ├── BpMasterManage.tsx                # [신규] 페이지 오케스트레이터 (상태 관리) ✅
│   ├── BpMasterSearch.tsx                # [신규] 검색 영역 컴포넌트 ✅
│   └── BpMasterList.tsx                  # [신규] 목록 영역 컴포넌트 (AG Grid) ✅
├── data/
│   └── HeaderMenu.ts                     # [수정] 파트너 정보 관리 링크 → /master/bp ✅
├── types/
│   └── bp.ts                             # [수정] 목록 타입, 검색 필터 타입 추가 ✅
└── hooks/queries/
    ├── query-keys.ts                     # [수정] bpKeys에 lists/list 추가 ✅
    └── use-bp-queries.ts                 # [수정] useBpList 추가 ✅
```

### API (`whale-erp-api`) — 사전 수정

```
domain/master/bp/
├── dto/request/BpSearchRequest.kt        # [수정] subscriptionPlanType 필드 추가, 날짜 기본값 null 변경 ✅
└── dto/response/BpResponse.kt            # [수정] createdByName 필드 추가 ✅
domain/master/bp/
├── service/BpService.kt                  # [수정] 목록 조회 시 member 이름 조회 로직 추가 ✅
└── repository/BpRepositoryImpl.kt        # [미완] 구독 필터 QueryDSL 조건 추가 (API 구독 조회 준비 후)
```

---

## API 수정 (사전 작업)

### 1. BpResponse에 `createdByName` 추가

기존 패턴 참조: `MenuResponse.kt`, `ProgramResponse.kt`

```kotlin
// BpResponse.kt
@field:Schema(description = "등록자명")
val createdByName: String? = null,
```

`BpService.findBpList()`에서 `memberRepository`로 이름 조회 후 매핑:

```kotlin
val memberMap = memberRepository.findAllById(memberIds).associateBy { it.id }
// BpResponse.from(entity, ..., createdByName = memberMap[entity.createdBy]?.name)
```

### 2. BpSearchRequest에 구독 필터 추가

```kotlin
// BpSearchRequest.kt
@field:Schema(description = "구독 요금제 타입 (PLNTYP 공통코드)")
var subscriptionPlanType: String? = null
```

### 3. QueryDSL 목록 조회에 구독 필터 조건 추가

`BpRepositoryImpl`에서 `BpServiceSubscription` 조인 + `subscriptionPlanType` 필터 조건 추가

---

## Front 구현

### 1단계: 타입 정의 (`src/types/bp.ts`)

#### 검색 필터 타입

```typescript
export interface BpSearchFilters {
  officeId: number | null        // 본사 (선택)
  franchiseId: number | null     // 가맹점
  representativeName: string     // 대표자명
  bpoprType: string              // 운영여부 (radio: '' | 'BPOPR_001' | 'BPOPR_002' | 'BPOPR_003')
  subscriptionPlanType: string   // 구독정보 (selectbox: '' | 'PLNTYP_001' ~ 'PLNTYP_004')
  createdAtFrom: Date | null     // 등록일 시작
  createdAtTo: Date | null       // 등록일 종료
}
```

#### API 검색 파라미터 타입

```typescript
export interface BpListParams {
  page?: number
  size?: number
  companyName?: string
  businessRegistrationNumber?: string
  representativeName?: string
  representativeMobilePhone?: string
  address1?: string
  address2?: string
  createdAtFrom?: string
  createdAtTo?: string
  bpoprType?: string
  subscriptionPlanType?: string
}
```

#### 기존 타입 오타 수정

- `businessRegistartionNumber` → `businessRegistrationNumber`
- `lnbLogoContarctFile` → `lnbLogoContractFile`

---

### 2단계: Query 훅 (`src/hooks/queries/`)

#### query-keys.ts 수정

```typescript
export const bpKeys = {
  all: ['bp'] as const,
  lists: () => [...bpKeys.all, 'list'] as const,
  list: (params: BpListParams) => [...bpKeys.lists(), params] as const,
  headOfficeTree: () => [...bpKeys.all, 'head-office-tree'] as const,
  details: () => [...bpKeys.all, 'detail'] as const,
  detail: (id: number) => [...bpKeys.details(), id] as const,
}
```

#### use-bp-queries.ts 추가

```typescript
// BP 목록 조회 훅
export const useBpList = (params: BpListParams, enabled = true) => {
  return useQuery({
    queryKey: bpKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PageResponse<BpDetailResponse>>>(
        '/api/master/bp',
        { params }
      )
      return response.data.data
    },
    enabled,
  })
}
```

---

### 3단계: 검색 컴포넌트 (`BpMasterSearch.tsx`)

#### UI 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ [가맹점 초대] 버튼 (우측 정렬)                                │
├─────────────────────────────────────────────────────────────┤
│ search-result-wrap (PriceMasterSearch 패턴)                  │
│  - 적용된 필터 태그 (본사, 운영여부 등) + 결과 건수             │
│  - 검색 영역 열기/닫기 토글 버튼                               │
├─────────────────────────────────────────────────────────────┤
│ search-filed (AnimateHeight 접기/펼치기)                      │
│                                                              │
│ ┌────────┬──────────────┬────────┬──────────────┬────────┬──────────────┐ │
│ │ 본사*  │ [SelectBox]  │ 가맹점 │ [SelectBox]  │대표자명│ [Input]      │ │
│ ├────────┼──────────────┼────────┼──────────────┼────────┼──────────────┤ │
│ │운영여부│ ○전체 ○상담중 │구독정보│ [SelectBox]  │ 등록일 │ [DateRange]  │ │
│ │        │ ○운영 ○종료  │        │              │        │              │ │
│ └────────┴──────────────┴────────┴──────────────┴────────┴──────────────┘ │
│                                                              │
│            [닫기]  [초기화]  [검색]                            │
└─────────────────────────────────────────────────────────────┘
```

#### Props 설계

```typescript
interface BpMasterSearchProps {
  filters: BpSearchFilters
  appliedFilters: BpSearchFilters
  operationStatusOptions: RadioOption[]
  subscriptionPlanOptions: SelectOption[]
  officeNameMap: Map<number, string>
  operationStatusCodeMap: Map<string, string>
  subscriptionPlanCodeMap: Map<string, string>
  resultCount: number
  onChange: (next: Partial<BpSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
  onRemoveFilter: (key: string) => void
  onInviteFranchise: () => void        // 가맹점 초대 → 별도 페이지 이동
}
```

#### 검색 Validation

- **본사 선택**: 선택사항 — 미선택 시 전체 BP 조회
- `HeadOfficeFranchiseStoreSelect` 공통 컴포넌트 활용 (`fields={['office']}` — 본사만)
- 가맹점은 별도 `SearchSelect`로 분리 — 본사 미선택 시 `isDisabled`, 본사 변경 시 `franchiseId` 초기화

#### 운영여부 Radio 매핑

| UI 라벨 | 코드값 |
|---------|--------|
| 전체 | `''` (빈값, 기본값) |
| 상담중 | `BPOPR_001` |
| 운영 | `BPOPR_002` |
| 종료 | `BPOPR_003` |

→ `useCommonCodeHierarchy('BPOPR')`로 조회

#### 구독정보 SelectBox

| UI 라벨 | 코드값 |
|---------|--------|
| 전체 | `''` (빈값, 기본값) |
| 무료 | `PLNTYP_001` |
| 스탠다드 | `PLNTYP_002` |
| 엔터프라이즈 | `PLNTYP_003` |
| 프랜차이즈 | `PLNTYP_004` |

→ `useCommonCodeHierarchy('PLNTYP')`로 조회

---

### 4단계: 목록 컴포넌트 (`BpMasterList.tsx`)

#### UI 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ [등록] 버튼 (좌측)                          [50 ▼] (우측)    │
├─────────────────────────────────────────────────────────────┤
│ AG Grid 테이블                                              │
│ ┌────┬────────┬────────┬────────┬──────┬──────┬──────┬─────┐│
│ │ ID │운영여부│ 본사   │ 가맹점 │대표자│등록자│등록일│더보기││
│ ├────┼────────┼────────┼────────┼──────┼──────┼──────┼─────┤│
│ │ 1  │ 운영   │따름인  │ -      │홍길동│관리자│25.01.│ ⓘ  ││
│ └────┴────────┴────────┴────────┴──────┴──────┴──────┴─────┘│
│                                                             │
│                    [< 1 2 3 ... >]                          │
└─────────────────────────────────────────────────────────────┘
```

#### AG Grid 컬럼 정의

| Field | Header | Width | 비고 |
|-------|--------|-------|------|
| `id` | ID | 80 | center |
| `bpoprType` | 운영여부 | 100 | 공통코드 → 이름 변환 |
| `companyName` | 본사 | flex:1 | center |
| `franchiseStoreName` | 가맹점 | flex:1 | center, 없으면 '-' |
| `representativeName` | 대표자 | 120 | |
| `createdByName` | 등록자 | 100 | API에서 이름으로 반환 |
| `createdAt` | 등록일 | 160 | yyyy-MM-dd HH:mm 포맷 |
| - | 구독정보 | 120 | API 준비 후 구현 (현재 '-' 표시) |

#### Props 설계

```typescript
interface BpMasterListProps {
  rows: BpDetailResponse[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  operationStatusCodeMap: Map<string, string>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRegister: () => void               // 등록 버튼 클릭
  onRowClick: (id: number) => void     // 행 클릭 → 수정 페이지 이동
}
```

---

### 5단계: 오케스트레이터 (`BpMasterManage.tsx`)

#### 역할

PriceMasterManage 패턴을 따라 상태 관리 + 하위 컴포넌트 조합

#### 상태 관리

```typescript
// 검색 필터 (편집 중)
const [filters, setFilters] = useState<BpSearchFilters>(initialFilters)
// 적용된 필터 (검색 버튼 클릭 시 확정)
const [appliedFilters, setAppliedFilters] = useState<BpSearchFilters>(initialFilters)
// 페이지네이션
const [page, setPage] = useState(0)
const [pageSize, setPageSize] = useState(50)
// 검색 활성화 여부 (본사 선택 후 검색 버튼 클릭 시 true)
const [searchEnabled, setSearchEnabled] = useState(false)
```

#### 데이터 흐름

1. 사용자 필터 변경 → `filters` 상태 업데이트
2. 검색 버튼 클릭 → 본사 validation → `appliedFilters` 확정 → `searchEnabled=true`
3. `useBpList(params, searchEnabled)` → API 호출
4. 결과 → `BpMasterList`에 전달

#### 공통코드 활용

```typescript
// 운영여부 공통코드 조회
const { data: bpoprCodes } = useCommonCodeHierarchy('BPOPR')
// → radioOptions 및 codeMap 파생

// 구독정보 공통코드 조회
const { data: plntypCodes } = useCommonCodeHierarchy('PLNTYP')
// → selectOptions 및 codeMap 파생
```

#### 페이지 이동

```typescript
const router = useRouter()

// 가맹점 초대 → 별도 페이지
const handleInviteFranchise = () => router.push('/masterlist/invitation')

// 행 클릭 → 수정 페이지
const handleRowClick = (id: number) => router.push(`/masterlist/${id}/edit`)
```

---

### 6단계: 페이지 수정 (`page.tsx`)

```typescript
import BpMasterManage from '@/components/master/bp/BpMasterManage'

const BPMasterPage = () => {
  return <BpMasterManage />
}

export default BPMasterPage
```

---

## 별도 작업 (이번 범위 외)

| 항목 | 설명 | 상태 |
|------|------|------|
| 가맹점 초대 페이지 | `/masterlist/invitation`, pub `InvitationForm.tsx` 참조 | 대기 |
| 등록/수정 페이지 | `/masterlist/create`, `/masterlist/[id]/edit`, 동일 form 공유 | 대기 |
| 구독 정보 API | BP 목록에 구독 요금제명 포함하여 반환 | 대기 |

---

## 구현 순서 및 진행 상황

| # | 작업 | 상태 |
|---|------|------|
| 1 | API 수정 — `BpResponse`에 `createdByName` 추가 | ✅ 완료 |
| 2 | API 수정 — `BpSearchRequest`에 `subscriptionPlanType` 추가 | ✅ 완료 |
| 3 | API 수정 — `BpSearchRequest` 날짜 기본값 `null`로 변경 | ✅ 완료 |
| 4 | API 수정 — `BpService` memberNameMap 패턴 적용 | ✅ 완료 |
| 5 | 타입 정의 + 오타 수정 (`types/bp.ts`) | ✅ 완료 |
| 6 | Query 키 + 훅 추가 (`query-keys.ts`, `use-bp-queries.ts`) | ✅ 완료 |
| 7 | `BpMasterSearch.tsx` 작성 | ✅ 완료 |
| 8 | `BpMasterList.tsx` 작성 | ✅ 완료 |
| 9 | `BpMasterManage.tsx` 작성 (오케스트레이터) | ✅ 완료 |
| 10 | `page.tsx` 신규 생성 (`/master/bp`) | ✅ 완료 |
| 11 | HeaderMenu 링크 연결 | ✅ 완료 |
| 12 | 가맹점 select 분리 (본사 미선택 시 비활성화) | ✅ 완료 |
| 13 | 구독정보 컬럼 변경 (더보기 → 구독정보) | ✅ 완료 |
| 14 | `pnpm lint` + `pnpm build` 체크 | ✅ 통과 |
| 15 | 본사 필수 조건 제거 (선택사항으로 변경) | ✅ 완료 |

### 미완료 (별도 작업)

| # | 작업 | 비고 |
|---|------|------|
| - | `BpRepositoryImpl` 구독 필터 QueryDSL 조건 | API 구독 조회 준비 후 |
| - | 구독정보 컬럼 실제 데이터 연동 | API 구독 조회 준비 후 |
