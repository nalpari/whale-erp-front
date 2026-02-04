'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import PartTimePayStub from '@/components/employee/payroll/PartTimePayStub'

function PartTimePayrollNewContent() {
  const searchParams = useSearchParams()
  const fromWorkTime = searchParams.get('fromWorkTime') === 'true'

  return (
    <>
      <Location title="파트타이머 급여명세서 신규 등록" list={['홈', '직원 관리', '급여 명세서', '파트타이머 급여명세서', '신규 등록']} />
      <PartTimePayStub id="new" isEditMode={true} fromWorkTimeEdit={fromWorkTime} />
    </>
  )
}

export default function PartTimePayrollNewPage() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <PartTimePayrollNewContent />
    </Suspense>
  )
}
