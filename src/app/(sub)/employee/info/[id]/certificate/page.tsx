import Location from '@/components/ui/Location'
import EmployeeCertificateEdit from '@/components/employee/employeeinfo/EmployeeCertificateEdit'

interface EmployeeCertificatePageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeCertificatePage({ params }: EmployeeCertificatePageProps) {
  const { id } = await params
  const employeeId = parseInt(id, 10)

  return (
    <div className="data-wrap">
      <Location title="자격증 정보 관리" list={['홈', '직원 관리', '직원 정보 관리', '자격증 정보 관리']} />
      <EmployeeCertificateEdit employeeId={employeeId} />
    </div>
  )
}
