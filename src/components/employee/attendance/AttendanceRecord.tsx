'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AttendanceSearch from '@/components/employee/attendance/AttendanceSearch'
import { DEFAULT_ATTENDANCE_FILTERS, type AttendanceSearchFilters } from '@/components/employee/attendance/AttendanceSearch'
import AttendanceList from '@/components/employee/attendance/AttendanceList'
import Location from '@/components/ui/Location'
import { useAttendanceList } from '@/hooks/queries'
import { useEmployeeInfoSettings } from '@/hooks/queries/use-employee-settings-queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { useAuthStore } from '@/stores/auth-store'
import type { AttendanceListParams } from '@/types/attendance'

const BREADCRUMBS = ['Home', '직원 관리', '근태 기록']

const CONTRACT_CLASS_LABEL: Record<string, string> = {
  CNTCFWK_001: '정직원',
  CNTCFWK_002: '정직원',
  CNTCFWK_003: '파트타이머',
}

const DEFAULT_PAGE_SIZE = 50

export default function AttendanceRecord() {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)

  // 로컬 상태 (sessionStorage 저장 없음)
  const [filters, setFilters] = useState<AttendanceSearchFilters>(DEFAULT_ATTENDANCE_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AttendanceSearchFilters>(DEFAULT_ATTENDANCE_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // bpTree auto-apply로 filters.officeId가 세팅되었는데
  // appliedFilters.officeId가 아직 null이면 자동으로 동기화하여 목록 조회를 시작한다.
  // (렌더 중 조건부 setState — 조건 해소 후 루프 종료)
  if (filters.officeId != null && appliedFilters.officeId == null) {
    setAppliedFilters(filters)
  }

  // 공통코드 조회: 근무여부, 계약분류
  const { children: workStatusChildren } = useCommonCode('EMPWK', true)
  const { children: contractClassChildren } = useCommonCode('CNTCFWK', true)

  // 직원 분류: 본사/가맹점 기반 API 조회
  const { data: settingsData } = useEmployeeInfoSettings(
    {
      headOfficeId: filters.officeId ?? undefined,
      franchiseId: filters.franchiseId ?? undefined,
    },
    !!filters.officeId
  )
  const empClassList = settingsData?.codeMemoContent?.EMPLOYEE ?? []

  const canFetchList = appliedFilters.officeId != null

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

  const { data: response, isPending: loading, error } = useAttendanceList(
    attendanceParams,
    canFetchList && Boolean(accessToken)
  )

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
        onPageChange={(nextPage) => setPage(nextPage)}
        onPageSizeChange={(size) => {
          if (size === pageSize) return
          setPageSize(size)
          setPage(0)
        }}
        onRowClick={(row) => {
          const params = new URLSearchParams()
          params.set('officeId', String(row.officeId))
          params.set('employeeId', String(row.employeeId))
          if (row.franchiseId != null) params.set('franchiseId', String(row.franchiseId))
          if (row.storeId != null) params.set('storeId', String(row.storeId))
          router.push(`/employee/attendance/detail?${params.toString()}`)
        }}
      />
    </div>
  )
}
