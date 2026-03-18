'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AttendanceSearch from '@/components/employee/attendance/AttendanceSearch'
import { DEFAULT_ATTENDANCE_FILTERS, type AttendanceSearchFilters } from '@/components/employee/attendance/AttendanceSearch'
import AttendanceList from '@/components/employee/attendance/AttendanceList'
import Location from '@/components/ui/Location'
import { useAttendanceList, useBpHeadOfficeTree } from '@/hooks/queries'
import { useEmployeeInfoSettings } from '@/hooks/queries/use-employee-settings-queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { useAuthStore } from '@/stores/auth-store'
import { isAutoSelectAccount } from '@/constants/owner-code'
import type { AttendanceListParams } from '@/types/attendance'
import { useQueryError } from '@/hooks/useQueryError'

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
  const ownerCode = useAuthStore((s) => s.ownerCode)
  const affiliationId = useAuthStore((s) => s.affiliationId)
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree = [] } = useBpHeadOfficeTree(isReady)

  // ownerCode 기반 자동 선택 판단 + Zustand 하이드레이션 전 bpTree 구조 fallback
  const autoSelect = ownerCode
    ? isAutoSelectAccount(ownerCode)
    : bpTree.length === 1

  // 로컬 상태 (sessionStorage 저장 없음)
  const [filters, setFilters] = useState<AttendanceSearchFilters>(DEFAULT_ATTENDANCE_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AttendanceSearchFilters>(DEFAULT_ATTENDANCE_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // 본사/가맹점 계정: bp-tree auto-select 후 첫 진입 시 목록 자동 조회
  // 플랫폼(관리자) 계정: 검색 버튼 클릭 시에만 조회
  // appliedFilters가 아직 초기 상태이고 filters에 officeId가 채워지면 파생값으로 대체
  // useMemo: React Compiler 자동 메모이제이션과 충돌 방지를 위해 명시적 의존성 선언
  const effectiveAppliedFilters = useMemo(
    () =>
      autoSelect && filters.officeId != null && appliedFilters.officeId == null
        ? filters
        : appliedFilters,
    [autoSelect, filters, appliedFilters]
  )

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

  const canFetchList = effectiveAppliedFilters.officeId != null

  const attendanceParams: AttendanceListParams = {
    officeId: effectiveAppliedFilters.officeId ?? undefined,
    franchiseId: effectiveAppliedFilters.franchiseId ?? undefined,
    storeId: effectiveAppliedFilters.storeId ?? undefined,
    status:
      effectiveAppliedFilters.workStatus === 'ALL' ? undefined : effectiveAppliedFilters.workStatus,
    employeeName: effectiveAppliedFilters.employeeName || undefined,
    dayType: effectiveAppliedFilters.workDays.length > 0 ? effectiveAppliedFilters.workDays : undefined,
    employeeClassify:
      effectiveAppliedFilters.employeeClassification === 'ALL'
        ? undefined
        : effectiveAppliedFilters.employeeClassification,
    contractClassify:
      effectiveAppliedFilters.contractClassification === 'ALL'
        ? undefined
        : effectiveAppliedFilters.contractClassification,
    page,
    size: pageSize,
  }

  const { data: response, isFetching: loading, error: queryError } = useAttendanceList(
    attendanceParams,
    canFetchList && Boolean(accessToken)
  )
  const errorMessage = useQueryError(queryError)

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  const handleReset = () => {
    setFilters(DEFAULT_ATTENDANCE_FILTERS)
  }

  const handleRemoveFilter = (key: string) => {
    const resetMap: Record<string, Partial<AttendanceSearchFilters>> = {
      office: { officeId: null, franchiseId: null, storeId: null },
      franchise: { franchiseId: null, storeId: null },
      store: { storeId: null },
      workStatus: { workStatus: 'ALL' },
      employeeName: { employeeName: '' },
      workDays: { workDays: [] },
      employeeClassification: { employeeClassification: 'ALL' },
      contractClassification: { contractClassification: 'ALL' },
    }
    const patch = resetMap[key]
    if (!patch) return
    const nextFilters = { ...effectiveAppliedFilters, ...patch }
    setFilters(nextFilters)
    // 필수값(office) 제거 시 appliedFilters는 유지 → 목록 데이터 보존
    if (key === 'office') return
    setAppliedFilters(nextFilters)
    setPage(0)
  }

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  return (
    <div className="data-wrap">
      <Location title="근태 기록" list={BREADCRUMBS} />
      <AttendanceSearch
        filters={filters}
        appliedFilters={effectiveAppliedFilters}
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
        onRemoveFilter={handleRemoveFilter}
      />
      <AttendanceList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        error={errorMessage}
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
