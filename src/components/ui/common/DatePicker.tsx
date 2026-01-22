'use client'

import { useState } from 'react'
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

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
}

export default function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ?? new Date())
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : selectedDate

  const handleChange = (date: Date | null) => {
    if (!isControlled) {
      setSelectedDate(date)
    }
    onChange?.(date)
  }

  return (
    <div className="date-picker-custom">
      <ReactDatePicker
        className="date-picker-input"
        renderCustomHeader={(props) => <CustomHeader {...props} />}
        selected={currentValue}
        onChange={handleChange}
        placeholderText={placeholder}
        dateFormat="yyyy-MM-dd"
      />
    </div>
  )
}
