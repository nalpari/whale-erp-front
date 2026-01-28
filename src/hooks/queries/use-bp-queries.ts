import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { bpKeys } from './query-keys'
import type { ApiResponse } from '@/lib/schemas/api'
import type { BpHeadOfficeNode, BpDetailResponse } from '@/types/bp'

export const useBpHeadOfficeTree = (enabled = true) => {
  return useQuery({
    queryKey: bpKeys.headOfficeTree(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<BpHeadOfficeNode[]>>(
        '/api/master/bp/head-office-tree'
      )
      return response.data.data ?? []
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export const useBpDetail = (id?: number | null) => {
  return useQuery({
    queryKey: bpKeys.detail(id!),
    queryFn: async () => {
      const response = await api.get<ApiResponse<BpDetailResponse>>(`/api/master/bp/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })
}

export const getBpDetail = async (id: number): Promise<BpDetailResponse> => {
  const response = await api.get<ApiResponse<BpDetailResponse>>(`/api/master/bp/${id}`)
  return response.data.data
}
