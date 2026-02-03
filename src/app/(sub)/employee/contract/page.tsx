'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Location from '@/components/ui/Location'
import EmployContractSearch from '@/components/employee/employcontract/EmployContractSearch'
import EmployContractList, { type EmployContractRowData } from '@/components/employee/employcontract/EmployContractList'
import { useContractList } from '@/hooks/queries/use-contract-queries'
import { contractKeys, type ContractSearchParams } from '@/hooks/queries/query-keys'
import type { EmploymentContractResponse } from '@/lib/api/employmentContract'

// API 응답을 리스트 컴포넌트용 데이터로 변환
const mapContractToRowData = (contract: EmploymentContractResponse): EmployContractRowData => {
  const header = contract.employmentContractHeader
  const workHours = contract.workHours || []

  // 근무 요일 계산
  const workDaysSet = new Set<string>()
  workHours.forEach(wh => {
    if (wh.isWork) {
      if (['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(wh.dayType)) {
        workDaysSet.add('평일')
      } else if (wh.dayType === 'SATURDAY') {
        workDaysSet.add('토')
      } else if (wh.dayType === 'SUNDAY') {
        workDaysSet.add('일')
      } else if (wh.dayType === 'WEEKDAY') {
        workDaysSet.add('평일')
      }
    }
  })
  const workDaysDisplay = Array.from(workDaysSet).join('/') || '-'

  // 전자계약 상태 표시 (electronicContractStatus는 enum 값)
  const electronicContractStatusMap: Record<string, string> = {
    'WRITING': '작성중',
    'PROGRESS': '진행중',
    'COMPLETE': '계약완료',
    'REFUSAL': '거절'
  }

  return {
    id: contract.id,
    workStatus: contract.workStatusName || contract.workStatus || '근무',
    contractStatus: header?.electronicContractStatus ? (electronicContractStatusMap[header.electronicContractStatus] || header.electronicContractStatus) : '작성중',
    electronicContract: header?.contractTypeName || '-', // 한글명 (전자계약, 서류계약)
    headOffice: contract.headOfficeOrganizationName || '-',
    franchise: contract.franchiseOrganizationName || '-',
    store: contract.storeName || '-',
    employeeName: contract.member?.name || contract.employeeInfoName || '-',
    contractClassification: header?.contractClassificationName || '-', // 한글명 (포괄연봉제 등)
    workDays: workDaysDisplay,
    employeeClassification: header?.contractClassificationName || '-', // 한글명
    salaryDay: header?.salaryDay ? `${header.salaryDay}` : '-',
    contractDate: header?.contractStartDate || '-',
    contractEndDate: header?.contractEndDate || undefined // 계약종료일
  }
}

export default function EmployContractPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // 검색 파라미터
  const [searchParams, setSearchParams] = useState<ContractSearchParams>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // TanStack Query로 목록 조회
  const { data: response, isPending: isLoading } = useContractList({
    ...searchParams,
    page: currentPage,
    size: pageSize
  })

  // React 19: 직접 계산 (derived state)
  const contracts = (response?.content || []).map(mapContractToRowData)
  const totalCount = response?.totalElements || 0
  const totalPages = response?.totalPages || 0

  // 검색 실행 - 캐시 무효화 후 새로 조회
  const handleSearch = useCallback((params: Record<string, unknown>) => {
    // _timestamp 제거 (캐시 무효화용으로만 사용)
    const { _timestamp: _, ...searchParamsOnly } = params

    // 기존 목록 캐시 무효화
    queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
    setSearchParams(searchParamsOnly as ContractSearchParams)
    setCurrentPage(0)
  }, [queryClient])

  // 초기화
  const handleReset = () => {
    setSearchParams({})
    setCurrentPage(0)
  }

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 페이지 사이즈 변경
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }

  // 등록 페이지로 이동
  const handleRegister = () => {
    router.push('/employee/contract/new')
  }

  return (
    <>
      <Location title="근로 계약 관리" list={['홈', '직원 관리', '근로 계약 관리']} />
      <EmployContractSearch
        onSearch={handleSearch}
        onReset={handleReset}
        totalCount={totalCount}
      />
      <EmployContractList
        contracts={contracts}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRegister={handleRegister}
      />
    </>
  )
}
