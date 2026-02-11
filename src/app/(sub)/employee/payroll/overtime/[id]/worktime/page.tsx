'use client'
import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import OvertimeWorkTimeEdit from '@/components/employee/payroll/OvertimeWorkTimeEdit'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OvertimeWorkTimeEditPage({ params }: PageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()

  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const employeeInfoId = searchParams.get('employeeInfoId') || ''
  const payrollMonth = searchParams.get('payrollMonth') || ''

  return (
    <>
      <Location title="연장근무 근무시간 수정" list={['홈', '직원 관리', '급여 명세서', '연장근무 수당명세서', '근무시간 수정']} />
      <OvertimeWorkTimeEdit
        id={id}
        startDate={startDate}
        endDate={endDate}
        employeeInfoId={employeeInfoId}
        payrollMonth={payrollMonth}
      />
    </>
  )
}
