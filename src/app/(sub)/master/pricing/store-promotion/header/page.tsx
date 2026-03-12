import { Suspense } from 'react'
import CubeLoader from '@/components/common/ui/CubeLoader'
import StorePromotionHeader from '@/components/master/pricing/store-promotion/StorePromotionHeader'

export default function StorePromotionHeaderPage() {
  return (
    <Suspense fallback={<div className="cube-loader-overlay"><CubeLoader /></div>}>
      <StorePromotionHeader />
    </Suspense>
  )
}
