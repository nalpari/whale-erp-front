import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import api from '@/lib/api'
import type { ApiResponse } from '@/lib/schemas/api'
import { storeScheduleKeys } from '@/hooks/queries/query-keys'
import type {
  ExcelDownloadResult,
  ExcelValidationResult,
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
      replaceMode = false,
    }: {
      storeId: number
      payload: ScheduleRequest[]
      replaceMode?: boolean
    }) => {
      try {
        const response = await api.post<ApiResponse<ScheduleSummary[]>>(
          `${STORE_SCHEDULE_BASE}/${storeId}`,
          payload,
          { params: { replaceMode } }
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
 * 점포별 근무 계획표 업로드 샘플 다운로드 훅.
 */
export const useStoreScheduleDownloadTemplate = () => {
  return useMutation({
    mutationFn: async (): Promise<ExcelDownloadResult> => {
      try {
        const response = await api.get(`${STORE_SCHEDULE_BASE}/template`, {
          responseType: 'blob',
        })
        const contentDisposition = response.headers['content-disposition']
        const fileName =
          getFileNameFromDisposition(contentDisposition) ?? '근무계획_업로드_샘플.xlsx'
        return { blob: response.data, fileName }
      } catch (error) {
        throw new Error(getErrorMessage(error, '샘플 파일 다운로드에 실패했습니다.'))
      }
    },
  })
}

/**
 * ExcelValidationResult 타입 가드
 */
const isExcelValidationResult = (data: unknown): data is ExcelValidationResult => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'valid' in data &&
    'totalRows' in data &&
    'validRows' in data &&
    'invalidRows' in data &&
    'errors' in data
  )
}

/**
 * 점포별 근무 계획표 엑셀 검증 훅.
 * - 검증만 수행하고 DB에 저장하지 않음
 * - 검증 성공 시 schedules 데이터를 반환하며, 저장은 useStoreScheduleUpsert로 별도 호출
 */
export const useStoreScheduleValidateExcel = () => {
  return useMutation({
    mutationFn: async ({ storeId, file }: { storeId: number; file: File }): Promise<ExcelValidationResult> => {
      const formData = new FormData()
      formData.append('excel', file)
      try {
        const response = await api.post<ApiResponse<ExcelValidationResult>>(
          `${STORE_SCHEDULE_BASE}/excel/${storeId}/validate`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
        if (!response.data.data) {
          throw new Error('검증 결과가 없습니다.')
        }
        return response.data.data
      } catch (error) {
        // 백엔드에서 validation 실패도 HTTP 200으로 내려오지만, 혹시 에러 응답인 경우 처리
        if (error instanceof AxiosError && error.response?.data?.data) {
          const errorData = error.response.data.data
          if (isExcelValidationResult(errorData)) {
            return errorData
          }
        }
        throw new Error(getErrorMessage(error, '엑셀 검증에 실패했습니다.'))
      }
    },
  })
}
