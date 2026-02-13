'use client'

import { useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { usePlansList } from '@/hooks/queries/use-plans-queries'

/** planTypeCode(공통코드) → 프론트 요금제 ID 매핑 */
const PLAN_TYPE_CODE_MAP: Record<string, string> = {
  PLNTYP_001: 'free',
  PLNTYP_002: 'standard',
  PLNTYP_003: 'enterprise',
  PLNTYP_004: 'franchise',
}

/** 퍼블(https://pub.whaleerp.co.kr/rate-plan) 기준 요금제 카드 데이터 */
export interface RatePlanItem {
  id: string
  grade: string
  title: string
  subtitle: string
  description: string
  priceMonthly: number
  priceLabel: string
  basicFeatures: string[]
  additionalFeatures: string[]
}

const RATE_PLANS: RatePlanItem[] = [
  {
    id: 'free',
    grade: 'Free',
    title: '평생 무료',
    subtitle: '매장운영 (기본기능)',
    description: '1개 점포에 5명의 직원이 무료로 사용하는 기본 운영 플랜',
    priceMonthly: 0,
    priceLabel: '0원/월',
    basicFeatures: [
      '점포수 1개',
      '직원수 5명',
      '메뉴 관리',
      '가격 관리',
      '카테고리 관리',
      '시설물 관리',
      '점검 관리',
      '출퇴근 관리',
    ],
    additionalFeatures: [],
  },
  {
    id: 'standard',
    grade: 'Standard',
    title: '무료기능 + 재무 관리',
    subtitle: 'Free 플랜 모든 기능 포함',
    description: '5개 점포에 25명의 직원이 무료로 사용하는 비즈니스 운영 플랜',
    priceMonthly: 19000,
    priceLabel: '19,000원/월',
    basicFeatures: ['기본 기능', '점포 최대 5개', '직원수 최대 25명', '재무 관리'],
    additionalFeatures: ['재무 관리'],
  },
  {
    id: 'enterprise',
    grade: 'Enterprise',
    title: 'STANDARD 기능 + 점포, 직원 무제한',
    subtitle: 'Standard 플랜 모든 기능 포함',
    description: '점포수와 직원수에 제한이 없는 기업형 운영 플랜',
    priceMonthly: 39000,
    priceLabel: '39,000원/월',
    basicFeatures: ['점포 무제한 등록', '직원 무제한 등록'],
    additionalFeatures: ['직원 무제한', '점포 무제한'],
  },
  {
    id: 'franchise',
    grade: 'Franchise',
    title: 'ENTERPRISE기능 + 가맹점 관리기능',
    subtitle: 'Enterprise 플랜 모든 기능 포함',
    description: '직영 점포 운영과 가맹점 운영에 적합한 프랜차이즈 운영 플랜',
    priceMonthly: 190000,
    priceLabel: '190,000원/월',
    basicFeatures: [
      '가맹점 관리',
      '계약 관리',
      '점검 관리',
      '마스터 상속 관리',
      '통합 관리',
    ],
    additionalFeatures: [
      '가맹점 관리',
      '계약 관리',
      '점검 관리',
      '마스터 상속 관리',
      '통합 관리',
    ],
  },
]

export default function RatePlan() {
  const subscriptionPlan = useAuthStore((state) => state.subscriptionPlan)
  const { data: plansData } = usePlansList({ size: 100 })

  const subscribedPlanId = useMemo(() => {
    if (subscriptionPlan === 0 || !plansData?.content) return null
    const matched = plansData.content.find((p) => p.planId === subscriptionPlan)
    return matched ? PLAN_TYPE_CODE_MAP[matched.planTypeCode] ?? null : null
  }, [subscriptionPlan, plansData?.content])

  const [userSelectedPlanId, setUserSelectedPlanId] = useState<string | null>(null)
  const selectedPlanId = userSelectedPlanId ?? subscribedPlanId

  return (
    <div className="content-wrap">
      <div className="rate-plan-wrap">
        {RATE_PLANS.map((plan) => (
          <div
            key={plan.id}
            role="button"
            tabIndex={0}
            className={`rate-plan-item${selectedPlanId === plan.id ? ' use' : ''}`}
            onClick={() => setUserSelectedPlanId(plan.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setUserSelectedPlanId(plan.id)
              }
            }}
          >
            <div className="rate-plan-header">
              <div className="plan-grade">{plan.grade}</div>
              <div className="plan-function">{plan.title}</div>
              <div className="plan-explain">{plan.description}</div>
            </div>
            <div className="rate-plan-cost">
              <div className="plan-cost-wrap">
                <span className="plan-cost">
                  {plan.priceLabel.replace(/\/월/g, '').trim()}
                </span>
                <span>/월</span>
              </div>
              <div className="plan-btn-wrap">
                {subscribedPlanId === plan.id ? (
                  <div className="service-btn block use-plan">이용중</div>
                ) : (
                  <button
                    type="button"
                    className="service-btn block"
                    onClick={(e) => e.preventDefault()}
                    aria-disabled="true"
                  >
                    구독 하기
                    <i className="icon-subscribe" />
                  </button>
                )}
              </div>
            </div>
            <div className="plan-list-wrap">
              {plan.subtitle && (
                <div className="plan-list">
                  <div className="plan-list-tit">{plan.subtitle}</div>
                  <ul className="plan-item-list">
                    {plan.basicFeatures.map((feature, idx) => (
                      <li key={idx} className="plan-list-item">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.additionalFeatures.length > 0 && (
                <div className="plan-list">
                  <div className="plan-list-tit">추가 기능</div>
                  <ul className="plan-item-list additional">
                    {plan.additionalFeatures.map((feature, idx) => (
                      <li key={idx} className="plan-list-item">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
