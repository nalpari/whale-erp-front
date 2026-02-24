import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { masterCategoryKeys } from './query-keys'
import type { ApiResponse } from '@/lib/schemas/api'
import type { CategoryResponse } from '@/types/menu'

export const useMasterCategoryList = (bpId: number | null | undefined) => {
  return useQuery({
    queryKey: masterCategoryKeys.list(bpId!),
    queryFn: async () => {
      const response = await api.get<ApiResponse<CategoryResponse[]>>(
        '/api/master/category/master',
        { params: { bpId, depth: 2, depth2IsActive: true } }
      )
      return response.data.data
    },
    enabled: !!bpId,
  })
}
