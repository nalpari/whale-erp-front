'use client'

/** 퍼블(https://pub.whaleerp.co.kr/after-service) 기준 부가서비스 카드 데이터. 테이블 미정의로 정적 데이터, 상태는 모두 준비중 */
export interface AfterServiceItem {
  id: string
  name: string
  description: string
}

const AFTER_SERVICES: AfterServiceItem[] = [
  { id: 'pickup-order', name: '픽업오더', description: '고객이 미리 주문 후 직접 매장에서 PICK UP 하는 주문 서비스입니다.' },
  { id: 'table-order', name: '테이블 오더', description: '매장 테이블에 설치된 타블렛PC에서 주문 및 결제를 관리하는 시스템입니다.' },
  { id: 'mobile-order', name: '모바일 오더', description: '매장 테이블에서 QR코드 등을 통해 고객이 스마트폰을 이용해 주문하는 시스템입니다.' },
  { id: 'pos', name: 'POS', description: '매장에서 결제 및 판매 내역을 관리하는 시스템으로 대면 주문 및 결제를 처리합니다.' },
  { id: 'kiosk', name: 'KIOSK', description: '고객이 직접 터치로 주문·결제하는 비대면 무인 단말기입니다.' },
  { id: 'inventory', name: '재고 관리', description: '매장 내 식자재, 소모품 등의 재고를 실시간으로 확인하고 관리할 수 있습니다.' },
  { id: 'order-management', name: '발주 관리', description: '필요한 식자재나 물품을 본사 또는 거래처별로 손쉽게 발주할 수 있습니다.' },
  { id: 'recipe', name: '레시피 관리', description: '가맹점의 메뉴 정보와 레시피를 본사에서 관리할 수 있습니다.' },
  { id: 'waiting', name: '대기 순번 관리', description: '매장 내 고객 대기 현황을 실시간으로 관리할 수 있습니다.' },
  { id: 'reservation', name: '예약 관리', description: '고객 예약 접수, 일정 확인, 좌석 배정 등을 통합 관리할 수 있습니다.' },
]

/** 구독하기 버튼 (퍼블과 동일: 기본 남색+흰글씨, 호버 시 연한회색 배경+회색 글씨) */
function SubscribeButton() {
  return (
    <div className="after-service-content">
      <div className="service-footer">
        <button
          type="button"
          className="service-btn block"
          disabled
        >
          구독 하기
          <i className="icon-subscribe" />
        </button>
      </div>
    </div>
  )
}

export default function AfterService() {
  return (
    <div className="content-wrap">
      <div className="after-service-wrap">
        {AFTER_SERVICES.map((service, index) => (
          <div key={service.id} className="after-service-item">
            <div className="after-service-icon" aria-hidden>
              <img
                src={`/assets/images/main/service_icon${String(index + 1).padStart(2, '0')}.png`}
                alt=""
                width={82}
                height={88}
              />
            </div>
            <div className="after-service-header">
              <div className="after-service-tit-wrap">
                <div className="after-service-tit" role="heading" aria-level={3}>{service.name}</div>
                <div className="badge brown">준비중</div>
              </div>
              <div className="after-service-desc">{service.description}</div>
            </div>
            <SubscribeButton />
          </div>
        ))}
        <div className="after-service-item">
          <div className="after-service-empty">서비스 추가 예정</div>
        </div>
        <div className="after-service-item">
          <div className="after-service-empty">서비스 추가 예정</div>
        </div>
      </div>
    </div>
  )
}
