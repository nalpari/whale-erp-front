'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useSubscribePlan } from '@/hooks/queries/use-plans-queries'
import { useAlert } from '@/components/common/ui'
import { getErrorMessage, getSafeErrorLog } from '@/lib/api'

/**
 * 프론트 요금제 ID → subscription_plans.id 하드코딩 매핑
 * ⚠️ DB의 subscription_plans 테이블 ID가 변경되면 반드시 이 매핑도 업데이트해야 한다.
 */
const PLAN_DB_ID_MAP: Record<string, number> = {
  free: 1,
  standard: 4,
  enterprise: 2,
  franchise: 3,
}

/**
 * 요금제 등급 서열 (숫자가 클수록 상위 플랜).
 * 다운그레이드 판정에 사용 — RATE_PLANS의 화면 표시 순서와 분리해 관리한다.
 * (RATE_PLANS 배열을 재정렬해도 등급 서열 판정이 영향받지 않도록 함)
 */
const PLAN_RANK: Record<string, number> = {
  free: 0,
  standard: 1,
  enterprise: 2,
  franchise: 3,
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

/** DB ID → 프론트 요금제 ID 역매핑 (auth store의 subscriptionPlan으로 현재 구독 카드 식별) */
const DB_ID_TO_PLAN_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(PLAN_DB_ID_MAP).map(([frontId, dbId]) => [dbId, frontId])
)

export default function RatePlan() {
  const subscriptionPlan = useAuthStore((state) => state.subscriptionPlan)
  const accountType = useAuthStore((state) => state.accountType)
  const subscribeMutation = useSubscribePlan()
  const { alert, confirm } = useAlert()

  const subscribedPlanId = useMemo(() => {
    if (subscriptionPlan === 0) return null
    return DB_ID_TO_PLAN_MAP[subscriptionPlan] ?? null
  }, [subscriptionPlan])

  const handleSubscribe = async (planFrontId: string) => {
    // 본사 BP만 요금제 선택 가능 — 백엔드 가드(ERR10005)와 동일 정책을 FE에서 선차단해
    // 불필요한 confirm → subscribe API → 403 왕복을 제거한다. (백엔드 가드는 최종 방어선으로 유지)
    if (accountType !== 'HEAD_OFFICE') {
      await alert('본사 BP 계정만 요금제를 선택할 수 있습니다.')
      return
    }

    const dbId = PLAN_DB_ID_MAP[planFrontId]
    if (dbId == null) {
      console.error(`[RatePlan] PLAN_DB_ID_MAP에 "${planFrontId}" 키가 없습니다.`)
      await alert('선택하신 요금제를 처리할 수 없습니다. 관리자에게 문의해주세요.')
      return
    }

    const planLabel = RATE_PLANS.find((p) => p.id === planFrontId)?.grade ?? planFrontId

    // 다운그레이드(하위 요금제로 변경) 판정: PLAN_RANK 서열(free<standard<enterprise<franchise) 비교
    const targetRank = PLAN_RANK[planFrontId] ?? -1
    const currentRank = subscribedPlanId ? PLAN_RANK[subscribedPlanId] ?? -1 : -1

    // 대상 플랜 서열을 못 찾으면 PLAN_DB_ID_MAP↔PLAN_RANK 상수 불일치 —
    // dbId 검사는 통과했으므로 두 상수의 키 누락을 의미한다. 조용히 넘기지 않고 로깅한다.
    if (targetRank < 0) {
      console.error(
        `[RatePlan] 대상 플랜 "${planFrontId}"의 서열을 PLAN_RANK에서 찾을 수 없어 다운그레이드 판정을 건너뜁니다.`
      )
    }

    // 구독 플랜은 있는데 서열을 못 찾으면 데이터 불일치 — 조용히 넘기지 않고 로깅한다
    if (subscribedPlanId && currentRank < 0) {
      console.error(
        `[RatePlan] 현재 구독 플랜 "${subscribedPlanId}"의 서열을 PLAN_RANK에서 찾을 수 없어 다운그레이드 판정을 건너뜁니다.`
      )
    }

    const isDowngrade = currentRank >= 0 && targetRank >= 0 && targetRank < currentRank

    const confirmMessage = isDowngrade
      ? `${planLabel} 요금제로 변경하시겠습니까? 하위 요금제로 변경 시 기존 초과분은 유지되나 신규 등록이 제한됩니다.`
      : `${planLabel} 요금제를 구독하시겠습니까?`
    const confirmed = await confirm(confirmMessage)
    if (!confirmed) return

    try {
      await subscribeMutation.mutateAsync(dbId)
      await alert('요금제 구독이 완료되었습니다.')
    } catch (err) {
      console.error('[RatePlan] 구독 실패:', getSafeErrorLog(err))
      await alert(getErrorMessage(err, '요금제 구독에 실패했습니다. 다시 시도해주세요.'))
    }
  }

  return (
    <div className="content-wrap">
      <div className="rate-plan-wrap">
        {RATE_PLANS.map((plan) => {
          return (
          <div
            key={plan.id}
            className={`rate-plan-item${subscribedPlanId === plan.id ? ' use' : ''}`}
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
                {/*
                  ⚠️ 결제 시스템 미구현 — 테스트를 위해 Free 외 요금제
                  (Standard/Enterprise/Franchise)의 '준비중' 비활성 처리를 임시 해제하고
                  모든 요금제를 '구독 하기'로 노출한다. (handleSubscribe / useSubscribePlan은
                  PLAN_DB_ID_MAP에 4개 플랜이 모두 매핑되어 있어 그대로 동작한다.)
                  결제 시스템 도입 시 아래 분기를 다시 복원할 것:

                  {subscribedPlanId === plan.id ? (
                    <div className="service-btn block use-plan">이용중</div>
                  ) : plan.id !== 'free' ? (
                    <button
                      type="button"
                      className="service-btn block"
                      style={{ cursor: 'not-allowed', opacity: 0.5 }}
                      disabled
                    >
                      준비중
                      <i className="icon-subscribe" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="service-btn block"
                      style={{ cursor: 'pointer' }}
                      disabled={subscribeMutation.isPending}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      구독 하기
                      <i className="icon-subscribe" />
                    </button>
                  )}
                */}
                {subscribedPlanId === plan.id ? (
                  <div className="service-btn block use-plan">이용중</div>
                ) : (
                  <button
                    type="button"
                    className="service-btn block"
                    style={{ cursor: 'pointer' }}
                    disabled={subscribeMutation.isPending}
                    onClick={() => handleSubscribe(plan.id)}
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
          )
        })}
      </div>
    </div>
  )
}
