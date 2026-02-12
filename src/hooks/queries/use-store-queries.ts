import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { storeKeys, type StoreListParams } from './query-keys'
import type { ApiResponse } from '@/lib/schemas/api'
import type {
  StoreListResponse,
  StoreDetailResponse,
  StoreOption,
  StoreHeaderRequest,
  SubscribePlanCheckResponse,
} from '@/types/store'

/**
 * 점포 등록/수정 시 첨부 파일 payload 타입.
 */
export interface StoreFilePayload {
  businessFile?: File | null
  storeImages?: File[]
  deleteImages?: number[]
}

/**
 * 멀티파트 업로드에 사용하는 필드 키 상수.
 * - 백엔드에서 기대하는 키와 반드시 일치해야 한다.
 */
const FORM_DATA_KEYS = {
  storeDto: 'storeDto',
  businessFile: 'businessFile',
  storeImages: 'storeImages',
  deleteImages: 'deleteImages',
} as const

/**
 * 점포 생성/수정용 FormData 빌더.
 * - storeDto는 JSON Blob으로 전송
 * - 파일/삭제 목록은 존재할 때만 추가
 */
const buildStoreFormData = (payload: StoreHeaderRequest, files: StoreFilePayload) => {
  const formData = new FormData()

  formData.append(
    FORM_DATA_KEYS.storeDto,
    new Blob([JSON.stringify(payload)], { type: 'application/json' })
  )

  if (files.businessFile) {
    formData.append(FORM_DATA_KEYS.businessFile, files.businessFile)
  }

  if (files.storeImages?.length) {
    files.storeImages.forEach((file) => formData.append(FORM_DATA_KEYS.storeImages, file))
  }

  if (files.deleteImages?.length) {
    const deletePayload = { shouldDeleteFileIds: files.deleteImages }
    formData.append(
      FORM_DATA_KEYS.deleteImages,
      new Blob([JSON.stringify(deletePayload)], { type: 'application/json' })
    )
  }

  return formData
}

/**
 * 점포 목록 조회 훅.
 */
export const useStoreList = (params: StoreListParams, enabled = true) => {
  return useQuery({
    queryKey: storeKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StoreListResponse>>('/api/v1/stores', { params })
      return response.data.data
    },
    enabled,
  })
}

/**
 * 점포 상세 조회 훅.
 */
export const useStoreDetail = (storeId?: number | null) => {
  return useQuery({
    queryKey: storeKeys.detail(storeId!),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StoreDetailResponse>>(
        `/api/v1/stores/${storeId}`
      )
      return response.data.data
    },
    enabled: !!storeId,
  })
}

/**
 * 점포 옵션(셀렉트용) 조회 훅.
 * - officeId/franchiseId 변경 시 options 쿼리 키가 달라져 캐시가 분리된다.
 */
export const useStoreOptions = (
  officeId?: number | null,
  franchiseId?: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: storeKeys.options(officeId, franchiseId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StoreOption[]>>('/api/v1/stores/options', {
        params: { officeId, franchiseId },
      })
      return response.data.data
    },
    enabled,
  })
}

/**
 * 구독 플랜 점포 등록 가능 여부 확인 훅.
 * - enabled: false로 설정하여 버튼 클릭 시 refetch로 수동 호출한다.
 */
export const useSubscribePlanCheck = () => {
  return useQuery({
    queryKey: storeKeys.subscribePlanCheck(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<SubscribePlanCheckResponse>>(
        '/api/v1/stores/subscribe'
      )
      return response.data.data
    },
    enabled: false,
  })
}

/**
 * 점포 생성 훅.
 * - 생성 성공 시 목록/옵션 캐시를 무효화한다.
 */
export const useCreateStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      payload,
      files,
    }: {
      payload: StoreHeaderRequest
      files: StoreFilePayload
    }) => {
      const formData = buildStoreFormData(payload, files)
      const response = await api.post<ApiResponse<StoreDetailResponse>>(
        '/api/v1/stores',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: storeKeys.options() })
    },
  })
}

/**
 * 점포 수정 훅.
 * - 수정 성공 시 목록과 해당 상세 캐시를 무효화한다.
 */
export const useUpdateStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      storeId,
      payload,
      files,
    }: {
      storeId: number
      payload: StoreHeaderRequest
      files: StoreFilePayload
    }) => {
      const formData = buildStoreFormData(payload, files)
      const response = await api.put<ApiResponse<StoreDetailResponse>>(
        `/api/v1/stores/${storeId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      return response.data.data
    },
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: storeKeys.detail(storeId) })
    },
  })
}

/**
 * 점포 삭제 훅.
 * - 삭제 성공 시 전체 store 캐시를 무효화한다.
 */
export const useDeleteStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storeId: number) => api.delete(`/api/v1/stores/${storeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
  })
}
