import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ApiResponse } from '@/lib/schemas/api'
import { employeeTodoKeys, type EmployeeTodoSelectParams } from '@/hooks/queries/query-keys'

export interface EmployeeTodoSelectItem {
  employeeInfoId: number
  employeeNumber: string
  employeeName: string
}

/**
 * 직원 할 일 등록/수정 화면에서 직원 선택(Selectbox)용 목록 조회.
 * 근무 상태가 '근무'(EMPWK_001)인 직원만 반환.
 */
export const useEmployeeTodoSelectList = (
  params: EmployeeTodoSelectParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: employeeTodoKeys.employees(params),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EmployeeTodoSelectItem[]>>(
        '/api/v1/employee-todos/employees',
        {
          params: {
            headOfficeId: params.headOfficeId,
            franchiseId: params.franchiseId,
            storeId: params.storeId,
          },
        },
      )
      return data.data
    },
    enabled,
  })
}
