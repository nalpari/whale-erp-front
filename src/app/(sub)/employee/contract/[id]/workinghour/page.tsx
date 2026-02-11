import { notFound } from 'next/navigation'
import Location from '@/components/ui/Location'
import WorkingHours from '@/components/working/WorkingHours'

interface EmployContractWorkHourPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployContractWorkHourPage({ params }: EmployContractWorkHourPageProps) {
  const { id } = await params
  const contractId = parseInt(id, 10)

  if (Number.isNaN(contractId)) {
    notFound()
  }

  return (
    <div className="data-wrap">
      <Location title="근로 계약 관리" list={['홈', '직원 관리', '근로 계약 관리', '계약 근무 시간 수정']} />
      <WorkingHours contractId={contractId} />
    </div>
  )
}
