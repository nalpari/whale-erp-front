const padTwo = (value: number) => String(value).padStart(2, '0')

const toDate = (value?: string | Date | null) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// YYYY-MM-DD format for created/updated dates.
export const formatDateYmd = (value?: string | Date | null, fallback = '-') => {
  const date = toDate(value)
  if (!date) return fallback
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`
}

// YYYY-MM-DD format; returns undefined when value is empty/invalid.
export const formatDateYmdOrUndefined = (value?: string | Date | null) => {
  const formatted = formatDateYmd(value, '')
  return formatted === '' ? undefined : formatted
}

// YYYY-MM-DD HH:mm format for datetime display.
export const formatDateTimeYmdHm = (value?: string | Date | null, fallback = '-') => {
  const date = toDate(value)
  if (!date) return fallback
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())} ${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`
}

// YYYY.MM.DD format for display purposes.
export const formatDateDot = (value?: string | Date | null, fallback = '-') => {
  const date = toDate(value)
  if (!date) return fallback
  return `${date.getFullYear()}.${padTwo(date.getMonth() + 1)}.${padTwo(date.getDate())}`
}

/**
 * YYYY-MM-DD HH:MM 형식으로 날짜/시간 포맷
 * @param value - 날짜 문자열 또는 Date 객체
 * @param fallback - 값이 없을 때 반환할 기본값 (기본: '-')
 * @returns 포맷된 날짜/시간 문자열 (예: "2024-12-25 14:30")
 */
export const formatDateTime = (value?: string | Date | null, fallback = '-') => {
  const date = toDate(value)
  if (!date) return fallback
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())} ${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`
}

/**
 * YYYY-MM-DD HH:MM:SS 형식으로 날짜/시간 포맷 (초 포함)
 * @param value - 날짜 문자열 또는 Date 객체
 * @param fallback - 값이 없을 때 반환할 기본값 (기본: '-')
 * @returns 포맷된 날짜/시간 문자열 (예: "2024-12-25 14:30:45")
 */
export const formatDateTimeWithSeconds = (value?: string | Date | null, fallback = '-') => {
  const date = toDate(value)
  if (!date) return fallback
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())} ${padTwo(date.getHours())}:${padTwo(date.getMinutes())}:${padTwo(date.getSeconds())}`
}
