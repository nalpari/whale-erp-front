'use client'
import { use } from 'react'
import Location from '@/components/ui/Location'
import PartTimePayStub from '@/components/employee/payroll/PartTimePayStub'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PartTimePayrollDetailPage({ params }: PageProps) {
  const { id } = use(params)

  return (
    <>
      <Location title="파트타이머 급여명세서 상세" list={['홈', '직원 관리', '급여 명세서', '파트타이머 급여명세서', '상세']} />
      <PartTimePayStub id={id} />
    </>
  )
}
