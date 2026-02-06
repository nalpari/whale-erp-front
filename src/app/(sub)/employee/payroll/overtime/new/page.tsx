'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import OvertimePayStub from '@/components/employee/payroll/OvertimePayStub'

function OvertimePayrollNewContent() {
  const searchParams = useSearchParams()
  const fromWorkTimeEdit = searchParams.get('fromWorkTimeEdit') === 'true'

  return (
    <>
      <Location title="연장근무 수당명세서 신규 등록" list={['홈', '직원 관리', '급여 명세서', '연장근무 수당명세서', '신규 등록']} />
      <OvertimePayStub id="new" isEditMode={true} fromWorkTimeEdit={fromWorkTimeEdit} />
    </>
  )
}

export default function OvertimePayrollNewPage() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <OvertimePayrollNewContent />
    </Suspense>
  )
}
