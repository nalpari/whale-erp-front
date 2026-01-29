import Location from '@/components/ui/Location'
import ProgramList from '@/components/program/ProgramList'

export default function ProgramManagePage() {
  return (
    <div className="data-wrap">
      <Location title="프로그램 관리" list={['시스템 관리', '프로그램 관리']} />
      <ProgramList />
    </div>
  )
}
