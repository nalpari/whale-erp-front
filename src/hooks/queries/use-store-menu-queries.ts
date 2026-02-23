import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { storeMenuKeys } from './query-keys'
import type { ApiResponse } from '@/lib/schemas/api'
import type {
  StoreMenuListParams,
  StoreMenuListResponse,
  StoreMenuDetailResponse,
  MenuDisplayOrderUpdateRequest,
  MenuOperationStatusUpdateRequest,
  StoreMenuUpdateRequest,
  StoreMenuFilePayload,
} from '@/types/store-menu'

export const useStoreMenuDetail = (id: number | null) => {
  return useQuery({
    queryKey: storeMenuKeys.detail(id ?? 0),
    queryFn: async () => {
      if (id == null) throw new Error('Menu ID is required')
      const response = await api.get<ApiResponse<StoreMenuDetailResponse>>(
        `/api/master/menu/store/${id}`
      )
      return response.data.data
    },
    enabled: id != null,
  })
}

export const useDeleteStoreMenu = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(
        `/api/master/menu/store/${id}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeMenuKeys.all })
    },
  })
}

export const useStoreMenuList = (params: StoreMenuListParams, enabled = true) => {
  return useQuery({
    queryKey: storeMenuKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StoreMenuListResponse>>(
        '/api/master/menu/store',
        { params }
      )
      return response.data.data
    },
    enabled,
  })
}

export const useBulkUpdateOperationStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: MenuOperationStatusUpdateRequest) => {
      const response = await api.patch<ApiResponse<void>>(
        '/api/master/menu/store/operation-status',
        body
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeMenuKeys.all })
    },
  })
}

export const useBulkUpdateDisplayOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: MenuDisplayOrderUpdateRequest[]) => {
      const response = await api.patch<ApiResponse<void>>(
        '/api/master/menu/store/display-order',
        body
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeMenuKeys.all })
    },
  })
}

const buildStoreMenuFormData = (
  payload: StoreMenuUpdateRequest,
  files: StoreMenuFilePayload,
) => {
  const formData = new FormData()
  formData.append(
    'menu',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  )
  if (files.image) {
    formData.append('image', files.image)
  }
  if (files.deleteFileId != null) {
    formData.append('deleteFileId', String(files.deleteFileId))
  }
  return formData
}

export const useUpdateStoreMenu = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
      files,
    }: {
      id: number
      payload: StoreMenuUpdateRequest
      files: StoreMenuFilePayload
    }) => {
      const formData = buildStoreMenuFormData(payload, files)
      const response = await api.put<ApiResponse<StoreMenuDetailResponse>>(
        `/api/master/menu/store/${id}`,
        formData,
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: storeMenuKeys.lists() })
      queryClient.invalidateQueries({ queryKey: storeMenuKeys.detail(id) })
    },
  })
}
