import { useQuery, keepPreviousData } from "@tanstack/react-query"
import api from "@/lib/api"
import { plansKeys, type PlansListParams } from "./query-keys"
import { PlansListResponse } from '@/types/plans'
import type { ApiResponse } from '@/lib/schemas/api'

//Plans 목록 조회
export const usePlansList = (params: PlansListParams, enabled = true) => {
    return useQuery({
        queryKey: plansKeys.list(params),
        queryFn: async () => {
            const response = await api.get<ApiResponse<PlansListResponse>>(
                '/api/v1/subscription/plans/list',
                { params }
            )
            return response.data.data
        },
        enabled,
        placeholderData: keepPreviousData,
    })
}