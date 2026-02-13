import Image from 'next/image'
import Pagination from '@/components/ui/Pagination'

export default function BeforeNoticeList() {
  return (
    <div className="sub-wrap">
      <div className="sub-wrap-inner">
        <div className="sub-wrap-header">
          <div className="sub-header-icon">
            <Image src="/assets/images/before_main/sub_whale.png" alt="introduction" width={228} height={126} />
          </div>
          <div className="sub-header-b-tit">
            <span className="bold">WHALE ERP의</span>
            <span>새로운 소식을 알려 드립니다.</span>
          </div>
          <div className="sub-header-desc">새로운 소식 및 업데이트 되어진 신규 기능들을 소개합니다.</div>
        </div>
        <div className="before-notice-wrap">
          <ul className="before-notice-list">
            <li className="before-notice-item">
              <button className="before-notice-btn">
                <div className="notice-tit">서버 교체 및 버전 업그레이드 작업 사전 안내</div>
                <div className="notice-date">2026.01.20</div>
              </button>
            </li>
            <li className="before-notice-item">
              <button className="before-notice-btn">
                <div className="notice-tit">원활한 서비스 이용을 위한 서버 교체 및 시스템 개선 작업 안내</div>
                <div className="notice-date">2026.01.20</div>
              </button>
            </li>
            <li className="before-notice-item act">
              <button className="before-notice-btn">
                <div className="notice-tit">시스템 성능 개선을 위한 서버 교체·버전 업그레이드 안내</div>
                <div className="notice-date">2026.01.20</div>
              </button>
            </li>
            <li className="before-notice-item">
              <button className="before-notice-btn">
                <div className="notice-tit">안정적인 서비스 운영을 위한 서버 교체 및 시스템 업그레이드 사전 안내</div>
                <div className="notice-date">2026.01.20</div>
              </button>
            </li>
            <li className="before-notice-item">
              <div className="before-notice-empty">등록된 공지사항이 없습니다.</div>
            </li>
          </ul>
          <Pagination />
        </div>
      </div>
    </div>
  )
}
