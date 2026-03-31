'use client'
import { useAuthStore } from '@/stores/auth-store'
import { usePlansList } from '@/hooks/queries/use-plans-queries'

/** 월 요금 포맷 (39000 → "39,000원", null/undefined → "-") */
const formatPrice = (price: number | null | undefined) =>
  price != null ? `${price.toLocaleString()}원` : '-'

export default function MyPageTab02() {
  const subscriptionPlan = useAuthStore((state) => state.subscriptionPlan)
  const { data: plansData, isPending, isError } = usePlansList({ size: 100 }, subscriptionPlan > 0)

  const plan = plansData?.content?.find((p) => p.planId === subscriptionPlan) ?? null

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-500">데이터를 불러오는 중...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-500">구독 정보를 불러오는 데 실패했습니다.</span>
      </div>
    )
  }

  return (
    <div className="mypage-frame-wrap">
      <div className="mypage-frame-tit">
        <h2>파트너오피스</h2>
      </div>
      <div className="mypage-frame-content">
        <table className="mypage-main-table bold">
          <colgroup>
            <col />
            <col width="160px" />
            <col width="170px" />
            <col />
            <col />
            <col width="98px" />
          </colgroup>
          <thead>
            <tr>
              <th>플랜</th>
              <th>구독일</th>
              <th>이용요금(부가세포함)</th>
              <th>과금 주기</th>
              <th>결제수단</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {plan ? (
              <tr>
                <td>{plan.planTypeName}</td>
                <td>-</td>
                <td className="al-r">{formatPrice(plan.monthlyPrice)}</td>
                <td>월 과금</td>
                <td>신용카드</td>
                <td>
                  <button className="s-btn navy">해지</button>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={6} className="empty">구독 중인 플랜이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="sub-contents-wrap">
          <div className="sub-contents-tit">이용중인 부가서비스 <span>0건</span></div>
          <div className="myservice-wrap">
            <table className="mypage-sub-table">
              <thead>
                <tr>
                  <th>서비스</th>
                  <th>점포</th>
                  <th>구독일</th>
                  <th>이용요금(부가세포함)</th>
                  <th>과금주기</th>
                  <th>결제수단</th>
                  <th>판매수수료율</th>
                  <th>과금방법</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="empty" colSpan={9}>이용중인 서비스가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
