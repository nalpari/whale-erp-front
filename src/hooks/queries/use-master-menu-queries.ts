import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/api'
import { masterMenuKeys, type MasterMenuListParams } from './query-keys'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'
import type { MenuResponse } from '@/types/menu'

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
