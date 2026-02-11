import Location from '@/components/ui/Location'
import AfterService from '@/components/customer/AfterService'

export default function AfterServicePage() {
  return (
    <div className="data-wrap">
      <Location title="부가서비스 신청" list={['고객지원', '부가서비스 신청']} />
      <AfterService />
    </div>
  )
}
