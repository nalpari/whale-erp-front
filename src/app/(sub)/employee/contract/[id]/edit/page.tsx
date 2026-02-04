import { notFound } from 'next/navigation'
import Location from '@/components/ui/Location'
import EmployContractEdit from '@/components/employee/employcontract/EmployContractEdit'

interface EmployContractEditPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployContractEditPage({ params }: EmployContractEditPageProps) {
  const { id } = await params
  const contractId = parseInt(id, 10)

  if (Number.isNaN(contractId)) {
    notFound()
  }

  return (
    <div className="data-wrap">
      <Location title="근로 계약 관리" list={['홈', '직원 관리', '근로 계약 관리', '근로 계약 수정']} />
      <EmployContractEdit contractId={contractId} />
    </div>
  )
}
