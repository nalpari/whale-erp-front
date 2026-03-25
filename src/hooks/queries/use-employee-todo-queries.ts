import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ApiResponse } from '@/lib/schemas/api'
import { employeeTodoKeys, type EmployeeTodoSelectParams } from '@/hooks/queries/query-keys'
import type {
  EmployeeTodoListParams,
  EmployeeTodoListResponse,
  EmployeeTodoDetailResponse,
  EmployeeTodoCreateRequest,
  EmployeeTodoUpdateRequest,
} from '@/types/employee-todo'

// === 직원 선택 목록 (Selectbox) ===

export interface EmployeeTodoSelectItem {
  employeeInfoId: number
  employeeNumber: string
  employeeName: string
}

export const useEmployeeTodoSelectList = (
  params: EmployeeTodoSelectParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: employeeTodoKeys.employees(params),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EmployeeTodoSelectItem[]>>(
        '/api/v1/employee-todos/employees',
        { params },
      )
      return data.data
    },
    enabled,
  })
}

// === 할 일 목록 ===

export const useEmployeeTodoList = (params: EmployeeTodoListParams, enabled = true) => {
  return useQuery({
    queryKey: employeeTodoKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EmployeeTodoListResponse>>(
        '/api/v1/employee-todos',
        { params },
      )
      return data.data
    },
    enabled,
  })
}

// === 할 일 상세 ===

export const useEmployeeTodoDetail = (id: number | null) => {
  return useQuery({
    queryKey: employeeTodoKeys.detail(id ?? 0),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EmployeeTodoDetailResponse>>(
        `/api/v1/employee-todos/${id}`,
      )
      return data.data
    },
    enabled: id != null,
  })
}

// === 할 일 등록 ===

export const useCreateEmployeeTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: EmployeeTodoCreateRequest) => {
      const { data } = await api.post<ApiResponse<{ id: number }>>('/api/v1/employee-todos', body)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeTodoKeys.lists() })
    },
  })
}

// === 할 일 수정 ===

export const useUpdateEmployeeTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: EmployeeTodoUpdateRequest }) => {
      const { data } = await api.put<ApiResponse<{ id: number }>>(`/api/v1/employee-todos/${id}`, body)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeTodoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeTodoKeys.details() })
    },
  })
}

// === 할 일 다중 삭제 ===

export const useDeleteEmployeeTodos = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const { data } = await api.delete<ApiResponse<null>>('/api/v1/employee-todos', { data: ids })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeTodoKeys.lists() })
    },
  })
}
