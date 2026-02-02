import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsKeys, type SettingsParams } from './query-keys'

import {
  getEmployeeInfoCommonCode,
  saveEmployeeInfoCommonCode,
  type SaveEmployeeInfoCommonCodeRequest,
} from '@/lib/api/employeeInfoSettings'

import {
  getLaborContractSettingsCode,
  saveLaborContractSettingsCode,
  type SaveLaborContractSettingsCodeRequest,
} from '@/lib/api/laborContractSettings'

import {
  getPayrollStatementSettingsCode,
  savePayrollStatementSettingsCode,
  type PayrollStatementSettingsContent,
} from '@/lib/api/payrollStatementSettings'

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
    mutationFn: (request: SaveLaborContractSettingsCodeRequest) =>
      saveLaborContractSettingsCode(request),
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
