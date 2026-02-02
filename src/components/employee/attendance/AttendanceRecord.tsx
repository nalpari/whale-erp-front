'use client'

import { useMemo, useState } from 'react'
import AttendanceSearch, {
  type AttendanceSearchFilters,
  DEFAULT_ATTENDANCE_FILTERS,
} from '@/components/employee/attendance/AttendanceSearch'
import AttendanceList from '@/components/employee/attendance/AttendanceList'
import Location from '@/components/ui/Location'
import { useAttendanceList } from '@/hooks/queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { useAuthStore } from '@/stores/auth-store'
import type { AttendanceListParams } from '@/types/attendance'

const BREADCRUMBS = ['Home', '직원 관리', '근태 기록']

export default function AttendanceRecord() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const hydrated = Boolean(accessToken)

  const [filters, setFilters] = useState<AttendanceSearchFilters>(DEFAULT_ATTENDANCE_FILTERS)
  const [appliedFilters, setAppliedFilters] =
    useState<AttendanceSearchFilters>(DEFAULT_ATTENDANCE_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // 공통코드 조회: 근무여부, 직원분류, 계약분류
  const { children: workStatusChildren } = useCommonCode('WRKST', hydrated)
  const { children: empClassChildren } = useCommonCode('CNTCF', hydrated)
  const { children: contractClassChildren } = useCommonCode('CNTCS', hydrated)

  const attendanceParams: AttendanceListParams = useMemo(
    () => ({
      officeId: appliedFilters.officeId ?? undefined,
      franchiseId: appliedFilters.franchiseId ?? undefined,
      storeId: appliedFilters.storeId ?? undefined,
      workStatus:
        appliedFilters.workStatus === 'ALL' ? undefined : appliedFilters.workStatus,
      employeeName: appliedFilters.employeeName || undefined,
      workDays: appliedFilters.workDays.length > 0 ? appliedFilters.workDays : undefined,
      employeeClassification:
        appliedFilters.employeeClassification === 'ALL'
          ? undefined
          : appliedFilters.employeeClassification,
      contractClassification:
        appliedFilters.contractClassification === 'ALL'
          ? undefined
          : appliedFilters.contractClassification,
      page,
      size: pageSize,
    }),
    [appliedFilters, page, pageSize]
  )

  const { data: response, isPending: loading, error } = useAttendanceList(attendanceParams, hydrated)

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  const handleReset = () => {
    setFilters(DEFAULT_ATTENDANCE_FILTERS)
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
        employeeClassificationOptions={empClassChildren.map((c) => ({
          value: c.code,
          label: c.name,
        }))}
        contractClassificationOptions={contractClassChildren.map((c) => ({
          value: c.code,
          label: c.name,
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
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
      />
    </div>
  )
}
