'use client'
import { useState, useCallback } from 'react'
import Location from '@/components/ui/Location'
import FullTimePayrollSearch from '@/components/employee/payroll/FullTimePayrollSearch'
import FullTimePayrollList from '@/components/employee/payroll/FullTimePayrollList'
import { useFullTimePayrollList } from '@/hooks/queries/use-payroll-queries'
import { useEmployeeInfoCommonCode } from '@/hooks/queries/use-employee-settings-queries'

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
  const [searchParams, setSearchParams] = useState<SearchParams>({
    headOfficeId: 1,
    franchiseId: 2,
    storeId: 1
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // TanStack Query로 급여명세서 목록 조회
  const { data: payrollData, isPending: isLoading, refetch } = useFullTimePayrollList({
    page: currentPage,
    size: pageSize,
    headOfficeId: searchParams.headOfficeId,
    franchiseStoreId: searchParams.franchiseId,
    storeId: searchParams.storeId,
    workStatus: searchParams.workStatus || undefined,
    memberName: searchParams.employeeName,
    contractClassification: searchParams.employeeClassification,
    paymentStartDate: searchParams.startDate,
    paymentEndDate: searchParams.endDate
  })

  // 직원 분류 공통코드 조회
  const { data: commonCodeData } = useEmployeeInfoCommonCode(
    searchParams.headOfficeId,
    searchParams.franchiseId,
    !!searchParams.headOfficeId
  )

  // React 19: derived state
  const classificationMap = new Map<string, string>(
    (commonCodeData?.codeMemoContent?.EMPLOYEE || []).map(item => [item.code, item.name])
  )

  const payrolls = (payrollData?.content || []).map((payroll) => {
    const classificationName = payroll.employeeClassification
      ? classificationMap.get(payroll.employeeClassification) || payroll.employeeClassification
      : ''

    return {
      id: payroll.id,
      rowNumber: 0,
      workStatus: payroll.workStatus || '',
      headOffice: payroll.headOfficeName || '',
      franchise: payroll.franchiseName || '',
      store: payroll.storeName || '',
      employeeName: payroll.memberName,
      employeeClassification: classificationName,
      payrollDate: payroll.paymentDate,
      registrationDate: payroll.createdAt?.split('T')[0] || '',
      emailStatus: payroll.isEmailSend ? '전송 완료' : '이메일 전송'
    }
  })

  const totalCount = payrollData?.totalElements || 0
  const totalPages = payrollData?.totalPages || 0

  const handleSearch = useCallback((params: SearchParams) => {
    setSearchParams(params)
    setCurrentPage(0)
  }, [])

  const handleReset = useCallback(() => {
    setSearchParams({})
    setCurrentPage(0)
  }, [])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
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
        payrolls={payrolls}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={handleRefresh}
      />
    </>
  )
}
