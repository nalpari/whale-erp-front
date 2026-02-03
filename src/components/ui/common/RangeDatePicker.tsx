'use client'

import { useState, useRef, useCallback, useId } from 'react'
import ReactDatePicker, { ReactDatePickerCustomHeaderProps } from 'react-datepicker'
import * as DateFNS from 'date-fns'

import 'react-datepicker/dist/react-datepicker.css'

const { getYear, getMonth } = DateFNS

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const range = (start: number, end: number, step: number = 1): number[] => {
  const result: number[] = []
  for (let i = start; i < end; i += step) {
    result.push(i)
  }
  return result
}

const years = range(1990, getYear(new Date()) + 1, 1) as number[]

const CustomHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}: ReactDatePickerCustomHeaderProps) => (
  <div
    style={{
      margin: 10,
      display: 'flex',
      justifyContent: 'center',
      gap: 8,
      alignItems: 'center',
    }}
  >
    <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
      {'<'}
    </button>
    <select value={getYear(date)} onChange={({ target: { value } }) => changeYear(+value)}>
      {years.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>

    <select
      value={MONTHS[getMonth(date)]}
      onChange={({ target: { value } }) => changeMonth(MONTHS.indexOf(value as (typeof MONTHS)[number]))}
    >
      {MONTHS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>

    <button onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
      {'>'}
    </button>
  </div>
)

/**
 * 날짜 범위 타입
 */
export interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

/**
 * RangeDatePicker 컴포넌트 Props
 */
export interface RangeDatePickerProps {
  /** 시작일 */
  startDate?: Date | null
  /** 종료일 */
  endDate?: Date | null
  /** 날짜 범위 변경 핸들러 */
  onChange?: (range: DateRange) => void
  /** 시작일 placeholder */
  startDatePlaceholder?: string
  /** 종료일 placeholder */
  endDatePlaceholder?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 최소 날짜 */
  minDate?: Date
  /** 최대 날짜 */
  maxDate?: Date
  /** 날짜 형식 */
  dateFormat?: string
  /** 컨테이너 추가 클래스 */
  containerClassName?: string
  /** 에러 상태 여부 - true면 빨간 테두리 */
  error?: boolean
  /** 에러 메시지 또는 도움말 텍스트 */
  helpText?: string
}

/**
 * 날짜 범위 선택 공통 컴포넌트
 * - 시작일과 종료일을 선택할 수 있는 범위 선택기
 * - 두 개의 input을 사용하지만 하나의 범위 선택 기능 제공
 */
export default function RangeDatePicker({
  startDate: controlledStartDate,
  endDate: controlledEndDate,
  onChange,
  startDatePlaceholder = '시작일',
  endDatePlaceholder = '종료일',
  disabled = false,
  minDate,
  maxDate,
  dateFormat = 'yyyy-MM-dd',
  containerClassName = '',
  error = false,
  helpText,
}: RangeDatePickerProps) {
  const [uncontrolledStartDate, setUncontrolledStartDate] = useState<Date | null>(null)
  const [uncontrolledEndDate, setUncontrolledEndDate] = useState<Date | null>(null)
  const [, setActiveInput] = useState<'start' | 'end' | null>(null)
  const startPickerRef = useRef<ReactDatePicker>(null)
  const endPickerRef = useRef<ReactDatePicker>(null)
  const inputId = useId()

  const isControlled = controlledStartDate !== undefined || controlledEndDate !== undefined
  const startDate = isControlled ? controlledStartDate : uncontrolledStartDate
  const endDate = isControlled ? controlledEndDate : uncontrolledEndDate

  const handleStartDateChange = useCallback(
    (date: Date | null) => {
      const newStartDate = date
      const newEndDate = endDate && newStartDate && newStartDate > endDate ? null : endDate

      if (!isControlled) {
        setUncontrolledStartDate(newStartDate)
        setUncontrolledEndDate(newEndDate ?? null)
      }
      onChange?.({ startDate: newStartDate, endDate: newEndDate ?? null })
    },
    [endDate, isControlled, onChange]
  )

  const handleEndDateChange = useCallback(
    (date: Date | null) => {
      const newEndDate = date
      // 종료일이 시작일보다 이전이면 무시
      if (startDate && newEndDate && newEndDate < startDate) {
        return
      }

      if (!isControlled) {
        setUncontrolledEndDate(newEndDate)
      }
      onChange?.({ startDate: startDate ?? null, endDate: newEndDate })
    },
    [startDate, isControlled, onChange]
  )

  const handleStartDateFocus = useCallback(() => {
    setActiveInput('start')
  }, [])

  const handleEndDateFocus = useCallback(() => {
    setActiveInput('end')
  }, [])

  return (
    <div>
      <div className={`date-picker-wrap ${containerClassName}`}>
        <div className={`date-picker-custom${error ? ' err' : ''}`}>
          <ReactDatePicker
            ref={startPickerRef}
            className={`date-picker-input${error ? ' border-red-500' : ''}`}
            renderCustomHeader={(props) => <CustomHeader {...props} />}
            selected={startDate}
            onChange={(date: Date | null) => handleStartDateChange(date)}
            onFocus={handleStartDateFocus}
            placeholderText={startDatePlaceholder}
            dateFormat={dateFormat}
            disabled={disabled}
            minDate={minDate}
            maxDate={maxDate || endDate || undefined}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={helpText ? `${inputId}-help` : undefined}
          />
        </div>
        <span>~</span>
        <div className={`date-picker-custom${error ? ' err' : ''}`}>
          <ReactDatePicker
            ref={endPickerRef}
            className={`date-picker-input${error ? ' border-red-500' : ''}`}
            renderCustomHeader={(props) => <CustomHeader {...props} />}
            selected={endDate}
            onChange={(date: Date | null) => handleEndDateChange(date)}
            onFocus={handleEndDateFocus}
            placeholderText={endDatePlaceholder}
            dateFormat={dateFormat}
            disabled={disabled}
            minDate={minDate || startDate || undefined}
            maxDate={maxDate}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={helpText ? `${inputId}-help` : undefined}
          />
        </div>
      </div>
      {helpText && (
        <div
          id={`${inputId}-help`}
          className={`${error ? 'warning-txt' : 'form-helper'} mt5`}
          role={error ? 'alert' : undefined}
        >
          {error && '* '}
          {helpText}
        </div>
      )}
    </div>
  )
}
