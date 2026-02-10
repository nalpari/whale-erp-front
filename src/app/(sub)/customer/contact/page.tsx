import Location from '@/components/ui/Location'
import Contact from '@/components/customer/Contact'

export default function ContactPage() {
  return (
    <div className="data-wrap">
      <Location title="문의하기" list={['고객지원', '문의하기']} />
      <Contact />
    </div>
  )
}
