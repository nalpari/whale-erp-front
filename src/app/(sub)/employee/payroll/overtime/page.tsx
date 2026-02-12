'use client'
import { useState } from 'react'
import Location from '@/components/ui/Location'
import OvertimePayrollSearch from '@/components/employee/payroll/OvertimePayrollSearch'
import OvertimePayrollList from '@/components/employee/payroll/OvertimePayrollList'
import { useOvertimePayrollList } from '@/hooks/queries/use-payroll-queries'
import { useEmployeeClassifications } from '@/hooks/queries/use-employee-settings-queries'

interface SearchParams {
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
  workStatus?: string
  employeeName?: string
  workDays?: string[]
  employeeClassification?: string
  startDate?: string
  endDate?: string
}

// 근무요일을 평일/토요일/일요일로 변환
function formatWorkDays(workDays: string | null | undefined): string {
  if (!workDays) return ''

  const days = workDays.split('/')
  const weekdays = ['월요일', '화요일', '수요일', '목요일', '금요일']
  const result: string[] = []

  const hasAnyWeekday = weekdays.some(day => days.includes(day))

  if (hasAnyWeekday) {
    result.push('평일')
  }

  if (days.includes('토요일')) {
    result.push('토요일')
  }

  if (days.includes('일요일')) {
    result.push('일요일')
  }

  return result.join('/') || workDays
}

export default function OvertimePayrollPage() {
  // 검색 버튼 클릭 시에만 반영되는 파라미터 (초기화 시 API 호출 방지)
  const [appliedParams, setAppliedParams] = useState<SearchParams>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // 직원 분류 목록 조회 (employeeClassificationName이 null인 경우 fallback)
  const { data: classifications = [] } = useEmployeeClassifications()
  const classificationMap = new Map<string, string>(
    classifications.map(item => [item.code, item.name])
  )

  // 연장근무 수당명세서 목록 조회
  const { data: payrollData, isPending: isLoading, refetch } = useOvertimePayrollList({
    page: currentPage,
    size: pageSize,
    headOfficeId: appliedParams.headOfficeId,
    franchiseStoreId: appliedParams.franchiseId,
    storeId: appliedParams.storeId,
    workStatus: appliedParams.workStatus || undefined,
    memberName: appliedParams.employeeName,
    workDays: appliedParams.workDays,
    contractClassification: appliedParams.employeeClassification,
    paymentStartDate: appliedParams.startDate,
    paymentEndDate: appliedParams.endDate
  })

  // React 19: derived state - 응답 데이터를 컴포넌트 데이터로 변환
  const payrolls = (payrollData?.content || []).map(payroll => {
    const classificationName = payroll.employeeClassificationName
      || (payroll.employeeClassification ? classificationMap.get(payroll.employeeClassification) : undefined)
      || payroll.employeeClassification
      || ''

    return {
      id: payroll.id,
      rowNumber: 0, // OvertimePayrollList에서 재계산됨
      workStatus: payroll.workStatus || '',
      headOffice: payroll.headOfficeName || '',
      franchise: payroll.franchiseName || '',
      store: payroll.storeName || '',
      employeeName: payroll.memberName,
      employeeClassification: classificationName,
      workDays: formatWorkDays(payroll.workDays),
      payrollDate: payroll.paymentDate || '',
      registrationDate: payroll.createdAt?.split('T')[0] || '',
      emailStatus: payroll.isEmailSend ? '전송 완료' : '이메일 전송'
    }
  })

  const totalCount = payrollData?.totalElements || 0
  const totalPages = payrollData?.totalPages || 0

  const handleSearch = (params: SearchParams) => {
    setAppliedParams(params)
    setCurrentPage(0)
  }

  // 초기화 — appliedParams를 변경하지 않아 불필요한 API 호출 방지
  const handleReset = () => {
    // 검색 컴포넌트가 자체 formData를 리셋하므로 여기서는 목록 유지
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
      <Location title="연장근무 수당명세서" list={['홈', '직원 관리', '급여 명세서', '연장근무 수당명세서']} />
      <OvertimePayrollSearch
        onSearch={handleSearch}
        onReset={handleReset}
        totalCount={totalCount}
      />
      <OvertimePayrollList
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
