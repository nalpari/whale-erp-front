import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/api'
import { alimTalkTemplateKeys } from './query-keys'
import type {
  AlimTalkTemplateCreateRequest,
  AlimTalkTemplateDetail,
  AlimTalkTemplateListItem,
  AlimTalkTemplateSearchParams,
  AlimTalkTemplateUpdateRequest,
} from '@/types/notification'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'

const BASE = '/api/v1/notifications/alim-talk/templates'

export const useAlimTalkTemplateList = (params: AlimTalkTemplateSearchParams, enabled = true) =>
  useQuery({
    queryKey: alimTalkTemplateKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PageResponse<AlimTalkTemplateListItem>>>(BASE, {
        params,
      })
      return response.data.data
    },
    enabled,
    placeholderData: keepPreviousData,
  })

export const useAlimTalkTemplateDetail = (id: number, enabled = true) =>
  useQuery({
    queryKey: alimTalkTemplateKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<AlimTalkTemplateDetail>>(`${BASE}/${id}`)
      return response.data.data
    },
    enabled: enabled && id > 0,
  })

export const useCreateAlimTalkTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: AlimTalkTemplateCreateRequest) => {
      const response = await api.post<ApiResponse<AlimTalkTemplateDetail>>(BASE, request)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alimTalkTemplateKeys.lists() })
    },
  })
}

export const useUpdateAlimTalkTemplate = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: AlimTalkTemplateUpdateRequest) => {
      const response = await api.put<ApiResponse<AlimTalkTemplateDetail>>(`${BASE}/${id}`, request)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alimTalkTemplateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alimTalkTemplateKeys.detail(id) })
    },
  })
}

export const useDeleteAlimTalkTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE}/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alimTalkTemplateKeys.lists() })
    },
  })
}
