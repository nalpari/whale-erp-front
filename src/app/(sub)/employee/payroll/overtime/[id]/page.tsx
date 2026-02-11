'use client'
import { use } from 'react'
import Location from '@/components/ui/Location'
import OvertimePayStub from '@/components/employee/payroll/OvertimePayStub'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OvertimePayrollDetailPage({ params }: PageProps) {
  const { id } = use(params)

  return (
    <>
      <Location title="연장근무 수당명세서 상세" list={['홈', '직원 관리', '급여 명세서', '연장근무 수당명세서', '상세']} />
      <OvertimePayStub id={id} isEditMode={false} />
    </>
  )
}
