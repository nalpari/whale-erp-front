import { useQuery } from '@tanstack/react-query'
import { getWithSchema } from '@/lib/api'
import { priceHistoryKeys } from './query-keys'
import { priceHistoryPagedResponseSchema } from '@/lib/schemas/price-history'
import type { PriceHistoryListParams } from '@/types/price-history'

export const usePriceHistoryList = (params: PriceHistoryListParams, enabled = true) => {
  return useQuery({
    queryKey: priceHistoryKeys.list(params),
    queryFn: async () => {
      const response = await getWithSchema(
        '/api/master/price/master/history',
        priceHistoryPagedResponseSchema,
        { params }
      )
      return response.data
    },
    enabled: enabled && params.bpId > 0,
  })
}
