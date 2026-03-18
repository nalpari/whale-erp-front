# 사업자등록증 OCR 기능 가이드

## 개요

사업자등록증 이미지(JPG, PNG, WebP) 또는 PDF를 업로드하면 Claude Vision API를 통해 내용을 자동 인식하고, 추출된 데이터를 폼 필드에 자동 채움하는 기능입니다.

## 아키텍처

```
[브라우저]
  사업자등록증 파일 선택 (드래그앤드롭 / 클릭)
    ↓ FormData (multipart/form-data)
[Next.js API Route]  /api/ocr/business-license
  파일 검증 → base64 변환 → Claude Vision API 호출
    ↓ JSON 응답
[브라우저]
  OCR 결과를 폼 필드에 자동 채움
```

### 왜 Next.js API Route를 사용하나?

- Claude API Key(`ANTHROPIC_API_KEY`)는 서버에서만 사용해야 합니다
- `NEXT_PUBLIC_` 접두사가 없는 환경 변수는 클라이언트에 노출되지 않습니다
- API Route는 서버에서 실행되므로 API Key가 안전하게 보호됩니다

## 파일 구조

```
whale-erp-front/src/
├── app/api/ocr/business-license/
│   └── route.ts              ← API Route (Claude Vision API 호출)
├── lib/schemas/
│   └── ocr.ts                ← Zod 스키마 + 타입 정의
└── hooks/queries/
    └── use-ocr-queries.ts    ← TanStack Query mutation 훅
```

## 각 파일 설명

### 1. Zod 스키마 (`src/lib/schemas/ocr.ts`)

OCR 결과의 타입 정의와 런타임 유효성 검증을 담당합니다.

```typescript
// 스키마 정의
export const businessLicenseOcrResultSchema = z.object({
  businessRegistrationNumber: z.string(),  // 사업자등록번호 (10자리 숫자)
  companyName: z.string(),                 // 상호(법인명)
  representativeName: z.string(),          // 대표자
  address1: z.string(),                    // 사업장 소재지
  address2: z.string().nullable(),         // 상세주소
  businessType: z.string().nullable(),     // 업태
  businessItem: z.string().nullable(),     // 종목
  openDate: z.string().nullable(),         // 개업연월일 (YYYY-MM-DD)
  corporateRegistrationNumber: z.string().nullable(), // 법인등록번호
  confidence: z.number().min(0).max(1),    // AI 신뢰도 (0~1)
})

// 타입은 스키마에서 추론 (별도 interface 작성 불필요)
export type BusinessLicenseOcrResult = z.infer<typeof businessLicenseOcrResultSchema>
```

> **주의**: `types/` 폴더에 별도 interface를 만들지 않습니다. Zod 스키마에서 `z.infer<>`로 타입을 추론하는 것이 프로젝트 컨벤션입니다.

### 2. API Route (`src/app/api/ocr/business-license/route.ts`)

서버에서 실행되는 엔드포인트입니다. 주요 흐름:

1. **파일 검증**: 크기(10MB), 타입(JPG/PNG/WebP/PDF) 확인
2. **base64 변환**: 파일을 base64 문자열로 인코딩
3. **Claude API 호출**: Vision 기능으로 이미지/PDF에서 텍스트 추출
4. **Zod 검증**: AI 응답을 스키마로 검증 후 반환

```typescript
// Anthropic 클라이언트는 모듈 스코프에서 한 번만 생성
const client = new Anthropic()

// AI 응답을 Zod로 검증하여 타입 안전성 확보
const parsed = JSON.parse(jsonStr)
const validated = businessLicenseOcrResultSchema.parse(parsed)
```

#### 이미지 vs PDF 처리

```typescript
// PDF는 'document' 타입, 이미지는 'image' 타입으로 전송
const fileContent = isPdf
  ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
  : { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } }
```

#### System Prompt

프롬프트에서 JSON 형식을 강제하고, 각 필드의 규칙(하이픈 제거, null 처리 등)을 명시합니다. 프롬프트를 수정하면 OCR 결과의 품질이 달라질 수 있으니 주의하세요.

### 3. TanStack Query 훅 (`src/hooks/queries/use-ocr-queries.ts`)

```typescript
export const useBusinessLicenseOcr = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<BusinessLicenseOcrResponse> => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/ocr/business-license', { method: 'POST', body: formData })
      // ...
    },
  })
}
```

> **참고**: 이 훅은 `fetch()`를 사용합니다 (`api` Axios 인스턴스가 아님). Next.js 내부 API Route 호출이므로 백엔드 인증 헤더(Bearer 토큰, affiliation)가 불필요하기 때문입니다.

## 다른 화면에서 사용하는 방법

### 기본 패턴: 파일 업로드 시 자동 OCR

```typescript
import { useBusinessLicenseOcr } from '@/hooks/queries/use-ocr-queries'

// 컴포넌트 내부
const { mutate: ocrMutate } = useBusinessLicenseOcr()

const handleFileAdd = (files: File[]) => {
  if (files.length === 0) return

  // 1. 파일 저장 (기존 로직)
  onFilesSelect(files)

  // 2. OCR 실행
  const file = files[0]
  const isOcrTarget = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)
  if (isOcrTarget) {
    ocrMutate(file, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          // 3. 원하는 필드만 골라서 폼에 채움
          const { representativeName, businessRegistrationNumber, address1 } = response.data
          if (representativeName) onCeoNameChange(representativeName)
          if (businessRegistrationNumber) onBusinessNumberChange(businessRegistrationNumber)
          // ... 필요한 필드 매핑
        }
      },
    })
  }
}
```

### 적용 예시: StoreDetailBasicInfo

점포 상세 화면에서 사업자등록증 FileUpload에 연동된 예시:

- `StoreDetailBasicInfo.tsx`의 `handleBusinessFileAdd` 함수 참고
- 드래그앤드롭 또는 클릭으로 파일 추가 시 자동 OCR 실행
- 대표자, 사업자등록번호, 주소(쉼표 기준 분리)를 폼에 채움

### 주소 처리

OCR에서 추출된 주소(`address1`)를 쉼표(`,`)로 분리하여 기본 주소와 상세 주소로 나눕니다:

```typescript
if (address1) {
  const commaIndex = address1.indexOf(',')
  if (commaIndex !== -1) {
    onAddressChange({
      address: address1.slice(0, commaIndex).trim(),       // 기본 주소
      addressDetail: address1.slice(commaIndex + 1).trim(), // 상세 주소
    })
  } else {
    onAddressChange({ address: address1, addressDetail: '' })
  }
}
```

## OCR 결과 필드 매핑 참고표

| OCR 결과 필드 | 설명 | 매핑 예시 |
|---------------|------|-----------|
| `businessRegistrationNumber` | 사업자등록번호 (10자리 숫자) | 사업자등록번호 입력 필드 |
| `companyName` | 상호(법인명) | 업체명 / 점포명 |
| `representativeName` | 대표자 | 대표자 입력 필드 |
| `address1` | 사업장 소재지 | 주소 필드 (쉼표로 분리) |
| `address2` | 상세주소 | 상세주소 필드 |
| `businessType` | 업태 | 참고용 (현재 미사용) |
| `businessItem` | 종목 | 참고용 (현재 미사용) |
| `openDate` | 개업연월일 (YYYY-MM-DD) | 참고용 (현재 미사용) |
| `corporateRegistrationNumber` | 법인등록번호 | 참고용 (현재 미사용) |
| `confidence` | AI 신뢰도 (0~1) | 로깅/디버깅용 |

## 환경 변수 설정

```env
# .env.local (whale-erp-front 루트)
ANTHROPIC_API_KEY=sk-ant-...
```

- `NEXT_PUBLIC_` 접두사 **없이** 설정 (서버 전용)
- `.env.local`은 gitignore 대상이므로 각 개발자가 직접 설정 필요

## 주의사항

1. **API 비용**: Claude API는 요청당 과금됩니다. 불필요한 재요청을 피하세요
2. **파일 크기**: 최대 10MB. 큰 이미지는 서버 메모리를 소모합니다
3. **자동 채움이지 자동 저장이 아님**: OCR 결과는 폼 필드에만 채워지고, 사용자가 확인 후 저장 버튼을 눌러야 합니다
4. **GlobalMutationSpinner**: `useMutation` 사용 시 글로벌 로딩 스피너가 자동 표시됩니다. 별도 로딩 처리 불필요
5. **console.log**: 현재 개발 단계에서 OCR 결과를 콘솔에 출력 중입니다. 배포 전 제거 필요
