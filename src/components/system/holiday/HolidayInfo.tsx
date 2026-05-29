'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import HolidayList from '@/components/system/holiday/HolidayList'
import HolidaySearch, { type HolidaySearchFilters } from '@/components/system/holiday/HolidaySearch'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useHolidayList } from '@/hooks/queries'
import type { HolidayListItem, HolidayListParams } from '@/types/holiday'
import { useQueryError } from '@/hooks/useQueryError'
import { useHolidaySearchStore } from '@/stores/search-stores'
import { useAccountPolicy } from '@/hooks/use-account-policy'

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
  const searchStore = useHolidaySearchStore()
  const restoredFilters = searchStore.hasSearched ? searchStore.searchParams : null

  const [filters, setFilters] = useState<HolidaySearchFilters>(restoredFilters ?? DEFAULT_FILTERS)
  const [appliedFilters, _setAppliedFilters] = useState<HolidaySearchFilters>(restoredFilters ?? DEFAULT_FILTERS)
  const setAppliedFilters = (next: HolidaySearchFilters) => {
    _setAppliedFilters(next)
    searchStore.setSearchParams(next )
    searchStore.setHasSearched(true)
  }
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

  // 자동선택 발동 가능성 판단 — useAccountPolicy 단일 출처
  const { shouldAutoSelectOffice: willAutoSelect } = useAccountPolicy()

  // 휴일 관리 fetch 가드:
  // willAutoSelect = true 이면 officeId 가 자동 채워질 예정이므로 채워질 때까지 fetch 보류.
  // 슈퍼 어드민(PLATFORM + defaultHeadOfficeId=null) 만 자동선택 미발동 → 즉시 fetch 가능.
  const canFetchList = !!appliedFilters.year && (
    !willAutoSelect || appliedFilters.officeId != null
  )
  const { data: response, isPending: loading, error: queryError } = useHolidayList(params, canFetchList)
  const errorMessage = useQueryError(queryError)

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  // HeadOfficeFranchiseStoreSelect의 자동선택 결과를 즉시 appliedFilters에 반영
  // (자동선택 사용자가 첫 페이지 로드 시 정확한 조건으로 1번만 fetch되도록)
  const handleAutoSelect = (value: { head_office: number | null; franchise: number | null; store: number | null }) => {
    const next: HolidaySearchFilters = {
      ...filters,
      officeId: value.head_office,
      franchiseId: value.franchise,
      storeId: value.store ?? filters.storeId,
    }
    setFilters(next)
    setAppliedFilters(next)
    setPage(0)
  }

  // 초기화: 검색 폼만 초기화, 목록 데이터는 유지 (appliedFilters 변경 안 함)
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    searchStore.reset()
  }

  const handleRemoveFilter = (key: string) => {
    const resetMap: Record<string, Partial<HolidaySearchFilters>> = {
      year: { year: null },
      office: { officeId: null },
      franchise: { franchiseId: null },
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
  }

  const handleFilterChange = (next: Partial<HolidaySearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }))
  }

  const handleOpenDetail = (row: HolidayListItem) => {
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
    }

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
        onAutoSelect={handleAutoSelect}
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
