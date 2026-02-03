import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import api from "@/lib/api"
import { plansKeys, type PlansListParams } from "./query-keys"
import { PlansListResponse, PlanDetailResponse, UpdatePlanHeaderRequest, PlanPricing, CreatePlanPricingRequest, CreatePlanPricingResponse, UpdatePlanPricingRequest } from '@/types/plans'
import type { ApiResponse } from '@/lib/schemas/api'

// Plans 목록 조회
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

// Plan 상세 조회
export const usePlanDetail = (id: number, enabled = true) => {
    return useQuery({
        queryKey: plansKeys.detail(id),
        queryFn: async () => {
            const response = await api.get<ApiResponse<PlanDetailResponse>>(
                `/api/v1/subscription/plans/${id}`
            )
            return response.data.data
        },
        enabled: enabled && id > 0,
    })
}

// Plan 헤더 수정
export const useUpdatePlanHeader = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdatePlanHeaderRequest }) => {
            const response = await api.put<ApiResponse<PlanDetailResponse>>(
                `/api/v1/subscription/plans/${id}`,
                data
            )
            return response.data.data
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: plansKeys.detail(id) })
        },
    })
}

// 가격 기간 중복 체크
export const useCheckPlanPricingDuplicate = () => {
    return useMutation({
        mutationFn: async ({
            planId,
            activeFrom,
            activeUntil,
            excludePricingId,
        }: {
            planId: number
            activeFrom: string
            activeUntil: string
            excludePricingId?: number  // 수정 시 자기 자신 제외
        }) => {
            const response = await api.get<ApiResponse<PlanPricing[]>>(
                `/api/v1/subscription/plans/${planId}/pricings`,
                { params: { activeFrom, activeUntil, excludePricingId } }
            )
            return {
                isDuplicate: response.data.data.length >= 1,
                duplicates: response.data.data,
            }
        },
    })
}

// 가격 정책 생성
export const useCreatePlanPricing = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            planId,
            data,
        }: {
            planId: number
            data: CreatePlanPricingRequest
        }) => {
            const response = await api.post<ApiResponse<CreatePlanPricingResponse>>(
                `/api/v1/subscription/plans/${planId}/pricings`,
                data
            )
            return response.data.data
        },
        onSuccess: (_, { planId }) => {
            queryClient.invalidateQueries({ queryKey: plansKeys.detail(planId) })
        },
    })
}

// 가격 정책 수정
export const useUpdatePlanPricing = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            planId,
            pricingId,
            data,
        }: {
            planId: number
            pricingId: number
            data: UpdatePlanPricingRequest
        }) => {
            const response = await api.put<ApiResponse<CreatePlanPricingResponse>>(
                `/api/v1/subscription/plans/${planId}/pricings/${pricingId}`,
                data
            )
            return response.data.data
        },
        onSuccess: (_, { planId }) => {
            queryClient.invalidateQueries({ queryKey: plansKeys.detail(planId) })
        },
    })
}

// 가격 정책 삭제
export const useDeletePlanPricing = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ planId, pricingId }: { planId: number; pricingId: number }) => {
            await api.delete(`/api/v1/subscription/plans/${planId}/pricings/${pricingId}`)
        },
        onSuccess: (_, { planId }) => {
            queryClient.invalidateQueries({ queryKey: plansKeys.detail(planId) })
        },
    })
}