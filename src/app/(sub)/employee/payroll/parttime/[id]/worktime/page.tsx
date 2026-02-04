'use client'
import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import PartTimeWorkTimeEdit from '@/components/employee/payroll/PartTimeWorkTimeEdit'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PartTimeWorkTimeEditPage({ params }: PageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()

  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const employeeInfoId = searchParams.get('employeeInfoId') || ''
  const payrollMonth = searchParams.get('payrollMonth') || ''

  return (
    <>
      <Location title="파트타이머 근무시간 수정" list={['홈', '직원 관리', '급여 명세서', '파트타이머 급여명세서', '근무시간 수정']} />
      <PartTimeWorkTimeEdit
        id={id}
        startDate={startDate}
        endDate={endDate}
        employeeInfoId={employeeInfoId}
        payrollMonth={payrollMonth}
      />
    </>
  )
}
