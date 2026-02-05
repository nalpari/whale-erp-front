'use client'
import { Swiper, SwiperSlide } from 'swiper/react'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import { Navigation } from 'swiper/modules'

import AnimateHeight from 'react-animate-height'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tooltip } from 'react-tooltip'
import { useContractDetail, useCreateContractWorkHours } from '@/hooks/queries/use-contract-queries'
import type { WorkHourDto } from '@/lib/api/employmentContract'
import { useAlert } from '@/components/common/ui'

interface WorkingHoursProps {
  contractId?: number
}

// 근무 시간 데이터 인터페이스
interface WorkHourData {
  dayType: string
  isWork: boolean
  isBreak: boolean
  workStartTime?: string
  workEndTime?: string
  breakStartTime?: string
  breakEndTime?: string
  everySaturdayWork?: boolean
  firstSaturdayWorkDay?: number
  everySundayWork?: boolean
  firstSundayWorkDay?: number
}

// 시간 파싱 유틸리티
const parseTime = (timeStr?: string): { period: 'AM' | 'PM', hour: number, minute: number } => {
  if (!timeStr) return { period: 'AM', hour: 9, minute: 0 }

  const [hourStr, minuteStr] = timeStr.split(':')
  let hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10) || 0
  const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM'

  // 12시간제로 변환
  if (hour > 12) hour -= 12
  if (hour === 0) hour = 12

  return { period, hour, minute }
}

export default function WorkingHours({ contractId }: WorkingHoursProps) {
  const router = useRouter()
  const { alert } = useAlert()
  const [slideboxOpen, setSlideboxOpen] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [employeeName, setEmployeeName] = useState('')

  // TanStack Query로 계약 상세 조회
  const { data: contract, isPending: isLoading } = useContractDetail(contractId ?? 0, !!contractId)
  const createWorkHoursMutation = useCreateContractWorkHours()

  // 근무 시간 데이터 상태
  const [_workHoursData, setWorkHoursData] = useState<{
    weekday: WorkHourData | null
    saturday: WorkHourData | null
    sunday: WorkHourData | null
  }>({
    weekday: null,
    saturday: null,
    sunday: null
  })

  // 평일 근무 요일 상태
  const [weekDays, setWeekDays] = useState<Record<string, boolean>>({
    MONDAY: false,
    TUESDAY: false,
    WEDNESDAY: false,
    THURSDAY: false,
    FRIDAY: false
  })

  // 토요일/일요일 설정
  const [saturdaySchedule, setSaturdaySchedule] = useState<'none' | 'every' | 'biweekly'>('none')
  const [sundaySchedule, setSundaySchedule] = useState<'none' | 'every' | 'biweekly'>('none')
  const [saturdayFirstWorkDay, setSaturdayFirstWorkDay] = useState<string>('')
  const [sundayFirstWorkDay, setSundayFirstWorkDay] = useState<string>('')

  // 평일 근무유무/휴게유무 토글 상태
  const [weekdayIsWork, setWeekdayIsWork] = useState<boolean>(true)
  const [weekdayIsBreak, setWeekdayIsBreak] = useState<boolean>(true)

  // 시간 선택 상태 (출근, 퇴근, 휴게시작, 휴게종료)
  const [workStartPeriod, setWorkStartPeriod] = useState<'오전' | '오후'>('오전')
  const [workStartHour, setWorkStartHour] = useState<string>('09')
  const [workStartMinute, setWorkStartMinute] = useState<string>('00')

  const [workEndPeriod, setWorkEndPeriod] = useState<'오전' | '오후'>('오후')
  const [workEndHour, setWorkEndHour] = useState<string>('06')
  const [workEndMinute, setWorkEndMinute] = useState<string>('00')

  const [breakStartPeriod, setBreakStartPeriod] = useState<'오전' | '오후'>('오후')
  const [breakStartHour, setBreakStartHour] = useState<string>('12')
  const [breakStartMinute, setBreakStartMinute] = useState<string>('00')

  const [breakEndPeriod, setBreakEndPeriod] = useState<'오전' | '오후'>('오후')
  const [breakEndHour, setBreakEndHour] = useState<string>('01')
  const [breakEndMinute, setBreakEndMinute] = useState<string>('00')

  // 토요일 시간 선택 상태
  const [satWorkStartPeriod, setSatWorkStartPeriod] = useState<'오전' | '오후'>('오전')
  const [satWorkStartHour, setSatWorkStartHour] = useState<string>('09')
  const [satWorkStartMinute, setSatWorkStartMinute] = useState<string>('00')
  const [satWorkEndPeriod, setSatWorkEndPeriod] = useState<'오전' | '오후'>('오후')
  const [satWorkEndHour, setSatWorkEndHour] = useState<string>('01')
  const [satWorkEndMinute, setSatWorkEndMinute] = useState<string>('00')
  const [satBreakStartPeriod, setSatBreakStartPeriod] = useState<'오전' | '오후'>('오후')
  const [satBreakStartHour, setSatBreakStartHour] = useState<string>('12')
  const [satBreakStartMinute, setSatBreakStartMinute] = useState<string>('00')
  const [satBreakEndPeriod, setSatBreakEndPeriod] = useState<'오전' | '오후'>('오후')
  const [satBreakEndHour, setSatBreakEndHour] = useState<string>('01')
  const [satBreakEndMinute, setSatBreakEndMinute] = useState<string>('00')
  const [satIsBreak, setSatIsBreak] = useState<boolean>(true)

  // 일요일 시간 선택 상태
  const [sunWorkStartPeriod, setSunWorkStartPeriod] = useState<'오전' | '오후'>('오전')
  const [sunWorkStartHour, setSunWorkStartHour] = useState<string>('09')
  const [sunWorkStartMinute, setSunWorkStartMinute] = useState<string>('00')
  const [sunWorkEndPeriod, setSunWorkEndPeriod] = useState<'오전' | '오후'>('오후')
  const [sunWorkEndHour, setSunWorkEndHour] = useState<string>('01')
  const [sunWorkEndMinute, setSunWorkEndMinute] = useState<string>('00')
  const [sunBreakStartPeriod, setSunBreakStartPeriod] = useState<'오전' | '오후'>('오후')
  const [sunBreakStartHour, setSunBreakStartHour] = useState<string>('12')
  const [sunBreakStartMinute, setSunBreakStartMinute] = useState<string>('00')
  const [sunBreakEndPeriod, setSunBreakEndPeriod] = useState<'오전' | '오후'>('오후')
  const [sunBreakEndHour, setSunBreakEndHour] = useState<string>('01')
  const [sunBreakEndMinute, setSunBreakEndMinute] = useState<string>('00')
  const [sunIsBreak, setSunIsBreak] = useState<boolean>(true)

  // contract 데이터가 변경되면 상태 업데이트
  useEffect(() => {
    if (!contract) return

    const workHours = contract.workHours || []
    const member = contract.member

    setEmployeeName(member?.name || '')

        // 근무 시간 데이터 분류
        let weekdayData: WorkHourData | null = null
        let saturdayData: WorkHourData | null = null
        let sundayData: WorkHourData | null = null

        // 평일 근무 요일 설정
        const newWeekDays: Record<string, boolean> = {
          MONDAY: false,
          TUESDAY: false,
          WEDNESDAY: false,
          THURSDAY: false,
          FRIDAY: false
        }

        workHours.forEach((wh) => {
          if (wh.dayType === 'WEEKDAY') {
            weekdayData = wh
          } else if (wh.dayType === 'SATURDAY') {
            saturdayData = wh
            // 토요일 근무 여부 설정
            if (!wh.isWork) {
              setSaturdaySchedule('none')
            } else if (wh.everySaturdayWork !== undefined) {
              setSaturdaySchedule(wh.everySaturdayWork ? 'every' : 'biweekly')
            }
            // 격주 첫 근무일 설정
            if (wh.firstSaturdayWorkDay) {
              const date = new Date(wh.firstSaturdayWorkDay)
              setSaturdayFirstWorkDay(date.toISOString().split('T')[0])
            }
          } else if (wh.dayType === 'SUNDAY') {
            sundayData = wh
            // 일요일 근무 여부 설정
            if (!wh.isWork) {
              setSundaySchedule('none')
            } else if (wh.everySundayWork !== undefined) {
              setSundaySchedule(wh.everySundayWork ? 'every' : 'biweekly')
            }
            // 격주 첫 근무일 설정
            if (wh.firstSundayWorkDay) {
              const date = new Date(wh.firstSundayWorkDay)
              setSundayFirstWorkDay(date.toISOString().split('T')[0])
            }
          } else if (['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(wh.dayType)) {
            // 개별 요일 설정
            if (wh.isWork) {
              newWeekDays[wh.dayType] = true
            }
            // 평일 기본 데이터로 사용
            if (!weekdayData && wh.isWork) {
              weekdayData = wh
            }
          }
        })

        setWeekDays(newWeekDays)
        setWorkHoursData({
          weekday: weekdayData,
          saturday: saturdayData,
          sunday: sundayData
        })

        // 평일 근무유무/휴게유무 설정
        const weekdayDataCopy = weekdayData as WorkHourData | null
        if (weekdayDataCopy) {
          setWeekdayIsWork(weekdayDataCopy.isWork ?? true)
          setWeekdayIsBreak(weekdayDataCopy.isBreak ?? true)

          // 시간 상태 초기화
          const workStart = parseTime(weekdayDataCopy.workStartTime)
          setWorkStartPeriod(workStart.period === 'AM' ? '오전' : '오후')
          setWorkStartHour(workStart.hour.toString().padStart(2, '0'))
          setWorkStartMinute(workStart.minute.toString().padStart(2, '0'))

          const workEnd = parseTime(weekdayDataCopy.workEndTime)
          setWorkEndPeriod(workEnd.period === 'AM' ? '오전' : '오후')
          setWorkEndHour(workEnd.hour.toString().padStart(2, '0'))
          setWorkEndMinute(workEnd.minute.toString().padStart(2, '0'))

          const breakStartTime = parseTime(weekdayDataCopy.breakStartTime)
          setBreakStartPeriod(breakStartTime.period === 'AM' ? '오전' : '오후')
          setBreakStartHour(breakStartTime.hour.toString().padStart(2, '0'))
          setBreakStartMinute(breakStartTime.minute.toString().padStart(2, '0'))

          const breakEndTime = parseTime(weekdayDataCopy.breakEndTime)
          setBreakEndPeriod(breakEndTime.period === 'AM' ? '오전' : '오후')
          setBreakEndHour(breakEndTime.hour.toString().padStart(2, '0'))
          setBreakEndMinute(breakEndTime.minute.toString().padStart(2, '0'))
        }

        // 토요일 시간 초기화
        const satDataCopy = saturdayData as WorkHourData | null
        if (satDataCopy) {
          setSatIsBreak(satDataCopy.isBreak ?? true)

          const satWorkStart = parseTime(satDataCopy.workStartTime)
          setSatWorkStartPeriod(satWorkStart.period === 'AM' ? '오전' : '오후')
          setSatWorkStartHour(satWorkStart.hour.toString().padStart(2, '0'))
          setSatWorkStartMinute(satWorkStart.minute.toString().padStart(2, '0'))

          const satWorkEnd = parseTime(satDataCopy.workEndTime)
          setSatWorkEndPeriod(satWorkEnd.period === 'AM' ? '오전' : '오후')
          setSatWorkEndHour(satWorkEnd.hour.toString().padStart(2, '0'))
          setSatWorkEndMinute(satWorkEnd.minute.toString().padStart(2, '0'))

          const satBreakStart = parseTime(satDataCopy.breakStartTime)
          setSatBreakStartPeriod(satBreakStart.period === 'AM' ? '오전' : '오후')
          setSatBreakStartHour(satBreakStart.hour.toString().padStart(2, '0'))
          setSatBreakStartMinute(satBreakStart.minute.toString().padStart(2, '0'))

          const satBreakEnd = parseTime(satDataCopy.breakEndTime)
          setSatBreakEndPeriod(satBreakEnd.period === 'AM' ? '오전' : '오후')
          setSatBreakEndHour(satBreakEnd.hour.toString().padStart(2, '0'))
          setSatBreakEndMinute(satBreakEnd.minute.toString().padStart(2, '0'))
        }

        // 일요일 시간 초기화
        const sunDataCopy = sundayData as WorkHourData | null
        if (sunDataCopy) {
          setSunIsBreak(sunDataCopy.isBreak ?? true)

          const sunWorkStart = parseTime(sunDataCopy.workStartTime)
          setSunWorkStartPeriod(sunWorkStart.period === 'AM' ? '오전' : '오후')
          setSunWorkStartHour(sunWorkStart.hour.toString().padStart(2, '0'))
          setSunWorkStartMinute(sunWorkStart.minute.toString().padStart(2, '0'))

          const sunWorkEnd = parseTime(sunDataCopy.workEndTime)
          setSunWorkEndPeriod(sunWorkEnd.period === 'AM' ? '오전' : '오후')
          setSunWorkEndHour(sunWorkEnd.hour.toString().padStart(2, '0'))
          setSunWorkEndMinute(sunWorkEnd.minute.toString().padStart(2, '0'))

          const sunBreakStart = parseTime(sunDataCopy.breakStartTime)
          setSunBreakStartPeriod(sunBreakStart.period === 'AM' ? '오전' : '오후')
          setSunBreakStartHour(sunBreakStart.hour.toString().padStart(2, '0'))
          setSunBreakStartMinute(sunBreakStart.minute.toString().padStart(2, '0'))

          const sunBreakEnd = parseTime(sunDataCopy.breakEndTime)
          setSunBreakEndPeriod(sunBreakEnd.period === 'AM' ? '오전' : '오후')
          setSunBreakEndHour(sunBreakEnd.hour.toString().padStart(2, '0'))
          setSunBreakEndMinute(sunBreakEnd.minute.toString().padStart(2, '0'))
        }
  }, [contract])

  // 시간 데이터 객체 (상태 기반)
  const weekdayStart = { period: workStartPeriod, hour: workStartHour, minute: workStartMinute }
  const weekdayEnd = { period: workEndPeriod, hour: workEndHour, minute: workEndMinute }
  const breakStart = { period: breakStartPeriod, hour: breakStartHour, minute: breakStartMinute }
  const breakEnd = { period: breakEndPeriod, hour: breakEndHour, minute: breakEndMinute }

  // 시간(hour)을 슬라이드 인덱스로 변환 (1~12 -> 0~11)
  const hourToSlideIndex = (hour: string): number => {
    const h = parseInt(hour, 10)
    return h - 1 // 1시=0, 2시=1, ..., 12시=11
  }

  // 분(minute)을 슬라이드 인덱스로 변환 (00->0, 30->1)
  const minuteToSlideIndex = (minute: string): number => {
    return minute === '30' ? 1 : 0
  }

  // 슬라이드 인덱스를 시간(hour)으로 변환 (0~11 -> 01~12)
  const slideIndexToHour = (index: number): string => {
    const realIndex = ((index % 12) + 12) % 12 // loop 처리
    return (realIndex + 1).toString().padStart(2, '0')
  }

  // 슬라이드 인덱스를 분(minute)으로 변환 (0->00, 1->30)
  const slideIndexToMinute = (index: number): string => {
    return index === 1 ? '30' : '00'
  }

  const handleBack = () => {
    router.push(`/employee/contract/${contractId}`)
  }

  const handleSave = async () => {
    if (!contractId) {
      await alert('계약 정보를 찾을 수 없습니다.')
      return
    }

    setIsSaving(true)
    try {
      // 시간 포맷 생성 (HH:mm:ss)
      const formatTime = (period: string, hour: string, minute: string): string => {
        let h = parseInt(hour, 10)
        if (period === '오후' && h < 12) h += 12
        if (period === '오전' && h === 12) h = 0
        return `${h.toString().padStart(2, '0')}:${minute}:00`
      }

      const workHoursPayload: WorkHourDto[] = []

      // 각 요일별 데이터 (월~금)
      const dayTypes = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const
      dayTypes.forEach(dayType => {
        workHoursPayload.push({
          dayType,
          isWork: weekDays[dayType],
          isBreak: weekdayIsBreak,
          workStartTime: formatTime(weekdayStart.period, weekdayStart.hour, weekdayStart.minute),
          workEndTime: formatTime(weekdayEnd.period, weekdayEnd.hour, weekdayEnd.minute),
          breakStartTime: formatTime(breakStart.period, breakStart.hour, breakStart.minute),
          breakEndTime: formatTime(breakEnd.period, breakEnd.hour, breakEnd.minute)
        })
      })

      // 토요일 데이터
      workHoursPayload.push({
        dayType: 'SATURDAY',
        isWork: saturdaySchedule !== 'none',
        isBreak: saturdaySchedule !== 'none' ? satIsBreak : false,  // 근무 안하면 휴게시간도 없음
        everySaturdayWork: saturdaySchedule === 'every',
        firstSaturdayWorkDay: saturdaySchedule === 'biweekly' ? (saturdayFirstWorkDay || null) : null,
        workStartTime: saturdaySchedule !== 'none' ? formatTime(satWorkStartPeriod, satWorkStartHour, satWorkStartMinute) : undefined,
        workEndTime: saturdaySchedule !== 'none' ? formatTime(satWorkEndPeriod, satWorkEndHour, satWorkEndMinute) : undefined,
        breakStartTime: saturdaySchedule !== 'none' && satIsBreak ? formatTime(satBreakStartPeriod, satBreakStartHour, satBreakStartMinute) : undefined,
        breakEndTime: saturdaySchedule !== 'none' && satIsBreak ? formatTime(satBreakEndPeriod, satBreakEndHour, satBreakEndMinute) : undefined
      })

      // 일요일 데이터
      workHoursPayload.push({
        dayType: 'SUNDAY',
        isWork: sundaySchedule !== 'none',
        isBreak: sundaySchedule !== 'none' ? sunIsBreak : false,  // 근무 안하면 휴게시간도 없음
        everySundayWork: sundaySchedule === 'every',
        firstSundayWorkDay: sundaySchedule === 'biweekly' ? (sundayFirstWorkDay || null) : null,
        workStartTime: sundaySchedule !== 'none' ? formatTime(sunWorkStartPeriod, sunWorkStartHour, sunWorkStartMinute) : undefined,
        workEndTime: sundaySchedule !== 'none' ? formatTime(sunWorkEndPeriod, sunWorkEndHour, sunWorkEndMinute) : undefined,
        breakStartTime: sundaySchedule !== 'none' && sunIsBreak ? formatTime(sunBreakStartPeriod, sunBreakStartHour, sunBreakStartMinute) : undefined,
        breakEndTime: sundaySchedule !== 'none' && sunIsBreak ? formatTime(sunBreakEndPeriod, sunBreakEndHour, sunBreakEndMinute) : undefined
      })

      await createWorkHoursMutation.mutateAsync({ contractId, workHours: workHoursPayload })
      await alert('저장되었습니다.')
    } catch (error) {
      console.error('저장 실패:', error)
      await alert('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="contents-wrap">
        <div className="contents-body">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <span>데이터를 불러오는 중...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="contents-wrap">
      <div className="contents-body">
        <div className="content-wrap">
          <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
            <div className="slidebox-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="btn-form outline" onClick={handleBack} style={{ padding: '4px 8px' }}>
                  <span style={{ fontSize: '16px' }}>&lt;</span>
                </button>
                <h2>계약 근무 시간</h2>
              </div>
              <div className="slidebox-btn-wrap">
                <button className="slidebox-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? '저장 중...' : '저장'}
                </button>
                <button className="slidebox-btn arr" onClick={() => setSlideboxOpen(!slideboxOpen)} aria-label={slideboxOpen ? '계약 근무 시간 접기' : '계약 근무 시간 펼치기'}>
                  <i className="arr-icon"></i>
                </button>
              </div>
            </div>
            <AnimateHeight duration={300} height={slideboxOpen ? 'auto' : 0}>
              <div className="slidebox-body">
                <table className="default-table">
                  <colgroup>
                    <col width="190px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>평일 근무시간</th>
                      <td>
                        <div className="work-info mb10">
                          <div className="work-badge blue">정직원</div>
                          <div className="staff-name">{employeeName || '미지정'}</div>
                          <div className="more-btn">
                            <span className="icon-more" id="more-btn-anchor-work-hours-01"></span>
                            <Tooltip
                              className="option-list"
                              anchorSelect="#more-btn-anchor-work-hours-01"
                              place="right-start"
                              offset={0}
                              openOnClick={true} // 클릭으로 열기
                              clickable={true} // 툴팁 내부 클릭 가능
                              opacity={1}
                            >
                              <button className="option-item">근무자 추가</button>
                              <button className="option-item">근무자 삭제</button>
                              <button className="option-item">근무자 교체</button>
                              <button className="option-item">직원 외 근무자 추가</button>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="work-info mb10">
                          <div className="work-badge green">파트</div>
                          <div className="staff-name">홍길동</div>
                          <div className="more-btn">
                            <span className="icon-more" id="more-btn-anchor-work-hours-02"></span>
                            <Tooltip
                              className="option-list"
                              anchorSelect="#more-btn-anchor-work-hours-02"
                              place="right-start"
                              offset={0}
                              openOnClick={true} // 클릭으로 열기
                              clickable={true} // 툴팁 내부 클릭 가능
                              opacity={1}
                            >
                              <button className="option-item">근무자 추가</button>
                              <button className="option-item">근무자 삭제</button>
                              <button className="option-item">근무자 교체</button>
                              <button className="option-item">직원 외 근무자 추가</button>
                            </Tooltip>
                          </div>
                        </div>
                        <table className="work-hours-table">
                          <colgroup>
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
                                      id="toggle-work"
                                      checked={weekdayIsWork}
                                      onChange={(e) => setWeekdayIsWork(e.target.checked)}
                                    />
                                    <label className="slider" htmlFor="toggle-work"></label>
                                  </div>
                                </div>
                              </th>
                              <th colSpan={2}>
                                <div className="toggle-wrap">
                                  <span className="toggle-txt">휴게유무</span>
                                  <div className="toggle-btn">
                                    <input
                                      type="checkbox"
                                      id="toggle-break"
                                      checked={weekdayIsBreak}
                                      onChange={(e) => setWeekdayIsBreak(e.target.checked)}
                                    />
                                    <label className="slider" htmlFor="toggle-break"></label>
                                  </div>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                <div className={`work-hours-box ${!weekdayIsWork ? 'disabled' : ''}`}>
                                  <div className="work-hours-tab">
                                    <button
                                      className={`work-time-tab ${workStartPeriod === '오전' ? 'act' : ''}`}
                                      onClick={() => setWorkStartPeriod('오전')}
                                    >오전</button>
                                    <button
                                      className={`work-time-tab ${workStartPeriod === '오후' ? 'act' : ''}`}
                                      onClick={() => setWorkStartPeriod('오후')}
                                    >오후</button>
                                  </div>
                                  <div className="work-hours-inner">
                                    <div className="time-swiper hours">
                                      <Swiper
                                        spaceBetween={10}
                                        slidesPerView={3}
                                        direction={'vertical'}
                                        navigation={true}
                                        loop={true}
                                        centeredSlides={true}
                                        modules={[Navigation]}
                                        className="mySwiper"
                                        initialSlide={hourToSlideIndex(workStartHour)}
                                        onSlideChange={(swiper) => setWorkStartHour(slideIndexToHour(swiper.realIndex))}
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
                                        spaceBetween={10}
                                        slidesPerView={3}
                                        direction={'vertical'}
                                        navigation={true}
                                        modules={[Navigation]}
                                        loop={false}
                                        centeredSlides={true}
                                        className="mySwiper"
                                        initialSlide={minuteToSlideIndex(workStartMinute)}
                                        onSlideChange={(swiper) => setWorkStartMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                      <span className="explain">{weekdayStart.period}</span>
                                      <div>
                                        <input type="text" className="input-frame xs" value={weekdayStart.hour} readOnly />
                                      </div>
                                      <span className="explain">시</span>
                                      <div>
                                        <input type="text" className="input-frame xs" value={weekdayStart.minute} readOnly />
                                      </div>
                                      <span className="explain">분</span>
                                      <span className="explain">부터</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className={`work-hours-box ${!weekdayIsWork ? 'disabled' : ''}`}>
                                  <div className="work-hours-tab">
                                    <button
                                      className={`work-time-tab ${workEndPeriod === '오전' ? 'act' : ''}`}
                                      onClick={() => setWorkEndPeriod('오전')}
                                    >오전</button>
                                    <button
                                      className={`work-time-tab ${workEndPeriod === '오후' ? 'act' : ''}`}
                                      onClick={() => setWorkEndPeriod('오후')}
                                    >오후</button>
                                  </div>
                                  <div className="work-hours-inner">
                                    <div className="time-swiper hours">
                                      <Swiper
                                        spaceBetween={10}
                                        slidesPerView={3}
                                        direction={'vertical'}
                                        navigation={true}
                                        loop={true}
                                        centeredSlides={true}
                                        modules={[Navigation]}
                                        className="mySwiper"
                                        initialSlide={hourToSlideIndex(workEndHour)}
                                        onSlideChange={(swiper) => setWorkEndHour(slideIndexToHour(swiper.realIndex))}
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
                                        spaceBetween={10}
                                        slidesPerView={3}
                                        direction={'vertical'}
                                        navigation={true}
                                        modules={[Navigation]}
                                        loop={false}
                                        centeredSlides={true}
                                        className="mySwiper"
                                        initialSlide={minuteToSlideIndex(workEndMinute)}
                                        onSlideChange={(swiper) => setWorkEndMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                      <span className="explain">{weekdayEnd.period}</span>
                                      <div>
                                        <input type="text" className="input-frame xs" value={weekdayEnd.hour} readOnly />
                                      </div>
                                      <span className="explain">시</span>
                                      <div>
                                        <input type="text" className="input-frame xs" value={weekdayEnd.minute} readOnly />
                                      </div>
                                      <span className="explain">분</span>
                                      <span className="explain">까지</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className={`work-hours-box ${!weekdayIsBreak ? 'disabled' : ''}`}>
                                  <div className="work-hours-tab">
                                    <button
                                      className={`work-time-tab ${breakStartPeriod === '오전' ? 'act' : ''}`}
                                      onClick={() => setBreakStartPeriod('오전')}
                                    >오전</button>
                                    <button
                                      className={`work-time-tab ${breakStartPeriod === '오후' ? 'act' : ''}`}
                                      onClick={() => setBreakStartPeriod('오후')}
                                    >오후</button>
                                  </div>
                                  <div className="work-hours-inner">
                                    <div className="time-swiper hours">
                                      <Swiper
                                        spaceBetween={10}
                                        slidesPerView={3}
                                        direction={'vertical'}
                                        navigation={true}
                                        loop={true}
                                        centeredSlides={true}
                                        modules={[Navigation]}
                                        className="mySwiper"
                                        initialSlide={hourToSlideIndex(breakStartHour)}
                                        onSlideChange={(swiper) => setBreakStartHour(slideIndexToHour(swiper.realIndex))}
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
                                        spaceBetween={10}
                                        slidesPerView={3}
                                        direction={'vertical'}
                                        navigation={true}
                                        modules={[Navigation]}
                                        loop={false}
                                        centeredSlides={true}
                                        className="mySwiper"
                                        initialSlide={minuteToSlideIndex(breakStartMinute)}
                                        onSlideChange={(swiper) => setBreakStartMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                      <span className="explain">{breakStart.period}</span>
                                      <div>
                                        <input type="text" className="input-frame xs" value={breakStart.hour} readOnly />
                                      </div>
                                      <span className="explain">시</span>
                                      <div>
                                        <input type="text" className="input-frame xs" value={breakStart.minute} readOnly />
                                      </div>
                                      <span className="explain">분</span>
                                      <span className="explain">부터</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className={`work-hours-box ${!weekdayIsBreak ? 'disabled' : ''}`}>
                                  <div className="work-hours-tab">
                                    <button
                                      className={`work-time-tab ${breakEndPeriod === '오전' ? 'act' : ''}`}
                                      onClick={() => setBreakEndPeriod('오전')}
                                    >오전</button>
                                    <button
                                      className={`work-time-tab ${breakEndPeriod === '오후' ? 'act' : ''}`}
                                      onClick={() => setBreakEndPeriod('오후')}
                                    >오후</button>
                                  </div>
                                  <div className="work-hours-inner">
                                    <div className="time-swiper hours">
                                      <Swiper
                                        spaceBetween={10}
                                        slidesPerView={3}
                                        direction={'vertical'}
                                        navigation={true}
                                        loop={true}
                                        centeredSlides={true}
                                        modules={[Navigation]}
                                        className="mySwiper"
                                        initialSlide={hourToSlideIndex(breakEndHour)}
                                        onSlideChange={(swiper) => setBreakEndHour(slideIndexToHour(swiper.realIndex))}
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
                                        spaceBetween={10}
                                        slidesPerView={3}
                                        direction={'vertical'}
                                        navigation={true}
                                        modules={[Navigation]}
                                        loop={false}
                                        centeredSlides={true}
                                        className="mySwiper"
                                        initialSlide={minuteToSlideIndex(breakEndMinute)}
                                        onSlideChange={(swiper) => setBreakEndMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                      <span className="explain">{breakEnd.period}</span>
                                      <div>
                                        <input type="text" className="input-frame xs" value={breakEnd.hour} readOnly />
                                      </div>
                                      <span className="explain">시</span>
                                      <div>
                                        <input type="text" className="input-frame xs" value={breakEnd.minute} readOnly />
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
                      </td>
                    </tr>
                    <tr>
                      <th>평일 근무 요일</th>
                      <td>
                        <div className="filed-flx g8">
                          <button
                            className={`day-btn ${weekDays.MONDAY ? 'act' : ''}`}
                            onClick={() => setWeekDays(prev => ({ ...prev, MONDAY: !prev.MONDAY }))}
                          >월</button>
                          <button
                            className={`day-btn ${weekDays.TUESDAY ? 'act' : ''}`}
                            onClick={() => setWeekDays(prev => ({ ...prev, TUESDAY: !prev.TUESDAY }))}
                          >화</button>
                          <button
                            className={`day-btn ${weekDays.WEDNESDAY ? 'act' : ''}`}
                            onClick={() => setWeekDays(prev => ({ ...prev, WEDNESDAY: !prev.WEDNESDAY }))}
                          >수</button>
                          <button
                            className={`day-btn ${weekDays.THURSDAY ? 'act' : ''}`}
                            onClick={() => setWeekDays(prev => ({ ...prev, THURSDAY: !prev.THURSDAY }))}
                          >목</button>
                          <button
                            className={`day-btn ${weekDays.FRIDAY ? 'act' : ''}`}
                            onClick={() => setWeekDays(prev => ({ ...prev, FRIDAY: !prev.FRIDAY }))}
                          >금</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>토요일 근무 여부</th>
                      <td>
                        <div className="filed-flx">
                          <div className="filed-check-flx">
                            <div className="radio-form-box">
                              <input
                                type="radio"
                                id="none-sat"
                                name="saturday-schedule"
                                checked={saturdaySchedule === 'none'}
                                onChange={() => setSaturdaySchedule('none')}
                              />
                              <label htmlFor="none-sat">근무 안함</label>
                            </div>
                            <div className="radio-form-box">
                              <input
                                type="radio"
                                id="every-sat"
                                name="saturday-schedule"
                                checked={saturdaySchedule === 'every'}
                                onChange={() => setSaturdaySchedule('every')}
                              />
                              <label htmlFor="every-sat">매주 토요일</label>
                            </div>
                            <div className="radio-form-box">
                              <input
                                type="radio"
                                id="biweek-sat"
                                name="saturday-schedule"
                                checked={saturdaySchedule === 'biweekly'}
                                onChange={() => setSaturdaySchedule('biweekly')}
                              />
                              <label htmlFor="biweek-sat">토요일 격주</label>
                            </div>
                          </div>
                          {saturdaySchedule === 'biweekly' && (
                            <div className="filed-flx ml10">
                              <div className="filed-flx g8">
                                <div className="explain">토요일 첫 근무일</div>
                                <div className="block">
                                  <input
                                    type="date"
                                    className="input-frame"
                                    value={saturdayFirstWorkDay}
                                    onChange={(e) => setSaturdayFirstWorkDay(e.target.value)}
                                    style={{ width: '150px' }}
                                  />
                                </div>
                              </div>
                              <div className="explain">※ 설정한 날짜를 격주 근무 시작일로 인식합니다.</div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {saturdaySchedule !== 'none' && (
                      <tr>
                        <th>토요일 근무시간</th>
                        <td>
                          <table className="work-hours-table">
                            <colgroup>
                              <col />
                              <col />
                            </colgroup>
                            <thead>
                              <tr>
                                <th colSpan={2}>
                                  <div className="toggle-wrap">
                                    <span className="toggle-txt">근무시간</span>
                                  </div>
                                </th>
                                <th colSpan={2}>
                                  <div className="toggle-wrap">
                                    <span className="toggle-txt">휴게유무</span>
                                    <div className="toggle-btn">
                                      <input
                                        type="checkbox"
                                        id="toggle-sat-break"
                                        checked={satIsBreak}
                                        onChange={(e) => setSatIsBreak(e.target.checked)}
                                      />
                                      <label className="slider" htmlFor="toggle-sat-break"></label>
                                    </div>
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <div className="work-hours-box">
                                    <div className="work-hours-tab">
                                      <button
                                        className={`work-time-tab ${satWorkStartPeriod === '오전' ? 'act' : ''}`}
                                        onClick={() => setSatWorkStartPeriod('오전')}
                                      >오전</button>
                                      <button
                                        className={`work-time-tab ${satWorkStartPeriod === '오후' ? 'act' : ''}`}
                                        onClick={() => setSatWorkStartPeriod('오후')}
                                      >오후</button>
                                    </div>
                                    <div className="work-hours-inner">
                                      <div className="time-swiper hours">
                                        <Swiper
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          loop={true}
                                          centeredSlides={true}
                                          modules={[Navigation]}
                                          className="mySwiper"
                                          initialSlide={hourToSlideIndex(satWorkStartHour)}
                                          onSlideChange={(swiper) => setSatWorkStartHour(slideIndexToHour(swiper.realIndex))}
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
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          modules={[Navigation]}
                                          loop={false}
                                          centeredSlides={true}
                                          className="mySwiper"
                                          initialSlide={minuteToSlideIndex(satWorkStartMinute)}
                                          onSlideChange={(swiper) => setSatWorkStartMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                        <span className="explain">{satWorkStartPeriod}</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={satWorkStartHour} readOnly />
                                        </div>
                                        <span className="explain">시</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={satWorkStartMinute} readOnly />
                                        </div>
                                        <span className="explain">분</span>
                                        <span className="explain">부터</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="work-hours-box">
                                    <div className="work-hours-tab">
                                      <button
                                        className={`work-time-tab ${satWorkEndPeriod === '오전' ? 'act' : ''}`}
                                        onClick={() => setSatWorkEndPeriod('오전')}
                                      >오전</button>
                                      <button
                                        className={`work-time-tab ${satWorkEndPeriod === '오후' ? 'act' : ''}`}
                                        onClick={() => setSatWorkEndPeriod('오후')}
                                      >오후</button>
                                    </div>
                                    <div className="work-hours-inner">
                                      <div className="time-swiper hours">
                                        <Swiper
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          loop={true}
                                          centeredSlides={true}
                                          modules={[Navigation]}
                                          className="mySwiper"
                                          initialSlide={hourToSlideIndex(satWorkEndHour)}
                                          onSlideChange={(swiper) => setSatWorkEndHour(slideIndexToHour(swiper.realIndex))}
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
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          modules={[Navigation]}
                                          loop={false}
                                          centeredSlides={true}
                                          className="mySwiper"
                                          initialSlide={minuteToSlideIndex(satWorkEndMinute)}
                                          onSlideChange={(swiper) => setSatWorkEndMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                        <span className="explain">{satWorkEndPeriod}</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={satWorkEndHour} readOnly />
                                        </div>
                                        <span className="explain">시</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={satWorkEndMinute} readOnly />
                                        </div>
                                        <span className="explain">분</span>
                                        <span className="explain">까지</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className={`work-hours-box ${!satIsBreak ? 'disabled' : ''}`}>
                                    <div className="work-hours-tab">
                                      <button
                                        className={`work-time-tab ${satBreakStartPeriod === '오전' ? 'act' : ''}`}
                                        onClick={() => setSatBreakStartPeriod('오전')}
                                      >오전</button>
                                      <button
                                        className={`work-time-tab ${satBreakStartPeriod === '오후' ? 'act' : ''}`}
                                        onClick={() => setSatBreakStartPeriod('오후')}
                                      >오후</button>
                                    </div>
                                    <div className="work-hours-inner">
                                      <div className="time-swiper hours">
                                        <Swiper
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          loop={true}
                                          centeredSlides={true}
                                          modules={[Navigation]}
                                          className="mySwiper"
                                          initialSlide={hourToSlideIndex(satBreakStartHour)}
                                          onSlideChange={(swiper) => setSatBreakStartHour(slideIndexToHour(swiper.realIndex))}
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
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          modules={[Navigation]}
                                          loop={false}
                                          centeredSlides={true}
                                          className="mySwiper"
                                          initialSlide={minuteToSlideIndex(satBreakStartMinute)}
                                          onSlideChange={(swiper) => setSatBreakStartMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                        <span className="explain">{satBreakStartPeriod}</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={satBreakStartHour} readOnly />
                                        </div>
                                        <span className="explain">시</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={satBreakStartMinute} readOnly />
                                        </div>
                                        <span className="explain">분</span>
                                        <span className="explain">부터</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className={`work-hours-box ${!satIsBreak ? 'disabled' : ''}`}>
                                    <div className="work-hours-tab">
                                      <button
                                        className={`work-time-tab ${satBreakEndPeriod === '오전' ? 'act' : ''}`}
                                        onClick={() => setSatBreakEndPeriod('오전')}
                                      >오전</button>
                                      <button
                                        className={`work-time-tab ${satBreakEndPeriod === '오후' ? 'act' : ''}`}
                                        onClick={() => setSatBreakEndPeriod('오후')}
                                      >오후</button>
                                    </div>
                                    <div className="work-hours-inner">
                                      <div className="time-swiper hours">
                                        <Swiper
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          loop={true}
                                          centeredSlides={true}
                                          modules={[Navigation]}
                                          className="mySwiper"
                                          initialSlide={hourToSlideIndex(satBreakEndHour)}
                                          onSlideChange={(swiper) => setSatBreakEndHour(slideIndexToHour(swiper.realIndex))}
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
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          modules={[Navigation]}
                                          loop={false}
                                          centeredSlides={true}
                                          className="mySwiper"
                                          initialSlide={minuteToSlideIndex(satBreakEndMinute)}
                                          onSlideChange={(swiper) => setSatBreakEndMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                        <span className="explain">{satBreakEndPeriod}</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={satBreakEndHour} readOnly />
                                        </div>
                                        <span className="explain">시</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={satBreakEndMinute} readOnly />
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
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th>일요일 근무 여부</th>
                      <td>
                        <div className="filed-flx">
                          <div className="filed-check-flx">
                            <div className="radio-form-box">
                              <input
                                type="radio"
                                id="none-sun"
                                name="sunday-schedule"
                                checked={sundaySchedule === 'none'}
                                onChange={() => setSundaySchedule('none')}
                              />
                              <label htmlFor="none-sun">근무 안함</label>
                            </div>
                            <div className="radio-form-box">
                              <input
                                type="radio"
                                id="every-sun"
                                name="sunday-schedule"
                                checked={sundaySchedule === 'every'}
                                onChange={() => setSundaySchedule('every')}
                              />
                              <label htmlFor="every-sun">매주 일요일</label>
                            </div>
                            <div className="radio-form-box">
                              <input
                                type="radio"
                                id="biweek-sun"
                                name="sunday-schedule"
                                checked={sundaySchedule === 'biweekly'}
                                onChange={() => setSundaySchedule('biweekly')}
                              />
                              <label htmlFor="biweek-sun">일요일 격주</label>
                            </div>
                          </div>
                          {sundaySchedule === 'biweekly' && (
                            <div className="filed-flx ml10">
                              <div className="filed-flx g8">
                                <div className="explain">일요일 첫 근무일</div>
                                <div className="block">
                                  <input
                                    type="date"
                                    className="input-frame"
                                    value={sundayFirstWorkDay}
                                    onChange={(e) => setSundayFirstWorkDay(e.target.value)}
                                    style={{ width: '150px' }}
                                  />
                                </div>
                              </div>
                              <div className="explain">※ 설정한 날짜를 격주 근무 시작일로 인식합니다.</div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {sundaySchedule !== 'none' && (
                      <tr>
                        <th>일요일 근무시간</th>
                        <td>
                          <table className="work-hours-table">
                            <colgroup>
                              <col />
                              <col />
                            </colgroup>
                            <thead>
                              <tr>
                                <th colSpan={2}>
                                  <div className="toggle-wrap">
                                    <span className="toggle-txt">근무시간</span>
                                  </div>
                                </th>
                                <th colSpan={2}>
                                  <div className="toggle-wrap">
                                    <span className="toggle-txt">휴게유무</span>
                                    <div className="toggle-btn">
                                      <input
                                        type="checkbox"
                                        id="toggle-sun-break"
                                        checked={sunIsBreak}
                                        onChange={(e) => setSunIsBreak(e.target.checked)}
                                      />
                                      <label className="slider" htmlFor="toggle-sun-break"></label>
                                    </div>
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <div className="work-hours-box">
                                    <div className="work-hours-tab">
                                      <button
                                        className={`work-time-tab ${sunWorkStartPeriod === '오전' ? 'act' : ''}`}
                                        onClick={() => setSunWorkStartPeriod('오전')}
                                      >오전</button>
                                      <button
                                        className={`work-time-tab ${sunWorkStartPeriod === '오후' ? 'act' : ''}`}
                                        onClick={() => setSunWorkStartPeriod('오후')}
                                      >오후</button>
                                    </div>
                                    <div className="work-hours-inner">
                                      <div className="time-swiper hours">
                                        <Swiper
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          loop={true}
                                          centeredSlides={true}
                                          modules={[Navigation]}
                                          className="mySwiper"
                                          initialSlide={hourToSlideIndex(sunWorkStartHour)}
                                          onSlideChange={(swiper) => setSunWorkStartHour(slideIndexToHour(swiper.realIndex))}
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
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          modules={[Navigation]}
                                          loop={false}
                                          centeredSlides={true}
                                          className="mySwiper"
                                          initialSlide={minuteToSlideIndex(sunWorkStartMinute)}
                                          onSlideChange={(swiper) => setSunWorkStartMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                        <span className="explain">{sunWorkStartPeriod}</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={sunWorkStartHour} readOnly />
                                        </div>
                                        <span className="explain">시</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={sunWorkStartMinute} readOnly />
                                        </div>
                                        <span className="explain">분</span>
                                        <span className="explain">부터</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="work-hours-box">
                                    <div className="work-hours-tab">
                                      <button
                                        className={`work-time-tab ${sunWorkEndPeriod === '오전' ? 'act' : ''}`}
                                        onClick={() => setSunWorkEndPeriod('오전')}
                                      >오전</button>
                                      <button
                                        className={`work-time-tab ${sunWorkEndPeriod === '오후' ? 'act' : ''}`}
                                        onClick={() => setSunWorkEndPeriod('오후')}
                                      >오후</button>
                                    </div>
                                    <div className="work-hours-inner">
                                      <div className="time-swiper hours">
                                        <Swiper
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          loop={true}
                                          centeredSlides={true}
                                          modules={[Navigation]}
                                          className="mySwiper"
                                          initialSlide={hourToSlideIndex(sunWorkEndHour)}
                                          onSlideChange={(swiper) => setSunWorkEndHour(slideIndexToHour(swiper.realIndex))}
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
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          modules={[Navigation]}
                                          loop={false}
                                          centeredSlides={true}
                                          className="mySwiper"
                                          initialSlide={minuteToSlideIndex(sunWorkEndMinute)}
                                          onSlideChange={(swiper) => setSunWorkEndMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                        <span className="explain">{sunWorkEndPeriod}</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={sunWorkEndHour} readOnly />
                                        </div>
                                        <span className="explain">시</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={sunWorkEndMinute} readOnly />
                                        </div>
                                        <span className="explain">분</span>
                                        <span className="explain">까지</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className={`work-hours-box ${!sunIsBreak ? 'disabled' : ''}`}>
                                    <div className="work-hours-tab">
                                      <button
                                        className={`work-time-tab ${sunBreakStartPeriod === '오전' ? 'act' : ''}`}
                                        onClick={() => setSunBreakStartPeriod('오전')}
                                      >오전</button>
                                      <button
                                        className={`work-time-tab ${sunBreakStartPeriod === '오후' ? 'act' : ''}`}
                                        onClick={() => setSunBreakStartPeriod('오후')}
                                      >오후</button>
                                    </div>
                                    <div className="work-hours-inner">
                                      <div className="time-swiper hours">
                                        <Swiper
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          loop={true}
                                          centeredSlides={true}
                                          modules={[Navigation]}
                                          className="mySwiper"
                                          initialSlide={hourToSlideIndex(sunBreakStartHour)}
                                          onSlideChange={(swiper) => setSunBreakStartHour(slideIndexToHour(swiper.realIndex))}
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
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          modules={[Navigation]}
                                          loop={false}
                                          centeredSlides={true}
                                          className="mySwiper"
                                          initialSlide={minuteToSlideIndex(sunBreakStartMinute)}
                                          onSlideChange={(swiper) => setSunBreakStartMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                        <span className="explain">{sunBreakStartPeriod}</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={sunBreakStartHour} readOnly />
                                        </div>
                                        <span className="explain">시</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={sunBreakStartMinute} readOnly />
                                        </div>
                                        <span className="explain">분</span>
                                        <span className="explain">부터</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className={`work-hours-box ${!sunIsBreak ? 'disabled' : ''}`}>
                                    <div className="work-hours-tab">
                                      <button
                                        className={`work-time-tab ${sunBreakEndPeriod === '오전' ? 'act' : ''}`}
                                        onClick={() => setSunBreakEndPeriod('오전')}
                                      >오전</button>
                                      <button
                                        className={`work-time-tab ${sunBreakEndPeriod === '오후' ? 'act' : ''}`}
                                        onClick={() => setSunBreakEndPeriod('오후')}
                                      >오후</button>
                                    </div>
                                    <div className="work-hours-inner">
                                      <div className="time-swiper hours">
                                        <Swiper
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          loop={true}
                                          centeredSlides={true}
                                          modules={[Navigation]}
                                          className="mySwiper"
                                          initialSlide={hourToSlideIndex(sunBreakEndHour)}
                                          onSlideChange={(swiper) => setSunBreakEndHour(slideIndexToHour(swiper.realIndex))}
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
                                          spaceBetween={10}
                                          slidesPerView={3}
                                          direction={'vertical'}
                                          navigation={true}
                                          modules={[Navigation]}
                                          loop={false}
                                          centeredSlides={true}
                                          className="mySwiper"
                                          initialSlide={minuteToSlideIndex(sunBreakEndMinute)}
                                          onSlideChange={(swiper) => setSunBreakEndMinute(slideIndexToMinute(swiper.activeIndex))}
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
                                        <span className="explain">{sunBreakEndPeriod}</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={sunBreakEndHour} readOnly />
                                        </div>
                                        <span className="explain">시</span>
                                        <div>
                                          <input type="text" className="input-frame xs" value={sunBreakEndMinute} readOnly />
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
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AnimateHeight>
          </div>
        </div>
      </div>
    </div>
  )
}
