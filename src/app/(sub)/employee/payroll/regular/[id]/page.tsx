'use client'
import { use } from 'react'
import Location from '@/components/ui/Location'
import FullTimePayStub from '@/components/employee/payroll/FullTimePayStub'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function FullTimePayrollDetailPage({ params }: PageProps) {
  const { id } = use(params)

  return (
    <>
      <Location title="정직원 급여명세서 상세" list={['홈', '직원 관리', '급여 명세서', '정직원 급여명세서', '상세']} />
      <FullTimePayStub id={id} />
    </>
  )
}
