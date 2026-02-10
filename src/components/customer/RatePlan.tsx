'use client'

import { useState } from 'react'

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
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>('standard')

  return (
    <div className="content-wrap">
      <div className="rate-plan-wrap">
        {RATE_PLANS.map((plan) => (
          <div
            key={plan.id}
            role="button"
            tabIndex={0}
            className={`rate-plan-item${selectedPlanId === plan.id ? ' use' : ''}`}
            onClick={() => setSelectedPlanId(plan.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelectedPlanId(plan.id)
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
                  {plan.priceLabel.replace(/원\/월/g, '').trim()}
                </span>
                <span className="plan-cost plan-cost-unit">원</span>
                <span className="plan-cost-suffix">/월</span>
              </div>
              <div className="plan-btn-wrap">
                <button
                  type="button"
                  className="service-btn"
                  onClick={(e) => e.preventDefault()}
                  aria-disabled="true"
                  style={{ width: '100%', height: 48, borderRadius: 6 }}
                >
                  구독 하기
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M12 7v10M7 12h10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="plan-list">
              {plan.subtitle && (
                <>
                  <div className="plan-list-tit">{plan.subtitle}</div>
                  <ul className="plan-item-list">
                    {plan.basicFeatures.map((feature, idx) => (
                      <li key={idx} className="plan-list-item">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {plan.additionalFeatures.length > 0 && (
                <>
                  <div className="plan-list-tit">추가 기능</div>
                  <ul className="plan-item-list additional">
                    {plan.additionalFeatures.map((feature, idx) => (
                      <li key={idx} className="plan-list-item">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
