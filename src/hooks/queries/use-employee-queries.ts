import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'
import { employeeKeys } from './query-keys'
import type { EmployeeInfoListResponse } from '@/types/employee'

export type EmployeeListParams = {
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  workStatus?: string
  employeeName?: string
  employeeClassification?: string
  contractClassification?: string
  hireDateFrom?: string
  hireDateTo?: string
  page?: number
  size?: number
}

const toEmployeePage = (payload: unknown): PageResponse<EmployeeInfoListResponse> => {
  if (Array.isArray(payload)) {
    return {
      content: payload as EmployeeInfoListResponse[],
      totalElements: payload.length,
      totalPages: payload.length === 0 ? 0 : 1,
      size: payload.length,
      number: 0,
      first: true,
      last: true,
      empty: payload.length === 0,
    }
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const content =
      (Array.isArray(record.content) && record.content) ||
      (Array.isArray(record.list) && record.list) ||
      (Array.isArray(record.items) && record.items)

    if (content) {
      const totalElements =
        typeof record.totalElements === 'number' ? record.totalElements : content.length
      const totalPages = typeof record.totalPages === 'number' ? record.totalPages : 1
      const size = typeof record.size === 'number' ? record.size : content.length
      const number = typeof record.number === 'number' ? record.number : 0
      const first = typeof record.first === 'boolean' ? record.first : true
      const last = typeof record.last === 'boolean' ? record.last : true
      const empty = typeof record.empty === 'boolean' ? record.empty : content.length === 0
      return {
        content: content as EmployeeInfoListResponse[],
        totalElements,
        totalPages,
        size,
        number,
        first,
        last,
        empty,
      }
    }
  }

  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 0,
    number: 0,
    first: true,
    last: true,
    empty: true,
  }
}

export const useEmployeeInfoList = (params: EmployeeListParams, enabled = true) => {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<unknown>>('/api/employee/info', { params })
      return toEmployeePage(response.data.data)
    },
    enabled,
  })
}
