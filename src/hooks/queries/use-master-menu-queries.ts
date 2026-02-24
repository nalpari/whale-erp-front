import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/api'
import { masterMenuKeys, type MasterMenuListParams } from './query-keys'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'
import type { MenuResponse, MenuFormData, MenuDetailResponse } from '@/lib/schemas/menu'

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

export const useOperatingOptionMenus = (bpId: number | null, enabled = true) => {
  return useQuery({
    queryKey: masterMenuKeys.operatingOptions(bpId!),
    queryFn: async () => {
      const response = await api.get<ApiResponse<MenuResponse[]>>(
        '/api/master/menu/master/operating-options',
        { params: { bpId } }
      )
      return response.data.data
    },
    enabled: enabled && !!bpId,
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

/** 폼 데이터에서 프론트엔드 전용 필드를 제거하여 API 전송용 객체 생성 */
function toApiPayload(menu: MenuFormData, keepIds = false) {
  return {
    ...menu,
    categories: menu.categories.map(({ id, ...cat }) => ({
      ...(keepIds && id != null ? { menuCategoryId: id } : {}),
      ...cat,
    })),
    optionSets: menu.optionSets.map(({ id: setId, ...set }) => ({
      ...(keepIds && setId != null ? { id: setId } : {}),
      ...set,
      optionItems: set.optionItems.map(({ id: itemId, selectedMenuCode: _mc, selectedOperationStatus: _os, optionSetItemId, ...item }, index) => ({
        ...(keepIds && itemId != null ? { id: itemId } : {}),
        ...(optionSetItemId != null ? { optionSetItemId } : {}),
        ...item,
        displayOrder: index + 1,
      })),
    })),
  }
}

export const useCreateMenu = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ menu, image }: { menu: MenuFormData; image?: File }) => {
      const formData = new FormData()
      formData.append('menu', new Blob([JSON.stringify(toApiPayload(menu))], { type: 'application/json' }))
      if (image) {
        formData.append('image', image)
      }
      const response = await api.post<ApiResponse<MenuResponse>>(
        '/api/master/menu/master',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterMenuKeys.lists() })
    },
  })
}

export const useUpdateMenu = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, menu, image, deleteFileId }: { id: number; menu: MenuFormData; image?: File; deleteFileId?: number }) => {
      const formData = new FormData()
      formData.append('menu', new Blob([JSON.stringify(toApiPayload(menu, true))], { type: 'application/json' }))
      if (image) {
        formData.append('image', image)
      }
      if (deleteFileId != null) {
        formData.append('deleteFileId', String(deleteFileId))
      }
      const response = await api.put<ApiResponse<MenuResponse>>(
        `/api/master/menu/master/${id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: masterMenuKeys.lists() })
      queryClient.invalidateQueries({ queryKey: masterMenuKeys.detail(variables.id) })
    },
  })
}

export const useMasterMenuDetail = (id: number) => {
  return useQuery({
    queryKey: masterMenuKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<MenuDetailResponse>>(
        `/api/master/menu/master/${id}`
      )
      return response.data.data
    },
    enabled: !!id,
  })
}

export const useDeleteMenu = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(
        `/api/master/menu/master/${id}`
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
