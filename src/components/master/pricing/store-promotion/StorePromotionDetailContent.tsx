'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import StorePromotionDetail from '@/components/master/pricing/store-promotion/StorePromotionDetail'
import { useStorePromotionDetail } from '@/hooks/queries'
import CubeLoader from '@/components/common/ui/CubeLoader'
import Location from '@/components/ui/Location'

const BREADCRUMBS = ['Home', '마스터', '가격 관리', '점포용 프로모션 가격 관리']

export default function StorePromotionDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const parsedId = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null
  const promotionId = parsedId && parsedId > 0 ? parsedId : null

  const { data: detail, isPending, error } = useStorePromotionDetail(promotionId)

  if (promotionId != null && isPending) {
    return (
      <div className="data-wrap">
        <Location title="점포용 프로모션 가격 관리" list={BREADCRUMBS} />
        <div className="cube-loader-overlay"><CubeLoader /></div>
      </div>
    )
  }

  if (promotionId != null && error) {
    return (
      <div className="data-wrap">
        <Location title="점포용 프로모션 가격 관리" list={BREADCRUMBS} />
        <div className="warning-txt">프로모션 정보를 불러오는 데 실패했습니다.</div>
        <div className="contents-btn mt-4">
          <button className="btn-form gray" type="button" onClick={() => router.push('/master/pricing/store-promotion')}>
            목록으로 돌아가기
          </button>
        </div>
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
