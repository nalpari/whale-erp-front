'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation } from 'swiper/modules'
import { useState } from 'react'
import type { OperatingFormState } from '@/types/store'

interface WorkHoursTimePickerProps {
  idPrefix: string
  toggleLabel: [string, string]
  openTime?: string | null
  closeTime?: string | null
  breakStartTime?: string | null
  breakEndTime?: string | null
  isOperating: boolean
  breakTimeEnabled: boolean
  readOnly?: boolean
  onChange?: (next: Partial<OperatingFormState>) => void
}

type Period = '오전' | '오후'

const EMPTY_MODULES: [] = []
const NAV_MODULES = [Navigation]

/** HH:mm 형식의 시간 문자열을 파싱한다. HH:mm:ss 형식이 전달되어도 초(seconds)는 무시한다. */
const parseTime = (timeStr?: string | null): { period: Period; hour: string; minute: string } => {
  if (!timeStr) return { period: '오전', hour: '09', minute: '00' }

  const [hourStr, minuteStr] = timeStr.split(':')
  let hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10) || 0
  const period: Period = hour >= 12 ? '오후' : '오전'

  if (hour > 12) hour -= 12
  if (hour === 0) hour = 12

  return {
    period,
    hour: hour.toString().padStart(2, '0'),
    minute: minute.toString().padStart(2, '0'),
  }
}

const to24Hour = (period: Period, hour: string, minute: string): string => {
  let h = parseInt(hour, 10)
  if (period === '오후' && h < 12) h += 12
  if (period === '오전' && h === 12) h = 0
  return `${h.toString().padStart(2, '0')}:${minute}`
}

const hourToSlideIndex = (hour: string): number => parseInt(hour, 10) - 1

const minuteToSlideIndex = (minute: string): number => (minute === '30' ? 1 : 0)

const slideIndexToHour = (index: number): string => {
  const realIndex = ((index % 12) + 12) % 12
  return (realIndex + 1).toString().padStart(2, '0')
}

const slideIndexToMinute = (index: number): string => (index === 1 ? '30' : '00')

interface TimeSwiperColumnProps {
  disabled?: boolean
  readOnly?: boolean
  period: Period
  hour: string
  minute: string
  suffix: string
  onPeriodChange: (p: Period) => void
  onHourChange: (h: string) => void
  onMinuteChange: (m: string) => void
}

function TimeSwiperColumn({
  disabled = false,
  readOnly = false,
  period,
  hour,
  minute,
  suffix,
  onPeriodChange,
  onHourChange,
  onMinuteChange,
}: TimeSwiperColumnProps) {
  const isInteractionBlocked = disabled || readOnly
  return (
    <td style={{ padding: '0 16px' }}>
      <div
        className={`work-hours-box${disabled ? ' disabled' : ''}`}
        style={readOnly ? { pointerEvents: 'none' } : undefined}
      >
        <div className="work-hours-tab">
          <button
            className={`work-time-tab ${period === '오전' ? 'act' : ''}`}
            onClick={() => onPeriodChange('오전')}
            type="button"
            disabled={isInteractionBlocked}
          >
            오전
          </button>
          <button
            className={`work-time-tab ${period === '오후' ? 'act' : ''}`}
            onClick={() => onPeriodChange('오후')}
            type="button"
            disabled={isInteractionBlocked}
          >
            오후
          </button>
        </div>
        <div className="work-hours-inner">
          <div className="time-swiper hours">
            <Swiper
              key={`hour-${hour}`}
              spaceBetween={10}
              slidesPerView={3}
              direction="vertical"
              navigation={!readOnly}
              loop={!readOnly}
              centeredSlides
              modules={readOnly ? EMPTY_MODULES : NAV_MODULES}
              allowTouchMove={!readOnly}
              className="mySwiper"
              initialSlide={hourToSlideIndex(hour)}
              onSlideChange={(swiper) => !isInteractionBlocked && onHourChange(slideIndexToHour(swiper.realIndex))}
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
              key={`min-${minute}`}
              spaceBetween={10}
              slidesPerView={3}
              direction="vertical"
              navigation={!readOnly}
              modules={readOnly ? EMPTY_MODULES : NAV_MODULES}
              loop={false}
              centeredSlides
              allowTouchMove={!readOnly}
              className="mySwiper"
              initialSlide={minuteToSlideIndex(minute)}
              onSlideChange={(swiper) => !isInteractionBlocked && onMinuteChange(slideIndexToMinute(swiper.activeIndex))}
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
            <span className="explain">{period}</span>
            <div>
              <input type="text" className="input-frame xs" value={hour} readOnly />
            </div>
            <span className="explain">시</span>
            <div>
              <input type="text" className="input-frame xs" value={minute} readOnly />
            </div>
            <span className="explain">분</span>
            <span className="explain">{suffix}</span>
          </div>
        </div>
      </div>
    </td>
  )
}

export default function WorkHoursTimePicker({
  idPrefix,
  toggleLabel,
  openTime,
  closeTime,
  breakStartTime,
  breakEndTime,
  isOperating,
  breakTimeEnabled,
  readOnly = false,
  onChange,
}: WorkHoursTimePickerProps) {
  const [workStart, setWorkStart] = useState(() => parseTime(openTime))
  const [workEnd, setWorkEnd] = useState(() => parseTime(closeTime))
  const [breakStart, setBreakStart] = useState(() => parseTime(breakStartTime))
  const [breakEnd, setBreakEnd] = useState(() => parseTime(breakEndTime))
  const [workEnabled, setWorkEnabled] = useState(isOperating)
  const [breakEnabled, setBreakEnabled] = useState(breakTimeEnabled)

  const [prevProps, setPrevProps] = useState({ isOperating, breakTimeEnabled, openTime, closeTime, breakStartTime, breakEndTime })
  if (
    isOperating !== prevProps.isOperating ||
    breakTimeEnabled !== prevProps.breakTimeEnabled ||
    openTime !== prevProps.openTime ||
    closeTime !== prevProps.closeTime ||
    breakStartTime !== prevProps.breakStartTime ||
    breakEndTime !== prevProps.breakEndTime
  ) {
    setPrevProps({ isOperating, breakTimeEnabled, openTime, closeTime, breakStartTime, breakEndTime })
    setWorkEnabled(isOperating)
    setBreakEnabled(breakTimeEnabled)
    setWorkStart(parseTime(openTime))
    setWorkEnd(parseTime(closeTime))
    setBreakStart(parseTime(breakStartTime))
    setBreakEnd(parseTime(breakEndTime))
  }

  const emitWorkStart = (p: Period, h: string, m: string) => {
    onChange?.({ openTime: to24Hour(p, h, m) })
  }
  const emitWorkEnd = (p: Period, h: string, m: string) => {
    onChange?.({ closeTime: to24Hour(p, h, m) })
  }
  const emitBreakStart = (p: Period, h: string, m: string) => {
    onChange?.({ breakStartTime: to24Hour(p, h, m) })
  }
  const emitBreakEnd = (p: Period, h: string, m: string) => {
    onChange?.({ breakEndTime: to24Hour(p, h, m) })
  }

  return (
    <table className="work-hours-table">
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
              <span className="toggle-txt">{toggleLabel[0]}</span>
              {!readOnly && (
                <div className="toggle-btn">
                  <input
                    type="checkbox"
                    id={`toggle-work-${idPrefix}`}
                    checked={workEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setWorkEnabled(checked)
                      if (checked) {
                        onChange?.({ isOperating: true })
                      } else {
                        setBreakEnabled(false)
                        onChange?.({ isOperating: false, breakTimeEnabled: false })
                      }
                    }}
                  />
                  <label className="slider" htmlFor={`toggle-work-${idPrefix}`} />
                </div>
              )}
            </div>
          </th>
          <th colSpan={2}>
            <div className="toggle-wrap">
              <span className="toggle-txt">{toggleLabel[1]}</span>
              {!readOnly && (
                <div className="toggle-btn">
                  <input
                    type="checkbox"
                    id={`toggle-break-${idPrefix}`}
                    checked={breakEnabled}
                    disabled={!workEnabled}
                    onChange={(e) => {
                      setBreakEnabled(e.target.checked)
                      onChange?.({ breakTimeEnabled: e.target.checked })
                    }}
                  />
                  <label className="slider" htmlFor={`toggle-break-${idPrefix}`} />
                </div>
              )}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <TimeSwiperColumn
            disabled={!workEnabled}
            readOnly={readOnly}
            period={workStart.period}
            hour={workStart.hour}
            minute={workStart.minute}
            suffix="부터"
            onPeriodChange={(p) => { setWorkStart((prev) => ({ ...prev, period: p })); emitWorkStart(p, workStart.hour, workStart.minute) }}
            onHourChange={(h) => { setWorkStart((prev) => ({ ...prev, hour: h })); emitWorkStart(workStart.period, h, workStart.minute) }}
            onMinuteChange={(m) => { setWorkStart((prev) => ({ ...prev, minute: m })); emitWorkStart(workStart.period, workStart.hour, m) }}
          />
          <TimeSwiperColumn
            disabled={!workEnabled}
            readOnly={readOnly}
            period={workEnd.period}
            hour={workEnd.hour}
            minute={workEnd.minute}
            suffix="까지"
            onPeriodChange={(p) => { setWorkEnd((prev) => ({ ...prev, period: p })); emitWorkEnd(p, workEnd.hour, workEnd.minute) }}
            onHourChange={(h) => { setWorkEnd((prev) => ({ ...prev, hour: h })); emitWorkEnd(workEnd.period, h, workEnd.minute) }}
            onMinuteChange={(m) => { setWorkEnd((prev) => ({ ...prev, minute: m })); emitWorkEnd(workEnd.period, workEnd.hour, m) }}
          />
          <TimeSwiperColumn
            disabled={!breakEnabled}
            readOnly={readOnly}
            period={breakStart.period}
            hour={breakStart.hour}
            minute={breakStart.minute}
            suffix="부터"
            onPeriodChange={(p) => { setBreakStart((prev) => ({ ...prev, period: p })); emitBreakStart(p, breakStart.hour, breakStart.minute) }}
            onHourChange={(h) => { setBreakStart((prev) => ({ ...prev, hour: h })); emitBreakStart(breakStart.period, h, breakStart.minute) }}
            onMinuteChange={(m) => { setBreakStart((prev) => ({ ...prev, minute: m })); emitBreakStart(breakStart.period, breakStart.hour, m) }}
          />
          <TimeSwiperColumn
            disabled={!breakEnabled}
            readOnly={readOnly}
            period={breakEnd.period}
            hour={breakEnd.hour}
            minute={breakEnd.minute}
            suffix="까지"
            onPeriodChange={(p) => { setBreakEnd((prev) => ({ ...prev, period: p })); emitBreakEnd(p, breakEnd.hour, breakEnd.minute) }}
            onHourChange={(h) => { setBreakEnd((prev) => ({ ...prev, hour: h })); emitBreakEnd(breakEnd.period, h, breakEnd.minute) }}
            onMinuteChange={(m) => { setBreakEnd((prev) => ({ ...prev, minute: m })); emitBreakEnd(breakEnd.period, breakEnd.hour, m) }}
          />
        </tr>
      </tbody>
    </table>
  )
}
