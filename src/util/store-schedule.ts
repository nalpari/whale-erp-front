import type { StoreScheduleQuery } from '@/types/work-schedule'

/**
 * 점포별 근무 계획표 검색 조건을 API 파라미터/URL 쿼리스트링으로 변환하는 유틸.
 *
 * 사용 예시:
 * - StoreSchedulePageClient에서 검색 조건을 URL로 붙여 이동할 때
 * - WorkSchedulePlan에서 계획 수립 화면으로 이동할 때 파라미터 구성
 */

type StoreScheduleParamSource =
  | {
      officeId?: number | null
      franchiseId?: number | null
      storeId?: number | null
      employeeName?: string
      dayType?: StoreScheduleQuery['dayType'] | ''
      from?: string
      to?: string
    }
  | null
  | undefined

type StoreScheduleParamOverrides = {
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  employeeName?: string
  dayType?: StoreScheduleQuery['dayType'] | ''
  from?: string
  to?: string
  date?: string
}

const appendIfDefined = (
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined
) => {
  if (value === null || value === undefined || value === '') return
  params.set(key, String(value))
}

export const buildStoreScheduleParams = (
  source: StoreScheduleParamSource,
  overrides: StoreScheduleParamOverrides = {}
) => {
  const merged = { ...source, ...overrides }
  const params = new URLSearchParams()

  appendIfDefined(params, 'officeId', merged.officeId)
  appendIfDefined(params, 'franchiseId', merged.franchiseId)
  appendIfDefined(params, 'storeId', merged.storeId)
  appendIfDefined(params, 'employeeName', merged.employeeName)
  appendIfDefined(params, 'dayType', merged.dayType)
  appendIfDefined(params, 'from', merged.from)
  appendIfDefined(params, 'to', merged.to)
  appendIfDefined(params, 'date', overrides.date)

  return params
}

export const toQueryString = (params: URLSearchParams) => {
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}
