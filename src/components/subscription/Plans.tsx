'use client'

import { useMemo } from 'react'
import Location from '@/components/ui/Location'
import PlansSearch from '@/components/subscription/PlansSearch'
import PlansList from '@/components/subscription/PlansList'
import { usePlansList, type PlansListParams } from '@/hooks/queries'
import { usePlansSearchStore } from '@/stores/plans-search-store'

const BREADCRUMBS = ['과금관리', 'ERP 요금제 관리']

export default function Plans() {
  const appliedFilters = usePlansSearchStore((s) => s.appliedFilters)
  const page = usePlansSearchStore((s) => s.page)
  const pageSize = usePlansSearchStore((s) => s.pageSize)
  const setPage = usePlansSearchStore((s) => s.setPage)

  const listParams: PlansListParams = useMemo(() => ({
    planType: appliedFilters.planType || undefined,
    updater: appliedFilters.updater || undefined,
    page,
    size: pageSize,
  }), [appliedFilters, page, pageSize])

  const { data: response, isPending: loading, error } = usePlansList(listParams)

  const resultCount = response?.totalElements ?? 0
  const plans = response?.content ?? []

  return (
    <div className="data-wrap">
      <Location title="ERP 요금제 관리" list={BREADCRUMBS} />
      <PlansSearch resultCount={resultCount} />
      <PlansList
        rows={plans}
        loading={loading}
        error={error?.message}
        page={page}
        totalPages={response?.totalPages ?? 0}
        onPageChange={setPage}
      />
    </div>
  )
}
