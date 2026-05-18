# PlanHeader 기능 목록 리팩토링 계획

> **작성일**: 2026-01-30
> **목표**: PlanHeader의 포함기능 목록을 공통코드(planFeatures) 기반으로 렌더링하고, plan.features에서 enabled 상태만 참조하도록 변경

---

## 1. 현재 구조

### 데이터 소스

| 소스 | 용도 | 데이터 구조 |
|------|------|-------------|
| `plan.features` | 기능 목록 + enabled 상태 | `{ id, featureCode, featureName, enabled }[]` |
| `planFeatures` (공통코드) | 기능 마스터 목록 | `{ code, name, ... }[]` |

### 현재 렌더링 방식

```typescript
// PlanHeaderForm 내부
const [features, setFeatures] = useState<PlanFeature[]>(plan.features)

{features.map(feature => (
    <button
        key={feature.id}
        className={`pricing-btn outline ${feature.enabled ? 'act' : ''}`}
        onClick={() => handleFeatureToggle(feature.id)}
    >
        {feature.featureName}
    </button>
))}
```

**문제점**:
- `plan.features`에 없는 기능은 표시되지 않음
- 새로운 기능이 공통코드에 추가되어도 UI에 반영되지 않음

---

## 2. 목표 구조

### 렌더링 로직

```
planFeatures (공통코드)를 기준으로 렌더링
    ↓
각 항목의 enabled 상태는 plan.features에서 featureCode로 매칭하여 가져옴
    ↓
plan.features에 없는 항목은 enabled: false로 처리
```

### 데이터 매핑

```typescript
// planFeatures를 기준으로 features 상태 초기화
const initialFeatures = planFeatures.map(pf => {
    const existingFeature = plan.features.find(f => f.featureCode === pf.code)
    return {
        featureCode: pf.code,
        featureName: pf.name,
        enabled: existingFeature?.enabled ?? false,
    }
})
```

---

## 3. 구현 단계

### Step 1: planFeatures를 PlanHeaderForm에 전달

`PlanHeader` 컴포넌트에서 `planFeatures`를 `PlanHeaderForm`의 prop으로 전달

```typescript
// PlanHeader.tsx
<PlanHeaderForm
    plan={plan}
    planFeatures={planFeatures}  // 추가
    onCancel={handleCancel}
    onSave={handleSave}
    isSaving={updateMutation.isPending}
/>
```

### Step 2: features 상태 타입 및 초기화 변경

`PlanHeaderForm`에서 features 상태를 공통코드 기반으로 초기화

```typescript
// 타입 정의 (간소화)
interface FeatureState {
    featureCode: string
    featureName: string
    enabled: boolean
}

// 초기화
const [features, setFeatures] = useState<FeatureState[]>(() =>
    planFeatures.map(pf => ({
        featureCode: pf.code,
        featureName: pf.name,
        enabled: plan.features.find(f => f.featureCode === pf.code)?.enabled ?? false,
    }))
)
```

### Step 3: handleFeatureToggle 수정

`id` 대신 `featureCode`로 토글

```typescript
const handleFeatureToggle = (featureCode: string) => {
    setFeatures(prev =>
        prev.map(f =>
            f.featureCode === featureCode ? { ...f, enabled: !f.enabled } : f
        )
    )
}
```

### Step 4: 렌더링 부분 수정

```typescript
{features.map(feature => (
    <button
        key={feature.featureCode}
        className={`pricing-btn outline ${feature.enabled ? 'act' : ''}`}
        onClick={() => handleFeatureToggle(feature.featureCode)}
    >
        {feature.featureName}
    </button>
))}
```

### Step 5: handleSave payload 수정

기존 `id` 필드 대신 `featureCode`만 전송 (또는 API 요구사항에 맞게 조정)

```typescript
const payload: UpdatePlanHeaderRequest = {
    storeLimit: storeLimit === undefined ? null : storeLimit,
    employeeLimit: employeeLimit === undefined ? null : employeeLimit,
    features: features.map(f => ({
        featureCode: f.featureCode,
        enabled: f.enabled
    })),
}
```

---

## 4. 타입 수정 필요 여부

### UpdatePlanHeaderRequest 타입

현재:
```typescript
features: {
    id: number
    featureCode: string
    enabled: boolean
}[]
```

변경 후 (API 요구사항에 따라):
```typescript
features: {
    featureCode: string
    enabled: boolean
}[]
```

> **참고**: `id` 필드가 API에서 필수인지 확인 필요. 공통코드 기반이라면 `featureCode`만으로 충분할 수 있음.

---

## 5. 체크리스트

- [ ] `PlanHeaderFormProps`에 `planFeatures` prop 추가
- [ ] `PlanHeader`에서 `planFeatures`를 `PlanHeaderForm`에 전달
- [ ] `FeatureState` 타입 정의 또는 기존 타입 수정
- [ ] `features` 상태 초기화 로직 변경 (공통코드 기반)
- [ ] `handleFeatureToggle` 함수 수정 (`featureCode` 기준)
- [ ] 렌더링 부분 수정 (`key`를 `featureCode`로)
- [ ] `handleSave` payload 구성 수정
- [ ] `UpdatePlanHeaderRequest` 타입 수정 (필요시)
- [ ] 테스트: 공통코드에 있고 plan.features에 없는 항목이 `enabled: false`로 표시되는지 확인

---

## 6. 예상 결과

| 시나리오 | 결과 |
|----------|------|
| 공통코드에 있고, plan.features에도 있는 기능 | plan.features의 enabled 값 사용 |
| 공통코드에 있지만, plan.features에 없는 기능 | enabled: false로 표시 |
| 새 기능이 공통코드에 추가됨 | 자동으로 UI에 표시 (enabled: false) |
