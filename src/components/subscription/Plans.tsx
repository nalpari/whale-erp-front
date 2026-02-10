'use client'

import { useState, useMemo } from 'react'
import Location from '@/components/ui/Location'
import PlansSearch from '@/components/subscription/PlansSearch'
import PlansList from '@/components/subscription/PlansList'
import { usePlansList, type PlansListParams } from '@/hooks/queries'

const BREADCRUMBS = ['과금관리', 'ERP 요금제 관리']

const defaultListParams: PlansListParams = {
    planType: undefined,
    updater: undefined,
    page: 0,
    size: 50,
    sort: 'createdAt,desc',
}

export default function Plans() {
    const [filters, setFilters] = useState<PlansListParams>(defaultListParams)
    const [page, setPage] = useState(0)
    const [pageSize, _setPageSize] = useState(10)

    const listParams: PlansListParams = useMemo(
        () => ({
            ...filters,
            page,
            size: pageSize,
            sort: undefined,
        }),
        [filters, page, pageSize]
    )

    const { data: response, isPending: loading, error } = usePlansList(listParams)

    const resultCount = response?.totalElements ?? 0
    const plans = response?.content ?? []

    // 검색 조건 초기화
    const handleReset = () => {
        setFilters(defaultListParams)
        setPage(0)
    }


    return (
        <div className="data-wrap">
            <Location title="ERP 요금제 관리" list={BREADCRUMBS} />
            <PlansSearch
                filters={filters}
                resultCount={resultCount}
                onChange={setFilters}
                onReset={handleReset}
            />
            <PlansList rows={plans} loading={loading} error={error?.message} />
        </div>
    )
}
