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

// YYYY.MM.DD format for display purposes.
export const formatDateDot = (value?: string | Date | null, fallback = '-') => {
  const date = toDate(value)
  if (!date) return fallback
  return `${date.getFullYear()}.${padTwo(date.getMonth() + 1)}.${padTwo(date.getDate())}`
}
