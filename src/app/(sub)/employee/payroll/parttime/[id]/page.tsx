'use client'
import { use, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import PartTimePayStub from '@/components/employee/payroll/PartTimePayStub'
import { usePartTimePayrollDetail } from '@/hooks/queries/use-payroll-queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PartTimePayrollDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const fromWorkTimeEdit = searchParams.get('fromWorkTimeEdit') === 'true'
  const { isPending } = usePartTimePayrollDetail(parseInt(id))
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <Location title="파트타이머 급여명세서 상세" list={['홈', '직원 관리', '급여 명세서', '파트타이머 급여명세서', '상세']} />
      <PartTimePayStub
        key={isPending ? `${id}-loading` : `${id}-${refreshKey}`}
        id={id}
        fromWorkTimeEdit={fromWorkTimeEdit}
        onSaveSuccess={() => setRefreshKey(k => k + 1)}
      />
    </>
  )
}
