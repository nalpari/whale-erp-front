'use client'
import Location from '@/components/ui/Location'
import PartTimePayrollSearch from '@/components/employee/payroll/PartTimePayrollSearch'
import PartTimePayrollList from '@/components/employee/payroll/PartTimePayrollList'
import { usePartTimePayrollList } from '@/hooks/queries/use-payroll-queries'
import { useEmployeeClassifications } from '@/hooks/queries/use-employee-settings-queries'
import { usePartTimePayrollSearchStore } from '@/stores/search-stores'

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
  const store = usePartTimePayrollSearchStore()
  const sp = store.searchParams as SearchParams

  const { data: classifications = [] } = useEmployeeClassifications()
  const classificationMap = new Map<string, string>(
    classifications.map(item => [item.code, item.name])
  )

  const { data: payrollData, isPending: isLoading, refetch } = usePartTimePayrollList({
    page: store.page,
    size: store.pageSize,
    headOfficeId: sp.headOfficeId,
    franchiseStoreId: sp.franchiseId,
    storeId: sp.storeId,
    workStatus: sp.workStatus || undefined,
    memberName: sp.employeeName,
    workDays: sp.workDays,
    startDate: sp.startDate,
    endDate: sp.endDate
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
      payrollDate: payroll.paymentDate,
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
      <Location title="파트타이머 급여명세서" list={['홈', '직원 관리', '급여 명세서', '파트타이머 급여명세서']} />
      <PartTimePayrollSearch
        onSearch={handleSearch}
        onReset={handleReset}
        totalCount={totalCount}
      />
      <PartTimePayrollList
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
