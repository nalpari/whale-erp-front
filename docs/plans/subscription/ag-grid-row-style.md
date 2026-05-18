# AG Grid 행 스타일 조건부 변경 계획

## 개요
`monthlyPrice`가 `null`인 데이터의 경우 해당 행의 배경색과 글자색을 변경하여 시각적으로 구분하는 기능을 구현합니다.

## 구현 범위
- **대상 컴포넌트**: `PlansList.tsx`
- **대상 필드**: `monthlyPrice`
- **조건**: 값이 `null`인 경우

## 구현 단계

### 1단계: 타입 수정
**파일**: `src/types/plans.ts`

`PlansListItem` 인터페이스의 `monthlyPrice` 타입을 `number | null`로 변경합니다.

```typescript
export interface PlansListItem {
    // ... 기존 필드들
    monthlyPrice: number | null  // null 허용
    // ...
}
```

### 2단계: AgGrid 컴포넌트에 getRowStyle prop 추가
**파일**: `src/components/ui/AgGrid.tsx`

1. `RowClassParams`, `RowStyle` 타입을 ag-grid-community에서 import합니다.
2. `AgGridProps` 인터페이스에 `getRowStyle` prop을 추가합니다.
3. 컴포넌트 함수에서 해당 prop을 받아 `AgGridReact`에 전달합니다.

```typescript
import { 
    ModuleRegistry, 
    AllCommunityModule, 
    ColDef, 
    RowClickedEvent, 
    RowClassParams, 
    RowStyle 
} from 'ag-grid-community'

interface AgGridProps<T extends object> {
    // ... 기존 props
    getRowStyle?: (params: RowClassParams<T>) => RowStyle | undefined
}

export default function AgGrid<T extends object>({
    // ... 기존 props
    getRowStyle,
}: AgGridProps<T>) {
    // ...
    return (
        <div className="erp-grid" style={{ width: '100%' }}>
            <AgGridReact
                // ... 기존 props
                getRowStyle={getRowStyle}
            />
        </div>
    )
}
```

### 3단계: PlansList에서 getRowStyle 사용
**파일**: `src/components/subscription/PlansList.tsx`

`AgGrid` 컴포넌트에 `getRowStyle` prop을 전달하여 조건부 스타일을 적용합니다.

```tsx
<AgGrid
    rowData={rows}
    columnDefs={columnDefs}
    getRowStyle={(params) => {
        // monthlyPrice가 null이면 회색 배경과 흐린 글자색 적용
        if (params.data?.monthlyPrice === null) {
            return { background: '#f5f5f5', color: '#999' }
        }
        return undefined
    }}
/>
```

## 스타일 옵션

### 기본 스타일 (회색 배경)
```typescript
{ background: '#f5f5f5', color: '#999' }
```

### 대안 스타일 (경고 스타일)
```typescript
{ background: '#fff3cd', color: '#856404' }  // 노란색 경고
```

### 대안 스타일 (에러 스타일)
```typescript
{ background: '#f8d7da', color: '#721c24' }  // 빨간색 에러
```

## 주의사항
1. `params.data`가 `undefined`일 수 있으므로 optional chaining(`?.`)을 사용해야 합니다.
2. 스타일이 적용되지 않는 행에는 `undefined`를 반환해야 합니다.
3. 여러 조건을 조합해야 하는 경우 if-else 문을 확장할 수 있습니다.

## 테스트 체크리스트
- [ ] `monthlyPrice`가 `null`인 행의 배경색이 변경되는지 확인
- [ ] `monthlyPrice`가 숫자인 행은 기본 스타일을 유지하는지 확인
- [ ] 빈 데이터셋에서 오류가 발생하지 않는지 확인
- [ ] 페이지네이션 후에도 스타일이 올바르게 적용되는지 확인
