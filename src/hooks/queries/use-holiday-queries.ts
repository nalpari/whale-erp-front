import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { holidayKeys, type HolidayListParams, type HolidayOwnerParams } from './query-keys'
import type { ApiResponse } from '@/lib/schemas/api'
import type {
  HolidayListItem,
  HolidayResponse,
  HolidayRequest,
  HolidayDeleteParams,
  LegalHolidayResponse,
  LegalHolidayRequest,
} from '@/types/holiday'

interface PageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  isFirst: boolean
  isLast: boolean
  hasNext: boolean
}

/**
 * 조직별 휴일 수 목록 조회
 */
export const useHolidayList = (params: HolidayListParams, enabled = true) => {
  return useQuery({
    queryKey: holidayKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PageResponse<HolidayListItem>>>(
        '/api/v1/holidays',
        { params }
      )
      return response.data.data
    },
    enabled,
  })
}

/**
 * 소유자(본사/가맹점/점포)별 휴일 상세 조회
 */
export const useHolidayOwner = (params: HolidayOwnerParams, enabled = true) => {
  return useQuery({
    queryKey: holidayKeys.owner(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<HolidayResponse>>(
        '/api/v1/holidays/owner',
        { params }
      )
      return response.data.data
    },
    enabled,
  })
}

/**
 * 휴일 생성
 */
export const useCreateHoliday = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ year, payload }: { year: number; payload: HolidayRequest }) => {
      const response = await api.post(`/api/v1/holidays/${year}`, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}

/**
 * 휴일 수정
 */
export const useUpdateHoliday = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: HolidayRequest) => {
      const response = await api.put('/api/v1/holidays', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}

/**
 * 휴일 삭제
 */
export const useDeleteHoliday = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ type, id }: HolidayDeleteParams) => {
      const response = await api.delete(`/api/v1/holidays/${type}/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}

/**
 * 법정공휴일 목록 조회
 */
export const useLegalHolidayList = (year: number, enabled = true) => {
  return useQuery({
    queryKey: holidayKeys.legalByYear(year),
    queryFn: async () => {
      const response = await api.get<ApiResponse<LegalHolidayResponse[]>>(
        `/api/v1/holidays/legal/${year}`
      )
      return response.data.data
    },
    enabled,
  })
}

/**
 * 법정공휴일 생성
 */
export const useCreateLegalHoliday = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ year, payload, skipDuplicate = false }: { year: number; payload: LegalHolidayRequest[]; skipDuplicate?: boolean }) => {
      const response = await api.post(`/api/v1/holidays/legal/${year}`, payload, {
        params: { skipDuplicate },
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}

/**
 * 법정공휴일 Upsert (생성/수정)
 */
export const useUpsertLegalHoliday = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LegalHolidayRequest[]) => {
      const response = await api.put('/api/v1/holidays/legal', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}

/**
 * 법정공휴일 삭제
 */
export const useDeleteLegalHoliday = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/holidays/legal/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}
