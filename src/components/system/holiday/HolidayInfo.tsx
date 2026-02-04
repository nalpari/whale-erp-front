'use client'

import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import HolidayList from '@/components/system/holiday/HolidayList'
import HolidaySearch, { type HolidaySearchFilters } from '@/components/system/holiday/HolidaySearch'
import Location from '@/components/ui/Location'
import { useHolidayList } from '@/hooks/queries'
import { useHolidaySearchStore } from '@/stores/holiday-search-store'
import type { HolidayListItem, HolidayListParams } from '@/types/holiday'

const BREADCRUMBS = ['Home', '시스템 관리', '휴일 관리']
const currentYear = new Date().getFullYear()

export default function HolidayInfo() {
  const router = useRouter()

  const filters = useHolidaySearchStore((s) => s.filters)
  const appliedFilters = useHolidaySearchStore((s) => s.appliedFilters)
  const page = useHolidaySearchStore((s) => s.page)
  const pageSize = useHolidaySearchStore((s) => s.pageSize)
  const hydrated = useHolidaySearchStore((s) => s.hydrated)
  const setFilters = useHolidaySearchStore((s) => s.setFilters)
  const setAppliedFilters = useHolidaySearchStore((s) => s.setAppliedFilters)
  const setPage = useHolidaySearchStore((s) => s.setPage)
  const setPageSize = useHolidaySearchStore((s) => s.setPageSize)
  const resetFilters = useHolidaySearchStore((s) => s.resetFilters)

  const params: HolidayListParams = useMemo(
    () => ({
      year: appliedFilters.year ?? currentYear,
      office: appliedFilters.officeId ?? undefined,
      franchise: appliedFilters.franchiseId ?? undefined,
      store: appliedFilters.storeId ?? undefined,
      page,
      size: pageSize,
    }),
    [appliedFilters, page, pageSize]
  )

  const { data: response, isPending: loading, error } = useHolidayList(params, hydrated && !!appliedFilters.year)

  const handleSearch = useCallback(() => {
    setAppliedFilters(filters)
    setPage(0)
  }, [filters, setAppliedFilters, setPage])

  const handleReset = useCallback(() => {
    resetFilters()
  }, [resetFilters])

  const handleFilterChange = useCallback(
    (next: Partial<HolidaySearchFilters>) => {
      setFilters({ ...filters, ...next })
    },
    [filters, setFilters]
  )

  const handleOpenDetail = useCallback(
    (row: HolidayListItem) => {
      if (row.holidayType === 'LEGAL') {
        router.push(`/system/holiday/legal?year=${row.year}`)
        return
      }

      const searchParams = new URLSearchParams()
      searchParams.set('year', String(row.year))

      if (row.storeId) {
        searchParams.set('storeId', String(row.storeId))
      } else if (row.franchiseId) {
        searchParams.set('orgId', String(row.franchiseId))
      } else if (row.headOfficeId) {
        searchParams.set('orgId', String(row.headOfficeId))
      }

      router.push(`/system/holiday/detail?${searchParams.toString()}`)
    },
    [router]
  )

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  return (
    <div className="data-wrap">
      <Location title="휴일 관리" list={BREADCRUMBS} />
      <HolidaySearch
        filters={filters}
        resultCount={totalCount}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <HolidayList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        error={error?.message}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        onOpenDetail={handleOpenDetail}
      />
    </div>
  )
}
