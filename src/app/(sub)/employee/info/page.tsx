'use client'
import { useState, useMemo } from 'react'
import Location from '@/components/ui/Location'
import EmployeeSearch from '@/components/employee/employeeinfo/EmployeeSearch'
import EmployeeList from '@/components/employee/employeeinfo/EmployeeList'
import { useEmployeeInfoList } from '@/hooks/queries/use-employee-queries'
import { useEmployeeInfoSettings } from '@/hooks/queries/use-employee-settings-queries'
import type { EmployeeSearchParams } from '@/types/employee'
import type { ClassificationItem } from '@/lib/api/employeeInfoSettings'

// 코드-이름 매핑 타입
type CodeNameMap = Record<string, string>

export default function EmployeePage() {
  // 검색 파라미터
  const [searchParams, setSearchParams] = useState<EmployeeSearchParams>({
    page: 0,
    size: 50
  })

  // TanStack Query로 직원 목록 조회
  const {
    data: employeeData,
    isPending: isLoading,
    refetch
  } = useEmployeeInfoList(searchParams)

  // TanStack Query로 직원 분류 공통코드 조회
  const { data: settingsData } = useEmployeeInfoSettings()

  // 코드-이름 매핑 메모이제이션
  const employeeCodeMap = useMemo<CodeNameMap>(() => {
    if (!settingsData?.codeMemoContent?.EMPLOYEE) return {}
    const empMap: CodeNameMap = {}
    settingsData.codeMemoContent.EMPLOYEE.forEach((item: ClassificationItem) => {
      empMap[item.code] = item.name
    })
    return empMap
  }, [settingsData])

  const contractCodeMap = useMemo<CodeNameMap>(() => ({
    'CNTCFWK_001': '정직원',
    'CNTCFWK_002': '파트타이머',
    'CNTCFWK_003': '기타'
  }), [])

  // 검색 실행
  const handleSearch = (params: Omit<EmployeeSearchParams, 'page' | 'size'>) => {
    const newParams = { ...params, page: 0, size: searchParams.size }
    setSearchParams(newParams)
  }

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  // 페이지 사이즈 변경
  const handlePageSizeChange = (size: number) => {
    setSearchParams(prev => ({ ...prev, page: 0, size }))
  }

  // 초기화
  const handleReset = () => {
    setSearchParams({ page: 0, size: searchParams.size })
  }

  // 코드를 이름으로 변환한 직원 목록
  const employees = employeeData?.content ?? []
  const employeesWithNames = employees.map((emp) => ({
    ...emp,
    employeeClassificationName: emp.employeeClassificationName ||
      (emp.employeeClassification ? employeeCodeMap[emp.employeeClassification] : null) ||
      emp.employeeClassification,
    contractClassificationName: emp.contractClassificationName ||
      (emp.contractClassification ? contractCodeMap[emp.contractClassification] : null) ||
      emp.contractClassification
  }))

  return (
    <>
      <Location title="직원 정보 관리" list={['홈', '직원 관리', '직원 정보 관리']} />
      <EmployeeSearch
        onSearch={handleSearch}
        onReset={handleReset}
        totalCount={employeeData?.totalElements ?? 0}
      />
      <EmployeeList
        employees={employeesWithNames}
        isLoading={isLoading}
        currentPage={employeeData?.number ?? 0}
        totalPages={employeeData?.totalPages ?? 0}
        pageSize={searchParams.size || 50}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() => refetch()}
      />
    </>
  )
}
