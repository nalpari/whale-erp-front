'use client'

import { useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import HolidayList from '@/components/system/holiday/HolidayList'
import HolidaySearch, { type HolidaySearchFilters } from '@/components/system/holiday/HolidaySearch'
import Location from '@/components/ui/Location'
import { useHolidayList } from '@/hooks/queries'
import type { HolidayListItem, HolidayListParams } from '@/types/holiday'

const BREADCRUMBS = ['Home', '시스템 관리', '휴일 관리']
const currentYear = new Date().getFullYear()

const DEFAULT_FILTERS: HolidaySearchFilters = {
  year: currentYear,
  officeId: null,
  franchiseId: null,
  storeId: null,
  holidayType: null,
}

export default function HolidayInfo() {
  const router = useRouter()

  const [filters, setFilters] = useState<HolidaySearchFilters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<HolidaySearchFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  const params: HolidayListParams = useMemo(
    () => ({
      year: appliedFilters.year ?? currentYear,
      office: appliedFilters.officeId ?? undefined,
      franchise: appliedFilters.franchiseId ?? undefined,
      store: appliedFilters.storeId ?? undefined,
      holidayType: appliedFilters.holidayType ?? undefined,
      page,
      size: pageSize,
    }),
    [appliedFilters, page, pageSize]
  )

  // bpTree auto-apply로 filters.officeId가 세팅되었는데
  // appliedFilters.officeId가 아직 null이면 자동으로 동기화하여 목록 조회를 시작한다.
  // (렌더 중 조건부 setState — 조건 해소 후 루프 종료)
  if (filters.officeId != null && appliedFilters.officeId == null) {
    setAppliedFilters(filters)
  }

  const canFetchList = !!appliedFilters.year && appliedFilters.officeId != null
  const { data: response, isPending: loading, error } = useHolidayList(params, canFetchList)

  const handleSearch = useCallback(() => {
    setAppliedFilters(filters)
    setPage(0)
  }, [filters])

  // 초기화: 검색 폼만 초기화, 목록 데이터는 유지
  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const handleFilterChange = useCallback(
    (next: Partial<HolidaySearchFilters>) => {
      setFilters((prev) => ({ ...prev, ...next }))
    },
    []
  )

  const handleOpenDetail = useCallback(
    (row: HolidayListItem) => {
      if (row.holidayType === 'LEGAL') {
        router.push(`/system/holiday/legal?year=${row.year}`)
        return
      }

      const searchParams = new URLSearchParams()
      searchParams.set('year', String(row.year))

      if (row.headOfficeId) {
        searchParams.set('headOfficeId', String(row.headOfficeId))
      }
      if (row.franchiseId) {
        searchParams.set('franchiseId', String(row.franchiseId))
      }
      if (row.storeId) {
        searchParams.set('storeId', String(row.storeId))
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
