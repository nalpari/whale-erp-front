'use client'

import { useEffect, useRef, useState } from 'react'
import type { OperatingFormState } from '@/types/store'

import '@/components/employee/custom-css/WorkScheduleTable.css'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const BLOCKS = Array.from({ length: 48 }, (_, i) => ({
  index: i,
  hour: Math.floor(i / 2),
  minute: i % 2 === 0 ? 0 : 30,
}))

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const parseTimeToIndex = (value?: string | null) => {
  if (!value) return null
  const [rawHour, rawMinute] = value.split(':')
  const hour = Number(rawHour)
  const minute = Number(rawMinute)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  const minuteIndex = minute >= 30 ? 1 : 0
  return clamp(hour * 2 + minuteIndex, 0, 48)
}

const indexToTime = (index: number) => {
  const hour = Math.floor(index / 2)
  const minute = index % 2 === 0 ? '00' : '30'
  return `${String(hour).padStart(2, '0')}:${minute}`
}

const buildWorkBlockStates = (startIndex: number, endIndex: number, hasWork: boolean) =>
  BLOCKS.map((block) => {
    const isWorking = hasWork && block.index >= startIndex && block.index < endIndex
    return { state: isWorking ? ('work' as const) : ('empty' as const) }
  })

const buildBreakBlockStates = (breakStartIndex: number, breakEndIndex: number, hasBreak: boolean) =>
  BLOCKS.map((block) => {
    const isBreak = hasBreak && block.index >= breakStartIndex && block.index < breakEndIndex
    return { state: isBreak ? ('break' as const) : ('empty' as const) }
  })

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
  idPrefix: string
  openTime?: string | null
  closeTime?: string | null
  breakStartTime?: string | null
  breakEndTime?: string | null
  isOperating: boolean
  breakTimeEnabled: boolean
  onChange?: (next: Partial<OperatingFormState>) => void
}) => {
  // 기본값: 운영 07:00-18:00, B/T 12:00-13:00
  const DEFAULT_WORK_START = 14  // 07:00
  const DEFAULT_WORK_END = 36    // 18:00
  const DEFAULT_BREAK_START = 24 // 12:00
  const DEFAULT_BREAK_END = 36   // 18:00

  const [workEnabled, setWorkEnabled] = useState(isOperating)
  const [breakEnabled, setBreakEnabled] = useState(breakTimeEnabled)
  const [startIndex, setStartIndex] = useState(() => parseTimeToIndex(openTime) ?? DEFAULT_WORK_START)
  const [endIndex, setEndIndex] = useState(() => parseTimeToIndex(closeTime) ?? DEFAULT_WORK_END)
  const [breakStartIndex, setBreakStartIndex] = useState(() => parseTimeToIndex(breakStartTime) ?? DEFAULT_BREAK_START)
  const [breakEndIndex, setBreakEndIndex] = useState(() => parseTimeToIndex(breakEndTime) ?? DEFAULT_BREAK_END)

  const dragRef = useRef<{
    type: 'work-start' | 'work-end' | 'break-start' | 'break-end'
    slider: HTMLDivElement
  } | null>(null)

  // Sync from props
  useEffect(() => {
    setWorkEnabled(isOperating)
  }, [isOperating])

  useEffect(() => {
    setBreakEnabled(breakTimeEnabled)
  }, [breakTimeEnabled])

  useEffect(() => {
    const index = parseTimeToIndex(openTime)
    if (index !== null) setStartIndex(index)
  }, [openTime])

  useEffect(() => {
    const index = parseTimeToIndex(closeTime)
    if (index !== null) setEndIndex(index)
  }, [closeTime])

  useEffect(() => {
    const index = parseTimeToIndex(breakStartTime)
    if (index !== null) setBreakStartIndex(index)
  }, [breakStartTime])

  useEffect(() => {
    const index = parseTimeToIndex(breakEndTime)
    if (index !== null) setBreakEndIndex(index)
  }, [breakEndTime])

  // Drag handlers
  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!dragRef.current) return
      const { type, slider } = dragRef.current
      const rect = slider.getBoundingClientRect()
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      const nextIndex = Math.round(ratio * 48)

      if (type === 'work-start') {
        const newStartIndex = clamp(nextIndex, 0, endIndex - 1)
        setStartIndex(newStartIndex)
        onChange?.({ openTime: indexToTime(newStartIndex) })
      } else if (type === 'work-end') {
        const newEndIndex = clamp(nextIndex, startIndex + 1, 48)
        setEndIndex(newEndIndex)
        onChange?.({ closeTime: indexToTime(newEndIndex) })
      } else if (type === 'break-start') {
        const newBreakStartIndex = clamp(nextIndex, startIndex, breakEndIndex - 1)
        setBreakStartIndex(newBreakStartIndex)
        onChange?.({ breakStartTime: indexToTime(newBreakStartIndex) })
      } else if (type === 'break-end') {
        const newBreakEndIndex = clamp(nextIndex, breakStartIndex + 1, endIndex)
        setBreakEndIndex(newBreakEndIndex)
        onChange?.({ breakEndTime: indexToTime(newBreakEndIndex) })
      }
    }

    const handleUp = () => {
      dragRef.current = null
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [startIndex, endIndex, breakStartIndex, breakEndIndex, onChange])

  const handleWorkToggle = (checked: boolean) => {
    setWorkEnabled(checked)
    if (checked) {
      // 서버 데이터가 없으면 기본값 설정
      const hasServerData = parseTimeToIndex(openTime) !== null
      if (!hasServerData) {
        setStartIndex(DEFAULT_WORK_START)
        setEndIndex(DEFAULT_WORK_END)
        onChange?.({
          isOperating: true,
          openTime: indexToTime(DEFAULT_WORK_START),
          closeTime: indexToTime(DEFAULT_WORK_END)
        })
      } else {
        onChange?.({ isOperating: true })
      }
    } else {
      setBreakEnabled(false)
      onChange?.({ isOperating: false, breakTimeEnabled: false })
    }
  }

  const handleBreakToggle = (checked: boolean) => {
    if (!workEnabled) return
    setBreakEnabled(checked)
    if (checked) {
      // 서버 데이터가 없으면 기본값 설정, 있으면 운영시간 범위 내로 조정
      const hasBreakData = parseTimeToIndex(breakStartTime) !== null
      let newBreakStart = hasBreakData ? breakStartIndex : DEFAULT_BREAK_START
      let newBreakEnd = hasBreakData ? breakEndIndex : DEFAULT_BREAK_END

      // 운영시간 범위 내로 조정
      newBreakStart = clamp(newBreakStart, startIndex, endIndex - 1)
      newBreakEnd = clamp(newBreakEnd, newBreakStart + 1, endIndex)

      setBreakStartIndex(newBreakStart)
      setBreakEndIndex(newBreakEnd)
      onChange?.({
        breakTimeEnabled: true,
        breakStartTime: indexToTime(newBreakStart),
        breakEndTime: indexToTime(newBreakEnd)
      })
    } else {
      onChange?.({ breakTimeEnabled: false })
    }
  }

  const workBlockStates = buildWorkBlockStates(startIndex, endIndex, workEnabled)
  const breakBlockStates = buildBreakBlockStates(breakStartIndex, breakEndIndex, breakEnabled && workEnabled)
  const startPercent = (startIndex / 48) * 100
  const endPercent = (endIndex / 48) * 100
  const breakStartPercent = (breakStartIndex / 48) * 100
  const breakEndPercent = (breakEndIndex / 48) * 100

  // 시간 계산 (30분 단위 = 0.5시간)
  const workHours = workEnabled ? ((endIndex - startIndex) / 2).toFixed(1) : '0'
  const breakHours = breakEnabled && workEnabled ? ((breakEndIndex - breakStartIndex) / 2).toFixed(1) : '0'

  return (
    <div className="staff-work-table">
      {/* 운영 시간 슬라이더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
        <div className="toggle-wrap">
          <span className="toggle-txt">운영</span>
          <label className="toggle-btn" htmlFor={`work-toggle-${idPrefix}`}>
            <input
              type="checkbox"
              id={`work-toggle-${idPrefix}`}
              checked={workEnabled}
              onChange={(event) => handleWorkToggle(event.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#222' }}>
          {workEnabled ? `${indexToTime(startIndex)} - ${indexToTime(endIndex)} (${workHours} H)` : '-'}
        </div>
      </div>

      <div className={`time-slider${workEnabled ? '' : ' is-disabled'}`}>
        <div className="time-blocks blue">
          <span
            className="time-handle start"
            style={{ left: `calc(${startPercent}% - 6px)` }}
            onMouseDown={(event) => {
              if (!workEnabled) return
              const slider = event.currentTarget.closest('.time-slider') as HTMLDivElement | null
              if (!slider) return
              dragRef.current = { type: 'work-start', slider }
            }}
          />
          <span
            className="time-handle end"
            style={{ left: `calc(${endPercent}% - 6px)` }}
            onMouseDown={(event) => {
              if (!workEnabled) return
              const slider = event.currentTarget.closest('.time-slider') as HTMLDivElement | null
              if (!slider) return
              dragRef.current = { type: 'work-end', slider }
            }}
          />
          {workBlockStates.map((block, index) => {
            const style = block.state === 'empty' ? { backgroundColor: 'transparent' } : undefined
            return <div key={index} className="time-block" style={style} />
          })}
        </div>
      </div>
      <div className="time-header">
        {HOURS.map((hour) => (
          <div key={hour} className="time-label">
            {String(hour).padStart(2, '0')}
          </div>
        ))}
      </div>

      {/* B/T 시간 슬라이더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, marginBottom: 6 }}>
        <div className="toggle-wrap">
          <span className="toggle-txt">B/T</span>
          <label className="toggle-btn" htmlFor={`break-toggle-${idPrefix}`}>
            <input
              type="checkbox"
              id={`break-toggle-${idPrefix}`}
              checked={breakEnabled}
              disabled={!workEnabled}
              onChange={(event) => handleBreakToggle(event.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#8d8d8d' }}>
          {breakEnabled && workEnabled ? `${indexToTime(breakStartIndex)} - ${indexToTime(breakEndIndex)} (${breakHours} H)` : '-'}
        </div>
      </div>

      <div className={`time-slider${workEnabled && breakEnabled ? '' : ' is-disabled'}`}>
        <div className="time-blocks">
          <span
            className="time-handle start break"
            style={{ left: `calc(${breakStartPercent}% - 6px)` }}
            onMouseDown={(event) => {
              if (!workEnabled || !breakEnabled) return
              const slider = event.currentTarget.closest('.time-slider') as HTMLDivElement | null
              if (!slider) return
              dragRef.current = { type: 'break-start', slider }
            }}
          />
          <span
            className="time-handle end break"
            style={{ left: `calc(${breakEndPercent}% - 6px)` }}
            onMouseDown={(event) => {
              if (!workEnabled || !breakEnabled) return
              const slider = event.currentTarget.closest('.time-slider') as HTMLDivElement | null
              if (!slider) return
              dragRef.current = { type: 'break-end', slider }
            }}
          />
          {breakBlockStates.map((block, index) => {
            const className = `time-block${block.state === 'break' ? ' gray' : ''}`
            const style = block.state === 'empty' ? { backgroundColor: 'transparent' } : undefined
            return <div key={index} className={className} style={style} />
          })}
        </div>
      </div>
      <div className="time-header">
        {HOURS.map((hour) => (
          <div key={hour} className="time-label">
            {String(hour).padStart(2, '0')}
          </div>
        ))}
      </div>
    </div>
  )
}
