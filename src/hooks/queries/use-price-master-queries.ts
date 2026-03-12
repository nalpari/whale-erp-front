import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWithSchema, postWithSchema, putWithSchema } from '@/lib/api'
import { priceMasterKeys } from './query-keys'
import { priceMasterPagedResponseSchema, priceScheduleSaveListResponseSchema } from '@/lib/schemas/price-master'
import { apiResponseSchema } from '@/lib/schemas/api'
import { z } from 'zod'
import type {
  PriceMasterListParams,
  PriceScheduleSaveRequest,
} from '@/types/price-master'

export const usePriceMasterList = (params: PriceMasterListParams, enabled = true) => {
  return useQuery({
    queryKey: priceMasterKeys.list(params),
    queryFn: async () => {
      const response = await getWithSchema(
        '/api/master/price/master',
        priceMasterPagedResponseSchema,
        { params }
      )
      return response.data
    },
    enabled: enabled && params.bpId > 0,
  })
}

export const useCreatePriceSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PriceScheduleSaveRequest[]) => {
      const response = await postWithSchema(
        '/api/master/price/master/schedule',
        data,
        priceScheduleSaveListResponseSchema
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceMasterKeys.lists() })
    },
  })
}

export const useCancelPriceSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (menuIds: number[]) => {
      return await putWithSchema(
        '/api/master/price/master/schedule/cancel',
        menuIds,
        apiResponseSchema(z.unknown())
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceMasterKeys.lists() })
    },
  })
}
