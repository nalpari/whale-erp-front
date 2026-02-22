# React Compiler eslint-disable 해소 가이드

## 개요

이 프로젝트는 `reactCompiler: true` (next.config.ts)로 React Compiler를 활성화하고 있다.
`eslint-plugin-react-hooks` v7.0.1에서 추가된 Compiler 전용 린트 규칙을 준수해야 하며,
현재 `eslint-disable`로 무시 중인 **9곳**을 해소해야 한다.

### 왜 해소해야 하는가?

- React Compiler는 렌더링 결과를 자동 메모이제이션한다.
- `useEffect` 안에서 `setState`를 호출하면 불필요한 이중 렌더링이 발생하고, Compiler의 최적화와 충돌할 수 있다.
- `eslint-disable`은 "이 코드는 Compiler가 보장하는 범위 밖"이라는 뜻이므로, 프로덕션에서 예측 불가능한 동작이 발생할 수 있다.

---

## set-state-in-effect 해소 대상 (7곳)

### 1. ProgramFormModal.tsx:81

**현재 코드:**
```tsx
const [formData, setFormData] = useState<ProgramFormData>(initialData)

useEffect(() => {
  if (mode === 'create' && !parentMenuKind && menuKindCodes.length > 0 && !formData.menu_kind) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData((prev) => ({ ...prev, menu_kind: menuKindCodes[0].code }))
  }
}, [menuKindCodes, mode, parentMenuKind, formData.menu_kind])
```

**문제:** 생성 모드에서 menuKindCodes가 로드되면 첫 번째 값을 기본 선택하기 위해 useEffect → setState

**해결:** `initialData` 계산 시점에 기본값을 포함시키고, `key` prop으로 리마운트 보장
```tsx
// 부모에서 initialData에 기본값 포함
const initialData = {
  ...defaultFormData,
  menu_kind: parentMenuKind ?? menuKindCodes[0]?.code ?? '',
}

// key로 menuKindCodes 로드 완료 시 리마운트
<ProgramFormModal key={menuKindCodes.length > 0 ? 'ready' : 'loading'} initialData={initialData} />
```

---

### 2. SalaryCalculationPop.tsx:115

**현재 코드:**
```tsx
useEffect(() => {
  if (isOpen) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedContractType(contractClassification)
    // ... 10개 이상의 setState 호출
  }
}, [isOpen, contractClassification, initialData])
```

**문제:** 팝업이 열릴 때 props(contractClassification, initialData)를 10개 이상의 로컬 state에 동기화

**해결:** `key` prop으로 팝업 열릴 때마다 리마운트하여 `useState(초기값)` 활용
```tsx
// 부모에서
<SalaryCalculationPop
  key={isOpen ? `salary-${contractClassification}` : 'closed'}
  isOpen={isOpen}
  contractClassification={contractClassification}
  initialData={initialData}
/>

// SalaryCalculationPop 내부 — useEffect 제거, useState 초기값으로 직접 설정
const [selectedContractType] = useState(contractClassification)
const [hourlyWage, setHourlyWage] = useState(
  initialData?.hourlyWage ? formatNumber(initialData.hourlyWage) : ''
)
// ... 나머지 state도 동일하게 useState 초기값으로 이동
```

---

### 3. SalaryCalculationPop.tsx:251

**현재 코드:**
```tsx
useEffect(() => {
  if (minimumWageListData.length > 0) {
    const currentYearData = minimumWageListData.find(item => item.year === currentYear)
    const wageData = currentYearData || minimumWageListData[0]
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedYear(wageData.year)
    setMinimumWage(wageData.minimumWage)
  }
}, [minimumWageListData])
```

**문제:** 최저임금 쿼리 데이터 로드 시 selectedYear, minimumWage를 로컬 state에 동기화

**해결:** 파생 값으로 직접 계산 (state 제거)
```tsx
// state 대신 파생 값으로 계산
const defaultWageData = useMemo(() => {
  if (minimumWageListData.length === 0) return null
  return minimumWageListData.find(item => item.year === currentYear) || minimumWageListData[0]
}, [minimumWageListData, currentYear])

// selectedYear, minimumWage를 사용자가 변경할 필요가 있다면
// useState의 초기값을 함수로 지정하고, key로 쿼리 로드 시점을 리마운트
const [selectedYear, setSelectedYear] = useState(() => defaultWageData?.year ?? currentYear)
const [minimumWage, setMinimumWage] = useState(() => defaultWageData?.minimumWage ?? 0)
```

---

### 4. LaborContractSettings.tsx:229

**현재 코드:**
```tsx
const [fulltimeSettings, setFulltimeSettings] = useState(DEFAULT_FULLTIME_SETTINGS)
const [parttimeSettings, setParttimeSettings] = useState(DEFAULT_PARTTIME_SETTINGS)

useEffect(() => {
  if (settingsData?.codeMemoContent) {
    const { fulltime, parttime } = settingsData.codeMemoContent
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFulltimeSettings(fulltime || DEFAULT_FULLTIME_SETTINGS)
    setParttimeSettings(parttime || DEFAULT_PARTTIME_SETTINGS)
  } else {
    setFulltimeSettings(DEFAULT_FULLTIME_SETTINGS)
    setParttimeSettings(DEFAULT_PARTTIME_SETTINGS)
  }
}, [settingsData])
```

**문제:** 쿼리 데이터(settingsData)가 로드되면 로컬 폼 state에 동기화

**해결:** 쿼리 데이터에서 파생 초기값 계산 + 사용자 수정 여부를 분리
```tsx
// 서버 데이터 기반 초기값 계산 (파생 값)
const serverFulltime = settingsData?.codeMemoContent?.fulltime ?? DEFAULT_FULLTIME_SETTINGS
const serverParttime = settingsData?.codeMemoContent?.parttime ?? DEFAULT_PARTTIME_SETTINGS

// 사용자가 수정하는 로컬 state — key로 서버 데이터 변경 시 리마운트
// 부모에서:
<LaborContractSettings key={settingsData?.id ?? 'new'} initialData={settingsData} />

// 컴포넌트 내부:
const [fulltimeSettings, setFulltimeSettings] = useState(
  initialData?.codeMemoContent?.fulltime ?? DEFAULT_FULLTIME_SETTINGS
)
const [parttimeSettings, setParttimeSettings] = useState(
  initialData?.codeMemoContent?.parttime ?? DEFAULT_PARTTIME_SETTINGS
)
// useEffect 제거
```

---

### 5. EmployeeInfoSettings.tsx:283

**현재 코드:**
```tsx
useEffect(() => {
  if (settingsData?.codeMemoContent) {
    const { EMPLOYEE, RANK, POSITION } = settingsData.codeMemoContent
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClassifications({
      employee: apiToUiClassifications(EMPLOYEE || []),
      rank: apiToUiClassifications(RANK || []),
      position: apiToUiClassifications(POSITION || []),
    })
  }
}, [settingsData, isLoading])
```

**문제:** LaborContractSettings와 동일 패턴. 쿼리 데이터 → 로컬 폼 state 동기화

**해결:** LaborContractSettings와 동일. key prop 리마운트 + useState 초기값
```tsx
// 부모에서:
<EmployeeInfoSettings key={settingsData?.id ?? 'new'} initialData={settingsData} />

// 컴포넌트 내부:
const [classifications, setClassifications] = useState(() => {
  if (!initialData?.codeMemoContent) return { employee: [], rank: [], position: [] }
  const { EMPLOYEE, RANK, POSITION } = initialData.codeMemoContent
  return {
    employee: apiToUiClassifications(EMPLOYEE || []),
    rank: apiToUiClassifications(RANK || []),
    position: apiToUiClassifications(POSITION || []),
  }
})
// useEffect 제거
```

---

### 6. EmployContractEdit.tsx:183

**현재 코드:**
```tsx
useEffect(() => {
  if (contractDetail && !isCreateMode && headerId === null) {
    if (header?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHeaderId(header.id)
    }
    setFormData(prev => ({ ...prev, /* 대량의 필드 매핑 */ }))
  }
}, [contractDetail, isCreateMode])
```

**문제:** 계약 상세 데이터 로드 시 headerId와 formData를 동기화

**해결:** key prop으로 계약 상세 데이터 변경 시 리마운트
```tsx
// 부모에서:
<EmployContractEdit key={contractDetail?.id ?? 'new'} contractDetail={contractDetail} />

// 컴포넌트 내부 — useState 초기값에서 contractDetail 매핑
const [headerId, setHeaderId] = useState<number | null>(
  contractDetail?.employmentContractHeader?.id ?? null
)
const [formData, setFormData] = useState<FormData>(() => {
  if (!contractDetail) return defaultFormData
  return mapContractDetailToFormData(contractDetail)
})
// useEffect 제거
```

---

### 7. ImageUpload.tsx:219

**현재 코드:**
```tsx
const [imageUrls, setImageUrls] = useState<Record<string | number, string>>({})

useEffect(() => {
  const urls: Record<string | number, string> = {}
  const newBlobUrls: string[] = []
  images.forEach((image, index) => {
    const key = image.id ?? `image-${index}`
    if (image.url) {
      urls[key] = image.url
    } else if (image.file) {
      const blobUrl = URL.createObjectURL(image.file)
      urls[key] = blobUrl
      newBlobUrls.push(blobUrl)
    }
  })
  setImageUrls(urls) // eslint-disable-line react-hooks/set-state-in-effect
  // cleanup 로직...
}, [images])
```

**문제:** images prop이 변경될 때 Blob URL을 생성하여 imageUrls state에 동기화. Blob URL 생성/해제가 side effect이므로 useEffect 자체는 적절하지만, setState가 문제

**해결:** `useMemo`로 URL 매핑을 파생 값으로 처리하고, Blob URL lifecycle만 useEffect에서 관리
```tsx
// Blob URL을 ref로 관리
const blobUrlMapRef = useRef<Map<string, string>>(new Map())

// 파생 값으로 imageUrls 계산
const imageUrls = useMemo(() => {
  const urls: Record<string | number, string> = {}
  const nextBlobMap = new Map<string, string>()

  images.forEach((image, index) => {
    const key = String(image.id ?? `image-${index}`)
    if (image.url) {
      urls[key] = image.url
    } else if (image.file) {
      // 기존 blob URL 재사용 또는 새로 생성
      const existing = blobUrlMapRef.current.get(key)
      const blobUrl = existing ?? URL.createObjectURL(image.file)
      urls[key] = blobUrl
      nextBlobMap.set(key, blobUrl)
    }
  })

  // 사용하지 않는 blob URL 해제
  blobUrlMapRef.current.forEach((url, key) => {
    if (!nextBlobMap.has(key)) URL.revokeObjectURL(url)
  })
  blobUrlMapRef.current = nextBlobMap

  return urls
}, [images])
// useState, useEffect 모두 제거
```

---

## exhaustive-deps 해소 대상 (2곳)

### 8. ProgramList.tsx:51

**현재 코드:**
```tsx
useEffect(() => {
  if (programs.length > 0) {
    expandAll()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedMenuKind, programs.length])
```

**문제:** `expandAll`이 매 렌더마다 새로 생성되어 의존성에 넣으면 무한루프

**해결:** `expandAll`을 `useCallback`으로 안정화
```tsx
// useProgram 훅 내부에서
const expandAll = useCallback(() => {
  // 기존 로직
}, [/* 필요한 의존성 */])

// ProgramList에서 의존성 정상 포함
useEffect(() => {
  if (programs.length > 0) {
    expandAll()
  }
}, [selectedMenuKind, programs.length, expandAll])
```

---

### 9. FullTimePayStub.tsx:329

**현재 코드:**
```tsx
useEffect(() => {
  async function loadCommonCodes() {
    const dptbsCodes = await getHierarchyChildren('DPTBS')
    setPaymentCommonCodes(dptbsCodes.filter(c => c.isActive))
    // ... 추가 로드
  }
  loadCommonCodes()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

**문제:** `getHierarchyChildren`이 의존성에 없지만 마운트 1회만 실행 의도

**해결:** `getHierarchyChildren`을 의존성에 포함하고 참조를 안정화
```tsx
// useCommonCodeCache 훅에서 getHierarchyChildren을 useCallback으로 안정화
const getHierarchyChildren = useCallback(async (code: string) => {
  // 기존 로직
}, [queryClient])

// FullTimePayStub에서 의존성 정상 포함
useEffect(() => {
  loadCommonCodes()
}, [getHierarchyChildren])
```

---

## 작업 우선순위

| 우선순위 | 대상 | 난이도 | 사유 |
|---------|------|--------|------|
| 높음 | #4 LaborContractSettings | 낮음 | key prop 패턴 단순 적용 |
| 높음 | #5 EmployeeInfoSettings | 낮음 | #4와 동일 패턴 |
| 높음 | #1 ProgramFormModal | 낮음 | initialData 계산 시점 변경 |
| 높음 | #8 ProgramList | 낮음 | useCallback 추가만 |
| 중간 | #6 EmployContractEdit | 중간 | 폼 필드 매핑이 복잡 |
| 중간 | #7 ImageUpload | 중간 | Blob URL lifecycle 관리 변경 |
| 중간 | #3 SalaryCalculationPop:251 | 중간 | 파생 값 분리 필요 |
| 낮음 | #2 SalaryCalculationPop:115 | 높음 | 10개+ setState를 useState 초기값으로 이동. 리팩토링 규모 큼 |
| 낮음 | #9 FullTimePayStub | 낮음 | useCallback 추가만 |

---

## 참고

- React Compiler 규칙 전체 목록: `eslint-plugin-react-hooks` v7.0.0+ README 참조
- CLAUDE.md "React Compiler 규칙" 섹션에 가이드 추가됨
- `useStoreDetailForm.ts:442`는 이미 렌더 중 setState 패턴으로 우회 완료 (추가 작업 불필요)
