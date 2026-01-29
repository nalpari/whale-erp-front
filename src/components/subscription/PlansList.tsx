'use client'
import { ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import { PlansListItem } from '@/types/plans'

export default function PlansList({
    rows,
    error,
    loading
}: {
    rows: PlansListItem[]
    error?: string | null
    loading: boolean
}) {
    const columnDefs: ColDef<PlansListItem>[] = [
        { field: 'planTypeName', headerName: '요금제명', flex: 1 },
        { field: 'storeLimit', headerName: '점포', flex: 1 },
        { field: 'employeeLimit', headerName: '직원', flex: 1 },
        { field: 'featureCount', headerName: '포함기능', flex: 1 },
        { field: 'featureCount', headerName: '1개월 요금', flex: 1 },
        { field: 'featureCount', headerName: '6개월 요금', flex: 1 },
        { field: 'featureCount', headerName: '12개월 요금', flex: 1 },
        { field: 'updatedAt', headerName: '수정일시', flex: 1 },
        { field: 'updater', headerName: '수정자', flex: 1 },
    ]
    return (
        <div className="data-list-wrap">
            <div className="data-list-header">
                <div className="data-header-left">
                </div>
                <div className="data-header-right">
                    <button className="btn-form basic" type="button">요금제 비교</button>
                </div>
            </div>
            <div className="data-list-bx">
                {error && <div className="form-helper error">{error}</div>}
                {loading ? (
                    <div></div>
                ) : rows.length === 0 ? (
                    <div className="empty-wrap">
                        <div className="empty-data">검색 결과가 없습니다.</div>
                    </div>
                ) : (
                    <AgGrid rowData={rows} columnDefs={columnDefs} />
                )}
            </div>
        </div>
    )
}