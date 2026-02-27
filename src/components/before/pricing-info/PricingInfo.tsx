import Link from 'next/link'
import SubPageHeader from '@/components/before/common/SubPageHeader'

interface PlanFeatureGroup {
  title: string
  items: string[]
  additional?: boolean
}

interface Plan {
  grade: string
  function: string
  explain: string
  cost: string
  isCurrentPlan?: boolean
  features: PlanFeatureGroup[]
}

const PLANS: Plan[] = [
  {
    grade: 'Free',
    function: '평생 무료',
    explain: '1개 점포에 5명의 직원이 무료로 사용하는 기본 운영 플랜',
    cost: '0원',
    features: [
      {
        title: '매장운영 (기본기능)',
        items: ['점포수 1개', '직원수 5명', '메뉴 관리', '가격 관리', '카테고리 관리', '시설물 관리', '점검 관리', '출퇴근 관리'],
      },
    ],
  },
  {
    grade: 'Standard',
    function: '무료기능 + 재무 관리',
    explain: '5개 점포에 25명의 직원이 무료로 사용하는 비즈니스 운영 플랜',
    cost: '19,000원',
    features: [
      {
        title: 'Free 플랜 모든 기능 포함',
        items: ['기본 기능', '점포 최대 5개', '직원수 최대 25명', '재무 관리'],
      },
      {
        title: '추가 기능',
        items: ['재무 관리'],
        additional: true,
      },
    ],
  },
  {
    grade: 'Enterprise',
    function: 'STANDARD 기능 + 점포, 직원 무제한',
    explain: '점포수와 직원수에 제한이 없는 기업형 운영 플랜',
    cost: '39,000원',
    features: [
      {
        title: 'Standard 플랜 모든 기능 포함',
        items: ['점포 무제한 등록', '직원 무제한 등록'],
      },
      {
        title: '추가 기능',
        items: ['직원 무제한', '점포 무제한'],
        additional: true,
      },
    ],
  },
  {
    grade: 'Franchise',
    function: 'ENTERPRISE 기능 + 가맹점 관리기능',
    explain: '직영 점포 운영과 가맹점 운영에 적합한 프랜차이즈 운영 플랜',
    cost: '190,000원',
    features: [
      {
        title: 'Enterprise 플랜 모든 기능 포함',
        items: ['가맹점 관리', '계약 관리', '점검 관리', '마스터 상속 관리', '통합 관리'],
      },
      {
        title: '추가 기능',
        items: ['가맹점 관리', '계약 관리', '점검 관리', '마스터 상속 관리', '통합 관리'],
        additional: true,
      },
    ],
  },
]

export default function PricingInfo() {
  return (
    <div className="sub-wrap">
      <div className="sub-wrap-inner">
        <SubPageHeader
          smallTitle="Whale ERP Pricing"
          boldTitle="서비스 요금안내"
          normalTitle="시작은 가볍게, 성장은 확실하게"
          description="부담 없는 시작 꼭 필요한 기능들은 무료로 열려 있습니다."
          showButtons={false}
        />
        <div className="pricing-info-wrap">
          <div className="pricing-info-inner">
            <div className="rate-plan-wrap">
              {PLANS.map((plan) => (
                <div
                  className={`rate-plan-item${plan.isCurrentPlan ? ' use' : ''}`}
                  key={plan.grade}
                >
                  <div className="rate-plan-header">
                    <div className="plan-grade">{plan.grade}</div>
                    <div className="plan-function">{plan.function}</div>
                    <div className="plan-explain">{plan.explain}</div>
                  </div>
                  <div className="rate-plan-cost">
                    <div className="plan-cost-wrap">
                      <span className="plan-cost">{plan.cost}</span>
                      <span>/월</span>
                    </div>
                    <div className="plan-btn-wrap">
                      {plan.isCurrentPlan ? (
                        <div className="service-btn block use-plan">이용중</div>
                      ) : (
                        <Link href="/login?returnUrl=/customer/rate-plan" className="service-btn block">
                          구독 하기 <i className="icon-subscribe" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="plan-list-wrap">
                    {plan.features.map((group) => (
                      <div className="plan-list" key={group.title}>
                        <div className="plan-list-tit">{group.title}</div>
                        <ul className={`plan-item-list${group.additional ? ' additional' : ''}`}>
                          {group.items.map((item) => (
                            <li className="plan-list-item" key={item}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
