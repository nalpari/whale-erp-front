# 가격 정보 등록 Validation 계획

## 목표
저장 버튼 클릭 시 필수 입력값 검증 및 에러 메시지 표시

## 현재 상태 분석

### 기존 상태
| 상태 | 용도 |
|------|------|
| `fromDate`, `toDate` | 기간 |
| `monthlyPrice` | 1개월 요금 |
| `showDateSuccess` | 중복 체크 성공 여부 |
| `enableSixMonth`, `enableTwelveMonth` | 6개월/12개월 활성화 |
| `sixMonthPrice`, `twelveMonthPrice` | 6개월/12개월 요금 |
| `sixMonthDiscountEnabled`, `twelveMonthDiscountEnabled` | 할인 활성화 |
| `sixMonthDiscountValue`, `twelveMonthDiscountValue` | 할인 값 |

### 누락된 상태
- `title`: 제목 (추가 필요)

## Validation 규칙

| 필드 | 조건 | 에러 메시지 |
|------|------|-------------|
| 제목 | 필수 | "제목을 입력해주세요." |
| 기간 시작일 | 필수 | "시작일을 선택해주세요." |
| 기간 종료일 | 필수 | "종료일을 선택해주세요." |
| 기간 중복 체크 | `showDateSuccess === true` | "기간 중복 확인을 해주세요." |
| 1개월 요금 | 필수 | "1개월 요금을 입력해주세요." |
| 6개월 요금 | `enableSixMonth && !sixMonthPrice` | "6개월 요금을 입력해주세요." |
| 6개월 할인 값 | `enableSixMonth && sixMonthDiscountEnabled && !sixMonthDiscountValue` | "6개월 할인 값을 입력해주세요." |
| 12개월 요금 | `enableTwelveMonth && !twelveMonthPrice` | "12개월 요금을 입력해주세요." |
| 12개월 할인 값 | `enableTwelveMonth && twelveMonthDiscountEnabled && !twelveMonthDiscountValue` | "12개월 할인 값을 입력해주세요." |

## 구현 계획

### 1단계: 제목 상태 추가

```typescript
const [title, setTitle] = useState('')
```

### 2단계: 에러 상태 추가

```typescript
interface ValidationErrors {
    title?: string
    fromDate?: string
    toDate?: string
    dateCheck?: string
    monthlyPrice?: string
    sixMonthPrice?: string
    sixMonthDiscount?: string
    twelveMonthPrice?: string
    twelveMonthDiscount?: string
}

const [errors, setErrors] = useState<ValidationErrors>({})
```

### 3단계: Validation 함수 구현

```typescript
const validate = (): boolean => {
    const newErrors: ValidationErrors = {}

    // 제목 검증
    if (!title.trim()) {
        newErrors.title = '제목을 입력해주세요.'
    }

    // 기간 검증
    if (!fromDate) {
        newErrors.fromDate = '시작일을 선택해주세요.'
    }
    if (!toDate) {
        newErrors.toDate = '종료일을 선택해주세요.'
    }

    // 기간 중복 체크 검증
    if (fromDate && toDate && !showDateSuccess) {
        newErrors.dateCheck = '기간 중복 확인을 해주세요.'
    }

    // 1개월 요금 검증
    if (monthlyPrice === undefined) {
        newErrors.monthlyPrice = '1개월 요금을 입력해주세요.'
    }

    // 6개월 요금 검증
    if (enableSixMonth) {
        if (sixMonthPrice === undefined) {
            newErrors.sixMonthPrice = '6개월 요금을 입력해주세요.'
        }
        if (sixMonthDiscountEnabled && sixMonthDiscountValue === undefined) {
            newErrors.sixMonthDiscount = '6개월 할인 값을 입력해주세요.'
        }
    }

    // 12개월 요금 검증
    if (enableTwelveMonth) {
        if (twelveMonthPrice === undefined) {
            newErrors.twelveMonthPrice = '12개월 요금을 입력해주세요.'
        }
        if (twelveMonthDiscountEnabled && twelveMonthDiscountValue === undefined) {
            newErrors.twelveMonthDiscount = '12개월 할인 값을 입력해주세요.'
        }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
}
```

### 4단계: handleSave 수정

```typescript
const handleSave = () => {
    if (!validate()) {
        return
    }

    // TODO: mutation 호출
    router.push(`/subscription/${planId}`)
}
```

### 5단계: UI에 에러 메시지 표시

각 필드 아래에 에러 메시지 표시:

```tsx
{/* 제목 필드 */}
<input
    type="text"
    className={`input-frame ${errors.title ? 'error' : ''}`}
    value={title}
    onChange={(e) => setTitle(e.target.value)}
/>
{errors.title && (
    <span className="form-helper error">{errors.title}</span>
)}
```

### 6단계: 입력 시 해당 에러 초기화

```typescript
// 제목 입력 시
onChange={(e) => {
    setTitle(e.target.value)
    if (errors.title) {
        setErrors(prev => ({ ...prev, title: undefined }))
    }
}}
```

## 파일 수정 목록

| 파일 | 작업 |
|------|------|
| `PlanPricingCreate.tsx` | 상태 추가, validate 함수 구현, handleSave 수정, UI 에러 표시 |

## UI 에러 표시 위치

```
기본 정보 섹션
├── 제목 * → 에러: errors.title
├── 기간 * → 에러: errors.fromDate, errors.toDate, errors.dateCheck
└── 1개월 요금 * → 에러: errors.monthlyPrice

6개월 요금 섹션 (enableSixMonth일 때)
├── 6개월 요금 * → 에러: errors.sixMonthPrice
└── 요금할인 * → 에러: errors.sixMonthDiscount

12개월 요금 섹션 (enableTwelveMonth일 때)
├── 12개월 요금 * → 에러: errors.twelveMonthPrice
└── 요금할인 * → 에러: errors.twelveMonthDiscount
```

## 추가 고려사항

1. **기간 변경 시 중복 체크 초기화**: 날짜가 변경되면 `showDateSuccess`를 `false`로 초기화하여 다시 중복 체크를 강제해야 함 (이미 구현됨)

2. **에러 스타일**: 기존 `.form-helper.error` 클래스 사용

3. **스크롤**: 에러 발생 시 첫 번째 에러 필드로 스크롤 (선택적 구현)
