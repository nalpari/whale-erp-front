import { Suspense } from 'react'
import Location from '@/components/ui/Location'
import DailySales from '@/components/finance/DailySales'

export default function DailySalesPage() {
  return (
    <div className="data-wrap">
      <Location title="일별 매출조회" list={['재무 관리', '신용카드매출조회', '일별 매출조회']} />
      <Suspense fallback={null}>
        <DailySales />
      </Suspense>
    </div>
  )
}
