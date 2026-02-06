'use client'
import Location from '@/components/ui/Location'
import FullTimePayStub from '@/components/employee/payroll/FullTimePayStub'

export default function FullTimePayrollNewPage() {
  return (
    <>
      <Location title="정직원 급여명세서 신규 등록" list={['홈', '직원 관리', '급여 명세서', '정직원 급여명세서', '신규 등록']} />
      <FullTimePayStub id="new" isEditMode={true} />
    </>
  )
}
