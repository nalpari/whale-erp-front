'use client'

import { useMemo, useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import HolidayList from '@/components/system/holiday/HolidayList'
import HolidaySearch, { type HolidaySearchFilters } from '@/components/system/holiday/HolidaySearch'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useBpHeadOfficeTree, useHolidayList } from '@/hooks/queries'
import { useAuthStore } from '@/stores/auth-store'
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
  const [isNavigating, startTransition] = useTransition()
  const { accessToken, affiliationId } = useAuthStore()
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree = [] } = useBpHeadOfficeTree(isReady)
  const isSingleOrg = bpTree.length === 1

  const [filters, setFilters] = useState<HolidaySearchFilters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<HolidaySearchFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // 단일 조직(사용자 소속): auto-select된 본사/가맹점 값을 appliedFilters에 자동 반영
  // 다중 조직(admin): 검색 버튼 클릭 시에만 반영
  if (isSingleOrg && filters.officeId != null && appliedFilters.officeId == null) {
    setAppliedFilters(filters)
  }

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
  const { data: response, isPending: loading, error } = useHolidayList(params, canFetchList)

  const handleSearch = useCallback(() => {
    setAppliedFilters(filters)
    setPage(0)
  }, [filters])

  // 초기화: 검색 폼만 초기화, 목록 데이터는 유지 (appliedFilters 변경 안 함)
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
      startTransition(() => {
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
      })
    },
    [router, startTransition]
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
