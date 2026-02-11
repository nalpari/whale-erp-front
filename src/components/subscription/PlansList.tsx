'use client'

import { useRouter } from 'next/navigation'
import { ColDef, RowClassParams, RowClickedEvent } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import dynamic from 'next/dynamic'

const PlansComparisonPop = dynamic(
    () => import('@/components/subscription/PlansComparisonPop'),
    { ssr: false }
)
import { PlansListItem } from '@/types/plans'
import { formatDateTimeYmdHm } from '@/util/date-util'
import { useState } from 'react'

const COLUMN_DEFS: ColDef<PlansListItem>[] = [
    { field: 'planTypeName', headerName: '요금제명', flex: 1 },
    {
        field: 'storeLimit',
        headerName: '점포 *',
        flex: 1,
        valueFormatter: (params) => params.value === null ? '제한없음' : params.value,
    },
    {
        field: 'employeeLimit',
        headerName: '직원  *',
        flex: 1,
        valueFormatter: (params) => params.value === null ? '제한없음' : params.value,
    },
    { field: 'featureCount', headerName: '포함기능 *', flex: 1 },
    { field: 'monthlyPrice', headerName: '1개월 요금 *', flex: 1 },
    { field: 'sixMonthDiscountPrice', headerName: '6개월 요금', flex: 1 },
    { field: 'yearlyDiscountPrice', headerName: '12개월 요금', flex: 1 },
    { field: 'updatedAt', headerName: '수정일시', flex: 1, valueFormatter: (params) => formatDateTimeYmdHm(params.value, '') },
    { field: 'updater', headerName: '수정자', flex: 1 },
]

const ROW_CLASS_RULES = {
    'ag-no-data': (params: RowClassParams<PlansListItem>) => params.data?.monthlyPrice === null,
}

export default function PlansList({
    rows,
    error,
    loading
}: {
    rows: PlansListItem[]
    error?: string | null
    loading: boolean
}) {
    const router = useRouter()
    const [isComparisonOpen, setIsComparisonOpen] = useState(false)

    // 행 클릭 시 상세 페이지로 이동
    const handleRowClick = (event: RowClickedEvent<PlansListItem>) => {
        if (event.data) {
            router.push(`/subscription/${event.data.planTypeId}`)
        }
    }
    return (
        <div className="data-list-wrap">
            <div className="data-list-header">
                <div className="data-header-left">
                </div>
                <div className="data-header-right">
                    <button className="btn-form basic" type="button" onClick={() => setIsComparisonOpen(true)}>요금제 비교</button>
                </div>
            </div>
            <div className="data-list-bx">
                {error && <div className="form-helper error">{error}</div>}
                {loading ? (
                    <div className="empty-wrap"><div className="empty-data">로딩중입니다</div></div>
                ) : rows.length === 0 ? (
                    <div className="empty-wrap">
                        <div className="empty-data">검색 결과가 없습니다.</div>
                    </div>
                ) : (
                    <AgGrid
                        rowData={rows}
                        columnDefs={COLUMN_DEFS}
                        rowClassRules={ROW_CLASS_RULES}
                        onRowClicked={handleRowClick}
                    />
                )}
            </div>
            <PlansComparisonPop
                isOpen={isComparisonOpen}
                onClose={() => setIsComparisonOpen(false)}
                plans={rows}
            />
        </div>
    )
}