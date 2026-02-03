'use client'

import { useRouter } from 'next/navigation'
import { ColDef, RowClickedEvent } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import { PlanPricing } from '@/types/plans'
import { useDeletePlanPricing } from '@/hooks/queries/use-plans-queries'

interface PlanPricingListProps {
    planId: number
    planTypeName: string
    pricingList: PlanPricing[]
}

export default function PlanPricingList({ planId, planTypeName, pricingList }: PlanPricingListProps) {
    const router = useRouter()
    const { mutate: deletePricing, isPending: isDeleting } = useDeletePlanPricing()

    const handleAddPricing = () => {
        const params = new URLSearchParams({ planTypeName })
        router.push(`/subscription/${planId}/pricing/create?${params.toString()}`)
    }

    const getStatus = (data: PlanPricing) => {
        if (!data?.startDate || !data?.endDate) return '-'

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const start = new Date(data.startDate)
        start.setHours(0, 0, 0, 0)

        const end = new Date(data.endDate)
        end.setHours(0, 0, 0, 0)

        if (today < start) return '대기'
        if (today > end) return '종료'
        return '진행'
    }

    const handleRowClicked = (event: RowClickedEvent<PlanPricing>) => {
        const data = event.data
        if (!data) return

        const status = getStatus(data)
        if (status !== '종료') {
            const params = new URLSearchParams({ planTypeName })
            router.push(`/subscription/${planId}/pricing/${data.id}/edit?${params.toString()}`)
        }
    }

    const handleDelete = (pricingId: number, title: string) => {
        if (confirm(`[${title}] 가격 정책을 삭제하시겠습니까?`)) {
            deletePricing(
                { planId, pricingId },
                {
                    onSuccess: () => {
                        alert('삭제되었습니다.')
                    },
                    onError: (error) => {
                        console.error('삭제 실패:', error)
                        alert('삭제에 실패했습니다. 다시 시도해주세요.')
                    },
                },
            )
        }
    }

    const columnDefs: ColDef<PlanPricing>[] = [
        {
            field: 'title',
            headerName: '제목',
            flex: 1,
        },
        {
            headerName: '상태',
            flex: 1,
            valueGetter: (params) => getStatus(params.data as PlanPricing),
        },
        {
            headerName: '기간',
            flex: 1,
            valueGetter: (params) => {
                const startDate = params.data?.startDate
                const endDate = params.data?.endDate
                if (!startDate || !endDate) return ''
                const formatDate = (date: Date) => {
                    const d = new Date(date)
                    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                }
                return `${formatDate(startDate)} ~ ${formatDate(endDate)}`
            },
        },
        {
            field: 'monthlyPrice',
            headerName: '월 요금',
            flex: 1,
            valueFormatter: (params) => `${params.value?.toLocaleString()}원`,
        },
        {
            field: 'sixMonthDiscount',
            headerName: '6개월 요금',
            flex: 1,
            valueFormatter: (params) => (params.value != null ? `${params.value.toLocaleString()}원` : ''),
        },
        {
            field: 'yearlyDiscount',
            headerName: '12개월 요금',
            flex: 1,
            valueFormatter: (params) => (params.value != null ? `${params.value.toLocaleString()}원` : ''),
        },
        {
            headerName: '',
            width: 100,
            cellRenderer: (params: any) => {
                const status = getStatus(params.data)
                if (status === '대기') {
                    return (
                        <div className="filed-btn">
                            <button
                                type="button"
                                className="btn-form outline grid"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(params.data.id, params.data.title)
                                }}
                                disabled={isDeleting}
                            >
                                삭제
                            </button>
                        </div>
                    )
                }
                return null
            },
        },
    ]

    return (
        <div className="data-list-wrap">
            <div className="data-list-header">
                <div className="data-header-right">
                    <button className="btn-form basic" type="button" onClick={handleAddPricing}>가격 추가</button>
                </div>
            </div>
            <div className="data-list-bx">
                {pricingList.length === 0 ? (
                    <div className="empty-wrap">
                        <div className="empty-data">등록된 가격정보가 없습니다.</div>
                    </div>
                ) : (
                    <AgGrid
                        rowData={pricingList}
                        columnDefs={columnDefs}
                        onRowClicked={handleRowClicked}
                        rowClassRules={{
                            'cursor-pointer hover:bg-gray-50': (params) => getStatus(params.data as PlanPricing) !== '종료',
                            'opacity-50 cursor-not-allowed': (params) => getStatus(params.data as PlanPricing) === '종료',
                        }}
                    />
                )}
            </div>
        </div>
    )
}
