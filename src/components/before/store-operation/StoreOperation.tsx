import Image from 'next/image'
import Link from 'next/link'
import SubPageHeader from '@/components/before/common/SubPageHeader'

const STORE_OPERATION_ITEMS = [
  {
    icon: '/assets/images/before_main/operation_icon01.svg',
    title: '매장운영',
    desc: '직원의 근무 계획을 수립하고, 근로계약서 체결과 급여명세서를 발급할 수 있습니다.',
  },
  {
    icon: '/assets/images/before_main/operation_icon02.svg',
    title: '출퇴근 관리',
    desc: '점포 근무 직원의 출퇴근을 관리하고\n급여명세서에 출퇴근 현황을 반영할 수 있습니다.',
  },
  {
    icon: '/assets/images/before_main/operation_icon03.svg',
    title: '점포 관리',
    desc: '점포 정보를 등록하고, 점포 단위로\n직원과 재무 정보를 관리할 수 있습니다.',
  },
  {
    icon: '/assets/images/before_main/operation_icon04.svg',
    title: '점검 관리',
    desc: '점포의 점검 템플릿을 등록하고\n정기/수시 점검을 실시 및 점검 결과를 관리합니다.',
  },
  {
    icon: '/assets/images/before_main/operation_icon05.svg',
    title: '시설물 관리',
    desc: '점포의 시설물 및 장비와 관련한 정보를 등록하고 각종 수리이력을 관리합니다.',
  },
  {
    icon: '/assets/images/before_main/operation_icon06.svg',
    title: '메뉴 관리',
    desc: '식당이나 카페에서 판매하는 메뉴를\n관리합니다.',
  },
  {
    icon: '/assets/images/before_main/operation_icon07.svg',
    title: '가격 관리',
    desc: '판매하는 메뉴에 대한 체계적인\n가격 정보를 관리합니다.',
  },
  {
    icon: '/assets/images/before_main/operation_icon08.svg',
    title: '카테고리 관리',
    desc: '메뉴를 구분할 카테고리 정보를 관리합니다.',
  },
]

export default function StoreOperation() {
  return (
    <div className="sub-wrap">
      <div className="sub-wrap-inner">
        <SubPageHeader
          boldTitle="고객의 서비스에 집중하세요."
          normalTitle="기본 기능을 무료로 이용하실 수 있습니다."
          description="점포의 관리에 필요한 불필요한 시간을 절약해 보세요."
        />
        <div className="store-operation-wrap">
          <div className="sub-category-content">
            {STORE_OPERATION_ITEMS.map((item) => (
              <div className="sub-category-item" key={item.title}>
                <div className="operation-icon">
                  <Image src={item.icon} alt="operation" width={64} height={64} />
                </div>
                <div className="operation-tit">{item.title}</div>
                <div className="operation-desc">
                  {(() => {
                    const lines = item.desc.split('\n')
                    return lines.map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < lines.length - 1 && <br />}
                      </span>
                    ))
                  })()}
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
              <div className="operation-tit">무료로 시작하기</div>
              <div className="operation-desc">WHALE ERP를 지금 시작해 보세요.</div>
              <Link href="/login?returnUrl=/customer/rate-plan" className="operation-btn" aria-label="무료로 시작하기" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
