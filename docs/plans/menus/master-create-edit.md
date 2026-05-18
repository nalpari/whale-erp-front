# 마스터 메뉴 등록/수정 페이지 구현 계획

## 개요

마스터용 메뉴 등록 페이지를 구현한다. pub/masteredit를 참조하여 slidebox 레이아웃 기반의 폼 UI를 구성한다.

## 화면 구성

### Location
```
title: "마스터용 메뉴 관리"
list: ['홈', 'Master data 관리', '메뉴 정보 관리', '마스터용 메뉴 Master', '등록']
```

### 레이아웃 구조
```
slidebox-wrap
├── slidebox-header
│   ├── h2 "마스터용 메뉴 관리"
│   └── slidebox-btn-wrap: [목록] [저장]
└── slidebox-body (AnimateHeight)
    ├── [섹션1] default-table — 기본 정보
    ├── [섹션2] slide-table-wrap — 메뉴 정보
    ├── [섹션3] slide-table-wrap — 옵션 정보
    └── [섹션4] slide-table-wrap — 카테고리 선택
```

---

## 섹션별 상세 설계

### 섹션1: 기본 정보 (default-table)

| colgroup | col=190px | col |
|----------|-----------|-----|

| 필드명 | UI 컴포넌트 | 공통코드 | 필수 | 비고 |
|--------|-------------|----------|------|------|
| ~~메뉴 소유~~ | ~~RadioButtonGroup~~ | - | - | **숨김 (차후 개발)** — 본사 고정 |
| 본사/가맹점 선택 | HeadOfficeFranchiseStoreSelect | - | **required** | 본사 선택만 표시 (`fields={['office']}`) |
| ~~메뉴 그룹~~ | ~~RadioButtonGroup~~ | `MNGRP` | - | **숨김 (차후 개발)** — 마스터용 고정 |
| ~~점포 선택~~ | ~~SearchSelect~~ | - | - | **숨김 (차후 개발)** — 선택 안 함 |

**동작 규칙:**
- ~~메뉴 소유 = "본사" → HeadOfficeFranchiseStoreSelect `fields={['office']}`~~
- ~~메뉴 소유 = "가맹점" → HeadOfficeFranchiseStoreSelect `fields={['office', 'franchise']}`~~
- 본사 선택 시 → 카테고리 목록 로딩에 bpId 사용
- ~~메뉴 그룹 = "점포용" 선택 시 → 점포 선택 활성화~~
- **현재**: 메뉴 소유(본사), 메뉴 그룹(마스터용), 점포(미선택)로 고정, UI 숨김

### 섹션2: 메뉴 정보 (slide-table-wrap)

| colgroup | col=190px | col |
|----------|-----------|-----|

| 필드명 | UI 컴포넌트 | 공통코드 | 필수 | 비고 |
|--------|-------------|----------|------|------|
| 운영여부 | RadioButtonGroup | `STOPR` | - | 운영, 미운영 |
| 메뉴타입 | RadioButtonGroup | `MNTYP` | **required** | 메뉴, 옵션 / helpText: "※ 옵션으로 선택할 경우..." |
| ~~세트여부~~ | ~~RadioButtonGroup~~ | `STST` | - | **숨김 (차후 개발)** — 일반메뉴 고정 |
| 메뉴분류 | SearchSelect | `MNCF` | **required** | `.mx-500`, 에러 클리어 처리 |
| 메뉴명(대표) | input | - | **required** | `.mx-500` |
| 메뉴명 영어 | input | - | - | `.mx-500` |
| 메뉴명 중국어 | input x2 | - | - | title="간체", title="번체" / `.mx-500` 2개 `filed-flx` |
| 메뉴명 일어 | input | - | - | `.mx-500` |
| 과세 | RadioButtonGroup | - | - | TAXABLE:과세, TAX_FREE:면세, ZERO_RATED:영세율 / helpText: "※ 과세로 설정하면..." |
| 마케팅분류 | Checkbox (`filed-check-flx`) | `MKCF` | - | NEW, BEST, EVENT — 다중 선택, `marketingTags: string[]` |
| 온도분류 | Checkbox (`filed-check-flx`) | `TMPCF` | - | HOT, COLD — 다중 선택, `temperatureTags: string[]` |
| 노출순서 | input (number) | - | - | `.mx-500`, type="number" / 메뉴타입=옵션 시 숨김 |
| 메뉴 Description | input | - | **required** | 전체 너비 |
| 메뉴 이미지 | ImageUpload | - | - | `multiple={false}`, 단일 이미지, 미리보기 |

### 섹션3: 옵션 정보 (slide-table-wrap)

pub/masteredit 옵션 정보 구조를 참조하여 **옵션 SET을 동적으로 추가/삭제**할 수 있다.

```
slide-table-wrap
  h3 "옵션 정보"
  table.master-option-table
    colgroup: col[190px] | col[*]
    tbody
      tr: [옵션 SET 헤더]
        th.option-header-tit "옵션 SET 01"
        td:
          table.option-header
            colgroup: col[*] | col[150px] | col[150px] | col[200px] | col[150px]
            tr:
              td: 옵션 SET명 * (input)
              td: 필수선택 (toggle)
              td: 다중선택 (toggle)
              td: 노출순서 (input number)
              td: 운영여부 (toggle, isActive)

      tr: [옵션 항목 행] (동적 추가/삭제)
        th: "옵션 01" + 순서변경 버튼
        td:
          table.option-list
            colgroup: col[*] | col[240px] | col[150px] | col[140px] | col[150px] | col[110px]
            tr:
              td: 옵션찾기 btn + 옵션명 (input) + 메뉴코드 + 운영상태 배지
              td: 추가가격 (input number)
              td: 수량입력 (toggle)
              td: 디폴트 (radio)
              td: 운영여부 (toggle, isActive)
              td: 더보기(옵션 추가/삭제)
```

**동작 규칙:**
- 옵션 SET은 여러 개 동적 추가/삭제 가능 ("옵션 SET 추가" 버튼 + 더보기 Tooltip → "옵션 SET 삭제")
- 옵션 항목은 각 SET 내에서 동적 추가/삭제 가능 (더보기 Tooltip → "옵션 추가", "옵션 삭제")
- 디폴트 radio는 SET 내 하나만 선택 가능
- 옵션 항목 최소 1개 유지
- 메뉴코드/운영상태 배지: 옵션찾기 선택 여부와 관계없이 항상 표시 (미선택 시 `-` / hidden badge로 레이아웃 유지)
- **옵션 항목 운영여부 (isActive)**: 각 옵션 항목에 운영여부 토글 존재
  - 옵션 SET 운영여부 ON → 옵션 항목 운영여부 개별 수정 가능
  - 옵션 SET 운영여부 OFF → 하위 옵션 항목 운영여부 모두 OFF로 일괄 변경 + disabled
  - 옵션 SET 운영여부 OFF→ON → 하위 옵션 항목 운영여부 모두 ON으로 일괄 변경
- **옵션 항목 Drag & Drop 순서 변경** ✅ 구현완료
  - `@dnd-kit` 사용, `EmployeeInfoSettings.tsx` 패턴 참조
  - `sequence-btn`을 드래그 핸들로 사용
  - 각 SET마다 독립 `DndContext` → SET 간 드래그 방지
  - 드래그 후 `displayOrder` 자동 재할당 (1, 2, 3...)
  - `SortableOptionRow` 컴포넌트로 `<tr>` 추출
  - Sortable ID: `option.id` 존재 시 사용, 없으면 `new-${setIndex}-${optionIndex}` 폴백

### 섹션4: 카테고리 선택 (slide-table-wrap)

```
slide-table-wrap
  h3 "카테고리 정보"
  table.default-table.white
    colgroup: col[190px] | col[*]
    tbody
      tr:
        th: "카테고리 선택 *"
        td:
          div.filed-flx
            SearchSelect (카테고리 목록)
            button "추가"
          ul.category-list
            li.category-item (선택된 카테고리 태그)
              span.category-name + 운영상태
              button.file-delete (삭제)
```

**동작 규칙:**
- bpId 기반 카테고리 목록 조회 (`useMasterCategoryList`)
- SearchSelect 옵션: MenuSearch와 동일한 depth prefix 표시 (depth1: `이름`, depth2: `- 이름`)
- SearchSelect에서 카테고리 선택 → "추가" 버튼 → 태그 목록에 추가
- 중복 추가 방지
- 태그별 삭제 버튼
- **필수 검증**: `categoryIds.min(1)` — 미선택 시 에러 메시지 표시

---

## 폼 검증 & 에러 클리어

- 저장 버튼 클릭 시 Zod 스키마 검증 → 실패 시 `fieldErrors`에 에러 메시지 설정
- 각 필드 값 변경 시 해당 필드의 에러만 개별 클리어 (`clearFieldError` 헬퍼)
  - 메뉴명, 메뉴타입, 본사 선택: 변경 시 해당 에러 제거
  - 옵션 SET: 각 Input(optionSetName, optionName) 변경 시 해당 필드 에러만 제거 (`onClearFieldError` prop)
  - 카테고리: 추가/삭제 시 `categoryIds` 에러 제거

---

## API 전송 방식

- **Content-Type**: `multipart/form-data`
- **`menu` 파트**: JSON Blob (`new Blob([JSON.stringify(data)], { type: 'application/json' })`)
- **`image` 파트**: File (optional, 메뉴 이미지)
- 백엔드: `@RequestPart("menu")` + `@RequestPart("image", required = false)`

---

## 파일 구조

### 새로 생성할 파일

| # | 파일 경로 | 역할 | 상태 |
|---|-----------|------|------|
| 1 | `src/app/(sub)/master/menu/create/page.tsx` | 등록 라우트 진입점 | ✅ 구현완료 |
| 2 | `src/components/master/menu/MenuForm.tsx` | 등록/수정 폼 컴포넌트 (핵심) | ✅ 구현완료 |
| 3 | `src/components/master/menu/OptionSetSection.tsx` | 옵션 SET 섹션 컴포넌트 | ✅ 구현완료 |
| 4 | `src/components/master/menu/CategorySelectSection.tsx` | 카테고리 선택 섹션 컴포넌트 | ✅ 구현완료 |
| 5 | `src/app/(sub)/master/menu/edit/[id]/page.tsx` | 수정 라우트 진입점 | ✅ 구현완료 |

### 수정할 파일

| # | 파일 경로 | 수정 내용 | 상태 |
|---|-----------|-----------|------|
| 5 | `src/lib/schemas/menu.ts` | 등록 폼 Zod 스키마 추가 + 수정 시 id 필드 | ✅ 구현완료 |
| 6 | `src/hooks/queries/use-master-menu-queries.ts` | `useCreateMenu` + `useUpdateMenu` mutation 추가 | ✅ 구현완료 |
| 7 | `src/hooks/queries/query-keys.ts` | (변경 불필요 — 기존 키 활용) | - |
| 8 | `src/components/master/menu/MenuList.tsx` | 등록 버튼 onClick → router.push 연결 | ✅ 구현완료 |
| 9 | `src/components/master/menu/MenuForm.tsx` | 수정 모드 지원 (menuId prop, 데이터 로딩, 저장 분기) | ✅ 구현완료 |

---

## 구현 순서

### Phase 1: 스키마 & API 훅 (기반)
1. `src/lib/schemas/menu.ts` — `menuFormSchema`, `optionSetSchema`, `optionItemSchema` 추가
2. `src/hooks/queries/use-master-menu-queries.ts` — `useCreateMenu` mutation 추가

### Phase 2: 컴포넌트 구현
3. `OptionSetSection.tsx` — 옵션 SET 테이블 (동적 옵션 추가/삭제)
4. `CategorySelectSection.tsx` — 카테고리 태그 선택
5. `MenuForm.tsx` — 전체 폼 통합 (slidebox 레이아웃)

### Phase 3: 라우팅 & 연결
6. `src/app/(sub)/master/menu/create/page.tsx` — 등록 라우트
7. `MenuList.tsx` — 등록 버튼 onClick 연결

### Phase 4: 검증
8. `pnpm lint` + `pnpm build` 체크

---

## Zod 스키마 설계

**에러 메시지 규칙:**
- Input 필드 → `'필수 입력 항목입니다.'`
- Radio, SelectBox 필드 → `'필수 선택 항목입니다.'`

```typescript
// 옵션 항목 — 백엔드: MenuOptionItemSaveRequest
const optionItemSchema = z.object({
  optionSetItemId: z.number().nullable().optional(),  // 옵션찾기로 선택한 메뉴 ID
  optionName: z.string().min(1, '필수 입력 항목입니다.'),  // 표시용 (request에 포함되지 않음)
  additionalPrice: z.number().default(0),
  isQuantity: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // 옵션찾기로 선택된 메뉴의 표시용 메타데이터
  selectedMenuCode: z.string().nullable().optional(),
  selectedOperationStatus: z.string().nullable().optional(),
})

// 옵션 SET — 백엔드: MenuOptionSetSaveRequest
const optionSetSchema = z.object({
  setName: z.string().min(1, '필수 입력 항목입니다.'),
  isRequired: z.boolean().default(false),
  isMultipleChoice: z.boolean().default(false),
  displayOrder: z.number().nullable().default(null),
  isActive: z.boolean().default(true),
  optionItems: z.array(optionItemSchema).min(1, '옵션을 1개 이상 추가해주세요'),
})

// 메뉴 등록 폼
const menuFormSchema = z.object({
  // 기본 정보
  menuOwnership: z.enum(['HEAD_OFFICE', 'FRANCHISE']),
  bpId: z.number({ error: '필수 선택 항목입니다.' }),
  menuGroup: z.string(),
  storeId: z.number().nullable().default(null),

  // 메뉴 정보
  operationStatus: z.string(),
  menuType: z.string().min(1, '필수 선택 항목입니다.'),
  setStatus: z.string(),
  menuClassificationCode: z.string().min(1, '필수 선택 항목입니다.'),
  menuName: z.string().min(1, '필수 입력 항목입니다.'),
  menuNameEng: z.string().nullable().default(null),
  menuNameChs: z.string().nullable().default(null),
  menuNameCht: z.string().nullable().default(null),
  menuNameJpn: z.string().nullable().default(null),
  taxType: z.string(),
  marketingTags: z.array(z.string()).default([]),
  temperatureTags: z.array(z.string()).default([]),
  displayOrder: z.number().nullable().default(null),
  description: z.string().min(1, '필수 입력 항목입니다.'),

  // 옵션 SET (여러 개)
  optionSets: z.array(optionSetSchema).default([]),

  // 카테고리 — 백엔드: categories: List<MenuCategorySaveRequest>
  categories: z.array(z.object({ categoryId: z.number() })).min(1, '필수 선택 항목입니다.'),
})
```

---

## API 엔드포인트 (예상)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/master/menu/master` | 마스터 메뉴 등록 |
| POST | `/api/v1/files/upload` | 이미지 업로드 (기존) |

> 실제 API 스펙은 백엔드 확인 후 조정 필요

---

## 주요 재사용 컴포넌트

| 컴포넌트 | 용도 |
|----------|------|
| `RadioButtonGroup` | 운영여부, 메뉴타입, 세트여부, 과세, 마케팅분류, 메뉴소유, 메뉴그룹 |
| `HeadOfficeFranchiseStoreSelect` | 본사/가맹점 선택 |
| `SearchSelect` | 점포 선택, 카테고리 선택 |
| `ImageUpload` | 메뉴 이미지 (단일, 미리보기) |
| `useCommonCodeHierarchy` | STOPR, MNTYP, STST, TXN, MKCF, MNGRP |
| `useMasterCategoryList` | 카테고리 목록 |
| `useStoreOptions` | 점포 목록 |
| `AnimateHeight` | slidebox 열기/닫기 |
| `react-tooltip` (Tooltip) | 옵션 더보기 메뉴 |

---

## 옵션찾기 기능

### 개요

옵션 SET 내 각 옵션 항목의 옵션명 Input 앞에 "옵션찾기" 버튼을 추가한다.
클릭 시 **메뉴 검색 팝업(FindOptionPop)**이 열리고, 선택 시 해당 옵션명이 자동 입력된다.

### API

- **목록 조회 (리디자인 후)**: `GET /api/master/menu/master` — 기존 마스터 메뉴 목록 API (`useMasterMenuList`) 재사용
- **~~기존~~**: ~~`GET /api/master/menu/master/operating-options?bpId={bpId}`~~ — 단순 목록용, 리디자인 이전 사용

### 생성/수정 파일

| 파일 | 변경 | 설명 | 상태 |
|------|------|------|------|
| `src/hooks/queries/use-master-menu-queries.ts` | 수정 | `useOperatingOptionMenus` 쿼리 훅 (기존 유지) | ✅ 구현완료 |
| `src/hooks/queries/query-keys.ts` | 수정 | `MasterMenuListParams`에 `menuGroup`, `setStatus` 추가 | ✅ 구현완료 |
| `src/components/master/menu/FindOptionPop.tsx` | **전면 재작성** | commonpoptable 패턴 적용, 메뉴 검색 팝업 | ✅ 구현완료 |
| `src/components/master/menu/OptionSetSection.tsx` | 수정 | `bpId` prop 추가, 옵션찾기 버튼 + 팝업 연동 | ✅ 구현완료 |
| `src/components/master/menu/MenuForm.tsx` | 수정 | OptionSetSection에 `bpId` prop 전달 | ✅ 구현완료 |

### FindOptionPop 리디자인 (commonpoptable 패턴)

**변경 전**: 단순 키워드 검색 + 옵션명/소속 테이블 + "선택" 버튼
**변경 후**: `modal-dialog mypage` + `common-pop-table-wrap` 구조

```
modal-popup show
└── modal-dialog mypage
    └── modal-content
        ├── mypage-header: "메뉴 검색" + 닫기
        └── mypage-body
            └── common-pop-table-wrap
                ├── search-wrap (검색 조건, AnimateHeight)
                │   ├── search-result-wrap (N건 + 열기/닫기)
                │   └── search-filed (4행 x 2열)
                │       ├── 본사 / 가맹점
                │       ├── 메뉴그룹(Radio) / 메뉴분류(SearchSelect)
                │       ├── 메뉴타입(Radio) / 세트여부(Radio)
                │       └── 메뉴명(Input, colSpan=3)
                └── data-list-wrap (결과 목록)
                    ├── data-list-header: 추가 버튼 + pageSize
                    └── data-list-bx
                        ├── default-table (radio 단일선택)
                        │   선택 | 메뉴명 | 메뉴그룹 | 메뉴분류 | 메뉴타입 | 세트여부
                        └── Pagination
```

**데이터 조회**: `useMasterMenuList` 재사용 (기존 메뉴 목록 페이지와 동일한 API)
**동작**: 검색 버튼 클릭 시에만 API 호출 → 라디오 단일선택 → 추가 버튼 → `onSelect(selectedMenu)` → 팝업 닫힘

### 동작 흐름

1. 옵션 항목 행의 옵션명 앞 "옵션찾기" 버튼 클릭
2. `FindOptionPop` 팝업 열림 (메뉴 검색 팝업)
3. 검색 조건 입력 → 검색 버튼 클릭 → 결과 테이블 표시
4. 라디오 버튼으로 메뉴 1개 선택 → 추가 버튼 클릭
5. `onSelect(selectedMenu)` 호출 → 해당 옵션의 `optionName`에 선택한 메뉴의 `menuName` 설정
6. 팝업 닫힘

### UI 구조 변경

옵션 항목 행의 첫 번째 td에 "옵션찾기" 버튼 + 옵션명 Input을 flex로 배치:
```
td: [옵션찾기 btn] + [옵션명 Input]
```

---

## 참고 사항

- pub/masteredit의 CSS 클래스를 그대로 사용 (기존 Sass 스타일 활용)
- 이미지 업로드는 `referenceType: 'MENU'` 사용 (기존 정의 확인됨)
- 등록 성공 시 목록 페이지로 이동 + 캐시 무효화 (`masterMenuKeys.lists()`)
- 기존 CSS/Sass 파일 수정 금지 규칙 준수 — 필요한 추가 스타일은 Tailwind 클래스 사용

---

## 수정 모드 구현

### 등록 vs 수정 차이점

| 항목 | 등록 | 수정 |
|------|------|------|
| API | `POST /api/master/menu/master` | `PUT /api/master/menu/master/{id}` |
| 데이터 로딩 | 없음 | `useMasterMenuDetail(id)` |
| 이미지 | 새 파일만 | 기존 파일 표시 + deleteFileId 파라미터 |
| 옵션/카테고리 | 신규만 | 기존 id 포함 (업데이트/삭제 추적) |
| Breadcrumb | '등록' | '수정' |
| 완료 후 | 목록으로 | 상세로 (`/master/menu/${id}`) |

### MenuForm 수정 모드 설계

- `menuId?: number` prop 추가 → menuId 있으면 수정 모드, 없으면 등록 모드
- 수정 모드 시 `useMasterMenuDetail(menuId)` 로 기존 데이터 로딩
- useEffect로 데이터 로딩 완료 시 각 state 초기화
- 이미지 처리: 기존 이미지 `existingFileId` 추적, 삭제 시 `deleteFileId` state 관리
- 옵션 SET/Item: 기존 id 포함하여 서버로 전달
- 카테고리: 기존 매핑 id 포함

### useUpdateMenu API

```
PUT /api/master/menu/master/{id}
Content-Type: multipart/form-data

Parts:
- menu: JSON Blob (MenuSaveRequest와 동일 구조)
- image: File (optional, 새 이미지)
- deleteFileId: number (optional, 삭제할 파일 ID)
```
