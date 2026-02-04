import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsKeys, type SettingsParams } from './query-keys'

import {
  getEmployeeInfoCommonCode,
  getEmployeeClassifications,
  saveEmployeeInfoCommonCode,
  type SaveEmployeeInfoCommonCodeRequest,
} from '@/lib/api/employeeInfoSettings'

// Settings staleTime: 30 minutes (settings change infrequently)
const SETTINGS_STALE_TIME = 30 * 60 * 1000

// ==================== Employee Info Settings ====================

export const useEmployeeInfoSettings = (params?: SettingsParams, enabled = true) => {
  return useQuery({
    queryKey: settingsKeys.employeeInfo(params),
    queryFn: () => getEmployeeInfoCommonCode(params),
    staleTime: SETTINGS_STALE_TIME,
    enabled,
  })
}

export const useSaveEmployeeInfoSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SaveEmployeeInfoCommonCodeRequest) => saveEmployeeInfoCommonCode(request),
    onSuccess: (_, request) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.employeeInfo({
          headOfficeId: request.headOfficeId,
          franchiseId: request.franchiseId,
        }),
      })
    },
  })
}

// ==================== Labor Contract Settings ====================

import {
  getLaborContractSettingsCode,
  saveLaborContractSettingsCode,
  type SaveLaborContractSettingsCodeRequest,
} from '@/lib/api/laborContractSettings'

export const useLaborContractSettings = (params?: SettingsParams, enabled = true) => {
  return useQuery({
    queryKey: settingsKeys.laborContract(params),
    queryFn: () => getLaborContractSettingsCode(params),
    staleTime: SETTINGS_STALE_TIME,
    enabled,
  })
}

export const useSaveLaborContractSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SaveLaborContractSettingsCodeRequest) => saveLaborContractSettingsCode(request),
    onSuccess: (_, request) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.laborContract({
          headOfficeId: request.headOfficeId,
          franchiseId: request.franchiseId,
        }),
      })
    },
  })
}

// ==================== Payroll Statement Settings ====================

import {
  getPayrollStatementSettingsCode,
  savePayrollStatementSettingsCode,
  type PayrollStatementSettingsContent,
} from '@/lib/api/payrollStatementSettings'

export const usePayrollStatementSettings = (params?: SettingsParams, enabled = true) => {
  return useQuery({
    queryKey: settingsKeys.payrollStatement(params),
    queryFn: () => getPayrollStatementSettingsCode(params),
    staleTime: SETTINGS_STALE_TIME,
    enabled,
  })
}

export const useSavePayrollStatementSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      headOfficeId,
      franchiseId,
      settings,
    }: {
      headOfficeId: number
      franchiseId?: number
      settings: PayrollStatementSettingsContent
    }) => savePayrollStatementSettingsCode(headOfficeId, franchiseId, settings),
    onSuccess: (_, { headOfficeId, franchiseId }) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.payrollStatement({
          headOfficeId,
          franchiseId,
        }),
      })
    },
  })
}

// ==================== Employee Info Common Code ====================

import {
  getEmployeeInfoCommonCode as getEmployeeInfoCommonCodeApi,
} from '@/lib/api/employeeInfoSettings'

export const useEmployeeInfoCommonCode = (
  headOfficeId?: number,
  franchiseId?: number,
  enabled = true
) => {
  return useQuery({
    queryKey: settingsKeys.employeeInfo({ headOfficeId, franchiseId }),
    queryFn: () => getEmployeeInfoCommonCodeApi({ headOfficeId, franchiseId }),
    staleTime: SETTINGS_STALE_TIME,
    enabled: enabled && !!headOfficeId,
  })
}

// ==================== Employee Classifications ====================

export const useEmployeeClassifications = (
  headOfficeId?: number,
  franchiseId?: number,
  enabled = true
) => {
  return useQuery({
    queryKey: [...settingsKeys.employeeInfo({ headOfficeId, franchiseId }), 'classifications'] as const,
    queryFn: () => getEmployeeClassifications(headOfficeId, franchiseId),
    staleTime: SETTINGS_STALE_TIME,
    enabled,
  })
}
