'use client'
import { useCallback } from 'react'
import Location from '@/components/ui/Location'
import FullTimePayrollSearch from '@/components/employee/payroll/FullTimePayrollSearch'
import FullTimePayrollList from '@/components/employee/payroll/FullTimePayrollList'
import { useFullTimePayrollList } from '@/hooks/queries/use-payroll-queries'
import { useFullTimePayrollSearchStore } from '@/stores/search-stores'

interface SearchParams {
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
  workStatus?: string
  employeeName?: string
  employeeClassification?: string
  startDate?: string
  endDate?: string
}

export default function FullTimePayrollPage() {
  const store = useFullTimePayrollSearchStore()
  const sp = store.searchParams as SearchParams

  const { data: payrollData, isPending: isLoading, refetch } = useFullTimePayrollList({
    page: store.page,
    size: store.pageSize,
    headOfficeId: sp.headOfficeId,
    franchiseStoreId: sp.franchiseId,
    storeId: sp.storeId,
    workStatus: sp.workStatus || undefined,
    memberName: sp.employeeName,
    contractClassification: sp.employeeClassification,
    paymentStartDate: sp.startDate,
    paymentEndDate: sp.endDate
  })

  const payrolls = (payrollData?.content || []).map((payroll) => ({
    id: payroll.id,
    rowNumber: 0,
    workStatus: payroll.workStatus || '',
    headOffice: payroll.headOfficeName || '',
    franchise: payroll.franchiseName || '',
    store: payroll.storeName || '',
    employeeName: payroll.memberName,
    employeeClassification: payroll.employeeClassificationName || payroll.employeeClassification || '',
    payrollDate: payroll.paymentDate,
    registrationDate: payroll.createdAt?.split('T')[0] || '',
    emailStatus: payroll.isEmailSend ? '전송 완료' : '이메일 전송'
  }))

  const totalCount = payrollData?.totalElements || 0
  const totalPages = payrollData?.totalPages || 0

  const handleSearch = useCallback((params: SearchParams) => {
    store.setSearchParams(params as Record<string, unknown>)
    store.setPage(0)
    store.setHasSearched(true)
  }, [store])

  const handleReset = useCallback(() => {
    store.reset()
  }, [store])

  const handlePageChange = (page: number) => {
    store.setPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    store.setPageSize(size)
  }

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <>
      <Location title="정직원 급여명세서" list={['홈', '직원 관리', '급여 명세서', '정직원 급여명세서']} />
      <FullTimePayrollSearch
        onSearch={handleSearch}
        onReset={handleReset}
        totalCount={totalCount}
      />
      <FullTimePayrollList
        payrolls={store.hasSearched ? payrolls : []}
        isLoading={store.hasSearched && isLoading}
        currentPage={store.page}
        totalPages={totalPages}
        pageSize={store.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={handleRefresh}
      />
    </>
  )
}
