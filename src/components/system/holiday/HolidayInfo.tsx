'use client'

import { useMemo, useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import HolidayList from '@/components/system/holiday/HolidayList'
import HolidaySearch, { type HolidaySearchFilters } from '@/components/system/holiday/HolidaySearch'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useHolidayList } from '@/hooks/queries'
import type { HolidayListItem, HolidayListParams } from '@/types/holiday'
import { useQueryError } from '@/hooks/useQueryError'
import { useSearchFilterStorage } from '@/hooks/useSearchFilterStorage'

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
  const [isNavigating, startTransition] = useTransition()
  const { savedFilters, saveFilters, clearFilters } = useSearchFilterStorage<HolidaySearchFilters>(
    'holiday-search',
  )

  const [filters, setFilters] = useState<HolidaySearchFilters>(savedFilters ?? DEFAULT_FILTERS)
  const [appliedFilters, _setAppliedFilters] = useState<HolidaySearchFilters>(savedFilters ?? DEFAULT_FILTERS)
  const setAppliedFilters = useCallback((next: HolidaySearchFilters) => { _setAppliedFilters(next); saveFilters(next) }, [saveFilters])
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

  // 휴일 관리는 본사 필수가 아니므로 연도만 있으면 목록 조회 가능
  const canFetchList = !!appliedFilters.year
  const { data: response, isPending: loading, error: queryError } = useHolidayList(params, canFetchList)
  const errorMessage = useQueryError(queryError)

  const handleSearch = useCallback(() => {
    setAppliedFilters(filters)
    setPage(0)
  }, [filters, setAppliedFilters])

  // 초기화: 검색 폼만 초기화, 목록 데이터는 유지 (appliedFilters 변경 안 함)
  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    clearFilters()
  }, [clearFilters])

  const handleRemoveFilter = useCallback((key: string) => {
    const resetMap: Record<string, Partial<HolidaySearchFilters>> = {
      year: { year: null },
      office: { officeId: null, franchiseId: null, storeId: null },
      franchise: { franchiseId: null, storeId: null },
      store: { storeId: null },
    }
    const patch = resetMap[key]
    if (!patch) return
    const nextFilters = { ...appliedFilters, ...patch }
    setFilters(nextFilters)
    // 필수값(year) 제거 시 appliedFilters는 유지 → 목록 데이터 보존
    if (key === 'year') return
    setAppliedFilters(nextFilters)
    setPage(0)
  }, [appliedFilters, setAppliedFilters])

  const handleFilterChange = useCallback(
    (next: Partial<HolidaySearchFilters>) => {
      setFilters((prev) => ({ ...prev, ...next }))
    },
    []
  )

  const handleOpenDetail = useCallback(
    (row: HolidayListItem) => {
      startTransition(() => {
        if (row.holidayType === 'LEGAL') {
          router.push(`/system/holiday/legal?year=${row.year}`)
          return
        }

        const searchParams = new URLSearchParams()
        searchParams.set('year', String(row.year))

        if (row.headOfficeId != null) {
          searchParams.set('headOfficeId', String(row.headOfficeId))
        }
        if (row.franchiseId != null) {
          searchParams.set('franchiseId', String(row.franchiseId))
        }
        if (row.storeId != null) {
          searchParams.set('storeId', String(row.storeId))
        }

        router.push(`/system/holiday/detail?${searchParams.toString()}`)
      })
    },
    [router]
  )

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  return (
    <div className="data-wrap">
      {isNavigating && (
        <div className="cube-loader-overlay">
          <CubeLoader />
        </div>
      )}
      <Location title="휴일 관리" list={BREADCRUMBS} />
      <HolidaySearch
        filters={filters}
        appliedFilters={appliedFilters}
        resultCount={totalCount}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
        onRemoveFilter={handleRemoveFilter}
      />
      <HolidayList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        error={errorMessage}
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
