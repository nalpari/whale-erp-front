# 마스터 메뉴 상세 조회 페이지 구현 계획

## 개요

마스터용 메뉴 상세 조회(읽기 전용) 페이지를 구현한다. pub/masterdetail을 참조하여 `detail-data-table` 기반의 읽기 전용 UI를 구성한다.

## 화면 구성

### Location

```
title: "마스터용 메뉴 관리"
list: ['홈', 'Master data 관리', '메뉴 정보 관리', '마스터용 메뉴 Master', '조회']
```

### 전체 레이아웃 구조

```
master-detail-data
├── slidebox-wrap (메인)
│   ├── slidebox-header: "마스터용 메뉴 관리" + [수정] [삭제] [목록]
│   └── slidebox-body (AnimateHeight)
│       ├── [섹션1] detail-data-wrap — 메뉴 Header 정보관리
│       └── [섹션2] detail-data-wrap — 카테고리 및 사용가능 가맹점
│
└── slidebox-wrap ×N (옵션구성, optionSets 갯수만큼)
    ├── slidebox-header: "옵션 SET #{n}" + [접기/펼치기]
    └── slidebox-body (AnimateHeight)
        └── detail-data-wrap — 옵션 항목 (data-option-wrap)
```

---

## Slidebox Header

```
slidebox-header
├── h2 "마스터용 메뉴 관리"
└── slidebox-btn-wrap
    ├── button.slidebox-btn "수정"    → router.push(`/master/menu/edit/${id}`)
    ├── button.slidebox-btn "삭제"    → confirm → DELETE API → router.push('/master/menu')
    ├── button.slidebox-btn "목록"    → router.push('/master/menu')
    └── button.slidebox-btn.arr       → 접기/펼치기 토글
```

**삭제 동작:**
1. `useAlert().confirm('삭제하시겠습니까?')` 확인
2. `DELETE /api/master/menu/master/{id}` 호출
3. 성공 시 `alert('삭제되었습니다.')` → 목록 페이지로 이동
4. 실패 시 `alert(getErrorMessage(error, '삭제에 실패했습니다.'))`
5. 캐시 무효화: `masterMenuKeys.lists()`

---

## 섹션별 상세 설계

### 섹션1: 메뉴 Header 정보관리 (detail-data-table)

| colgroup | col=200px | col |
|----------|-----------|-----|

| # | th | td 내용 | 데이터 필드 | 변환 | 비고 |
|---|------|---------|------------|------|------|
| 1 | 운영여부 및 메뉴그룹 | `detail-data-list` 2개 항목 | `isActive`, `menuProperty` | `isActive` → "운영"/"미운영", `menuProperty` → commonCode(`MNPRP`) name 변환 | `|` 구분 |
| 2 | Business Partner | 단일 텍스트 | `companyName` | 직접 표시, null → '-' | |
| 3 | 메뉴타입 | 단일 텍스트 | `menuType` | commonCode(`MNTYP`) name 변환 | |
| 4 | 메뉴분류 | 단일 텍스트 | `menuClassificationCode` | commonCode(`MNCF`) name 변환 | |
| 5 | 메뉴명 | `detail-data-list` 2개 항목 | `menuName`, `menuCode` | 직접 표시 | `|` 구분 |
| 6 | 다국어 | `detail-data-list` N개 항목 | `menuNameEng`, `menuNameChs`, `menuNameJpn` | 값이 있는 필드만 표시, 순서: 영어→중국어→일어 | **전부 null이면 행 hidden** |
| 7 | 마케팅 분류 | `detail-data-list` N개 항목 | `marketingTags[]` | commonCode(`MKCF`) name 변환, 각 태그를 `detail-data-item`으로 표시 | `|` 구분 (::before), 없으면 행 hidden |
| 8 | 온도 분류 | `detail-data-list` N개 항목 | `temperatureTags[]` | commonCode(`TMPCF`) name 변환, 각 태그를 `detail-data-item`으로 표시 | `|` 구분 (::before), 없으면 행 hidden |
| 9 | Description | 단일 텍스트 | `description` | 직접 표시 | |
| 10 | 이미지 정보 | 이미지 + 파일명 | `menuImgFile` | null이면 행 hidden, 있으면 `originalFileName` 표시 + 이미지 미리보기 | `next/image` 사용 |

**detail-data-list 패턴** (pub 참조):
```tsx
<ul className="detail-data-list">
  <li className="detail-data-item">
    <span className="detail-data-text">{value}</span>
  </li>
  {/* ::before pseudo-element로 | 구분선 자동 생성 */}
  {/* :last-child는 구분선 숨김 */}
</ul>
```

**다국어 행 표시 규칙:**
- `menuNameEng` 있으면 → "메뉴 영어: {value}" 형태로 표시
- `menuNameChs` 있으면 → "메뉴 중국어: {value}"
- `menuNameJpn` 있으면 → "메뉴 일어: {value}"
- 3개 모두 null이면 → 행 자체를 렌더링하지 않음

**이미지 정보 표시:**
- `menuImgFile`이 있으면 → `publicUrl`로 이미지 미리보기 + `originalFileName` 텍스트
- `menuImgFile`이 null이면 → 행 자체를 렌더링하지 않음

### 섹션2: 카테고리 및 사용가능 가맹점 (detail-data-table)

같은 slidebox-body 내에 별도 `detail-data-wrap` + `detail-data-table`로 구성.

| # | th | td 내용 | 데이터 필드 | 변환 | 비고 |
|---|------|---------|------------|------|------|
| 1 | 카테고리 | `detail-data-list` N개 항목 | `categories[]` | 각 카테고리의 `name` + `isActive` 아이콘 표시 | `|` 구분 (::before) |
| 2 | 사용가능 가맹점 | 단일 텍스트 | - | "전체 가맹점" (고정 텍스트) | |

**카테고리 표시 규칙:**
```tsx
categories.map(cat => (
  <li className="detail-data-item">
    <span className="detail-data-text">
      {cat.isActive ? <span>(운영)</span> : <span className="red">(미운영)</span>}
      {' '}{cat.name}
    </span>
  </li>
))
```
- `isActive: true` → `(운영) 카테고리명` (기본 색상)
- `isActive: false` → `(미운영) 카테고리명` (빨간색, `.red` 클래스)

### 섹션3: 옵션구성 (slidebox-wrap ×N)

**API 응답의 `optionSets` 배열 갯수만큼** 별도의 slidebox-wrap을 동적 생성한다.
pub/masterdetail의 "세트 메뉴 구성 (옵션 SET)" UI를 따른다.

각 옵션 SET의 slidebox 구조:
```
slidebox-wrap
├── slidebox-header
│   ├── h2 "옵션 SET #{n}: {optionSetName}"
│   └── slidebox-btn-wrap: [접기/펼치기]
└── slidebox-body (AnimateHeight)
    └── detail-data-wrap
        └── detail-data-table
            └── tr
                ├── th: "옵션 SET 정보"
                └── td: data-option-wrap (좌우 2열)
                    ├── data-option-item (좌): SET 메타 정보
                    │   └── 필수선택, 다중선택, 노출순서, 운영여부
                    └── data-option-item (우): 옵션 항목 리스트
                        └── detail-data-list ×N (옵션 항목별)
                            └── (운영/미운영) 옵션명 | 추가가격 | 수량입력 | 디폴트
```

**data-option-wrap 좌우 분할 패턴** (pub 참조):
```tsx
<div className="data-option-wrap">
  {/* 좌측: SET 정보 */}
  <div className="data-option-item">
    <ul className="detail-data-list">
      <li className="detail-data-item">
        <span className="detail-data-text">필수선택: {isRequired ? 'Y' : 'N'}</span>
      </li>
      <li className="detail-data-item">
        <span className="detail-data-text">다중선택: {isMultipleChoice ? 'Y' : 'N'}</span>
      </li>
      {/* ... */}
    </ul>
  </div>
  {/* 우측: 옵션 항목들 */}
  <div className="data-option-item">
    {optionItems.map(item => (
      <ul className="detail-data-list">
        <li className="detail-data-item">
          <span className="detail-data-text">
            {item.isActive ? <span>(운영)</span> : <span className="red">(미운영)</span>}
            {' '}{item.optionName}
          </span>
        </li>
        <li className="detail-data-item">
          <span className="detail-data-text">+{item.additionalPrice}원</span>
        </li>
        {/* ... */}
      </ul>
    ))}
  </div>
</div>
```

**옵션 SET이 없는 경우**: 옵션구성 섹션 전체를 렌더링하지 않음.

---

## API

### 메뉴 상세 조회

| 항목 | 값 |
|------|------|
| 메서드 | `GET` |
| 엔드포인트 | `/api/master/menu/master/{id}` |
| 응답 | `ApiResponse<MenuDetailResponse>` |
| 쿼리 키 | `masterMenuKeys.detail(id)` (이미 정의됨) |

### 메뉴 삭제

| 항목 | 값 |
|------|------|
| 메서드 | `DELETE` |
| 엔드포인트 | `/api/master/menu/master/{id}` |
| 응답 | `ApiResponse<void>` |
| 성공 시 | `masterMenuKeys.lists()` 캐시 무효화 → 목록으로 이동 |

---

## 타입/스키마 추가

### MenuDetailResponse (상세 응답 — 기존 MenuResponse 확장)

기존 `MenuResponse`는 목록용으로 `optionSets: { id, optionSetName }[]`만 포함한다.
상세 조회 API는 옵션 항목까지 포함하는 상세 응답을 반환하므로 별도 스키마가 필요하다.

```typescript
// 옵션 항목 상세 응답 스키마
export const menuOptionItemDetailSchema = z.object({
  id: z.number(),
  optionName: z.string(),
  additionalPrice: z.number(),
  isQuantity: z.boolean(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.number().nullable(),
})

// 옵션 SET 상세 응답 스키마
export const menuOptionSetDetailSchema = z.object({
  id: z.number(),
  optionSetName: z.string(),
  isRequired: z.boolean(),
  isMultipleChoice: z.boolean(),
  displayOrder: z.number().nullable(),
  isActive: z.boolean(),
  optionItems: z.array(menuOptionItemDetailSchema),
})

// 메뉴 상세 응답 스키마 (MenuResponse 확장)
// — 기존 menuResponseSchema 필드 + optionSets를 상세 버전으로 교체
export const menuDetailResponseSchema = menuResponseSchema.extend({
  isActive: z.boolean().optional(),  // 상세 API에서 추가로 내려올 수 있는 필드
  optionSets: z.array(menuOptionSetDetailSchema).nullable(),
})

// 타입 추출
export type MenuOptionItemDetail = z.infer<typeof menuOptionItemDetailSchema>
export type MenuOptionSetDetail = z.infer<typeof menuOptionSetDetailSchema>
export type MenuDetailResponse = z.infer<typeof menuDetailResponseSchema>
```

> **참고**: 실제 API 응답 구조에 따라 스키마 조정 필요. 위는 예상 구조.

---

## 공통코드 변환

상세 조회에서 코드값을 사람이 읽을 수 있는 이름으로 변환해야 한다.

| 필드 | 공통코드 | 변환 방식 |
|------|----------|-----------|
| `menuProperty` | `MNPRP` | `useCommonCodeHierarchy('MNPRP')` → `Map<code, name>` |
| `menuType` | `MNTYP` | `useCommonCodeHierarchy('MNTYP')` → `Map<code, name>` |
| `menuClassificationCode` | `MNCF` | `useCommonCodeHierarchy('MNCF')` → `Map<code, name>` |
| `marketingTags[]` | `MKCF` | `useCommonCodeHierarchy('MKCF')` → 각 tag code를 name으로 변환 |
| `temperatureTags[]` | `TMPCF` | `useCommonCodeHierarchy('TMPCF')` → 각 tag code를 name으로 변환 |

**코드→이름 변환 헬퍼** (MenuList 기존 패턴 참조):
```typescript
const codeMap = new Map(codes.map((c) => [c.code, c.name]))
const displayName = codeMap.get(codeValue) ?? codeValue
```

---

## 파일 구조

### 새로 생성할 파일

| # | 파일 경로 | 역할 | 상태 |
|---|-----------|------|------|
| 1 | `src/app/(sub)/master/menu/[id]/page.tsx` | 상세 조회 라우트 진입점 | |
| 2 | `src/components/master/menu/MenuDetail.tsx` | 상세 조회 컴포넌트 (핵심) | |

### 수정할 파일

| # | 파일 경로 | 수정 내용 | 상태 |
|---|-----------|-----------|------|
| 3 | `src/lib/schemas/menu.ts` | `menuOptionItemDetailSchema`, `menuOptionSetDetailSchema`, `menuDetailResponseSchema` 추가 | |
| 4 | `src/hooks/queries/use-master-menu-queries.ts` | `useMasterMenuDetail(id)`, `useDeleteMenu()` 훅 추가 | |
| 5 | `src/components/master/menu/MenuList.tsx` | 카드 클릭 시 상세 페이지 이동 연결 | |

---

## 구현 순서

### Phase 1: 스키마 & API 훅 (기반)

1. `src/lib/schemas/menu.ts` — 상세 응답 스키마 추가
2. `src/hooks/queries/use-master-menu-queries.ts` — `useMasterMenuDetail`, `useDeleteMenu` 훅 추가

### Phase 2: 컴포넌트 구현

3. `src/components/master/menu/MenuDetail.tsx` — 상세 조회 컴포넌트 전체 구현
   - Slidebox 레이아웃 (AnimateHeight)
   - 메뉴 Header 정보관리 섹션
   - 카테고리 및 사용가능 가맹점 섹션
   - 옵션구성 섹션 (동적)
   - 공통코드 변환 (useCommonCodeHierarchy ×5)
   - 삭제 기능 (confirm + mutation)

### Phase 3: 라우팅 & 연결

4. `src/app/(sub)/master/menu/[id]/page.tsx` — 상세 조회 라우트
5. `src/components/master/menu/MenuList.tsx` — 카드 클릭 시 상세 페이지 이동

### Phase 4: 검증

6. `pnpm lint` + `pnpm build` 체크

---

## 쿼리 훅 설계

### useMasterMenuDetail

```typescript
export const useMasterMenuDetail = (id: number) => {
  return useQuery({
    queryKey: masterMenuKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<MenuDetailResponse>>(
        `/api/master/menu/master/${id}`
      )
      return response.data.data
    },
    enabled: !!id,
  })
}
```

### useDeleteMenu

```typescript
export const useDeleteMenu = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(
        `/api/master/menu/master/${id}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterMenuKeys.lists() })
    },
  })
}
```

---

## MenuDetail 컴포넌트 구조

```tsx
'use client'

export default function MenuDetail({ id }: { id: number }) {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const [slideboxOpen, setSlideboxOpen] = useState(true)
  const [optionSlideboxOpen, setOptionSlideboxOpen] = useState<Record<number, boolean>>({})

  // API
  const { data: menu, isPending } = useMasterMenuDetail(id)
  const { mutateAsync: deleteMenu } = useDeleteMenu()

  // 공통코드
  const { data: mnprpCodes } = useCommonCodeHierarchy('MNPRP')
  const { data: mntypCodes } = useCommonCodeHierarchy('MNTYP')
  const { data: mncfCodes } = useCommonCodeHierarchy('MNCF')
  const { data: mkcfCodes } = useCommonCodeHierarchy('MKCF')
  const { data: tmpcfCodes } = useCommonCodeHierarchy('TMPCF')

  // 코드→이름 변환 Map
  const mnprpMap = useMemo(...)
  const mntypMap = useMemo(...)
  // ...

  // 핸들러
  const handleEdit = () => router.push(`/master/menu/edit/${id}`)
  const handleDelete = async () => { ... }
  const handleList = () => router.push('/master/menu')

  // 다국어 필드 (null이 아닌 것만)
  const i18nFields = useMemo(() => {
    if (!menu) return []
    const fields = []
    if (menu.menuNameEng) fields.push({ label: '메뉴 영어', value: menu.menuNameEng })
    if (menu.menuNameChs) fields.push({ label: '메뉴 중국어', value: menu.menuNameChs })
    if (menu.menuNameJpn) fields.push({ label: '메뉴 일어', value: menu.menuNameJpn })
    return fields
  }, [menu])

  if (isPending) return <CubeLoader />
  if (!menu) return null

  return (
    <div className="master-detail-data">
      {/* 메인 slidebox */}
      {/* 옵션 SET slidebox ×N */}
    </div>
  )
}
```

---

## 라우트 페이지

### `src/app/(sub)/master/menu/[id]/page.tsx`

```tsx
import MenuDetail from '@/components/master/menu/MenuDetail'
import Location from '@/components/ui/Location'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MasterMenuDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="data-wrap">
      <Location
        title="마스터용 메뉴 관리"
        list={['홈', 'Master data 관리', '메뉴 정보 관리', '마스터용 메뉴 Master', '조회']}
      />
      <MenuDetail id={Number(id)} />
    </div>
  )
}
```

---

## MenuList 카드 클릭 연결

MenuList의 각 카드에 클릭 이벤트를 추가하여 상세 페이지로 이동:

```tsx
const handleCardClick = (menuId: number) => {
  router.push(`/master/menu/${menuId}`)
}
```

---

## 주요 재사용 컴포넌트/리소스

| 컴포넌트/훅 | 용도 |
|-------------|------|
| `AnimateHeight` | slidebox 열기/닫기 |
| `CubeLoader` | 로딩 상태 표시 |
| `useCommonCodeHierarchy` | 공통코드 변환 (MNPRP, MNTYP, MNCF, MKCF, TMPCF) |
| `useAlert` | confirm/alert 다이얼로그 |
| `getErrorMessage` | 에러 메시지 추출 |
| `next/image` | 이미지 표시 |
| `useRouter` | 페이지 이동 |

## 참고 사항

- pub/masterdetail의 CSS 클래스를 그대로 사용 (`master-detail-data`, `detail-data-table`, `detail-data-list`, `data-option-wrap` 등)
- 기존 CSS/Sass 파일 수정 금지 규칙 준수
- `masterMenuKeys.detail(id)` 쿼리 키는 이미 `query-keys.ts`에 정의되어 있음 (추가 불필요)
- 상세 API 응답의 실제 구조에 따라 스키마 조정 필요 (특히 옵션 SET 상세)
- 수정 페이지(`/master/menu/edit/{id}`)는 별도 계획으로 구현 예정
