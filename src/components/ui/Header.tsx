import MyData from './common/MyData'
import ServiceTab from './common/ServiceTab'

export default function Header({
  onToggleMenuType,
}: {
  onToggleMenuType?: () => void
}) {
  return (
    <header>
      <div className="data-wrap">
        <ServiceTab onToggleMenuType={onToggleMenuType} />
        <MyData />
      </div>
    </header>
  )
}
