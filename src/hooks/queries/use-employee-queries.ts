import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '@/hooks/queries/query-keys'
import type {
  PostEmployeeInfoRequest,
  SaveEmployeeCareersRequest,
  SaveEmployeeCertificatesRequest,
  UpdateEmployeeInfoRequest,
} from '@/types/employee'
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
  getMinimumWageList,
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
 * - officeId/headOfficeOrganizationId, franchiseId/franchiseOrganizationId 둘 다 지원
 */
export type EmployeeListParams = {
  officeId?: number | null
  headOfficeOrganizationId?: number | null
  franchiseId?: number | null
  franchiseOrganizationId?: number | null
  storeId?: number | null
  workStatus?: string
  employeeName?: string
  employeeClassification?: string
  contractClassification?: string
  adminAuthority?: string
  memberStatus?: string
  hireDateFrom?: string
  hireDateTo?: string
  healthCheckExpiryFrom?: string
  healthCheckExpiryTo?: string
  page?: number
  size?: number
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
      // officeId/headOfficeOrganizationId, franchiseId/franchiseOrganizationId 둘 다 지원
      const searchParams = {
        headOfficeOrganizationId: params.officeId ?? params.headOfficeOrganizationId ?? undefined,
        franchiseOrganizationId: params.franchiseId ?? params.franchiseOrganizationId ?? undefined,
        storeId: params.storeId ?? undefined,
        workStatus: params.workStatus as 'EMPWK_001' | 'EMPWK_002' | 'EMPWK_003' | undefined,
        employeeName: params.employeeName,
        employeeClassification: params.employeeClassification,
        contractClassification: params.contractClassification,
        adminAuthority: params.adminAuthority,
        memberStatus: params.memberStatus,
        hireDateFrom: params.hireDateFrom,
        hireDateTo: params.hireDateTo,
        healthCheckExpiryFrom: params.healthCheckExpiryFrom,
        healthCheckExpiryTo: params.healthCheckExpiryTo,
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

// 최저시급 목록 조회 (현재년도 + 다음년도)
export const useMinimumWageList = (enabled = true) => {
  return useQuery({
    queryKey: [...employeeKeys.all, 'minimum-wage-list'] as const,
    queryFn: () => getMinimumWageList(),
    staleTime: 24 * 60 * 60 * 1000, // 24시간 캐시 (최저시급은 잘 변하지 않음)
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
