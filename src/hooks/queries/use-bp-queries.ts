import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { bpKeys } from './query-keys'
import type { ApiResponse } from '@/lib/schemas/api'
import type { BpHeadOfficeNode, BpDetailResponse } from '@/types/bp'

/**
 * BP 본사 트리 조회 훅.
 * - 헤더/필터에서 사용하는 본사/가맹점 트리 데이터를 제공
 * - staleTime을 길게 잡아 불필요한 재요청을 줄인다.
 */
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

/**
 * BP 상세 조회 훅.
 * - 특정 BP 선택 시 상세 정보를 조회한다.
 */
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

/**
 * BP 상세 조회 함수.
 * - 훅 외부(예: 이벤트 핸들러/비동기 로직)에서 사용한다.
 */
export const getBpDetail = async (id: number): Promise<BpDetailResponse> => {
  const response = await api.get<ApiResponse<BpDetailResponse>>(`/api/master/bp/${id}`)
  return response.data.data
}
