import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/lib/api'
import type { ApiResponse } from '@/lib/schemas/api'
import { storeScheduleKeys } from './query-keys'
import type {
  ExcelDownloadResult,
  ExcelUploadResult,
  ScheduleRequest,
  ScheduleResponse,
  ScheduleSummary,
  StoreScheduleQuery,
  DayType,
} from '@/types/work-schedule'

/**
 * 점포별 근무 계획표 API 기본 경로.
 */
const STORE_SCHEDULE_BASE = '/api/v1/store-schedule'

/**
 * Axios 에러에서 사용자에게 보여줄 메시지를 추출한다.
 * - 백엔드 message 우선
 * - 없으면 기본 fallback 사용
 */
const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (message && typeof message === 'string') {
      return message
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

/**
 * Content-Disposition에서 파일명을 추출한다.
 * - RFC5987(UTF-8)와 일반 filename 형식을 모두 지원
 */
const getFileNameFromDisposition = (value?: string): string | null => {
  if (!value) return null
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }
  const basicMatch = value.match(/filename="?([^";]+)"?/i)
  if (!basicMatch?.[1]) return null
  try {
    return decodeURIComponent(basicMatch[1])
  } catch {
    return basicMatch[1]
  }
}

/**
 * 점포별 근무 계획표 목록 조회(단건 함수).
 * - useStoreScheduleList에서 재사용한다.
 */
export const fetchStoreSchedules = async (params: StoreScheduleQuery) => {
  try {
    const response = await api.get<ApiResponse<ScheduleResponse[]>>(
      STORE_SCHEDULE_BASE,
      { params }
    )
    return response.data.data ?? []
  } catch (error) {
    throw new Error(getErrorMessage(error, '근무 계획 조회에 실패했습니다.'))
  }
}

/**
 * 점포별 근무 계획표 목록 조회 훅.
 * - params가 없으면 조회하지 않음
 * - refetchOnWindowFocus: false로 불필요한 재조회 방지
 */
export const useStoreScheduleList = (params: StoreScheduleQuery | null, enabled = true) => {
  return useQuery({
    queryKey: storeScheduleKeys.list(params),
    queryFn: async () => {
      if (!params) return []
      return fetchStoreSchedules(params)
    },
    enabled: enabled && !!params,
    refetchOnWindowFocus: false,
  })
}

/**
 * 점포별 근무 계획 저장(업서트) 훅.
 * - 성공 시 목록 캐시 무효화
 */
export const useStoreScheduleUpsert = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      storeId,
      payload,
    }: {
      storeId: number
      payload: ScheduleRequest[]
    }) => {
      try {
        const response = await api.post<ApiResponse<ScheduleSummary[]>>(
          `${STORE_SCHEDULE_BASE}/${storeId}`,
          payload
        )
        return response.data.data ?? []
      } catch (error) {
        throw new Error(getErrorMessage(error, '근무 계획 저장에 실패했습니다.'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeScheduleKeys.lists() })
    },
  })
}

/**
 * 점포별 근무 계획표 엑셀 다운로드 훅.
 * - 서버에서 내려준 파일명을 우선 사용
 */
export const useStoreScheduleDownloadExcel = () => {
  return useMutation({
    mutationFn: async ({
      params,
    }: {
      params: { storeId: number; startDate: string; endDate: string; employeeName?: string; dayOfWeek?: DayType }
    }): Promise<ExcelDownloadResult> => {
      try {
        const response = await api.get(`${STORE_SCHEDULE_BASE}/excel`, {
          params,
          responseType: 'blob',
        })
        const contentDisposition = response.headers['content-disposition']
        const fileName =
          getFileNameFromDisposition(contentDisposition) ?? 'store-schedule.xlsx'
        return { blob: response.data, fileName }
      } catch (error) {
        throw new Error(getErrorMessage(error, '엑셀 다운로드에 실패했습니다.'))
      }
    },
  })
}

/**
 * 점포별 근무 계획표 엑셀 업로드 훅.
 * - 성공 시 목록 캐시 무효화
 */
export const useStoreScheduleUploadExcel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ storeId, file }: { storeId: number; file: File }) => {
      const formData = new FormData()
      formData.append('excel', file)
      try {
        const response = await api.post<ApiResponse<ExcelUploadResult>>(
          `${STORE_SCHEDULE_BASE}/excel/${storeId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
        if (!response.data.data) {
          throw new Error('업로드 결과가 없습니다.')
        }
        return response.data.data
      } catch (error: any) {
        // 백엔드에서 validation 실패 시 에러 응답에 ExcelUploadResult가 포함됨
        if (error.response?.data?.data) {
          return error.response.data.data as ExcelUploadResult
        }
        throw new Error(getErrorMessage(error, '엑셀 업로드에 실패했습니다.'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeScheduleKeys.lists() })
    },
  })
}
