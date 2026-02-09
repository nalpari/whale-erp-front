import Location from '@/components/ui/Location'
import Notice from '@/components/customer/Notice'

export default function NoticePage() {
  return (
    <div className="data-wrap">
      <Location title="공지사항" list={['고객지원', '공지사항']} />
      <Notice />
    </div>
  )
}
