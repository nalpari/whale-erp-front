import { Suspense } from 'react'
import Location from '@/components/ui/Location'
import DailySaleDetail from '@/components/finance/DailySaleDetail'

export default function DailySaleDetailPage() {
  return (
    <div className="data-wrap">
      <Location title="일별 매출 상세조회" list={['재무 관리', '신용카드매출조회', '일별 매출 상세조회']} />
      <Suspense fallback={<div className="empty-data">불러오는 중...</div>}>
        <DailySaleDetail />
      </Suspense>
    </div>
  )
}
