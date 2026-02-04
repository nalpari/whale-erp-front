'use client'
import { useState } from 'react'
import Location from '@/components/ui/Location'
import PartTimePayrollSearch from '@/components/employee/payroll/PartTimePayrollSearch'
import PartTimePayrollList from '@/components/employee/payroll/PartTimePayrollList'
import { usePartTimePayrollList } from '@/hooks/queries/use-payroll-queries'
import { useEmployeeClassifications } from '@/hooks/queries/use-employee-settings-queries'

interface SearchParams {
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
  workStatus?: string
  employeeName?: string
  workDays?: string[]
  startDate?: string
  endDate?: string
}

// 근무요일을 평일/토/일 형식으로 변환
function formatWorkDays(workDays: string | null | undefined): string {
  if (!workDays) return ''

  const days = workDays.split('/')
  const weekdays = ['월요일', '화요일', '수요일', '목요일', '금요일']
  const hasWeekday = days.some(day => weekdays.includes(day))
  const hasSaturday = days.includes('토요일')
  const hasSunday = days.includes('일요일')

  const result: string[] = []
  if (hasWeekday) result.push('평일')
  if (hasSaturday) result.push('토')
  if (hasSunday) result.push('일')

  return result.join('/')
}

export default function PartTimePayrollPage() {
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // 직원 분류 목록 조회
  const { data: classifications = [] } = useEmployeeClassifications()

  // React 19: derived state - 분류 맵 생성
  const classificationMap = new Map<string, string>(
    classifications.map(item => [item.code, item.name])
  )

  // 급여명세서 목록 조회
  const { data: payrollData, isPending: isLoading, refetch } = usePartTimePayrollList({
    page: currentPage,
    size: pageSize,
    headOfficeId: searchParams.headOfficeId,
    franchiseStoreId: searchParams.franchiseId,
    storeId: searchParams.storeId,
    workStatus: searchParams.workStatus || undefined,
    memberName: searchParams.employeeName,
    workDays: searchParams.workDays,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate
  })

  // React 19: derived state - 응답 데이터를 컴포넌트 데이터로 변환
  const payrolls = (payrollData?.content || []).map(payroll => {
    const classificationName = payroll.employeeClassification
      ? classificationMap.get(payroll.employeeClassification) || payroll.employeeClassification
      : ''

    return {
      id: payroll.id,
      rowNumber: 0, // PartTimePayrollList에서 재계산됨
      workStatus: payroll.workStatus || '',
      headOffice: payroll.headOfficeName || '',
      franchise: payroll.franchiseName || '',
      store: payroll.storeName || '',
      employeeName: payroll.memberName,
      employeeClassification: classificationName,
      workDays: formatWorkDays(payroll.workDays),
      payrollDate: payroll.paymentDate,
      registrationDate: payroll.createdAt?.split('T')[0] || '',
      emailStatus: payroll.isEmailSend ? '전송 완료' : '이메일 전송'
    }
  })

  const totalCount = payrollData?.totalElements || 0
  const totalPages = payrollData?.totalPages || 0

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params)
    setCurrentPage(0)
  }

  const handleReset = () => {
    setSearchParams({})
    setCurrentPage(0)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }

  return (
    <>
      <Location title="파트타이머 급여명세서" list={['홈', '직원 관리', '급여 명세서', '파트타이머 급여명세서']} />
      <PartTimePayrollSearch
        onSearch={handleSearch}
        onReset={handleReset}
        totalCount={totalCount}
      />
      <PartTimePayrollList
        payrolls={payrolls}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={refetch}
      />
    </>
  )
}
