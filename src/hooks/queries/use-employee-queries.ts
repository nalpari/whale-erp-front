import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '@/hooks/queries/query-keys'
import type {
  PostEmployeeInfoRequest,
  SaveEmployeeCareersRequest,
  SaveEmployeeCertificatesRequest,
  UpdateEmployeeInfoRequest,
} from '@/types/employee'
import type { ApiResponse, PageResponse } from '@/lib/schemas/api'
import type { EmployeeInfoListResponse } from '@/types/employee'
import {
  getEmployee,
  getEmployeeList,
  createEmployee,
  updateEmployee,
  updateEmployeeWithFiles,
  deleteEmployee,
  checkEmployeeNumber,
  sendEmployeeRegistrationEmail,
  getEmployeeCareers,
  saveEmployeeCareers,
  deleteAllEmployeeCareers,
  getEmployeeCertificates,
  saveEmployeeCertificates,
  saveEmployeeCertificatesWithFiles,
  deleteAllEmployeeCertificates,
  getMinimumWage,
  getEmployeeListByType,
  updateEmployeeLoginInfo,
  withdrawEmployeeMember,
  type EmployeeFiles,
  type GetEmployeeListByTypeParams,
  type UpdateEmployeeLoginInfoRequest,
} from '@/lib/api/employee'


/**
 * 직원 목록 조회 파라미터.
 * - 백엔드 검색 조건과 동일한 키를 사용한다.
 */
export type EmployeeListParams = {
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  workStatus?: string
  employeeName?: string
  employeeClassification?: string
  contractClassification?: string
  hireDateFrom?: string
  hireDateTo?: string
  page?: number
  size?: number
}

/**
 * 직원 목록 응답을 PageResponse 형태로 정규화.
 * - 서버 응답이 배열/객체(content|list|items)로 바뀌어도 안전하게 처리한다.
 */
const toEmployeePage = (payload: unknown): PageResponse<EmployeeInfoListResponse> => {
  if (Array.isArray(payload)) {
    return {
      content: payload as EmployeeInfoListResponse[],
      totalElements: payload.length,
      totalPages: payload.length === 0 ? 0 : 1,
      size: payload.length,
      number: 0,
      first: true,
      last: true,
      empty: payload.length === 0,
    }
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const content =
      (Array.isArray(record.content) && record.content) ||
      (Array.isArray(record.list) && record.list) ||
      (Array.isArray(record.items) && record.items)

    if (content) {
      const totalElements =
        typeof record.totalElements === 'number' ? record.totalElements : content.length
      const size =
        typeof record.size === 'number' && record.size > 0 ? record.size : content.length || 1
      const totalPages =
        typeof record.totalPages === 'number' ? record.totalPages : Math.ceil(totalElements / size)
      const number = typeof record.number === 'number' ? record.number : 0
      const first = typeof record.first === 'boolean' ? record.first : true
      const last = typeof record.last === 'boolean' ? record.last : true
      const empty = typeof record.empty === 'boolean' ? record.empty : content.length === 0
      return {
        content: content as EmployeeInfoListResponse[],
        totalElements,
        totalPages,
        size,
        number,
        first,
        last,
        empty,
      }
    }
  }

  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 0,
    number: 0,
    first: true,
    last: true,
    empty: true,
  }
}

/**
 * 직원 분류 공통코드 항목 타입.
 */
export type EmployeeCommonCodeItem = {
  code: string
  name: string
}

/**
 * 직원 분류 공통코드 조회 훅.
 * - headOfficeId 필수: 값이 없으면 쿼리를 실행하지 않는다.
 */
export const useEmployeeCommonCode = (
  headOfficeId?: number | null,
  franchiseId?: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: employeeKeys.commonCode(headOfficeId, franchiseId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<EmployeeCommonCodeItem[]>>(
        '/api/employee/info/common-code',
        { params: { headOfficeId, franchiseId } }
      )
      return response.data.data ?? []
    },
    enabled: enabled && !!headOfficeId,
  })
}

/**
 * 직원 목록 조회 훅.
 * - getEmployeeList를 사용하여 변환된 데이터를 반환한다.
 */
export const useEmployeeInfoList = (params: EmployeeListParams, enabled = true) => {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => {
      // null을 undefined로 변환하여 EmployeeSearchParams와 호환
      const searchParams = {
        headOfficeOrganizationId: params.officeId ?? undefined,
        franchiseOrganizationId: params.franchiseId ?? undefined,
        storeId: params.storeId ?? undefined,
        workStatus: params.workStatus as 'EMPWK_001' | 'EMPWK_002' | 'EMPWK_003' | undefined,
        employeeName: params.employeeName,
        employeeClassification: params.employeeClassification,
        contractClassification: params.contractClassification,
        hireDateFrom: params.hireDateFrom,
        hireDateTo: params.hireDateTo,
        page: params.page,
        size: params.size,
      }
      return getEmployeeList(searchParams)
    },
    enabled,
  })
}

export const useEmployeeDetail = (id?: number | null) => {
  return useQuery({
    queryKey: employeeKeys.detail(id!),
    queryFn: () => getEmployee(id!),
    enabled: !!id,
  })
}

export const useEmployeeCareers = (employeeId: number, enabled = true) => {
  return useQuery({
    queryKey: employeeKeys.careers(employeeId),
    queryFn: () => getEmployeeCareers(employeeId),
    enabled,
  })
}

export const useEmployeeCertificates = (employeeId: number, enabled = true) => {
  return useQuery({
    queryKey: employeeKeys.certificates(employeeId),
    queryFn: () => getEmployeeCertificates(employeeId),
    enabled,
  })
}

export const useEmployeeListByType = (params: GetEmployeeListByTypeParams, enabled = true) => {
  return useQuery({
    queryKey: employeeKeys.byType(params),
    queryFn: () => getEmployeeListByType(params),
    enabled,
  })
}

export const useMinimumWage = (year: number, enabled = true) => {
  return useQuery({
    queryKey: employeeKeys.minimumWage(year),
    queryFn: () => getMinimumWage(year),
    enabled,
  })
}

// ========== Mutation Hooks ==========

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PostEmployeeInfoRequest) => createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeInfoRequest }) =>
      updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) })
    },
  })
}

export const useUpdateEmployeeWithFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
                   id,
                   data,
                   files,
                 }: {
      id: number
      data: UpdateEmployeeInfoRequest
      files: EmployeeFiles
    }) => updateEmployeeWithFiles(id, data, files),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) })
    },
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export const useCheckEmployeeNumber = () => {
  return useMutation({
    mutationFn: ({
                   employeeNumber,
                   headOfficeOrganizationId,
                   franchiseOrganizationId,
                   storeId,
                 }: {
      employeeNumber: string
      headOfficeOrganizationId: number
      franchiseOrganizationId?: number | null
      storeId?: number | null
    }) =>
      checkEmployeeNumber(
        employeeNumber,
        headOfficeOrganizationId,
        franchiseOrganizationId,
        storeId
      ),
  })
}

export const useSendEmployeeRegistrationEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: number) => sendEmployeeRegistrationEmail(employeeId),
    onSuccess: (_, employeeId) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

// ========== Career Mutation Hooks ==========

export const useSaveEmployeeCareers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
                   employeeInfoId,
                   data,
                 }: {
      employeeInfoId: number
      data: SaveEmployeeCareersRequest
    }) => saveEmployeeCareers(employeeInfoId, data),
    onSuccess: (_, { employeeInfoId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.careers(employeeInfoId) })
    },
  })
}

export const useDeleteAllEmployeeCareers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeInfoId: number) => deleteAllEmployeeCareers(employeeInfoId),
    onSuccess: (_, employeeInfoId) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.careers(employeeInfoId) })
    },
  })
}

// ========== Certificate Mutation Hooks ==========

export const useSaveEmployeeCertificates = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
                   employeeInfoId,
                   data,
                 }: {
      employeeInfoId: number
      data: SaveEmployeeCertificatesRequest
    }) => saveEmployeeCertificates(employeeInfoId, data),
    onSuccess: (_, { employeeInfoId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.certificates(employeeInfoId) })
    },
  })
}

export const useSaveEmployeeCertificatesWithFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
                   employeeInfoId,
                   data,
                   files,
                 }: {
      employeeInfoId: number
      data: SaveEmployeeCertificatesRequest
      files: File[]
    }) => saveEmployeeCertificatesWithFiles(employeeInfoId, data, files),
    onSuccess: (_, { employeeInfoId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.certificates(employeeInfoId) })
    },
  })
}

export const useDeleteAllEmployeeCertificates = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeInfoId: number) => deleteAllEmployeeCertificates(employeeInfoId),
    onSuccess: (_, employeeInfoId) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.certificates(employeeInfoId) })
    },
  })
}

// ========== Login Info Mutation Hooks ==========

export const useUpdateEmployeeLoginInfo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
                   employeeInfoId,
                   request,
                 }: {
      employeeInfoId: number
      request: UpdateEmployeeLoginInfoRequest
    }) => updateEmployeeLoginInfo(employeeInfoId, request),
    onSuccess: (_, { employeeInfoId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeInfoId) })
    },
  })
}

export const useWithdrawEmployeeMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeInfoId: number) => withdrawEmployeeMember(employeeInfoId),
    onSuccess: (_, employeeInfoId) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeInfoId) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
