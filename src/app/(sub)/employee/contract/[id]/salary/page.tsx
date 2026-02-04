import { notFound } from 'next/navigation'
import Location from '@/components/ui/Location'
import EmployContractSalaryEdit from '@/components/employee/employcontract/EmployContractSalaryEdit'

interface EmployContractSalaryPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployContractSalaryPage({ params }: EmployContractSalaryPageProps) {
  const { id } = await params
  const contractId = parseInt(id, 10)

  if (Number.isNaN(contractId)) {
    notFound()
  }

  return (
    <div className="data-wrap">
      <Location title="근로 계약 관리" list={['홈', '직원 관리', '근로 계약 관리', '급여 정보 수정']} />
      <EmployContractSalaryEdit contractId={contractId} />
    </div>
  )
}
