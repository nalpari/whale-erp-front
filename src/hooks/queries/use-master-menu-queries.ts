import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/api'
import { masterMenuKeys, type MasterMenuListParams } from './query-keys'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'
import type { MenuResponse } from '@/lib/schemas/menu'

export const useMasterMenuList = (params: MasterMenuListParams, enabled = true) => {
  return useQuery({
    queryKey: masterMenuKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PageResponse<MenuResponse>>>(
        '/api/master/menu/master',
        { params }
      )
      return response.data.data
    },
    enabled: enabled && !!params.bpId,
    placeholderData: keepPreviousData,
  })
}

interface UpdateMenuOperationStatusRequest {
  bpId: number
  menuIds: number[]
  operationStatus: string
}

export const useUpdateMenuOperationStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateMenuOperationStatusRequest) => {
      const response = await api.patch<ApiResponse<void>>(
        '/api/master/menu/master/operation-status',
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterMenuKeys.lists() })
    },
  })
}

interface SyncMenuToStoresRequest {
  bpId: number
  menuIds: number[] | null
  storeIds: number[]
  operationStatus: string
}

export const useSyncMenuToStores = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SyncMenuToStoresRequest) => {
      const response = await api.post<ApiResponse<void>>(
        '/api/master/menu/master/sync-to-stores',
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterMenuKeys.lists() })
    },
  })
}
