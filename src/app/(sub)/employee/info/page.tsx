'use client'
import { useState, useEffect, useCallback } from 'react'
import Location from '@/components/ui/Location'
import EmployeeSearch from '@/components/employee/employeeinfo/EmployeeSearch'
import EmployeeList from '@/components/employee/employeeinfo/EmployeeList'
import { getEmployeeList } from '@/lib/api/employee'
import { getEmployeeInfoCommonCode, type ClassificationItem } from '@/lib/api/employeeInfoSettings'
import type { EmployeeSearchParams, EmployeeListItem } from '@/types/employee'

// 코드-이름 매핑 타입
type CodeNameMap = Record<string, string>

export default function EmployeePage() {
  // 검색 파라미터
  const [searchParams, setSearchParams] = useState<EmployeeSearchParams>({
    page: 0,
    size: 50
  })

  // 목록 데이터
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // 코드-이름 매핑
  const [employeeCodeMap, setEmployeeCodeMap] = useState<CodeNameMap>({})
  const [contractCodeMap, setContractCodeMap] = useState<CodeNameMap>({})

  // 코드 매핑 데이터 조회
  const fetchCodeMappings = useCallback(async () => {
    try {
      const commonCode = await getEmployeeInfoCommonCode()
      if (commonCode?.codeMemoContent) {
        // 직원 분류 코드 매핑
        const empMap: CodeNameMap = {}
        commonCode.codeMemoContent.EMPLOYEE?.forEach((item: ClassificationItem) => {
          empMap[item.code] = item.name
        })
        setEmployeeCodeMap(empMap)

        // 계약 분류는 시스템 공통코드에서 관리 (하드코딩)
        setContractCodeMap({
          'CNTCFWK_001': '정직원',
          'CNTCFWK_002': '파트타이머',
          'CNTCFWK_003': '기타'
        })
      }
    } catch (error) {
      console.error('코드 매핑 조회 실패:', error)
    }
  }, [])

  // 데이터 조회
  const fetchEmployees = useCallback(async (params: EmployeeSearchParams) => {
    try {
      setIsLoading(true)
      const response = await getEmployeeList(params)
      setEmployees(response.content)
      setTotalElements(response.totalElements)
      setTotalPages(response.totalPages)
      setCurrentPage(response.number)
    } catch (error) {
      console.error('직원 목록 조회 실패:', error)
      // API 연결 전 더미 데이터 표시
      setEmployees([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 초기 로딩
  useEffect(() => {
    fetchCodeMappings()
    fetchEmployees(searchParams)
  }, [])

  // 검색 실행
  const handleSearch = (params: Omit<EmployeeSearchParams, 'page' | 'size'>) => {
    const newParams = { ...params, page: 0, size: searchParams.size }
    setSearchParams(newParams)
    fetchEmployees(newParams)
  }

  // 페이지 변경
  const handlePageChange = (page: number) => {
    const newParams = { ...searchParams, page }
    setSearchParams(newParams)
    fetchEmployees(newParams)
  }

  // 페이지 사이즈 변경
  const handlePageSizeChange = (size: number) => {
    const newParams = { ...searchParams, page: 0, size }
    setSearchParams(newParams)
    fetchEmployees(newParams)
  }

  // 초기화
  const handleReset = () => {
    const newParams: EmployeeSearchParams = { page: 0, size: searchParams.size }
    setSearchParams(newParams)
    fetchEmployees(newParams)
  }

  // 코드를 이름으로 변환한 직원 목록
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
        totalCount={totalElements}
      />
      <EmployeeList
        employees={employeesWithNames}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={searchParams.size || 50}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() => fetchEmployees(searchParams)}
      />
    </>
  )
}
