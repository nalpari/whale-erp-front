import Location from '@/components/ui/Location'
import RatePlan from '@/components/customer/RatePlan'

export default function RatePlanPage() {
  return (
    <div className="data-wrap">
      <Location title="요금안내/변경" list={['고객지원', '요금안내/변경']} />
      <RatePlan />
    </div>
  )
}
