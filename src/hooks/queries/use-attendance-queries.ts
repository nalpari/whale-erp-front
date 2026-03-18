import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'
import { attendanceKeys } from '@/hooks/queries/query-keys'
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
      pageSize: payload.length,
      pageNumber: 1,
      isFirst: true,
      isLast: true,
      hasNext: false,
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
      const pageSize =
        typeof record.pageSize === 'number' && record.pageSize > 0 ? record.pageSize : content.length || 1
      const totalPages =
        typeof record.totalPages === 'number' ? record.totalPages : Math.ceil(totalElements / pageSize)
      const pageNumber = typeof record.pageNumber === 'number' ? record.pageNumber : 1
      const isFirst = typeof record.isFirst === 'boolean' ? record.isFirst : true
      const isLast = typeof record.isLast === 'boolean' ? record.isLast : true
      const hasNext = typeof record.hasNext === 'boolean' ? record.hasNext : false
      return {
        content: content as AttendanceListItem[],
        totalElements,
        totalPages,
        pageSize,
        pageNumber,
        isFirst,
        isLast,
        hasNext,
      }
    }
  }

  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    pageSize: 0,
    pageNumber: 1,
    isFirst: true,
    isLast: true,
    hasNext: false,
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
