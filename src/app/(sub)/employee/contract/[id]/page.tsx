import { notFound } from 'next/navigation'
import Location from '@/components/ui/Location'
import EmployContractDetailData from '@/components/employee/employcontract/EmployContractDetailData'

interface EmployContractDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployContractDetailPage({ params }: EmployContractDetailPageProps) {
  const { id } = await params
  const contractId = parseInt(id, 10)

  if (Number.isNaN(contractId)) {
    notFound()
  }

  return (
    <div className="data-wrap">
      <Location title="근로 계약 상세 정보" list={['홈', '직원 관리', '근로 계약 관리', '근로 계약 상세 정보']} />
      <EmployContractDetailData contractId={contractId} />
    </div>
  )
}
