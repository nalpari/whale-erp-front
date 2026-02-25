'use client'

import { useSearchParams } from 'next/navigation'
import StorePromotionDetail from '@/components/master/pricing/store-promotion/StorePromotionDetail'
import { useStorePromotionDetail } from '@/hooks/queries'
import CubeLoader from '@/components/common/ui/CubeLoader'
import Location from '@/components/ui/Location'

const BREADCRUMBS = ['Home', '마스터', '가격 관리', '점포용 프로모션 가격 관리']

export default function StorePromotionDetailContent() {
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const promotionId = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null

  const { data: detail, isPending } = useStorePromotionDetail(promotionId)

  if (promotionId != null && isPending) {
    return (
      <div className="data-wrap">
        <Location title="점포용 프로모션 가격 관리" list={BREADCRUMBS} />
        <div className="cube-loader-overlay"><CubeLoader /></div>
      </div>
    )
  }

  return (
    <StorePromotionDetail
      key={promotionId ?? 'new'}
      promotionId={promotionId}
      initialData={detail ?? null}
    />
  )
}
