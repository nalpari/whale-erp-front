'use client'

import { ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import { PlanPricing } from '@/types/plans'

interface PlanPricingListProps {
    pricingList: PlanPricing[]
}

export default function PlanPricingList({ pricingList }: PlanPricingListProps) {
    const columnDefs: ColDef<PlanPricing>[] = [
        {
            field: 'months',
            headerName: '구독 기간',
            flex: 1,
            valueFormatter: (params) => `${params.value}개월`,
        },
        {
            field: 'originalPrice',
            headerName: '정상가',
            flex: 1,
            valueFormatter: (params) => `${params.value?.toLocaleString()}원`,
        },
        {
            field: 'discountPrice',
            headerName: '할인가',
            flex: 1,
            valueFormatter: (params) => `${params.value?.toLocaleString()}원`,
        },
        {
            field: 'discountRate',
            headerName: '할인율',
            flex: 1,
            valueFormatter: (params) => `${params.value}%`,
        },
    ]

    return (
        <div className="data-list-wrap">
            <div className="data-list-header">
                <div className="data-header-left">
                    <h3>가격 정책</h3>
                </div>
                <div className="data-header-right">
                    <button className="btn-form basic" type="button">가격 추가</button>
                </div>
            </div>
            <div className="data-list-bx">
                {pricingList.length === 0 ? (
                    <div className="empty-wrap">
                        <div className="empty-data">가격 정책이 없습니다.</div>
                    </div>
                ) : (
                    <AgGrid
                        rowData={pricingList}
                        columnDefs={columnDefs}
                        autoSizeStrategy={{ type: 'fitGridWidth' }}
                    />
                )}
            </div>
        </div>
    )
}
