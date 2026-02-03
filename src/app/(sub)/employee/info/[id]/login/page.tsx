import Location from '@/components/ui/Location'
import EmployeeLoginEdit from '@/components/employee/employeeinfo/EmployeeLoginEdit'

interface EmployeeLoginEditPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeLoginEditPage({ params }: EmployeeLoginEditPageProps) {
  const { id } = await params
  const employeeId = parseInt(id, 10)

  return (
    <div className="data-wrap">
      <Location title="로그인 정보 및 권한" list={['홈', '직원 관리', '직원 정보 관리', '로그인 정보 및 권한']} />
      <EmployeeLoginEdit employeeId={employeeId} />
    </div>
  )
}
