import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  payrollKeys,
  type FullTimePayrollListParams,
  type PartTimePayrollListParams,
  type OvertimePayrollListParams,
} from './query-keys'

// Full-time payroll API imports
import {
  getPayrollStatements,
  getPayrollStatement,
  createPayrollStatement,
  updatePayrollStatement,
  deletePayrollStatement,
  sendPayrollEmail,
  downloadPayrollExcel,
  uploadPayrollExcel,
  getLatestPayroll,
  type CreatePayrollStatementRequest,
  type UpdatePayrollStatementRequest,
} from '@/lib/api/payrollStatement'

// Part-time payroll API imports
import {
  getPartTimerPayrollStatements,
  getPartTimerPayrollStatement,
  updatePartTimerPayrollStatement,
  deletePartTimerPayrollStatement,
  sendPartTimerPayrollEmail,
  downloadPartTimerPayrollExcel,
  getDailyWorkHours,
  type UpdatePartTimerPayrollStatementRequest,
  type GetDailyWorkHoursParams,
} from '@/lib/api/partTimerPayrollStatement'

// Overtime payroll API imports
import {
  getOvertimeAllowanceStatements,
  getOvertimeAllowanceStatement,
  createOvertimeAllowanceStatement,
  updateOvertimeAllowanceStatement,
  deleteOvertimeAllowanceStatement,
  sendOvertimeAllowanceEmail,
  downloadOvertimeAllowanceExcel,
  getDailyOvertimeHoursSummary,
  type PostOvertimeAllowanceStatementRequest,
  type PutOvertimeAllowanceStatementRequest,
  type GetDailyOvertimeHoursParams,
} from '@/lib/api/overtimeAllowanceStatement'

// ==================== Full-time Payroll Hooks ====================

export const useFullTimePayrollList = (params: FullTimePayrollListParams, enabled = true) => {
  return useQuery({
    queryKey: payrollKeys.fullTime.list(params),
    queryFn: () => getPayrollStatements(params),
    enabled,
  })
}

export const useFullTimePayrollDetail = (id?: number | null) => {
  return useQuery({
    queryKey: payrollKeys.fullTime.detail(id!),
    queryFn: () => getPayrollStatement(id!),
    enabled: !!id,
  })
}

export const useLatestFullTimePayroll = (employeeInfoId: number, enabled = true) => {
  return useQuery({
    queryKey: payrollKeys.fullTime.latest(employeeInfoId),
    queryFn: () => getLatestPayroll(employeeInfoId),
    enabled,
  })
}

export const useCreateFullTimePayroll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      request,
      attachmentFile,
    }: {
      request: CreatePayrollStatementRequest
      attachmentFile?: File
    }) => createPayrollStatement(request, attachmentFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.fullTime.lists() })
    },
  })
}

export const useUpdateFullTimePayroll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdatePayrollStatementRequest }) =>
      updatePayrollStatement(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.fullTime.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.fullTime.detail(id) })
    },
  })
}

export const useDeleteFullTimePayroll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deletePayrollStatement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.fullTime.all() })
    },
  })
}

export const useSendFullTimePayrollEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sendPayrollEmail(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.fullTime.detail(id) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.fullTime.lists() })
    },
  })
}

export const useDownloadFullTimePayrollExcel = () => {
  return useMutation({
    mutationFn: (id: number) => downloadPayrollExcel(id),
  })
}

export const useUploadFullTimePayrollExcel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      payrollYearMonth,
      overwrite,
    }: {
      file: File
      payrollYearMonth: string
      overwrite?: boolean
    }) => uploadPayrollExcel(file, payrollYearMonth, overwrite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.fullTime.lists() })
    },
  })
}

// ==================== Part-time Payroll Hooks ====================

export const usePartTimePayrollList = (params: PartTimePayrollListParams, enabled = true) => {
  return useQuery({
    queryKey: payrollKeys.partTime.list(params),
    queryFn: () => getPartTimerPayrollStatements(params),
    enabled,
  })
}

export const usePartTimePayrollDetail = (id?: number | null) => {
  return useQuery({
    queryKey: payrollKeys.partTime.detail(id!),
    queryFn: () => getPartTimerPayrollStatement(id!),
    enabled: !!id,
  })
}

export const useDailyWorkHours = (
  params: Omit<GetDailyWorkHoursParams, 'headOfficeId' | 'franchiseStoreId' | 'storeId'> & {
    headOfficeId?: number
    franchiseStoreId?: number
    storeId?: number
  },
  enabled = true
) => {
  return useQuery({
    queryKey: payrollKeys.partTime.dailyWorkHours({
      employeeInfoId: params.employeeInfoId,
      startDate: params.startDate,
      endDate: params.endDate,
    }),
    queryFn: () => getDailyWorkHours(params),
    enabled,
  })
}

export const useUpdatePartTimePayroll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdatePartTimerPayrollStatementRequest }) =>
      updatePartTimerPayrollStatement(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.partTime.detail(id) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.partTime.lists() })
    },
  })
}

export const useDeletePartTimePayroll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deletePartTimerPayrollStatement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.partTime.all() })
    },
  })
}

export const useSendPartTimePayrollEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sendPartTimerPayrollEmail(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.partTime.detail(id) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.partTime.lists() })
    },
  })
}

export const useDownloadPartTimePayrollExcel = () => {
  return useMutation({
    mutationFn: (id: number) => downloadPartTimerPayrollExcel(id),
  })
}

// ==================== Overtime Payroll Hooks ====================

export const useOvertimePayrollList = (params: OvertimePayrollListParams, enabled = true) => {
  return useQuery({
    queryKey: payrollKeys.overtime.list(params),
    queryFn: () => getOvertimeAllowanceStatements(params),
    enabled,
  })
}

export const useOvertimePayrollDetail = (id?: number | null) => {
  return useQuery({
    queryKey: payrollKeys.overtime.detail(id!),
    queryFn: () => getOvertimeAllowanceStatement(id!),
    enabled: !!id,
  })
}

export const useDailyOvertimeHours = (
  params: Omit<GetDailyOvertimeHoursParams, 'headOfficeId' | 'franchiseStoreId' | 'storeId'> & {
    headOfficeId?: number
    franchiseStoreId?: number
    storeId?: number
  },
  enabled = true
) => {
  return useQuery({
    queryKey: payrollKeys.overtime.dailyOvertimeHours({
      employeeInfoId: params.employeeInfoId,
      startDate: params.startDate,
      endDate: params.endDate,
    }),
    queryFn: () => getDailyOvertimeHoursSummary(params),
    enabled,
  })
}

export const useCreateOvertimePayroll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: PostOvertimeAllowanceStatementRequest) =>
      createOvertimeAllowanceStatement(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.overtime.lists() })
    },
  })
}

export const useUpdateOvertimePayroll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: PutOvertimeAllowanceStatementRequest }) =>
      updateOvertimeAllowanceStatement(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.overtime.lists() })
      queryClient.invalidateQueries({ queryKey: payrollKeys.overtime.detail(id) })
    },
  })
}

export const useDeleteOvertimePayroll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteOvertimeAllowanceStatement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.overtime.all() })
    },
  })
}

export const useSendOvertimePayrollEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sendOvertimeAllowanceEmail(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.overtime.detail(id) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.overtime.lists() })
    },
  })
}

export const useDownloadOvertimePayrollExcel = () => {
  return useMutation({
    mutationFn: (id: number) => downloadOvertimeAllowanceExcel(id),
  })
}

// ==================== Utility Hook ====================

export const useInvalidateAllPayroll = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: payrollKeys.all })
}
