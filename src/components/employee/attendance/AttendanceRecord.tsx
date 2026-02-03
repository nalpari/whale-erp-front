'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import AttendanceSearch from '@/components/employee/attendance/AttendanceSearch'
import AttendanceList from '@/components/employee/attendance/AttendanceList'
import Location from '@/components/ui/Location'
import { useAttendanceList, useEmployeeCommonCode } from '@/hooks/queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { useAuthStore } from '@/stores/auth-store'
import { useAttendanceSearchStore } from '@/stores/attendance-search-store'
import type { AttendanceListParams } from '@/types/attendance'

const BREADCRUMBS = ['Home', '직원 관리', '근태 기록']

const CONTRACT_CLASS_LABEL: Record<string, string> = {
  CNTCFWK_001: '정직원',
  CNTCFWK_002: '정직원',
  CNTCFWK_003: '파트타이머',
}

const PAGE_SIZE_OPTIONS = [50, 100, 200] as const
const DEFAULT_PAGE_SIZE = 50

const normalizePage = (value: string | null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
}

const normalizeSize = (value: string | null) => {
  const parsed = Number(value)
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number])
    ? parsed
    : DEFAULT_PAGE_SIZE
}

export default function AttendanceRecord() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const accessToken = useAuthStore((s) => s.accessToken)

  // Zustand store에서 상태 가져오기
  const filters = useAttendanceSearchStore((state) => state.filters)
  const appliedFilters = useAttendanceSearchStore((state) => state.appliedFilters)
  const page = useAttendanceSearchStore((state) => state.page)
  const pageSize = useAttendanceSearchStore((state) => state.pageSize)
  const hydrated = useAttendanceSearchStore((state) => state.hydrated)
  const setFilters = useAttendanceSearchStore((state) => state.setFilters)
  const setAppliedFilters = useAttendanceSearchStore((state) => state.setAppliedFilters)
  const setPage = useAttendanceSearchStore((state) => state.setPage)
  const setPageSize = useAttendanceSearchStore((state) => state.setPageSize)
  const resetFilters = useAttendanceSearchStore((state) => state.resetFilters)

  // URL 파라미터와 store 동기화 (초기 로드 시)
  useEffect(() => {
    if (!hydrated) return
    const urlPage = normalizePage(searchParams.get('page'))
    const urlSize = normalizeSize(searchParams.get('size'))
    if (urlPage !== page) setPage(urlPage)
    if (urlSize !== pageSize) setPageSize(urlSize)
  }, [hydrated, searchParams, page, pageSize, setPage, setPageSize])

  const syncQueryParams = (nextPage: number, nextSize: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage > 0) {
      params.set('page', String(nextPage))
    } else {
      params.delete('page')
    }
    params.set('size', String(nextSize))
    const query = params.toString()
    const nextUrl = query ? `${pathname}?${query}` : pathname
    const currentQuery = searchParams.toString()
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl)
    }
    // store도 업데이트
    setPage(nextPage)
    setPageSize(nextSize)
  }

  // 공통코드 조회: 근무여부, 계약분류
  const { children: workStatusChildren } = useCommonCode('EMPWK', hydrated)
  const { children: contractClassChildren } = useCommonCode('CNTCFWK', hydrated)

  // 직원 분류: 본사/가맹점 기반 API 조회
  const { data: empClassList = [] } = useEmployeeCommonCode(
    filters.officeId,
    filters.franchiseId,
    hydrated
  )

  const attendanceParams: AttendanceListParams = {
    officeId: appliedFilters.officeId ?? undefined,
    franchiseId: appliedFilters.franchiseId ?? undefined,
    storeId: appliedFilters.storeId ?? undefined,
    status:
      appliedFilters.workStatus === 'ALL' ? undefined : appliedFilters.workStatus,
    employeeName: appliedFilters.employeeName || undefined,
    dayType: appliedFilters.workDays.length > 0 ? appliedFilters.workDays : undefined,
    employeeClassify:
      appliedFilters.employeeClassification === 'ALL'
        ? undefined
        : appliedFilters.employeeClassification,
    contractClassify:
      appliedFilters.contractClassification === 'ALL'
        ? undefined
        : appliedFilters.contractClassification,
    page,
    size: pageSize,
  }

  const { data: response, isPending: loading, error } = useAttendanceList(attendanceParams, hydrated && Boolean(accessToken))

  const handleSearch = () => {
    setAppliedFilters(filters)
    syncQueryParams(0, pageSize)
  }

  const handleReset = () => {
    resetFilters()
  }

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  return (
    <div className="data-wrap">
      <Location title="근태 기록" list={BREADCRUMBS} />
      <AttendanceSearch
        filters={filters}
        workStatusOptions={workStatusChildren.map((c) => ({ value: c.code, label: c.name }))}
        employeeClassificationOptions={empClassList.map((c) => ({
          value: c.code,
          label: c.name,
        }))}
        empClassDisabled={!filters.officeId}
        contractClassificationOptions={contractClassChildren.map((c) => ({
          value: c.code,
          label: CONTRACT_CLASS_LABEL[c.code] ?? c.name,
        }))}
        resultCount={totalCount}
        onChange={(next) => setFilters({ ...filters, ...next })}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <AttendanceList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        error={error?.message}
        onPageChange={(nextPage) => syncQueryParams(nextPage, pageSize)}
        onPageSizeChange={(size) => {
          if (size === pageSize) return
          syncQueryParams(0, size)
        }}
        onRowClick={(row) => {
          const params = new URLSearchParams({
            officeId: String(row.officeId),
            franchiseId: String(row.franchiseId),
            storeId: String(row.storeId),
            employeeId: String(row.employeeId),
          })
          router.push(`/employee/attendance/detail?${params.toString()}`)
        }}
      />
    </div>
  )
}
