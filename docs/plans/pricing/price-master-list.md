# Price Master 목록 화면 구현 계획

## 목표

whale-erp-api에 구현된 Price Master API(`GET /api/master/price/master`, `PUT /api/master/price/master`)에 대응하는 프론트엔드 목록 화면을 구현한다.

## 컴포넌트 구조

`StorePromotionManage` (useState 패턴)을 기준으로 검색 + AgGrid 목록 화면.

```
page.tsx (단순 렌더링)
└── PriceMasterManage.tsx (상태 관리 + 레이아웃)
    ├── Location
    ├── PriceMasterSearch (검색 폼 + 예약 액션바)
    └── PriceMasterList (AgGrid 목록 + 가격 수정 input + 체크박스 선택)
```

## 생성/수정 파일 목록

| 파일 | 상태 | 설명 |
|------|------|------|
| `src/types/price-master.ts` | **구현완료** | 타입 정의 (ListItem, ListResponse, ListParams, UpdateRequest) |
| `src/hooks/queries/query-keys.ts` | **구현완료** | `priceMasterKeys` 추가 |
| `src/hooks/queries/use-price-master-queries.ts` | **구현완료** | 조회/수정 TanStack Query 훅 |
| `src/hooks/queries/index.ts` | **구현완료** | export 추가 |
| `src/components/master/pricing/price-master/PriceMasterSearch.tsx` | **구현완료** | 검색 컴포넌트 + 예약 액션바 |
| `src/components/master/pricing/price-master/PriceMasterList.tsx` | **구현완료** | AgGrid 목록 (체크박스, 가격 수정 input) |
| `src/components/master/pricing/price-master/PriceMasterManage.tsx` | **구현완료** | 래퍼 컴포넌트 (상태 관리) |
| `src/app/(sub)/master/pricing/price-master/page.tsx` | **구현완료** | 라우트 진입점 |
| `src/data/HeaderMenu.ts` | **구현완료** | "마스터용 가격 관리" 메뉴 link 연결 |
| `src/components/ui/common/DatePicker.tsx` | **구현완료** | `minDate` prop 추가 (react-datepicker에 전달) |

## 타입 정의 (`src/types/price-master.ts`)

```typescript
PriceMasterListItem     // API 응답 항목 (id, bpId, companyName, menuName, menuClassificationCode, operationStatus, salePrice, discountPrice, priceAppliedAt, scheduledAt)
PriceMasterListResponse // 페이징 응답 (content, totalElements, totalPages 등)
PriceMasterListParams   // 검색 요청 파라미터 (bpId 필수, 나머지 선택)
PriceMasterUpdateRequest // 가격 수정 요청 (id, bpId, salePrice, discountPrice)
```

## TanStack Query 훅

- `usePriceMasterList(params, enabled)` → `GET /api/master/price/master`
- `useUpdatePriceMaster()` → `PUT /api/master/price/master` (배열), 성공 시 목록 캐시 무효화

## 검색 컴포넌트 (`PriceMasterSearch.tsx`)

### 검색 필드 (6열 테이블 레이아웃, 기본 오픈 상태)

| 행 | th | td | th | td | th | td |
|----|----|----|----|----|----|----|
| 1행 | 본사* | HeadOfficeFranchiseStoreSelect (office만) | 가맹점 | SearchSelect (disabled) | 운영여부 | RadioButtonGroup (전체/운영/미운영) |
| 2행 | 메뉴분류 | SearchSelect (MNCF 공통코드) | 메뉴명 | Input (엔터 검색) | 반영일 | RangeDatePicker |
| 3행 | 판매가 | Input(currency) ~ Input(currency) | 할인가 | Input(currency) ~ Input(currency) | - | - |

- 본사: 필수 (미선택 시 검색 버튼 클릭 시 "필수 선택 조건입니다" 에러 문구 표시)
- 가맹점: disabled 상태로 "전체" 표시
- 버튼: 닫기 / 초기화 / 검색

### 검색 조건 표시

검색 수행 후 `search-result` div 안에 현재 적용된 조건을 태그로 표시:
- 값이 있는 조건만 표시 (본사명, 운영여부, 메뉴분류, 메뉴명, 반영일 범위, 판매가 범위, 할인가 범위)
- `appliedFilters`를 prop으로 전달받아 렌더링
- 각 조건 오른쪽에 붉은색 X 버튼 → 클릭 시 해당 조건 삭제 후 재검색(`onRemoveFilter` 콜백)
- 본사 조건 삭제 시: 전체 초기화 + 검색 영역 펼침 (재검색하지 않음)

### 예약 액션바 (체크박스 선택 시)

체크박스가 하나라도 선택되면 검색결과 영역이 아래 액션바로 교체되고 검색영역이 닫힌다:

```
[예약취소(btn)] [DatePicker(minDate=today)] [시간(select)] [분(select, 10분 단위)] [반영예약(btn)]
```

체크 해제 시 다시 "검색결과 N건" 표시로 복원.

### 예약 시간 validation (3단계) — 구현완료

1. **DatePicker `minDate`**: `DatePicker.tsx`에 `minDate` prop 추가. 달력에서 오늘 이전 날짜 선택 불가
2. **시간/분 옵션 필터링**: 오늘 선택 시 현재 시각 이전의 시/분 옵션이 목록에서 제외됨. 날짜/시간 변경 시 선택값이 범위 밖이면 자동 보정
3. **반영예약 버튼 최종 validation**: 날짜 미선택 체크 + 조합된 예약 시각이 현재 이전이면 alert

## 목록 컴포넌트 (`PriceMasterList.tsx`)

### 헤더

- 좌측: (없음)
- 우측: 반영예약 N건 표시 + 페이지 사이즈 select (50/100/200)

### AgGrid 컬럼

| # | 컬럼명 | 설명 |
|---|--------|------|
| 1 | 체크박스 | headerCheckboxSelection + checkboxSelection |
| 2 | 메뉴명 | field: menuName, flex:1 |
| 3 | 메뉴분류 | MNCF 공통코드명 변환 |
| 4 | 운영여부 | STOPR 공통코드명 변환 |
| 5 | 현재 판매가 | formatPrice() |
| 6 | 판매가 수정 | PriceInput (로컬 uncontrolled 컴포넌트, ref로 변경값 수집, 수정 시 해당 row 자동 체크) |
| 7 | 현재 할인가 | formatPrice() |
| 8 | 할인가 수정 | PriceInput (동일 패턴, 수정 시 해당 row 자동 체크) |
| 9 | 반영 예약 | scheduledAt 날짜+시분 표시 (`formatDateTimeYmdHm`) |

### PriceInput 컴포넌트

공용 `Input` 컴포넌트가 controlled 전용이라 `defaultValue` 사용 시 충돌 발생. 네이티브 `<input>`을 사용하는 로컬 컴포넌트로 구현:

```typescript
function PriceInput({ defaultValue, onChange }) {
  const [display, setDisplay] = useState(...)  // 콤마 포맷된 표시값
  // onChange에서 숫자만 추출한 raw 값을 부모에 전달
}
```

### 가격 수정 흐름

1. `priceChangesRef` (Map)에 수정된 가격값 수집 (리렌더링 없음)
2. 판매가/할인가 수정 시 해당 row 자동 체크 (`params.node.setSelected(true)`)
3. 수정된 가격은 반영예약 시 사용됨 (별도 저장 버튼 없음)

## 래퍼 컴포넌트 (`PriceMasterManage.tsx`)

### 상태 관리

- `filters` / `appliedFilters` — 입력 중 / 검색 실행된 값 분리
- `page`, `pageSize` — 페이징
- `hasCheckedRows` — 체크박스 선택 여부 (Search 액션바 전환용)
- `scheduleDate`, `scheduleHour`, `scheduleMinute` — 예약 설정값

### 공통코드

- `useCommonCodeHierarchy('STOPR')` → 운영여부 라디오 옵션 (+ "전체")
- `useCommonCodeHierarchy('MNCF')` → 메뉴분류 셀렉트 옵션
- 각각 `Map<code, name>`으로 변환하여 AgGrid valueFormatter에서 사용

## LNB 메뉴 연결

`src/data/HeaderMenu.ts` — "마스터용 가격 관리" link: `'/master/pricing/price-master'`

## 반영예약 / 예약취소 API 연동

### API 엔드포인트

| API | Method | URL | Request Body | Response |
|-----|--------|-----|-------------|----------|
| 예약 등록 | POST | `/api/master/price/master/schedule` | `List<PriceScheduleSaveRequest>` | `List<PriceScheduleSaveResponse>` |
| 예약 취소 | PUT | `/api/master/price/master/schedule/cancel` | `List<Long>` (menuId 목록) | `Unit` |

### 타입 추가 (`src/types/price-master.ts`)

```typescript
// 예약 등록 요청
interface PriceScheduleSaveRequest {
  id: number          // Menu ID
  bpId: number        // 메뉴 소유 BP ID
  scheduledSalePrice: number    // 판매가
  scheduledDiscountPrice: number // 할인가
  scheduledAt: string  // ISO 8601 (ZonedDateTime)
}

// 예약 등록 응답
interface PriceScheduleSaveResponse {
  id: number | null
  menuId: number | null
  bpId: number | null
  scheduledSalePrice: number | null
  scheduledDiscountPrice: number | null
  status: string
  scheduledAt: string
}
```

### Query 훅 추가 (`use-price-master-queries.ts`)

- `useCreatePriceSchedule()` → `POST /api/master/price/master/schedule`, 성공 시 목록 캐시 무효화
- `useCancelPriceSchedule()` → `PUT /api/master/price/master/schedule/cancel`, 성공 시 목록 캐시 무효화

### 연동 흐름

**반영예약 (`onApplySchedule`):**
1. 시간 validation 통과 (기존 3단계 validation)
2. 선택된 행에서 `id`, `bpId` 수집
3. `priceChangesRef`에서 수정된 가격 추출 (수정 없으면 현재 가격 사용)
4. `scheduleDate + scheduleHour + scheduleMinute` → ISO 8601 문자열 조합
5. `useCreatePriceSchedule` mutation 호출
6. 성공 시 alert + 체크 해제 + 검색결과 UI 복원 + 목록 갱신
7. 실패 시 서버 응답 message를 alert에 표시

**예약취소 (`onCancelSchedule`):**
1. 선택된 행에서 `scheduledAt`이 있는 항목의 `id`(menuId) 수집
2. `useCancelPriceSchedule` mutation 호출
3. 성공 시 alert + 체크 해제 + 검색결과 UI 복원 + 목록 갱신
4. 실패 시 서버 응답 message를 alert에 표시

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/price-master.ts` | `PriceScheduleSaveRequest`, `PriceScheduleSaveResponse` 타입 추가 |
| `src/hooks/queries/use-price-master-queries.ts` | `useCreatePriceSchedule`, `useCancelPriceSchedule` 훅 추가 |
| `src/components/master/pricing/price-master/PriceMasterManage.tsx` | 예약/취소 핸들러에 실제 API 호출 연결 |
| `src/components/master/pricing/price-master/PriceMasterList.tsx` | 선택된 행 + 수정된 가격을 외부에서 접근할 수 있도록 getter 콜백 추가 |

## 2차 코드리뷰 수정 사항

| # | 이슈 | 파일 | 상태 |
|---|------|------|------|
| 1 | `defaultColDef`를 컴포넌트 외부 모듈 상수로 이동 | PriceMasterList.tsx | 구현완료 |
| 2 | `priceChangesRef`를 rows 변경 시 및 clearSelection에서 초기화 | PriceMasterList.tsx | 구현완료 |
| 3 | useImperativeHandle 패턴 (선택적) | PriceMasterList.tsx | 스킵 (현재 패턴 유지) |
| 4 | Zod 스키마 추가 (`src/lib/schemas/price-master.ts`) | price-master.ts | 구현완료 |
| 5 | `getFilteredMinutes` 폴백 로직 검증 | PriceMasterSearch.tsx | 구현완료 |
| 6 | 인라인 스타일 → Tailwind 유틸리티 클래스 | PriceMasterSearch.tsx | 구현완료 |

### 상세 변경

- **#1**: `defaultColDef` 객체를 컴포넌트 밖 모듈 레벨 상수로 추출 (매 렌더마다 새 객체 생성 방지)
- **#2**: `rows` prop이 변경될 때 `priceChangesRef.current.clear()` 호출, `clearSelection`에서도 동일하게 초기화
- **#4**: `src/lib/schemas/price-master.ts` 파일 생성 — `priceMasterListItemSchema`, `priceMasterListResponseSchema`, `priceScheduleSaveRequestSchema`, `priceScheduleSaveResponseSchema` 정의
- **#5**: `getFilteredMinutes`에서 `selectedHour === currentHour`이고 빈 배열이 되는 경우 → `getFilteredHours`가 이미 해당 시간을 제외하므로 실질적 문제 없음. 방어 코드로 빈 배열 반환하고 UI에서 첫 번째 사용 가능한 시간으로 자동 보정
- **#6**: 검색 조건 태그의 인라인 스타일을 Tailwind 유틸리티 클래스로 대체

## 3차 코드리뷰 수정 사항

| # | 이슈 | 파일 | 상태 |
|---|------|------|------|
| 1 | `getWithSchema`/`postWithSchema` 반환값 `.data` 접근 | use-price-master-queries.ts | 오탐 — `apiResponseSchema` 래핑으로 `.data`는 `ApiResponse.data` 접근이므로 정상 |
| 2 | `useCancelPriceSchedule`에서 `putWithSchema` 미사용 | use-price-master-queries.ts | 구현완료 |
| 4 | `priceAppliedAtTo`가 `T00:00:00` 전송 — 종료일 레코드 제외 | PriceMasterManage.tsx | 구현완료 |

### 상세 변경

- **#2**: `useCancelPriceSchedule`에서 `api.put` → `putWithSchema` + `apiResponseSchema(z.unknown())` 사용
- **#4**: `toIsoDateTime` → 종료일 전용 `toIsoDateTimeEnd` 함수 추가 (`T23:59:59`), `priceAppliedAtTo` 파라미터에 적용

## 4차 코드리뷰 수정 사항

| # | 이슈 | 파일 | 상태 |
|---|------|------|------|
| 1 | `useEffect` imperative getter → `useImperativeHandle` + `forwardRef` | PriceMasterList.tsx, PriceMasterManage.tsx | 구현완료 |
| 2 | `scheduledCount`가 현재 페이지만 카운트 — 라벨 명확화 | PriceMasterManage.tsx, PriceMasterList.tsx | 구현완료 |
| 3 | `PriceInput` stale display — key로 remount 강제 | PriceMasterList.tsx | 구현완료 |

### 상세 변경

- **#1**: `onRegisterGetters` 콜백 패턴 → `forwardRef` + `useImperativeHandle`로 교체. `PriceMasterListHandle` 인터페이스 export. Manage에서 `useRef<PriceMasterListHandle>` 사용
- **#2**: "반영예약 N건" → "(현재 페이지) 반영예약 N건"으로 라벨 명확화
- **#3**: `PriceInput`에 `key={row.id-row.salePrice}` 패턴 적용하여 데이터 변경 시 자동 remount. React Compiler safe (useEffect 미사용)

### 추가 수정 (4차 리뷰 Important)

| # | 이슈 | 파일 | 상태 |
|---|------|------|------|
| 4 | `getFilteredMinutes`에서 과거 시간에 ALL_MINUTES 반환 | PriceMasterSearch.tsx | 구현완료 |
| 5 | 커스텀 페이지네이션 스키마 — 표준과 필드명 차이 주석 추가 | price-master.ts (schema) | 구현완료 |
| 7 | `export default function` → `const` 컨벤션 | PriceMasterSearch.tsx, PriceMasterManage.tsx | 구현완료 |
| 8 | 가격 입력 후 지우면 0원 전송 — 원래 가격 유지로 변경 | PriceMasterManage.tsx | 구현완료 |

### 추가 수정 (5차 리뷰)

| # | 이슈 | 파일 | 상태 |
|---|------|------|------|
| 2 | `getFilteredHours` 23:51 이후 빈 드롭다운 — 오늘 예약 불가 시 내일부터 선택 안내 | PriceMasterSearch.tsx | 구현완료 |
| 3 | `scheduledAt` 타임존 `+09:00` 하드코딩 → 동적 오프셋 | PriceMasterManage.tsx | 구현완료 |
| 4 | `rows` 변경 시 `selectedRowsRef` 미초기화 — 페이지 이동 시 stale 선택 | PriceMasterList.tsx | 구현완료 |
| 6 | cellRenderer 내 `setSelected(true)` — `setTimeout`으로 AG Grid 렌더 사이클 분리 | PriceMasterList.tsx | 구현완료 |
| 8 | `page.tsx` `function` → `const` 컨벤션 | page.tsx | 구현완료 |

스킵 사유:
- #1: 서버 검증이 안전망, 타이머 추가는 과도한 복잡성
- #5: ref 변경은 `set-state-in-effect` 위반 아님 (false positive)
- #7: 가격 미변경 행 예약은 의도적 동작 가능

## 미구현 / 추후 작업

(없음)
