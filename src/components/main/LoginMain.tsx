'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import Image from 'next/image'
import { Tooltip } from 'react-tooltip'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { Pagination, Navigation } from 'swiper/modules'

export default function LoginMain() {
  return (
    <div className="login-main-wrap">
      <div className="login-main-inner">
        <div className="login-main-item">
          <div className="login-main-item-tit">점포별 운영 현황</div>
          <div className="login-main-item-cont">
            <Swiper
              slidesPerView={4}
              spaceBetween={32}
              className="store-swiper"
              pagination={{
                clickable: true,
              }}
              modules={[Pagination]}
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <SwiperSlide key={index}>
                  <div className="store-main-item">
                    <div className="store-main-info">
                      <div className="store-badge-wrap">
                        <div className="badge blue">운영</div>
                      </div>
                      <div className="store-info-wrap">
                        <div className="store-time">2025.10.10일 08시 28분 현재</div>
                        <div className="store-name">힘이 나는 커피생활 종로점</div>
                      </div>
                      <div className="store-work">
                        <div className="store-work-item">
                          <div className="badge s brd-org">근무자</div>
                          <ul className="worker-info">
                            <li>매장 매니저</li>
                            <li>김길수</li>
                            <li>07:00~18:00</li>
                          </ul>
                        </div>
                        <div className="store-work-item">
                          <div className="badge s brd-org">근무자</div>
                          <ul className="worker-info">
                            <li>파트 타이머</li>
                            <li>홍길동</li>
                            <li>07:00~18:00</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
              <SwiperSlide>
                <div className="store-main-item">
                  <div className="store-main-info">
                    <div className="store-badge-wrap">
                      <div className="badge red">영업종료</div>
                      <button className="invite-staff">
                        신규직원 초대 <span className="icon-arrow-right"></span>
                      </button>
                    </div>
                    <div className="store-info-wrap">
                      <div className="store-time">2025.10.10일 08시 28분 현재</div>
                      <div className="store-name">힘이 나는 커피생활 종로점</div>
                    </div>
                    <div className="store-work">
                      <div className="store-worker-empty">
                        <div className="empty-tit">직원이 등록되어 있지 않습니다.</div>
                        <div className="empty-desc">직원을 등록하시면 현재 근무자 현황을 조회할 수 있습니다.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <button className="store-main-item-add">
                  <div className="store-add-icon"></div>
                  <div className="store-add-txt">
                    <div className="store-add-tit">점포 정보를 등록해 주세요.</div>
                    <div className="store-add-desc">
                      <span>점포 운영현황 및 근무자 현황을</span>
                      <span>조회할 수 있습니다.</span>
                    </div>
                  </div>
                </button>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
        <div className="login-main-item">
          <div className="login-main-item-tit">TO-DO LIST</div>
          <div className="login-main-item-cont">
            <div className="todo-list-wrap">
              <div className="todo-list-item-wrap">
                <div className="todo-list-item">
                  <div className="todo-list-item-tit">급여명세서</div>
                  <div className="todo-emtpy">2025년 09월 등록할 급여명세서가 없습니다.</div>
                  <ul className="todo-list">
                    <li className="todo-list-li">
                      <button className="todo-list-btn">2025년 09월 급여명세서 작성을 완료했습니다.</button>
                    </li>
                    <li className="todo-list-li">
                      <button className="todo-list-btn">2025년 10월 급여명세서 작성이 필요합니다.</button>
                    </li>
                  </ul>
                </div>
                <div className="todo-list-item">
                  <div className="todo-list-item-tit">건강진단결과서</div>
                  <div className="todo-emtpy">당월 건강진단 결과서 만료 직원은 없습니다.</div>
                  <ul className="todo-list">
                    <li className="todo-list-li">
                      <button className="todo-list-btn">
                        당월 홍길동 직원의 건강진단 결과서 만료일(2025.10.10)입니다 당월 홍길동 직원의 건강진단 결과서
                        만료일(2025.10.10)입니다당월 홍길동 직원의 건강진단 결과서 만료일(2025.10.10)입니다
                      </button>
                    </li>
                    <li className="todo-list-li">
                      <button className="todo-list-btn">
                        당월 홍길동 직원의 건강진단 결과서 만료일(2025.10.10)입니다
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="todo-list-item">
                  <div className="todo-list-item-tit">진행 중인 업무</div>
                  <div className="todo-emtpy">진행중인 계약 업무가 없습니다.</div>
                  <ul className="todo-list">
                    <li className="todo-list-li">
                      <button className="todo-list-btn">을지로3가점과 가맹계약 진행중입니다.</button>
                    </li>
                    <li className="todo-list-li">
                      <button className="todo-list-btn">김길동 직원과 근로계약 진행중입니다.</button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="login-main-item">
          <div className="login-main-item-cont">
            <div className="dash-bord-wrap">
              <div className="dash-bord-item">
                <div className="dash-bord-head">
                  <div className="dash-bord-head-tit">근무 중인 직원</div>
                  <div className="dash-bord-head-desc">
                    <div className="dash-bord-head-desc-unit">단위: 명</div>
                    <button className="tooltip-btn black">
                      <span className="tooltip-icon" id="worker-tooltip"></span>
                      <Tooltip className="tooltip-txt" anchorSelect="#worker-tooltip" opacity={1}>
                        <div>퇴직일이 없는 직원을 기준으로 그래프를 표시합니다.</div>
                      </Tooltip>
                    </button>
                  </div>
                </div>
                <div className="dash-bord-content">
                  <div className="dash-graph-wrap">
                    <div
                      className="dash-graph"
                      style={{
                        width: '100%',
                        height: '200px',
                        backgroundColor: '#f5f5f5',
                        textAlign: 'center',
                        lineHeight: '200px',
                        fontSize: '32px',
                      }}
                    >
                      임시영역
                    </div>
                    <div className="dash-graph-guide">※ 근로계약서의 직원별  계약 기간 기준(최근 6개월)</div>
                  </div>
                  <div className="dash-bord-empty">
                    <div className="empty-tit">직원이 등록되어 있지 않습니다.</div>
                    <div className="empty-desc">직원을 등록하시면 월별 직원 현황을 조회할 수 있습니다.</div>
                    <div className="empty-btn">
                      <button className="dash-empty-btn block">
                        신규직원 초대 <i className="icon-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dash-bord-item">
                <div className="dash-bord-head">
                  <div className="dash-bord-head-tit">운영 중인 점포</div>
                  <div className="dash-bord-head-desc">
                    <div className="dash-bord-head-desc-unit">단위: 개</div>
                    <button className="tooltip-btn black">
                      <span className="tooltip-icon" id="operation-tooltip"></span>
                      <Tooltip className="tooltip-txt" anchorSelect="#operation-tooltip" opacity={1}>
                        <div>점포의 운영여부를 기준으로 그래프를 표시합니다.</div>
                      </Tooltip>
                    </button>
                  </div>
                </div>
                <div className="dash-bord-content">
                  <div className="dash-graph-wrap">
                    <div
                      className="dash-graph"
                      style={{
                        width: '100%',
                        height: '200px',
                        backgroundColor: '#f5f5f5',
                        textAlign: 'center',
                        lineHeight: '200px',
                        fontSize: '32px',
                      }}
                    >
                      임시영역
                    </div>
                    <div className="dash-graph-guide">※ [점포 정보 관리]에 등록된 점포 기준(최근 6개월)</div>
                  </div>
                  <div className="dash-bord-empty">
                    <div className="empty-tit">점포 정보를 등록해 주세요.</div>
                    <div className="empty-desc">점포를 등록하시면 월별 점포 현황을 조회할 수 있습니다.</div>
                    <div className="empty-btn">
                      <button className="dash-empty-btn block">
                        점포 등록하기 <i className="icon-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dash-bord-item">
                <div className="dash-bord-head">
                  <div className="dash-bord-head-tit">
                    매출 현황 <span>(전 점포)</span>
                  </div>
                  <div className="dash-bord-head-desc">
                    <div className="dash-bord-head-desc-unit">단위: 만원</div>
                  </div>
                </div>
                <div className="dash-bord-content">
                  <div className="dash-graph-wrap">
                    <div
                      className="dash-graph"
                      style={{
                        width: '100%',
                        height: '200px',
                        backgroundColor: '#f5f5f5',
                        textAlign: 'center',
                        lineHeight: '200px',
                        fontSize: '32px',
                      }}
                    >
                      임시영역
                    </div>
                    <div className="dash-graph-guide">※ [재무현황]의 매출 기준(최근3개월)</div>
                  </div>
                  <div className="dash-bord-empty">
                    <div className="empty-tit">재무 정보를 등록해 주세요.</div>
                    <div className="empty-desc">재무 정보를 등록하시면 월별 매출 현황을 조회할 수 있습니다.</div>
                    <div className="empty-btn">
                      <button className="dash-empty-btn block">
                        재무 정보 등록하기 <i className="icon-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="login-main-item">
          <div className="login-main-item-tit">이용 중인 부가서비스</div>
          <div className="login-main-item-cont">
            <div className="after-service-wrap">
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon01.png" alt="픽업오더" width={82} height={88} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">픽업오더</div>
                    <div className="badge blue">이용중</div>
                  </div>
                  <div className="after-service-desc">
                    고객이 미리 주문 후 직접 매장에서 PICK UP 하는 주문 서비스입니다.
                  </div>
                </div>
                <div className="after-service-content">
                  <div className="service-swiper-wrap">
                    <Swiper slidesPerView={1} navigation={true} className="service-swiper" modules={[Navigation]}>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="service-footer">
                    <div className="service-sales">
                      <div className="service-sales-tit">
                        <span>매출</span>
                        <span>10.10(금)</span>
                      </div>
                      <div className="service-sales-total">
                        <span>256,000원</span>
                      </div>
                    </div>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon02.png" alt="테이블오더" width={82} height={88} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">테이블 오더</div>
                    <div className="badge green">신청전</div>
                  </div>
                  <div className="after-service-desc">
                    매장 테이블에 설치된 타블렛PC에서 주문 및 결제를 관리하는 시스템입니다.
                  </div>
                </div>
                <div className="after-service-content">
                  <div className="service-swiper-wrap">
                    <Swiper slidesPerView={1} navigation={true} className="service-swiper" modules={[Navigation]}>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="service-footer">
                    <div className="service-sales">
                      <div className="service-sales-tit">
                        <span>매출</span>
                        <span>10.10(금)</span>
                      </div>
                      <div className="service-sales-total">
                        <span>256,000원</span>
                      </div>
                    </div>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon03.png" alt="모바일오더" width={82} height={88} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">모바일 오더</div>
                    <div className="badge brown">준비중</div>
                  </div>
                  <div className="after-service-desc">
                    매장 테이블에서 QR코드 등을 통해 고객이 스마트폰을 이용해 주문하는 시스템입니다.
                  </div>
                </div>
                <div className="after-service-content">
                  <div className="service-swiper-wrap">
                    <Swiper slidesPerView={1} navigation={true} className="service-swiper" modules={[Navigation]}>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="service-footer">
                    <div className="service-sales">
                      <div className="service-sales-tit">
                        <span>매출</span>
                        <span>10.10(금)</span>
                      </div>
                      <div className="service-sales-total">
                        <span>256,000원</span>
                      </div>
                    </div>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon04.png" alt="POS" width={82} height={88} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">POS</div>
                    <div className="badge blue">이용중</div>
                  </div>
                  <div className="after-service-desc">
                    매장에서 결제 및 판매 내역을 관리하는 시스템으로 대면 주문 및 결제를 처리합니다.
                  </div>
                </div>
                <div className="after-service-content">
                  <div className="service-swiper-wrap">
                    <Swiper slidesPerView={1} navigation={true} className="service-swiper" modules={[Navigation]}>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="service-footer">
                    <div className="service-sales">
                      <div className="service-sales-tit">
                        <span>매출</span>
                        <span>10.10(금)</span>
                      </div>
                      <div className="service-sales-total">
                        <span>256,000원</span>
                      </div>
                    </div>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon05.png" alt="KIOSK" width={82} height={88} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">KIOSK</div>
                    <div className="badge blue">이용중</div>
                  </div>
                  <div className="after-service-desc">고객이 직접 터치로 주문·결제하는 비대면 무인 단말기입니다.</div>
                </div>
                <div className="after-service-content">
                  <div className="service-swiper-wrap">
                    <Swiper slidesPerView={1} navigation={true} className="service-swiper" modules={[Navigation]}>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="service-footer">
                    <div className="service-sales">
                      <div className="service-sales-tit">
                        <span>매출</span>
                        <span>10.10(금)</span>
                      </div>
                      <div className="service-sales-total">
                        <span>256,000원</span>
                      </div>
                    </div>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon06.png" alt="재고관리" width={82} height={88} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">재고 관리</div>
                    <div className="badge green">신청전</div>
                  </div>
                  <div className="after-service-desc">
                    매장 내 식자재, 소모품 등의 재고를 실시간으로 확인하고 관리할 수 있습니다.
                  </div>
                </div>
                <div className="after-service-content">
                  <div className="service-footer">
                    <button className="service-btn block">
                      재고 관리 바로가기 <i className="icon-arrow-right"></i>
                    </button>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon07.png" alt="발주관리" width={82} height={88} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">발주 관리</div>
                    <div className="badge brown">준비중</div>
                  </div>
                  <div className="after-service-desc">
                    필요한 식자재나 물품을 본사 또는 거래처별로 손쉽게 발주할 수 있습니다.
                  </div>
                </div>
                <div className="after-service-content">
                  <div className="service-footer">
                    <button className="service-btn block">
                      발주 관리 바로가기 <i className="icon-arrow-right"></i>
                    </button>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon08.png" alt="레시피관리" width={82} height={88} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">레시피 관리</div>
                    <div className="badge blue">이용중</div>
                  </div>
                  <div className="after-service-desc">가맹점의 메뉴 정보와 레시피를 본사에서 관리할 수 있습니다.</div>
                </div>
                <div className="after-service-content">
                  <div className="service-footer">
                    <div className="service-sales">
                      <div className="service-sales-tit">
                        <span>등록된 레시피</span>
                      </div>
                      <div className="service-sales-total">
                        <span>10개</span>
                      </div>
                    </div>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon09.png" alt="대기순번관리" width={82} height={74} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">대기 순번 관리</div>
                    <div className="badge blue">이용중</div>
                  </div>
                  <div className="after-service-desc">매장 내 고객 대기 현황을 실시간으로 관리할 수 있습니다.</div>
                </div>
                <div className="after-service-content">
                  <div className="service-swiper-wrap">
                    <Swiper slidesPerView={1} navigation={true} className="service-swiper" modules={[Navigation]}>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="service-footer">
                    <div className="service-sales">
                      <div className="service-sales-tit">
                        <span>현재 대기자</span>
                      </div>
                      <div className="service-sales-total">
                        <span>10건</span>
                      </div>
                    </div>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-icon">
                  <Image src="/assets/images/main/service_icon10.png" alt="예약관리" width={82} height={88} />
                </div>
                <div className="after-service-header">
                  <div className="after-service-tit-wrap">
                    <div className="after-service-tit">예약 관리</div>
                    <div className="badge green">신청전</div>
                  </div>
                  <div className="after-service-desc">
                    고객 예약 접수, 일정 확인, 좌석 배정 등을 통합 관리할 수 있습니다.
                  </div>
                </div>
                <div className="after-service-content">
                  <div className="service-swiper-wrap">
                    <Swiper slidesPerView={1} navigation={true} className="service-swiper" modules={[Navigation]}>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="service-store">힘이 나는 커피생활 을지로3가점</div>
                      </SwiperSlide>
                    </Swiper>
                  </div>
                  <div className="service-footer">
                    <div className="service-sales">
                      <div className="service-sales-tit">
                        <span>예약건</span>
                        <span>10.10(금)</span>
                      </div>
                      <div className="service-sales-total">
                        <span>256,000원</span>
                      </div>
                    </div>
                  </div>
                  <div className="service-footer">
                    <button className="service-btn block">
                      구독 하기 <i className="icon-subscribe"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="after-service-item">
                <div className="after-service-empty">서비스 추가 예정</div>
              </div>
              <div className="after-service-item">
                <div className="after-service-empty">서비스 추가 예정</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
