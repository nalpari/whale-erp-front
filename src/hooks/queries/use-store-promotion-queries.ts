import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { storePromotionKeys } from './query-keys'
import type { ApiResponse } from '@/lib/schemas/api'
import type {
  StorePromotionListParams,
  StorePromotionListResponse,
  StorePromotionDetailResponse,
  StorePromotionCreateRequest,
} from '@/types/store-promotion'

export const useStorePromotionList = (params: StorePromotionListParams, enabled = true) => {
  return useQuery({
    queryKey: storePromotionKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StorePromotionListResponse>>(
        '/api/master/promotion/store',
        { params }
      )
      return response.data.data
    },
    enabled,
  })
}

export const useStorePromotionDetail = (id?: number | null) => {
  return useQuery({
    queryKey: storePromotionKeys.detail(id!),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StorePromotionDetailResponse>>(
        `/api/master/promotion/store/${id}`
      )
      return response.data.data
    },
    enabled: !!id,
  })
}

export const useCreateStorePromotion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StorePromotionCreateRequest) => {
      const response = await api.post('/api/master/promotion/store', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storePromotionKeys.lists() })
    },
  })
}

export const useUpdateStorePromotion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StorePromotionCreateRequest }) => {
      const response = await api.put(`/api/master/promotion/store/${id}`, data)
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: storePromotionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: storePromotionKeys.detail(id) })
    },
  })
}

export const useDeleteStorePromotion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/master/promotion/store/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storePromotionKeys.all })
    },
  })
}
