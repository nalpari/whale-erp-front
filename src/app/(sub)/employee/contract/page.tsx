'use client'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Location from '@/components/ui/Location'
import EmployContractSearch from '@/components/employee/employcontract/EmployContractSearch'
import EmployContractList, { type EmployContractRowData } from '@/components/employee/employcontract/EmployContractList'
import { useContractList } from '@/hooks/queries/use-contract-queries'
import { contractKeys, type ContractSearchParams } from '@/hooks/queries/query-keys'
import { useEmployContractSearchStore } from '@/stores/search-stores'
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
    electronicContract: header?.contractTypeName || '-',
    headOffice: contract.headOfficeOrganizationName || '-',
    franchise: contract.franchiseOrganizationName || '-',
    store: contract.storeName || '-',
    employeeName: contract.member?.name || contract.employeeInfoName || '-',
    contractClassification: header?.contractClassificationName || '-',
    workDays: workDaysDisplay,
    salaryDay: header?.salaryDay ? `${header.salaryDay}` : '-',
    contractDate: header?.contractStartDate || '-',
    contractEndDate: header?.contractEndDate || undefined
  }
}

export default function EmployContractPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const store = useEmployContractSearchStore()

  // TanStack Query로 목록 조회
  const { data: response, isPending: isLoading } = useContractList({
    ...store.searchParams as ContractSearchParams,
    page: store.page,
    size: store.pageSize
  })

  const contracts = (response?.content || []).map(mapContractToRowData)
  const totalCount = response?.totalElements || 0
  const totalPages = response?.totalPages || 0

  const handleSearch = useCallback((params: Record<string, unknown>) => {
    const { _timestamp: _, ...searchParamsOnly } = params
    queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
    store.setSearchParams(searchParamsOnly)
    store.setPage(0)
    store.setHasSearched(true)
  }, [queryClient, store])

  const handleReset = () => {
    store.reset()
  }

  const handlePageChange = (page: number) => {
    store.setPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    store.setPageSize(size)
  }

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
        contracts={store.hasSearched ? contracts : []}
        isLoading={store.hasSearched && isLoading}
        currentPage={store.page}
        totalPages={totalPages}
        pageSize={store.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRegister={handleRegister}
      />
    </>
  )
}
