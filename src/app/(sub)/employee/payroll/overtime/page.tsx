'use client'
import Location from '@/components/ui/Location'
import OvertimePayrollSearch from '@/components/employee/payroll/OvertimePayrollSearch'
import OvertimePayrollList from '@/components/employee/payroll/OvertimePayrollList'
import { useOvertimePayrollList } from '@/hooks/queries/use-payroll-queries'
import { useEmployeeClassifications } from '@/hooks/queries/use-employee-settings-queries'
import { useOvertimePayrollSearchStore } from '@/stores/search-stores'

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
  const store = useOvertimePayrollSearchStore()
  const sp = store.searchParams as SearchParams

  const { data: classifications = [] } = useEmployeeClassifications()
  const classificationMap = new Map<string, string>(
    classifications.map(item => [item.code, item.name])
  )

  const { data: payrollData, isPending: isLoading, refetch } = useOvertimePayrollList({
    page: store.page,
    size: store.pageSize,
    headOfficeId: sp.headOfficeId,
    franchiseStoreId: sp.franchiseId,
    storeId: sp.storeId,
    workStatus: sp.workStatus || undefined,
    memberName: sp.employeeName,
    workDays: sp.workDays,
    contractClassification: sp.employeeClassification,
    paymentStartDate: sp.startDate,
    paymentEndDate: sp.endDate
  })

  const payrolls = (payrollData?.content || []).map(payroll => {
    const classificationName = payroll.employeeClassificationName
      || (payroll.employeeClassification ? classificationMap.get(payroll.employeeClassification) : undefined)
      || payroll.employeeClassification
      || ''

    return {
      id: payroll.id,
      rowNumber: 0,
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
    store.setSearchParams(params as Record<string, unknown>)
    store.setPage(0)
    store.setHasSearched(true)
  }

  const handleReset = () => {
    store.reset()
  }

  const handlePageChange = (page: number) => {
    store.setPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    store.setPageSize(size)
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
        payrolls={store.hasSearched ? payrolls : []}
        isLoading={store.hasSearched && isLoading}
        currentPage={store.page}
        totalPages={totalPages}
        pageSize={store.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={refetch}
      />
    </>
  )
}
