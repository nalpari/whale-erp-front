import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerKeys } from '@/hooks/queries/query-keys'
import type { CustomerSearchParams, PutCustomerRequest } from '@/types/customer'
import {
  getCustomerList,
  getCustomer,
  updateCustomer,
  withdrawCustomer,
} from '@/lib/api/customer'

// 회원 목록 조회
export const useCustomerList = (params?: CustomerSearchParams, enabled = true) => {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => getCustomerList(params),
    enabled,
  })
}

// 회원 상세 조회
export const useCustomerDetail = (id?: number | null) => {
  return useQuery({
    queryKey: customerKeys.detail(id!),
    queryFn: () => getCustomer(id!),
    enabled: !!id,
  })
}

// 회원 수정
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PutCustomerRequest }) =>
      updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
    },
  })
}

// 회원 탈퇴
export const useWithdrawCustomer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, withdrawalReason }: { id: number; withdrawalReason: string }) =>
      withdrawCustomer(id, { withdrawalReason }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
    },
  })
}
