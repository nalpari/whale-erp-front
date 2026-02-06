import Location from '@/components/ui/Location'
import EmployeeDetailData from '@/components/employee/employeeinfo/EmployeeDetailData'

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { id } = await params
  const employeeId = parseInt(id, 10)

  return (
    <div className="data-wrap">
      <Location title="직원 상세 정보" list={['홈', '직원 관리', '직원 정보 관리', '직원 상세 정보']} />
      <EmployeeDetailData employeeId={employeeId} />
    </div>
  )
}
