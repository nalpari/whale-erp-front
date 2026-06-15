import { Suspense } from 'react'
import Location from '@/components/ui/Location'
import MonthlySales from '@/components/finance/MonthlySales'

export default function MonthlySalesPage() {
  return (
    <div className="data-wrap">
      <Location title="월별 매출조회" list={['재무 관리', '신용카드매출조회', '월별 매출조회']} />
      <Suspense fallback={null}>
        <MonthlySales />
      </Suspense>
    </div>
  )
}
