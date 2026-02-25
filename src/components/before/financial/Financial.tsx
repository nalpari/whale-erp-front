import Image from 'next/image'
import Link from 'next/link'
import SubPageHeader from '@/components/before/common/SubPageHeader'

const FINANCIAL_ITEMS = [
  {
    icon: '/assets/images/before_main/financial_icon01.svg',
    title: '재무현황 조회',
    desc: '입금/출금 정보를 기준으로 점포별 재무 정보를\n한눈에 조회하고 분석할 수 있습니다.',
  },
  {
    icon: '/assets/images/before_main/financial_icon02.svg',
    title: '매입/매출 등록',
    desc: '은행 거래 내역을 스크래핑하여 AI를 통해\n자동으로 계정을 분류합니다.',
  },
]

export default function Financial() {
  return (
    <div className="sub-wrap">
      <div className="sub-wrap-inner">
        <SubPageHeader
          boldTitle="고객의 서비스에 집중하세요."
          normalTitle="기본 기능을 무료로 이용하실 수 있습니다."
          description="점포의 관리에 필요한 불필요한 시간을 절약해 보세요."
        />
        <div className="financial-management-wrap">
          <div className="sub-category-content">
            {FINANCIAL_ITEMS.map((item) => (
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
              <div className="operation-tit">무료로 시작하기</div>
              <div className="operation-desc">WHALE ERP를 지금 시작해 보세요.</div>
              <Link href="/login" className="operation-btn" aria-label="무료로 시작하기" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
