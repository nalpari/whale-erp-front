import Image from 'next/image'
import Link from 'next/link'
import SubPageHeader from '@/components/before/common/SubPageHeader'

const FRANCHISE_ITEMS = [
  {
    icon: '/assets/images/before_main/franchise_icon01.svg',
    title: '가맹점 관리',
    desc: '프랜차이즈 사업과 관련한 가맹점 정보를\n관리할 수 있습니다.',
  },
  {
    icon: '/assets/images/before_main/franchise_icon02.svg',
    title: '계약 관리',
    desc: '프랜차이즈 가맹점과 가맹 계약 및 물품공급\n계약 등 각종 계약 체결 기능을 지원합니다.',
  },
  {
    icon: '/assets/images/before_main/franchise_icon03.svg',
    title: '점검 관리',
    desc: '가맹점에 운영을 위한 각종 정기 점검 및 수시\n점검을 수행합니다.',
  },
  {
    icon: '/assets/images/before_main/franchise_icon04.svg',
    title: 'Master 관리',
    desc: '메뉴, 카테고리, 가격 등 각종 오더를 위한\nMaster 데이터를 관리하고, 가맹점에 배포합니다.',
  },
  {
    icon: '/assets/images/before_main/franchise_icon05.svg',
    title: '재무 관리',
    desc: '가맹점의 재무정보를 손쉽게 취합하여 관리합니다.',
  },
  {
    icon: '/assets/images/before_main/franchise_icon06.svg',
    title: '통합 관리',
    desc: 'WHALE ERP를 통해서 구독하고 있는 서비스를\n통합하여 관리할 수 있습니다.',
  },
]

export default function Franchise() {
  return (
    <div className="sub-wrap">
      <div className="sub-wrap-inner">
        <SubPageHeader
          boldTitle="고객의 서비스에 집중하세요."
          normalTitle="기본 기능을 무료로 이용하실 수 있습니다."
          description="점포의 관리에 필요한 불필요한 시간을 절약해 보세요."
        />
        <div className="franchise-wrap">
          <div className="sub-category-content">
            {FRANCHISE_ITEMS.map((item) => (
              <div className="sub-category-item" key={item.title}>
                <div className="operation-icon">
                  <Image src={item.icon} alt="operation" width={64} height={64} />
                </div>
                <div className="operation-tit">{item.title}</div>
                <div className="operation-desc">
                  {item.desc.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < item.desc.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="sub-category-item act">
              <div className="operation-icon">
                <Image
                  src="/assets/images/before_main/operation_icon09.svg"
                  alt="operation"
                  width={64}
                  height={64}
                />
              </div>
              <div className="operation-tit">
                Business Partner 가입하기
                <Link href="/login?returnUrl=/customer/rate-plan" className="operation-btn" aria-label="Business Partner 가입하기" />
              </div>
              <div className="operation-desc">
                WHALE ERP의 Business Partner에 가입하시고, 프랜차이즈 사업에 필요한 기능을 사용해 보세요.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
