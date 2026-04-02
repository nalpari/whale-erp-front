'use client'
import { use } from 'react'
import Location from '@/components/ui/Location'
import OvertimePayStub from '@/components/employee/payroll/OvertimePayStub'
import { useOvertimePayrollDetail } from '@/hooks/queries/use-payroll-queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OvertimePayrollDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { isPending } = useOvertimePayrollDetail(parseInt(id))

  return (
    <>
      <Location title="연장근무 수당명세서 상세" list={['홈', '직원 관리', '급여 명세서', '연장근무 수당명세서', '상세']} />
      <OvertimePayStub key={isPending ? `${id}-loading` : id} id={id} isEditMode={false} />
    </>
  )
}
