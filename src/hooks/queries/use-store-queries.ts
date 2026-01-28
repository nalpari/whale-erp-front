import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { storeKeys, type StoreListParams } from './query-keys'
import type { ApiResponse } from '@/lib/schemas/api'
import type {
  StoreListResponse,
  StoreDetailResponse,
  StoreOption,
  StoreHeaderRequest,
} from '@/types/store'

export interface StoreFilePayload {
  businessFile?: File | null
  storeImages?: File[]
  deleteImages?: number[]
}

const FORM_DATA_KEYS = {
  storeDto: 'storeDto',
  businessFile: 'businessFile',
  storeImages: 'storeImages',
  deleteImages: 'deleteImages',
} as const

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

export const useDeleteStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storeId: number) => api.delete(`/api/v1/stores/${storeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
  })
}
