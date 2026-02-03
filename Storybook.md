# Storybook - 공통 컴포넌트 샘플 페이지

whale-erp-front 프로젝트의 공통 컴포넌트 예제 페이지 목록입니다.

> 기본 경로: `/storybook/`

---

## 라우트 목록

| 라우트 | 컴포넌트 | 설명 |
|--------|----------|------|
| `/storybook/input` | Input | 텍스트 입력 컴포넌트 |
| `/storybook/postcode` | AddressSearch | 우편번호/주소 검색 컴포넌트 |
| `/storybook/upload` | FileUpload | 파일 업로드 컴포넌트 |
| `/storybook/image-upload` | ImageUpload | 이미지 업로드 컴포넌트 |
| `/storybook/datepicker` | DatePicker, RangeDatePicker | 날짜 선택 컴포넌트 |

---

## 상세 내용

### 1. Input (`/storybook/input`)

**경로**: `src/app/(sub)/storybook/input/page.tsx`

**Import**: `import { Input } from '@/components/common/ui'`

**샘플 목록**:
- 기본 Input
- 라벨 + 필수 입력 (`label`, `required`)
- 에러 상태 + 에러 메시지 (`error`, `helpText`)
- Clear 버튼 (`showClear`, `onClear`)
- 설명 텍스트 (`explain`)
- 읽기 전용 (`readOnly`)
- 비활성화 (`disabled`)
- 도움말 텍스트 (`helpText`)
- 전체 너비 (`fullWidth`)
- 좌측/우측 버튼 조합 (`startAdornment`, `endAdornment`)

**주요 Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `label` | string | 라벨 텍스트 |
| `required` | boolean | 필수 입력 여부 |
| `error` | boolean | 에러 상태 |
| `helpText` | string | 에러/도움말 메시지 |
| `explain` | string | 입력 필드 옆 보조 텍스트 |
| `showClear` | boolean | Clear 버튼 표시 |
| `onClear` | () => void | Clear 버튼 클릭 핸들러 |
| `startAdornment` | ReactNode | 입력 필드 좌측 요소 |
| `endAdornment` | ReactNode | 입력 필드 우측 요소 |
| `fullWidth` | boolean | 전체 너비 사용 |

---

### 2. AddressSearch (`/storybook/postcode`)

**경로**: `src/app/(sub)/storybook/postcode/page.tsx`

**Import**: `import { AddressSearch, type AddressData } from '@/components/common/ui'`

**샘플 목록**:
- 기본 주소 검색
- 필수 입력 + 에러 상태 (`label`, `required`, `error`, `helpText`)
- 값이 있는 상태
- 비활성화 (`disabled`)
- Placeholder 커스텀 (`addressPlaceholder`, `detailPlaceholder`)

**주요 Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `value` | AddressData | 현재 주소 데이터 |
| `onChange` | (data: AddressData) => void | 주소 변경 핸들러 |
| `label` | string | 라벨 텍스트 |
| `required` | boolean | 필수 입력 여부 |
| `error` | boolean | 에러 상태 |
| `helpText` | string | 에러/도움말 메시지 |
| `disabled` | boolean | 비활성화 여부 |
| `addressPlaceholder` | string | 기본 주소 placeholder |
| `detailPlaceholder` | string | 상세 주소 placeholder |

**AddressData 타입**:
```typescript
interface AddressData {
  address: string           // 기본 주소
  addressDetail: string     // 상세 주소
  zonecode?: string         // 우편번호
  buildingName?: string     // 건물명
  roadAddress?: string      // 도로명 주소
  jibunAddress?: string     // 지번 주소
}
```

---

### 3. FileUpload (`/storybook/upload`)

**경로**: `src/app/(sub)/storybook/upload/page.tsx`

**Import**: `import { FileUpload, type FileItem } from '@/components/common/ui'`

**샘플 목록**:
- 단일 파일 업로드
- 다중 파일 업로드 (`multiple`)
- 필수 입력 + 에러 상태 (`label`, `required`, `error`, `helpText`)
- 값이 있는 상태
- 비활성화 (`disabled`)
- 파일 타입 제한 (`accept`)
- 커스텀 안내 문구 (`guideText`)

**주요 Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `files` | FileItem[] | 현재 파일 목록 |
| `onAdd` | (files: File[]) => void | 파일 추가 핸들러 |
| `onRemove` | (index: number) => void | 파일 삭제 핸들러 |
| `onFileClick` | (file, index) => void | 파일 클릭 핸들러 |
| `label` | string | 라벨 텍스트 |
| `required` | boolean | 필수 입력 여부 |
| `error` | boolean | 에러 상태 |
| `helpText` | string | 에러/도움말 메시지 |
| `multiple` | boolean | 다중 파일 허용 |
| `disabled` | boolean | 비활성화 여부 |
| `accept` | string | 허용 파일 타입 (예: `.pdf`) |
| `guideText` | string | 안내 문구 |

**FileItem 타입**:
```typescript
interface FileItem {
  id?: string | number    // 파일 고유 ID (기존 파일용)
  name: string            // 파일명
  file?: File             // 파일 객체 (새 파일)
  type?: string           // MIME 타입
  size?: number           // 파일 크기 (bytes)
}
```

---

### 4. ImageUpload (`/storybook/image-upload`)

**경로**: `src/app/(sub)/storybook/image-upload/page.tsx`

**Import**: `import { ImageUpload, type ImageItem } from '@/components/common/ui'`

**샘플 목록**:
- 단일 이미지 업로드
- 다중 이미지 업로드 (`multiple`)
- 순서 변경 가능 (드래그&드랍, `onReorder`)
- 필수 입력 + 에러 상태 (`label`, `required`, `error`, `helpText`)
- 값이 있는 상태
- 비활성화 (`disabled`)
- 커스텀 안내 문구 (`guideText`)

**주요 Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `images` | ImageItem[] | 현재 이미지 목록 |
| `onAdd` | (files: File[]) => void | 이미지 추가 핸들러 |
| `onRemove` | (index: number) => void | 이미지 삭제 핸들러 |
| `onReorder` | (newOrder: ImageItem[]) => void | 순서 변경 핸들러 |
| `onImageClick` | (image, index) => void | 이미지 클릭 핸들러 |
| `label` | string | 라벨 텍스트 |
| `required` | boolean | 필수 입력 여부 |
| `error` | boolean | 에러 상태 |
| `helpText` | string | 에러/도움말 메시지 |
| `multiple` | boolean | 다중 이미지 허용 |
| `disabled` | boolean | 비활성화 여부 |
| `accept` | string | 허용 이미지 타입 (기본: `image/*`) |
| `guideText` | string | 안내 문구 |

**ImageItem 타입**:
```typescript
interface ImageItem {
  id?: string | number    // 이미지 고유 ID (드래그&드랍에 필요)
  name: string            // 파일명
  file?: File             // 파일 객체 (새 이미지)
  url?: string            // 이미지 URL (미리보기용)
  type?: string           // MIME 타입
  size?: number           // 파일 크기 (bytes)
}
```

---

### 5. DatePicker & RangeDatePicker (`/storybook/datepicker`)

**경로**: `src/app/(sub)/storybook/datepicker/page.tsx`

**Import**:
```typescript
import DatePicker from '@/components/ui/common/DatePicker'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
```

#### DatePicker (단일 날짜 선택)

**샘플 목록**:
- 기본 사용법
- 값이 있는 상태
- 비활성화

**주요 Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `value` | Date \| null | 선택된 날짜 |
| `onChange` | (date: Date \| null) => void | 날짜 변경 핸들러 |
| `placeholder` | string | placeholder 텍스트 |

#### RangeDatePicker (날짜 범위 선택)

**샘플 목록**:
- 기본 사용법
- 값이 있는 상태
- 날짜 제한 (`minDate`, `maxDate`)
- 커스텀 placeholder
- 비활성화 (`disabled`)

**주요 Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `startDate` | Date \| null | 시작일 |
| `endDate` | Date \| null | 종료일 |
| `onChange` | (range: DateRange) => void | 날짜 범위 변경 핸들러 |
| `startDatePlaceholder` | string | 시작일 placeholder |
| `endDatePlaceholder` | string | 종료일 placeholder |
| `disabled` | boolean | 비활성화 여부 |
| `minDate` | Date | 최소 선택 가능 날짜 |
| `maxDate` | Date | 최대 선택 가능 날짜 |
| `dateFormat` | string | 날짜 형식 (기본: `yyyy-MM-dd`) |

**DateRange 타입**:
```typescript
interface DateRange {
  startDate: Date | null
  endDate: Date | null
}
```

---

## 파일 구조

```
src/app/(sub)/storybook/
├── input/
│   └── page.tsx          # Input 컴포넌트 예제
├── postcode/
│   └── page.tsx          # AddressSearch 컴포넌트 예제
├── upload/
│   └── page.tsx          # FileUpload 컴포넌트 예제
├── image-upload/
│   └── page.tsx          # ImageUpload 컴포넌트 예제
└── datepicker/
    └── page.tsx          # DatePicker, RangeDatePicker 예제
```
