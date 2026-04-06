'use client'
import { use, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import OvertimePayStub from '@/components/employee/payroll/OvertimePayStub'
import { useOvertimePayrollDetail } from '@/hooks/queries/use-payroll-queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OvertimePayrollDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const fromWorkTimeEdit = searchParams.get('fromWorkTimeEdit') === 'true'
  const { isPending } = useOvertimePayrollDetail(parseInt(id))
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <Location title="연장근무 수당명세서 상세" list={['홈', '직원 관리', '급여 명세서', '연장근무 수당명세서', '상세']} />
      <OvertimePayStub
        key={isPending ? `${id}-loading` : `${id}-${refreshKey}`}
        id={id}
        isEditMode={false}
        fromWorkTimeEdit={fromWorkTimeEdit}
        onSaveSuccess={() => setRefreshKey(k => k + 1)}
      />
    </>
  )
}
