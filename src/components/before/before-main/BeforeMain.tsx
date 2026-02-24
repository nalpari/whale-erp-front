'use client'

import { useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const SWIPER_SLIDES = [
  {
    title: '관리업무',
    desc: '점포/시설 관리, 직원/근무관리 등 매장 운영 시스템 완비',
    img: '/assets/images/before_main/section02_swiper_img01.svg',
  },
  {
    title: '재무관리',
    desc: '은행 계좌를 자동으로 수집하여 편리한 점포 재무 관리 지원',
    img: '/assets/images/before_main/section02_swiper_img02.svg',
  },
  {
    title: '판매기능 지원',
    desc: '부가 서비스 구독을 통한 효율적판매 시스템 운영',
    img: '/assets/images/before_main/section02_swiper_img03.svg',
  },
]

const STORE_INFO = [
  {
    title: '매장 및 직원관리',
    items: [
      { title: '급여 자동 발행', desc: '주휴수당, 4대 보험 포함 급여 정산 및 명세서 자동 생성' },
      { title: '운영 뼈대 구축', desc: '점포·시설·근무 관리를 한 곳에서 간편하게 처리' },
    ],
  },
  {
    title: '재무관리',
    items: [
      { title: '매출 통합 관리', desc: '은행 계좌 및 카드사 매출 데이터 자동 수집' },
      { title: '손익 분석 자동화', desc: '매출과 지출을 분석하여 매장의재무 상태 진단' },
    ],
  },
  {
    title: '프랜차이즈 관리',
    items: [
      { title: '다점포 통합 대시보드', desc: '여러 매장의 현황을 한눈에 비교하고 동시 관리' },
      { title: '운영 표준화', desc: '표준 매뉴얼로 모든 지점의 서비스 퀄리티 유지' },
    ],
  },
]

const SERVICES = [
  { name: '테이블 오더', icon: '/assets/images/before_main/service_icon01.png' },
  { name: '모바일 오더', icon: '/assets/images/before_main/service_icon02.png' },
  { name: 'POS', icon: '/assets/images/before_main/service_icon03.png' },
  { name: '키오스크', icon: '/assets/images/before_main/service_icon04.png' },
  { name: '재고관리', icon: '/assets/images/before_main/service_icon05.png' },
  { name: '발주관리', icon: '/assets/images/before_main/service_icon06.png' },
  { name: '레시피 관리', icon: '/assets/images/before_main/service_icon07.png' },
  { name: '대기 관리', icon: '/assets/images/before_main/service_icon08.png' },
  { name: '예약관리', icon: '/assets/images/before_main/service_icon09.png' },
]

const PC_SCREENS = [
  { src: '/assets/images/before_main/screen_pc01.svg', type: 'svg' as const },
  { src: '/assets/images/before_main/screen_pc02.png', type: 'png' as const },
  { src: '/assets/images/before_main/screen_pc03.png', type: 'png' as const },
]

const MB_SCREENS = [
  { src: '/assets/images/before_main/screen_mb01.svg', type: 'svg' as const },
  { src: '/assets/images/before_main/screen_mb02.png', type: 'png' as const },
  { src: '/assets/images/before_main/screen_mb03.png', type: 'png' as const },
]

function DeviceImage({ src, type }: { src: string; type: 'svg' | 'png' }) {
  return (
    <Image
      alt="device-item-img"
      loading="lazy"
      fill
      sizes={type === 'png' ? '100vw' : undefined}
      style={{ objectFit: 'cover' }}
      src={src}
    />
  )
}

function useScrollReveal() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  const setRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    refs.current[index] = el
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            el.style.opacity = '1'
            el.style.transform = 'translate(0px, 0px)'
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.15 }
    )

    refs.current.forEach((el) => {
      if (el) {
        el.style.opacity = '0'
        el.style.transform = 'translate(0px, 200px)'
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease'
        observer.observe(el)
      }
    })

    return () => observer.disconnect()
  }, [])

  return setRef
}

export default function BeforeMain() {
  const setRef = useScrollReveal()

  return (
    <div className="before-main">
      {/* Section 01 - Hero */}
      <section className="main-section01">
        <video autoPlay muted loop playsInline preload="auto">
          <source src="/assets/images/before_main/main_section01.webm" type="video/webm" />
        </video>
        <div className="section-inner">
          <div className="gsap-wrap">
            <div className="erp-tit-wrap">
              <Image
                alt="Whale ERP"
                priority
                width={526}
                height={291}
                className="whale-img"
                src="/assets/images/before_main/whale_img.png"
              />
            </div>
            <div className="erp-txt-wrap">
              <div className="erp-txt-tit">your smart choice</div>
              <div className="erp-txt-desc">all in one store management platform</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02 - Introduction Swiper */}
      <section className="main-section02">
        <div className="section02-inner">
          <div className="section02-txt-wrap">
            <div className="section02-txt-s-tit" ref={setRef(0)}>
              store management platform
            </div>
            <div className="section02-txt-b-tit" ref={setRef(1)}>
              <span>당신의 스마트한 선택</span>
              <span className="bold">매장에 필요한 업무를 한 곳에서!</span>
            </div>
            <div className="section02-txt-desc" ref={setRef(2)}>
              <span>매장의 직원 관리, 근무관리, 급여·정산, 매출과 손익 분석까지.</span>
              <span>WHALE ERP은 매장 운영에 필요한 모든 업무를 쉽고 간편하게 관리할 수 있습니다.</span>
            </div>
          </div>
          <div className="section02-swiper-wrap" ref={setRef(3)}>
            <Swiper
              className="mySwiper"
              spaceBetween={235}
              slidesPerView="auto"
              centeredSlides
              loop
              navigation
              modules={[Navigation]}
            >
              {SWIPER_SLIDES.map((slide, idx) => (
                <SwiperSlide key={idx}>
                  <div className="section-swip-item">
                    <div className="swip-item-head">
                      <span className="s-tit">Smart Biz</span>
                      <span className="b-tit">Whale ERP</span>
                    </div>
                    <div className="swip-item-img">
                      <Image
                        alt="section-swip-item-img"
                        loading="lazy"
                        fill
                        style={{ objectFit: 'cover' }}
                        src={slide.img}
                      />
                    </div>
                    <div className="swip-item-info">
                      <div className="info-txt">Introduction</div>
                      <div className="info-tit">{slide.title}</div>
                      <div className="info-desc">{slide.desc}</div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* Section 03 - PC Device Showcase */}
      <section className="main-section03">
        <div className="section-inner">
          <div className="device-info-wrap">
            <div className="device-comment" ref={setRef(4)}>
              <div className="comment-tit">
                <span>점포운영에</span>
                <span className="bold">필요한 모든 것을 지원합니다.</span>
              </div>
              <div className="comment-desc">반복되는 번거로운 업무, WHALE ERP로 손쉽게 해결</div>
            </div>
            <div className="device-wrap">
              <div className="device-item" ref={setRef(5)}>
                <Swiper
                  className="screen-swiper"
                  slidesPerView={1}
                  loop
                  autoplay={{ delay: 3000, disableOnInteraction: false }}
                  pagination={{ clickable: true }}
                  modules={[Pagination, Autoplay]}
                >
                  {PC_SCREENS.map((screen, idx) => (
                    <SwiperSlide key={idx}>
                      <div className="device-item-img">
                        <DeviceImage src={screen.src} type={screen.type} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </div>
          <div className="store-info-list">
            {STORE_INFO.map((info, idx) => (
              <div className="store-info-item" key={idx} ref={setRef(6 + idx)}>
                <div className="store-info-item-tit">{info.title}</div>
                <div className="store-info-data">
                  {info.items.map((item, itemIdx) => (
                    <div className="data-item" key={itemIdx}>
                      <div className="data-item-tit">{item.title}</div>
                      <div className="data-item-desc">{item.desc}</div>
                    </div>
                  ))}
                </div>
                <button type="button" className="store-info-btn">
                  기능 상세 보기 <i className="icon-arrow-right" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 04 - Mobile Device Showcase */}
      <section className="main-section04">
        <div className="section-inner">
          <div className="device-info-wrap mb">
            <div className="device-comment" ref={setRef(9)}>
              <div className="comment-tit">
                <span>매장운영에 필요한</span>
                <span className="bold">다양한 부가서비스를 제공합니다.</span>
              </div>
              <div className="comment-desc">
                우리 매장에 꼭 필요한 옵션으로 WHALE ERP의 기능을 업그레이드 하세요.
              </div>
            </div>
            <div className="mb-device-wrap">
              <div className="mb-device-item" ref={setRef(10)}>
                <Swiper
                  className="screen-swiper"
                  slidesPerView={1}
                  loop
                  autoplay={{ delay: 3000, disableOnInteraction: false }}
                  modules={[Autoplay]}
                >
                  {MB_SCREENS.map((screen, idx) => (
                    <SwiperSlide key={idx}>
                      <div className="device-item-img">
                        <DeviceImage src={screen.src} type={screen.type} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div className="custom-pagination" />
              </div>
              <div className="mb-device-info" ref={setRef(11)}>
                <div className="mb-device-info-tit-s">픽업오더 APP</div>
                <div className="mb-device-info-tit-b">26.03 오픈예정</div>
                <div className="mb-device-info-desc">
                  불필요한 고객 평가 부담은 덜고, 매장 운영에 집중할 수 있는 픽업오더. 주문은 미리 받고
                  매장 회전율을 극대화하세요.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 05 - Coming Soon Services */}
      <section className="main-section05">
        <div className="section05-inner">
          <div className="section05-head">
            <div className="head-tit" ref={setRef(12)}>
              <span>오픈 예정 서비스</span>
              <span className="bold">올인원 Coming Soon!</span>
            </div>
            <div className="head-desc" ref={setRef(13)}>
              <span>테이블 오더, 키오스크, 재고 관리</span>
              <span>사장님의 고민을 해결할 지원군들이 차례로 도착할 예정입니다.</span>
            </div>
          </div>
          <div className="section05-service-list" ref={setRef(14)}>
            <Swiper
              className="service-swiper"
              spaceBetween={30}
              slidesPerView="auto"
              loop
              autoplay={{ delay: 2000, disableOnInteraction: false }}
              pagination={{ type: 'progressbar' }}
              modules={[Autoplay, Pagination]}
            >
              {SERVICES.map((service, idx) => (
                <SwiperSlide key={idx} style={{ width: 240 }}>
                  <div className="service-item">
                    <div className="service-icon">
                      <Image
                        alt="service-icon"
                        loading="lazy"
                        fill
                        sizes="100vw"
                        src={service.icon}
                      />
                    </div>
                    <div className="service-info-wrap">
                      <div className="service-name-wrap">
                        <div className="service-tit">WHALE ERP</div>
                        <div className="service-name">{service.name}</div>
                      </div>
                      <button type="button" className="service-arr" aria-label="서비스 상세 보기" />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>
    </div>
  )
}
