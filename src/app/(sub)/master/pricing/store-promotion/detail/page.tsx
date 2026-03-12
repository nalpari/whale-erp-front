import { Suspense } from 'react'
import CubeLoader from '@/components/common/ui/CubeLoader'
import StorePromotionDetailContent from '@/components/master/pricing/store-promotion/StorePromotionDetailContent'

export default function StorePromotionDetailPage() {
  return (
    <Suspense fallback={<div className="cube-loader-overlay"><CubeLoader /></div>}>
      <StorePromotionDetailContent />
    </Suspense>
  )
}
