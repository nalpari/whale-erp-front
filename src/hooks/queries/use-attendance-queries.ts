import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'
import { attendanceKeys } from './query-keys'
import type {
  AttendanceListItem,
  AttendanceListParams,
  AttendanceRecordParams,
  AttendanceRecordResponse,
} from '@/types/attendance'

const toAttendancePage = (payload: unknown): PageResponse<AttendanceListItem> => {
  if (Array.isArray(payload)) {
    return {
      content: payload as AttendanceListItem[],
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
      const size =
        typeof record.size === 'number' && record.size > 0 ? record.size : content.length || 1
      const totalPages =
        typeof record.totalPages === 'number' ? record.totalPages : Math.ceil(totalElements / size)
      const number = typeof record.number === 'number' ? record.number : 0
      const first = typeof record.first === 'boolean' ? record.first : true
      const last = typeof record.last === 'boolean' ? record.last : true
      const empty = typeof record.empty === 'boolean' ? record.empty : content.length === 0
      return {
        content: content as AttendanceListItem[],
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

export const useAttendanceList = (params: AttendanceListParams, enabled = true) => {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<unknown>>('/api/v1/employee/attendances', {
        params,
      })
      return toAttendancePage(response.data.data)
    },
    enabled: enabled && !!params.officeId,
  })
}

export const useAttendanceRecords = (params: AttendanceRecordParams, enabled = true) => {
  return useQuery({
    queryKey: attendanceKeys.records(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<AttendanceRecordResponse>>(
        '/api/v1/employee/attendances/records',
        { params }
      )
      return response.data.data ?? null
    },
    enabled: enabled && !!params.officeId && !!params.employeeId,
  })
}
