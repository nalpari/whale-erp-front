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
