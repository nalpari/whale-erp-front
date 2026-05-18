import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/api'
import { messageTemplateKeys } from './query-keys'
import type {
  MessageTemplateCreateRequest,
  MessageTemplateDetail,
  MessageTemplateListItem,
  MessageTemplateSearchParams,
  MessageTemplateUpdateRequest,
} from '@/types/notification'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'

const BASE = '/api/v1/notifications/alim-talk/templates'

export const useMessageTemplateList = (params: MessageTemplateSearchParams, enabled = true) =>
  useQuery({
    queryKey: messageTemplateKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PageResponse<MessageTemplateListItem>>>(BASE, {
        params,
      })
      return response.data.data
    },
    enabled,
    placeholderData: keepPreviousData,
  })

export const useMessageTemplateDetail = (id: number, enabled = true) =>
  useQuery({
    queryKey: messageTemplateKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<MessageTemplateDetail>>(`${BASE}/${id}`)
      return response.data.data
    },
    enabled: enabled && id > 0,
  })

export const useCreateMessageTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: MessageTemplateCreateRequest) => {
      const response = await api.post<ApiResponse<MessageTemplateDetail>>(BASE, request)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageTemplateKeys.lists() })
    },
  })
}

export const useUpdateMessageTemplate = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: MessageTemplateUpdateRequest) => {
      const response = await api.put<ApiResponse<MessageTemplateDetail>>(`${BASE}/${id}`, request)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageTemplateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: messageTemplateKeys.detail(id) })
    },
  })
}

export const useDeleteMessageTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE}/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: messageTemplateKeys.lists() })
      queryClient.removeQueries({ queryKey: messageTemplateKeys.detail(id) })
    },
  })
}
