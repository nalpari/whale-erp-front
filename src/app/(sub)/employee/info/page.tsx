'use client'
import { useMemo } from 'react'
import Location from '@/components/ui/Location'
import EmployeeSearch from '@/components/employee/employeeinfo/EmployeeSearch'
import EmployeeList from '@/components/employee/employeeinfo/EmployeeList'
import { useEmployeeInfoList } from '@/hooks/queries/use-employee-queries'
import { useEmployeeInfoSettings } from '@/hooks/queries/use-employee-settings-queries'
import { useEmployeeInfoSearchStore } from '@/stores/search-stores'
import type { EmployeeSearchParams } from '@/types/employee'
import type { ClassificationItem } from '@/lib/api/employeeInfoSettings'

type CodeNameMap = Record<string, string>

export default function EmployeePage() {
  const store = useEmployeeInfoSearchStore()

  const queryParams: EmployeeSearchParams = {
    ...store.searchParams,
    page: store.page,
    size: store.pageSize,
  }

  const {
    data: employeeData,
    isPending: isLoading,
    refetch
  } = useEmployeeInfoList(queryParams)

  const { data: settingsData } = useEmployeeInfoSettings()

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

  const handleSearch = (params: Omit<EmployeeSearchParams, 'page' | 'size'>) => {
    store.setSearchParams(params)
    store.setPage(0)
    store.setHasSearched(true)
  }

  const handlePageChange = (page: number) => {
    store.setPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    store.setPageSize(size)
  }

  const handleReset = () => {
    store.reset()
  }

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
        employees={store.hasSearched ? employeesWithNames : []}
        isLoading={store.hasSearched && isLoading}
        currentPage={employeeData?.number ?? 0}
        totalPages={employeeData?.totalPages ?? 0}
        pageSize={store.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() => refetch()}
      />
    </>
  )
}
