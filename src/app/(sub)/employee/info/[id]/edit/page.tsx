import Location from '@/components/ui/Location'
import EmployeeEdit from '@/components/employee/employeeinfo/EmployeeEdit'

interface EmployeeEditPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeEditPage({ params }: EmployeeEditPageProps) {
  const { id } = await params
  const employeeId = parseInt(id, 10)

  return (
    <div className="data-wrap">
      <Location title="직원 정보 수정" list={['홈', '직원 관리', '직원 정보 관리', '직원 정보 수정']} />
      <EmployeeEdit employeeId={employeeId} />
    </div>
  )
}
