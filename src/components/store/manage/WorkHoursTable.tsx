import { useEffect, useMemo, useRef, useState } from 'react'
import type { Swiper as SwiperClass } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import type { OperatingFormState } from '@/types/store'

import 'swiper/css'
import 'swiper/css/pagination'

// HH:mm 형태의 문자열을 안전하게 자르는 유틸
const normalizeTime = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length < 5) return null
  return trimmed.slice(0, 5)
}

// 숫자 범위를 강제해 입력값이 튀는 것을 방지
const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// 오전/오후 + 시/분 입력 상태
type TimeParts = {
  period: string
  hour: string
  minute: string
}

// 24시간 HH:mm 문자열을 오전/오후 + 12시간제로 변환
const toTimeParts = (value?: string | null) => {
  const normalized = normalizeTime(value)
  if (!normalized) {
    return { period: '오전', hour: '00', minute: '00' }
  }
  const [hourText = '00', minuteText = '00'] = normalized.split(':')
  const hourValue = Number(hourText)
  const period = hourValue >= 12 ? '오후' : '오전'
  const hour12 = hourValue % 12 || 12
  return {
    period,
    hour: String(hour12).padStart(2, '0'),
    minute: minuteText,
  }
}

const AM_PERIOD = toTimeParts('00:00').period
const PM_PERIOD = toTimeParts('13:00').period

// 오전/오후 + 12시간제 입력을 24시간제로 환산
const to24HourTime = (parts: TimeParts) => {
  if (!parts.hour || !parts.minute) return ''
  const hour12 = clampNumber(Number(parts.hour), 1, 12)
  const minute = clampNumber(Number(parts.minute), 0, 59)
  const isPm = parts.period === PM_PERIOD
  const hour24 = isPm ? (hour12 % 12) + 12 : hour12 % 12
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

// 점포 운영/휴게 시간 선택 UI(스와이퍼 + 입력 병행)
export const WorkHoursTable = ({
  idPrefix,
  openTime,
  closeTime,
  breakStartTime,
  breakEndTime,
  isOperating,
  breakTimeEnabled,
  onChange,
}: {
  // 동일 화면에서 여러 개 사용되므로 id 충돌 방지용 prefix
  idPrefix: string
  openTime?: string | null
  closeTime?: string | null
  breakStartTime?: string | null
  breakEndTime?: string | null
  isOperating: boolean
  breakTimeEnabled: boolean
  // 입력 변경 시 상위 상태로 부분 업데이트 전달
  onChange?: (next: Partial<OperatingFormState>) => void
}) => {
  const [workEnabledOverride, setWorkEnabledOverride] = useState<boolean | null>(null)
  const [breakEnabledOverride, setBreakEnabledOverride] = useState<boolean | null>(null)
  const workEnabled = workEnabledOverride ?? isOperating
  const breakEnabled = breakEnabledOverride ?? breakTimeEnabled
  const [openParts, setOpenParts] = useState<TimeParts>(() => toTimeParts(openTime))
  const [closeParts, setCloseParts] = useState<TimeParts>(() => toTimeParts(closeTime))
  const [breakStartParts, setBreakStartParts] = useState<TimeParts>(() => toTimeParts(breakStartTime))
  const [breakEndParts, setBreakEndParts] = useState<TimeParts>(() => toTimeParts(breakEndTime))
  const openHourSwiperRef = useRef<SwiperClass | null>(null)
  const openMinuteSwiperRef = useRef<SwiperClass | null>(null)
  const closeHourSwiperRef = useRef<SwiperClass | null>(null)
  const closeMinuteSwiperRef = useRef<SwiperClass | null>(null)
  const breakStartHourSwiperRef = useRef<SwiperClass | null>(null)
  const breakStartMinuteSwiperRef = useRef<SwiperClass | null>(null)
  const breakEndHourSwiperRef = useRef<SwiperClass | null>(null)
  const breakEndMinuteSwiperRef = useRef<SwiperClass | null>(null)

  const hourOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')),
    []
  )
  const minuteOptions = useMemo(() => ['00', '30'], [])

  const getHourIndex = (value: string) => {
    const index = Math.max(0, Math.min(11, Number(value) - 1))
    return Number.isNaN(index) ? 0 : index
  }

  const getMinuteIndex = (value: string) => (value === '30' ? 1 : 0)

  useEffect(() => {
    const next = to24HourTime(openParts)
    if (!next || next === (openTime ?? '')) return
    onChange?.({ openTime: next })
  }, [openParts, openTime, onChange])

  useEffect(() => {
    const next = to24HourTime(closeParts)
    if (!next || next === (closeTime ?? '')) return
    onChange?.({ closeTime: next })
  }, [closeParts, closeTime, onChange])

  useEffect(() => {
    const next = to24HourTime(breakStartParts)
    if (!next || next === (breakStartTime ?? '')) return
    onChange?.({ breakStartTime: next })
  }, [breakStartParts, breakStartTime, onChange])

  useEffect(() => {
    const next = to24HourTime(breakEndParts)
    if (!next || next === (breakEndTime ?? '')) return
    onChange?.({ breakEndTime: next })
  }, [breakEndParts, breakEndTime, onChange])

  const normalizeHourInput = (value: string, currentPeriod: string) => {
    const digits = value.replace(/\D/g, '').slice(-2)
    if (!digits) {
      return { period: currentPeriod, hour: '' }
    }
    if (digits.length === 1) {
      return { period: currentPeriod, hour: digits }
    }
    const hour24 = clampNumber(Number(digits), 0, 23)
    const preferTwoDigits = digits.length > 1
    let nextPeriod = currentPeriod
    let hour12 = hour24

    if (hour24 >= 13) {
      nextPeriod = PM_PERIOD
      hour12 = hour24 - 12
    } else if (hour24 === 12) {
      nextPeriod = currentPeriod === AM_PERIOD ? PM_PERIOD : currentPeriod
      hour12 = 12
    } else if (hour24 === 0) {
      hour12 = 12
    }

    const hourText = preferTwoDigits ? String(hour12).padStart(2, '0') : String(hour12)
    return { period: nextPeriod, hour: hourText }
  }

  const normalizeMinuteInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(-2)
    if (!digits) return null
    if (digits.length === 1) {
      return { minute: digits, finalized: false }
    }
    const minute = clampNumber(Number(digits), 0, 59)
    return { minute: minute >= 30 ? '30' : '00', finalized: true }
  }

  const handlePeriodChange = (
    period: string,
    setParts: (next: TimeParts | ((prev: TimeParts) => TimeParts)) => void
  ) => {
    setParts((prev) => ({ ...prev, period }))
  }

  const syncHourSwiper = (swiperRef: { current: SwiperClass | null }, hour: string) => {
    if (!hour) return
    swiperRef.current?.slideTo(getHourIndex(hour))
  }

  const syncMinuteSwiper = (swiperRef: { current: SwiperClass | null }, minute: string) => {
    if (!minute) return
    swiperRef.current?.slideTo(getMinuteIndex(minute))
  }

  const openKey = normalizeTime(openTime) ?? 'na'
  const closeKey = normalizeTime(closeTime) ?? 'na'
  const breakStartKey = normalizeTime(breakStartTime) ?? 'na'
  const breakEndKey = normalizeTime(breakEndTime) ?? 'na'

  return (
    <table className="store-info-work-hours-table">
      <colgroup>
        <col />
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th colSpan={2}>
            <div className="toggle-wrap">
              <span className="toggle-txt">근무유무</span>
              <div className="toggle-btn">
                <input
                  type="checkbox"
                  id={`toggle-work-hours-${idPrefix}`}
                  checked={workEnabled}
                  onChange={(event) => {
                    setWorkEnabledOverride(event.target.checked)
                    onChange?.({ isOperating: event.target.checked })
                  }}
                />
                <label className="slider" htmlFor={`toggle-work-hours-${idPrefix}`}></label>
              </div>
            </div>
          </th>
          <th colSpan={2}>
            <div className="toggle-wrap">
              <span className="toggle-txt">휴게유무</span>
              <div className="toggle-btn">
                <input
                  type="checkbox"
                  id={`toggle-break-hours-${idPrefix}`}
                  checked={breakEnabled}
                  onChange={(event) => {
                    setBreakEnabledOverride(event.target.checked)
                    onChange?.({ breakTimeEnabled: event.target.checked })
                  }}
                />
                <label className="slider" htmlFor={`toggle-break-hours-${idPrefix}`}></label>
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div className={`work-hours-box ${workEnabled ? '' : 'disabled'}`}>
              <div className="work-hours-tab">
                <button
                  className={`work-time-tab ${openParts.period === AM_PERIOD ? 'act' : ''}`}
                  type="button"
                  onClick={() => handlePeriodChange(AM_PERIOD, setOpenParts)}
                >
                  {AM_PERIOD}
                </button>
                <button
                  className={`work-time-tab ${openParts.period === PM_PERIOD ? 'act' : ''}`}
                  type="button"
                  onClick={() => handlePeriodChange(PM_PERIOD, setOpenParts)}
                >
                  {PM_PERIOD}
                </button>
              </div>
              <div className="work-hours-inner">
                <div className="time-swiper hours">
                  <Swiper
                    key={`${idPrefix}-open-hour-${openKey}`}
                    spaceBetween={10}
                    slidesPerView={3}
                    direction={'vertical'}
                    navigation={workEnabled}
                    loop={false}
                    centeredSlides={true}
                    allowTouchMove={workEnabled}
                    modules={[Navigation]}
                    className="mySwiper"
                    initialSlide={getHourIndex(openParts.hour)}
                    onSwiper={(swiper) => {
                      openHourSwiperRef.current = swiper
                    }}
                    onSlideChange={(swiper) => {
                      const index = swiper.realIndex ?? swiper.activeIndex
                      const next = hourOptions[index] ?? '01'
                      setOpenParts((prev) => ({ ...prev, hour: next }))
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, index) => (
                      <SwiperSlide key={index}>
                        <div className="number-box">{index < 9 ? `0${index + 1}` : index + 1}</div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                <div className="time-colon">:</div>
                <div className="time-swiper minutes">
                  <Swiper
                    key={`${idPrefix}-open-minute-${openKey}`}
                    spaceBetween={10}
                    slidesPerView={3}
                    direction={'vertical'}
                    navigation={workEnabled}
                    modules={[Navigation]}
                    loop={false}
                    centeredSlides={true}
                    allowTouchMove={workEnabled}
                    className="mySwiper"
                    initialSlide={getMinuteIndex(openParts.minute)}
                    onSwiper={(swiper) => {
                      openMinuteSwiperRef.current = swiper
                    }}
                    onSlideChange={(swiper) => {
                      const index = swiper.realIndex ?? swiper.activeIndex
                      const next = minuteOptions[index] ?? '00'
                      setOpenParts((prev) => ({ ...prev, minute: next }))
                    }}
                  >
                    <SwiperSlide>
                      <div className="number-box">00</div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="number-box">30</div>
                    </SwiperSlide>
                  </Swiper>
                </div>
              </div>
              <div className="work-hours-preview">
                <div className="filed-flx g8">
                  <span className="explain">{openParts.period}</span>
                  <div>
                    <input
                      type="text"
                      className="input-frame xs"
                      value={openParts.hour}
                      inputMode="numeric"
                      onChange={(event) => {
                        const next = normalizeHourInput(event.target.value, openParts.period)
                        if (!next) return
                        setOpenParts((prev) => ({ ...prev, period: next.period, hour: next.hour }))
                        if (!next.hour) return
                        syncHourSwiper(openHourSwiperRef, next.hour)
                      }}
                    />
                  </div>
                  <span className="explain">시</span>
                  <div>
                    <input
                      type="text"
                      className="input-frame xs"
                      value={openParts.minute}
                      inputMode="numeric"
                      maxLength={2}
                      onChange={(event) => {
                        const next = normalizeMinuteInput(event.target.value)
                        if (!next) return
                        setOpenParts((prev) => ({ ...prev, minute: next.minute }))
                        if (next.finalized) {
                          syncMinuteSwiper(openMinuteSwiperRef, next.minute)
                        }
                      }}
                    />
                  </div>
                  <span className="explain">분</span>
                  <span className="explain">부터</span>
                </div>
              </div>
            </div>
          </td>
          <td>
            <div className={`work-hours-box ${workEnabled ? '' : 'disabled'}`}>
              <div className="work-hours-tab">
                <button
                  className={`work-time-tab ${closeParts.period === AM_PERIOD ? 'act' : ''}`}
                  type="button"
                  onClick={() => handlePeriodChange(AM_PERIOD, setCloseParts)}
                >
                  {AM_PERIOD}
                </button>
                <button
                  className={`work-time-tab ${closeParts.period === PM_PERIOD ? 'act' : ''}`}
                  type="button"
                  onClick={() => handlePeriodChange(PM_PERIOD, setCloseParts)}
                >
                  {PM_PERIOD}
                </button>
              </div>
              <div className="work-hours-inner">
                <div className="time-swiper hours">
                  <Swiper
                    key={`${idPrefix}-close-hour-${closeKey}`}
                    spaceBetween={10}
                    slidesPerView={3}
                    direction={'vertical'}
                    navigation={workEnabled}
                    loop={false}
                    centeredSlides={true}
                    allowTouchMove={workEnabled}
                    modules={[Navigation]}
                    className="mySwiper"
                    initialSlide={getHourIndex(closeParts.hour)}
                    onSwiper={(swiper) => {
                      closeHourSwiperRef.current = swiper
                    }}
                    onSlideChange={(swiper) => {
                      const index = swiper.realIndex ?? swiper.activeIndex
                      const next = hourOptions[index] ?? '01'
                      setCloseParts((prev) => ({ ...prev, hour: next }))
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, index) => (
                      <SwiperSlide key={index}>
                        <div className="number-box">{index < 9 ? `0${index + 1}` : index + 1}</div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                <div className="time-colon">:</div>
                <div className="time-swiper minutes">
                  <Swiper
                    key={`${idPrefix}-close-minute-${closeKey}`}
                    spaceBetween={10}
                    slidesPerView={3}
                    direction={'vertical'}
                    navigation={workEnabled}
                    modules={[Navigation]}
                    loop={false}
                    centeredSlides={true}
                    allowTouchMove={workEnabled}
                    className="mySwiper"
                    initialSlide={getMinuteIndex(closeParts.minute)}
                    onSwiper={(swiper) => {
                      closeMinuteSwiperRef.current = swiper
                    }}
                    onSlideChange={(swiper) => {
                      const index = swiper.realIndex ?? swiper.activeIndex
                      const next = minuteOptions[index] ?? '00'
                      setCloseParts((prev) => ({ ...prev, minute: next }))
                    }}
                  >
                    <SwiperSlide>
                      <div className="number-box">00</div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="number-box">30</div>
                    </SwiperSlide>
                  </Swiper>
                </div>
              </div>
              <div className="work-hours-preview">
                <div className="filed-flx g8">
                  <span className="explain">{closeParts.period}</span>
                  <div>
                    <input
                      type="text"
                      className="input-frame xs"
                      value={closeParts.hour}
                      inputMode="numeric"
                      onChange={(event) => {
                        const next = normalizeHourInput(event.target.value, closeParts.period)
                        if (!next) return
                        setCloseParts((prev) => ({ ...prev, period: next.period, hour: next.hour }))
                        if (!next.hour) return
                        syncHourSwiper(closeHourSwiperRef, next.hour)
                      }}
                    />
                  </div>
                  <span className="explain">시</span>
                  <div>
                    <input
                      type="text"
                      className="input-frame xs"
                      value={closeParts.minute}
                      inputMode="numeric"
                      maxLength={2}
                      onChange={(event) => {
                        const next = normalizeMinuteInput(event.target.value)
                        if (!next) return
                        setCloseParts((prev) => ({ ...prev, minute: next.minute }))
                        if (next.finalized) {
                          syncMinuteSwiper(closeMinuteSwiperRef, next.minute)
                        }
                      }}
                    />
                  </div>
                  <span className="explain">분</span>
                  <span className="explain">까지</span>
                </div>
              </div>
            </div>
          </td>
          <td>
            <div className={`work-hours-box ${breakEnabled ? '' : 'disabled'}`}>
              <div className="work-hours-tab">
                <button
                  className={`work-time-tab ${breakStartParts.period === AM_PERIOD ? 'act' : ''}`}
                  type="button"
                  onClick={() => handlePeriodChange(AM_PERIOD, setBreakStartParts)}
                >
                  {AM_PERIOD}
                </button>
                <button
                  className={`work-time-tab ${breakStartParts.period === PM_PERIOD ? 'act' : ''}`}
                  type="button"
                  onClick={() => handlePeriodChange(PM_PERIOD, setBreakStartParts)}
                >
                  {PM_PERIOD}
                </button>
              </div>
              <div className="work-hours-inner">
                <div className="time-swiper hours">
                  <Swiper
                    key={`${idPrefix}-break-start-hour-${breakStartKey}`}
                    spaceBetween={10}
                    slidesPerView={3}
                    direction={'vertical'}
                    navigation={breakEnabled}
                    loop={false}
                    centeredSlides={true}
                    allowTouchMove={breakEnabled}
                    modules={[Navigation]}
                    className="mySwiper"
                    initialSlide={getHourIndex(breakStartParts.hour)}
                    onSwiper={(swiper) => {
                      breakStartHourSwiperRef.current = swiper
                    }}
                    onSlideChange={(swiper) => {
                      const index = swiper.realIndex ?? swiper.activeIndex
                      const next = hourOptions[index] ?? '01'
                      setBreakStartParts((prev) => ({ ...prev, hour: next }))
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, index) => (
                      <SwiperSlide key={index}>
                        <div className="number-box">{index < 9 ? `0${index + 1}` : index + 1}</div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                <div className="time-colon">:</div>
                <div className="time-swiper minutes">
                  <Swiper
                    key={`${idPrefix}-break-start-minute-${breakStartKey}`}
                    spaceBetween={10}
                    slidesPerView={3}
                    direction={'vertical'}
                    navigation={breakEnabled}
                    modules={[Navigation]}
                    loop={false}
                    centeredSlides={true}
                    allowTouchMove={breakEnabled}
                    className="mySwiper"
                    initialSlide={getMinuteIndex(breakStartParts.minute)}
                    onSwiper={(swiper) => {
                      breakStartMinuteSwiperRef.current = swiper
                    }}
                    onSlideChange={(swiper) => {
                      const index = swiper.realIndex ?? swiper.activeIndex
                      const next = minuteOptions[index] ?? '00'
                      setBreakStartParts((prev) => ({ ...prev, minute: next }))
                    }}
                  >
                    <SwiperSlide>
                      <div className="number-box">00</div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="number-box">30</div>
                    </SwiperSlide>
                  </Swiper>
                </div>
              </div>
              <div className="work-hours-preview">
                <div className="filed-flx g8">
                  <span className="explain">{breakStartParts.period}</span>
                  <div>
                    <input
                      type="text"
                      className="input-frame xs"
                      value={breakStartParts.hour}
                      inputMode="numeric"
                      onChange={(event) => {
                        const next = normalizeHourInput(event.target.value, breakStartParts.period)
                        if (!next) return
                        setBreakStartParts((prev) => ({ ...prev, period: next.period, hour: next.hour }))
                        if (!next.hour) return
                        syncHourSwiper(breakStartHourSwiperRef, next.hour)
                      }}
                    />
                  </div>
                  <span className="explain">시</span>
                  <div>
                    <input
                      type="text"
                      className="input-frame xs"
                      value={breakStartParts.minute}
                      inputMode="numeric"
                      maxLength={2}
                      onChange={(event) => {
                        const next = normalizeMinuteInput(event.target.value)
                        if (!next) return
                        setBreakStartParts((prev) => ({ ...prev, minute: next.minute }))
                        if (next.finalized) {
                          syncMinuteSwiper(breakStartMinuteSwiperRef, next.minute)
                        }
                      }}
                    />
                  </div>
                  <span className="explain">분</span>
                  <span className="explain">부터</span>
                </div>
              </div>
            </div>
          </td>
          <td>
            <div className={`work-hours-box ${breakEnabled ? '' : 'disabled'}`}>
              <div className="work-hours-tab">
                <button
                  className={`work-time-tab ${breakEndParts.period === AM_PERIOD ? 'act' : ''}`}
                  type="button"
                  onClick={() => handlePeriodChange(AM_PERIOD, setBreakEndParts)}
                >
                  {AM_PERIOD}
                </button>
                <button
                  className={`work-time-tab ${breakEndParts.period === PM_PERIOD ? 'act' : ''}`}
                  type="button"
                  onClick={() => handlePeriodChange(PM_PERIOD, setBreakEndParts)}
                >
                  {PM_PERIOD}
                </button>
              </div>
              <div className="work-hours-inner">
                <div className="time-swiper hours">
                  <Swiper
                    key={`${idPrefix}-break-end-hour-${breakEndKey}`}
                    spaceBetween={10}
                    slidesPerView={3}
                    direction={'vertical'}
                    navigation={breakEnabled}
                    loop={false}
                    centeredSlides={true}
                    allowTouchMove={breakEnabled}
                    modules={[Navigation]}
                    className="mySwiper"
                    initialSlide={getHourIndex(breakEndParts.hour)}
                    onSwiper={(swiper) => {
                      breakEndHourSwiperRef.current = swiper
                    }}
                    onSlideChange={(swiper) => {
                      const index = swiper.realIndex ?? swiper.activeIndex
                      const next = hourOptions[index] ?? '01'
                      setBreakEndParts((prev) => ({ ...prev, hour: next }))
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, index) => (
                      <SwiperSlide key={index}>
                        <div className="number-box">{index < 9 ? `0${index + 1}` : index + 1}</div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                <div className="time-colon">:</div>
                <div className="time-swiper minutes">
                  <Swiper
                    key={`${idPrefix}-break-end-minute-${breakEndKey}`}
                    spaceBetween={10}
                    slidesPerView={3}
                    direction={'vertical'}
                    navigation={breakEnabled}
                    modules={[Navigation]}
                    loop={false}
                    centeredSlides={true}
                    allowTouchMove={breakEnabled}
                    className="mySwiper"
                    initialSlide={getMinuteIndex(breakEndParts.minute)}
                    onSwiper={(swiper) => {
                      breakEndMinuteSwiperRef.current = swiper
                    }}
                    onSlideChange={(swiper) => {
                      const index = swiper.realIndex ?? swiper.activeIndex
                      const next = minuteOptions[index] ?? '00'
                      setBreakEndParts((prev) => ({ ...prev, minute: next }))
                    }}
                  >
                    <SwiperSlide>
                      <div className="number-box">00</div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="number-box">30</div>
                    </SwiperSlide>
                  </Swiper>
                </div>
              </div>
              <div className="work-hours-preview">
                <div className="filed-flx g8">
                  <span className="explain">{breakEndParts.period}</span>
                  <div>
                    <input
                      type="text"
                      className="input-frame xs"
                      value={breakEndParts.hour}
                      inputMode="numeric"
                      onChange={(event) => {
                        const next = normalizeHourInput(event.target.value, breakEndParts.period)
                        if (!next) return
                        setBreakEndParts((prev) => ({ ...prev, period: next.period, hour: next.hour }))
                        if (!next.hour) return
                        syncHourSwiper(breakEndHourSwiperRef, next.hour)
                      }}
                    />
                  </div>
                  <span className="explain">시</span>
                  <div>
                    <input
                      type="text"
                      className="input-frame xs"
                      value={breakEndParts.minute}
                      inputMode="numeric"
                      maxLength={2}
                      onChange={(event) => {
                        const next = normalizeMinuteInput(event.target.value)
                        if (!next) return
                        setBreakEndParts((prev) => ({ ...prev, minute: next.minute }))
                        if (next.finalized) {
                          syncMinuteSwiper(breakEndMinuteSwiperRef, next.minute)
                        }
                      }}
                    />
                  </div>
                  <span className="explain">분</span>
                  <span className="explain">까지</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
