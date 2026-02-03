import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsKeys, type SettingsParams } from './query-keys'

import {
  getEmployeeInfoCommonCode,
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
// TODO: Implement when laborContractSettings API module is created

// ==================== Payroll Statement Settings ====================
// TODO: Implement when payrollStatementSettings API module is created
