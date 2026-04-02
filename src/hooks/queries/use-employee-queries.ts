import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '@/hooks/queries/query-keys'
import type {
  PostEmployeeInfoRequest,
  SaveEmployeeCareersRequest,
  SaveEmployeeCertificatesRequest,
  UpdateEmployeeInfoRequest,
} from '@/types/employee'
import type { ApiResponse } from '@/lib/schemas/api'
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
  getMemberDocuments,
  createMemberDocument,
  deleteMemberDocument,
  type EmployeeFiles,
  type GetEmployeeListByTypeParams,
  type UpdateEmployeeLoginInfoRequest,
} from '@/lib/api/employee'
import api from '@/lib/api'


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
        '/api/v1/employee/info/common-code',
        { params: { headOfficeId, franchiseId } }
      )
      const data = response.data.data
      return Array.isArray(data) ? data : []
    },
    enabled: enabled && !!headOfficeId,
  })
}

/**
 * 직원 목록 조회 훅.
 * - getEmployeeList를 사용하여 변환된 데이터를 반환한다.
 */
export const useEmployeeInfoList = (params: EmployeeListParams, enabled = true) => {
  // 0은 유효한 ID가 아니므로 || 사용 (0, null, undefined 모두 fallthrough)
  const headOfficeId = params.officeId || params.headOfficeOrganizationId
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
    enabled: enabled && !!headOfficeId,
  })
}

export const useEmployeeDetail = (id?: number | null) => {
  return useQuery({
    queryKey: employeeKeys.detail(id!),
    queryFn: () => getEmployee(id!),
    enabled: !!id,
  })
}

export const useEmployeeCareers = (memberId: number, enabled = true) => {
  return useQuery({
    queryKey: employeeKeys.careers(memberId),
    queryFn: () => getEmployeeCareers(memberId),
    enabled,
  })
}

export const useEmployeeCertificates = (memberId: number, enabled = true) => {
  return useQuery({
    queryKey: employeeKeys.certificates(memberId),
    queryFn: () => getEmployeeCertificates(memberId),
    enabled,
  })
}

export const useEmployeeListByType = (params: GetEmployeeListByTypeParams, enabled = true, filterByContract = false) => {
  return useQuery({
    queryKey: employeeKeys.byType(params),
    queryFn: () => getEmployeeListByType(params),
    enabled,
    select: filterByContract
      ? (data) => data.filter((emp) => emp.employmentContractId !== null && emp.memberId !== null)
      : undefined,
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
                   memberId,
                   data,
                 }: {
      memberId: number
      data: SaveEmployeeCareersRequest
    }) => saveEmployeeCareers(memberId, data),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.careers(memberId) })
    },
  })
}

export const useDeleteAllEmployeeCareers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: number) => deleteAllEmployeeCareers(memberId),
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.careers(memberId) })
    },
  })
}

// ========== Certificate Mutation Hooks ==========

export const useSaveEmployeeCertificates = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
                   memberId,
                   data,
                 }: {
      memberId: number
      data: SaveEmployeeCertificatesRequest
    }) => saveEmployeeCertificates(memberId, data),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.certificates(memberId) })
    },
  })
}

export const useSaveEmployeeCertificatesWithFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
                   memberId,
                   data,
                   files,
                 }: {
      memberId: number
      data: SaveEmployeeCertificatesRequest
      files: File[]
    }) => saveEmployeeCertificatesWithFiles(memberId, data, files),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.certificates(memberId) })
    },
  })
}

export const useDeleteAllEmployeeCertificates = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: number) => deleteAllEmployeeCertificates(memberId),
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.certificates(memberId) })
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

// ========== Member Document Hooks ==========

export const useMemberDocuments = (memberId: number | null, enabled = true) => {
  return useQuery({
    queryKey: employeeKeys.documents(memberId ?? 0),
    queryFn: () => getMemberDocuments(memberId!),
    enabled: enabled && !!memberId,
  })
}

export const useCreateMemberDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: number
      data: { documentType: string; uploadFileId: number; expiryDate?: string }
    }) => createMemberDocument(memberId, data),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.documents(memberId) })
    },
  })
}

export const useDeleteMemberDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, documentId }: { memberId: number; documentId: number }) =>
      deleteMemberDocument(memberId, documentId),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.documents(memberId) })
    },
  })
}
