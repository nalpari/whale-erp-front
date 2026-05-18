# 요금 추가 팝업 구현 계획

## 목표
"요금 추가" 버튼 클릭 시 6개월/12개월 요금 항목을 선택할 수 있는 팝업을 표시하고, 선택에 따라 해당 섹션을 표시/숨김 처리

## 요구사항

1. **팝업 표시**: "요금 추가" 버튼 클릭 시 팝업 오픈
2. **체크박스**: 6개월, 12개월 체크박스 제공
3. **추가 버튼**: 클릭 시 팝업 닫힘, 체크된 항목만 표시
4. **데이터 초기화**: 체크 해제된 항목의 입력값 초기화

## 현재 구조 분석

- 기존 스타일: `src/styles/layout/_pop-common.scss`에 `.modal-popup` 클래스 정의됨
- 6개월/12개월 섹션이 이미 UI로 구현되어 있음 (187-314줄)
- 현재는 항상 표시되는 상태

## 구현 계획

### 1단계: 상태 추가

```typescript
// 팝업 표시 상태
const [showAddPricePopup, setShowAddPricePopup] = useState(false)

// 각 요금제 활성화 상태
const [enableSixMonth, setEnableSixMonth] = useState(false)
const [enableTwelveMonth, setEnableTwelveMonth] = useState(false)

// 팝업 내 임시 체크 상태 (추가 버튼 누르기 전)
const [tempSixMonth, setTempSixMonth] = useState(false)
const [tempTwelveMonth, setTempTwelveMonth] = useState(false)

// 6개월 요금 관련 상태
const [sixMonthPrice, setSixMonthPrice] = useState<number | undefined>(undefined)
const [sixMonthDiscountType, setSixMonthDiscountType] = useState<'rate' | 'amount'>('rate')
const [sixMonthDiscountValue, setSixMonthDiscountValue] = useState<number | undefined>(undefined)
const [sixMonthDiscountEnabled, setSixMonthDiscountEnabled] = useState(false)

// 12개월 요금 관련 상태
const [twelveMonthPrice, setTwelveMonthPrice] = useState<number | undefined>(undefined)
const [twelveMonthDiscountType, setTwelveMonthDiscountType] = useState<'rate' | 'amount'>('rate')
const [twelveMonthDiscountValue, setTwelveMonthDiscountValue] = useState<number | undefined>(undefined)
const [twelveMonthDiscountEnabled, setTwelveMonthDiscountEnabled] = useState(false)
```

### 2단계: 팝업 열기/닫기 핸들러

```typescript
// 팝업 열기
const handleOpenAddPricePopup = () => {
    // 현재 상태를 임시 상태에 복사
    setTempSixMonth(enableSixMonth)
    setTempTwelveMonth(enableTwelveMonth)
    setShowAddPricePopup(true)
}

// 팝업 닫기 (취소)
const handleCloseAddPricePopup = () => {
    setShowAddPricePopup(false)
}

// 팝업 확인 (추가)
const handleConfirmAddPrice = () => {
    // 6개월이 비활성화되면 데이터 초기화
    if (enableSixMonth && !tempSixMonth) {
        setSixMonthPrice(undefined)
        setSixMonthDiscountType('rate')
        setSixMonthDiscountValue(undefined)
        setSixMonthDiscountEnabled(false)
    }

    // 12개월이 비활성화되면 데이터 초기화
    if (enableTwelveMonth && !tempTwelveMonth) {
        setTwelveMonthPrice(undefined)
        setTwelveMonthDiscountType('rate')
        setTwelveMonthDiscountValue(undefined)
        setTwelveMonthDiscountEnabled(false)
    }

    // 상태 적용
    setEnableSixMonth(tempSixMonth)
    setEnableTwelveMonth(tempTwelveMonth)
    setShowAddPricePopup(false)
}
```

### 3단계: 팝업 UI 컴포넌트

```tsx
{showAddPricePopup && (
    <div className="modal-popup">
        <div className="modal-dialog small">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>요금 추가</h2>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={handleCloseAddPricePopup}
                    />
                </div>
                <div className="modal-body">
                    <div className="flex flex-col gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={tempSixMonth}
                                onChange={(e) => setTempSixMonth(e.target.checked)}
                            />
                            <span>6개월 요금</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={tempTwelveMonth}
                                onChange={(e) => setTempTwelveMonth(e.target.checked)}
                            />
                            <span>12개월 요금</span>
                        </label>
                    </div>
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-form"
                        onClick={handleCloseAddPricePopup}
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        className="btn-form basic"
                        onClick={handleConfirmAddPrice}
                    >
                        추가
                    </button>
                </div>
            </div>
        </div>
    </div>
)}
```

### 4단계: 섹션 조건부 렌더링

```tsx
{/* 6개월 요금 섹션 */}
{enableSixMonth && (
    <div className='content-wrap'>
        {/* 기존 6개월 요금 테이블 */}
    </div>
)}

{/* 12개월 요금 섹션 */}
{enableTwelveMonth && (
    <div className='content-wrap'>
        {/* 기존 12개월 요금 테이블 */}
    </div>
)}
```

### 5단계: "요금 추가" 버튼 연결

```tsx
<button
    type="button"
    className="btn-form basic"
    onClick={handleOpenAddPricePopup}
>
    요금 추가
</button>
```

## 파일 수정 목록

| 파일 | 작업 |
|------|------|
| `src/components/subscription/detail/PlanPricingCreate.tsx` | 상태, 핸들러, 팝업 UI, 조건부 렌더링 추가 |

## UI 흐름

```
[요금 추가 버튼 클릭]
        ↓
[팝업 표시]
  ☐ 6개월 요금
  ☐ 12개월 요금
  [취소] [추가]
        ↓
[추가 버튼 클릭]
        ↓
[팝업 닫힘]
        ↓
[체크된 항목만 화면에 표시]
[체크 해제된 항목의 데이터 초기화]
```

## 참고사항

- 기존 `.modal-popup` 스타일 재사용
- `.modal-dialog.small` 클래스로 작은 팝업 사용 (max-width: 352px)
- 체크박스 스타일은 기존 프로젝트 스타일 또는 Tailwind 사용
- 6개월/12개월 입력 필드 상태를 분리하여 독립적으로 관리
