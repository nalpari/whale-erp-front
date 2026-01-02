import MasterSearch from '@/components/masterlist/MasterSearch'
import Location from '@/components/ui/Location'
import MasterList from '@/components/masterlist/MasterList'

export default function BPMasterPage() {
  return (
    <div className="data-wrap">
      <Location title="Business Partner Master" list={['Master data 관리', 'Business Partner Master']} />
      <MasterSearch />
      <MasterList />
    </div>
  )
}
