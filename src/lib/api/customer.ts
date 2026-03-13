import api from '@/lib/api'
import type {
  CustomerSearchParams,
  CustomerListResponse,
  CustomerDetailResponse,
  PutCustomerRequest,
} from '@/types/customer'

// 회원 목록 조회
export async function getCustomerList(params?: CustomerSearchParams): Promise<CustomerListResponse> {
  const response = await api.get<{ data: CustomerListResponse }>('/api/customers', { params })
  return response.data.data
}

// 회원 상세 조회
export async function getCustomer(id: number): Promise<CustomerDetailResponse> {
  const response = await api.get<{ data: CustomerDetailResponse }>(`/api/customers/${id}`)
  return response.data.data
}

// 회원 수정
export async function updateCustomer(id: number, data: PutCustomerRequest): Promise<CustomerDetailResponse> {
  const response = await api.put<{ data: CustomerDetailResponse }>(`/api/customers/${id}`, data)
  return response.data.data
}

// 회원 탈퇴 (isOperate=0 + withdrawalReason 설정)
export async function withdrawCustomer(id: number, data: { withdrawalReason: string }): Promise<CustomerDetailResponse> {
  const response = await api.put<{ data: CustomerDetailResponse }>(`/api/customers/${id}`, {
    isOperate: 0,
    withdrawalReason: data.withdrawalReason,
  })
  return response.data.data
}
