import Location from '@/components/ui/Location'
import EmployeeCareerEdit from '@/components/employee/employeeinfo/EmployeeCareerEdit'

interface EmployeeCareerPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeCareerPage({ params }: EmployeeCareerPageProps) {
  const { id } = await params
  const employeeId = parseInt(id, 10)

  return (
    <div className="data-wrap">
      <Location title="경력 정보 관리" list={['홈', '직원 관리', '직원 정보 관리', '경력 정보 관리']} />
      <EmployeeCareerEdit employeeId={employeeId} />
    </div>
  )
}
