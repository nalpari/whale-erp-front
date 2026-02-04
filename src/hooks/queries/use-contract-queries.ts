'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractKeys, type ContractSearchParams } from './query-keys'
import {
  getEmploymentContracts,
  getEmploymentContract,
  getEmploymentContractsByEmployeeInfoId,
  createEmploymentContractHeaderWithFiles,
  updateEmploymentContractHeaderWithFiles,
  createEmploymentContractSalaryInfo,
  updateEmploymentContractSalaryInfo,
  createEmploymentContractWorkHours,
  deleteEmploymentContract,
  sendContractEmail,
  type CreateEmploymentContractHeaderWithFilesRequest,
  type UpdateEmploymentContractHeaderWithFilesRequest,
  type CreateEmploymentContractSalaryInfoRequest,
  type UpdateEmploymentContractSalaryInfoRequest,
  type CreateEmploymentContractWorkHoursRequest,
} from '@/lib/api/employmentContract'

// 근로 계약 목록 조회
export const useContractList = (params?: ContractSearchParams, enabled = true) => {
  return useQuery({
    queryKey: contractKeys.list(params),
    queryFn: () => getEmploymentContracts(params),
    enabled,
  })
}

// 근로 계약 상세 조회
export const useContractDetail = (id: number, enabled = true) => {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => getEmploymentContract(id),
    enabled: enabled && !!id,
  })
}

// 직원별 이전 계약 조회
export const useContractsByEmployee = (employeeId: number, enabled = true) => {
  return useQuery({
    queryKey: contractKeys.byEmployee(employeeId),
    queryFn: () => getEmploymentContractsByEmployeeInfoId(employeeId),
    enabled: enabled && !!employeeId,
  })
}

// 근로 계약 생성 (파일 포함)
export const useCreateContract = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateEmploymentContractHeaderWithFilesRequest) =>
      createEmploymentContractHeaderWithFiles(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
    },
  })
}

// 근로 계약 헤더 수정 (파일 포함)
export const useUpdateContractHeader = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ headerId, request }: { headerId: number; request: UpdateEmploymentContractHeaderWithFilesRequest }) =>
      updateEmploymentContractHeaderWithFiles(headerId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contractKeys.details() })
    },
  })
}

// 급여 정보 생성
export const useCreateContractSalary = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEmploymentContractSalaryInfoRequest) =>
      createEmploymentContractSalaryInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.details() })
    },
  })
}

// 급여 정보 수정
export const useUpdateContractSalary = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ salaryInfoId, data }: { salaryInfoId: number; data: UpdateEmploymentContractSalaryInfoRequest }) =>
      updateEmploymentContractSalaryInfo(salaryInfoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.details() })
    },
  })
}

// 근무 시간 등록
export const useCreateContractWorkHours = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEmploymentContractWorkHoursRequest) =>
      createEmploymentContractWorkHours(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.details() })
    },
  })
}

// 근로 계약 삭제
export const useDeleteContract = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteEmploymentContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contractKeys.details() })
    },
  })
}

// 계약서 이메일 전송
export const useSendContractEmail = () => {
  return useMutation({
    mutationFn: (contractId: number) => sendContractEmail(contractId),
  })
}
