export interface StoreListParams {
  office?: number
  franchise?: number
  store?: number
  status?: string
  from?: string
  to?: string
  page?: number
  size?: number
  sort?: string
}

export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  list: (params: StoreListParams) => [...storeKeys.lists(), params] as const,
  details: () => [...storeKeys.all, 'detail'] as const,
  detail: (id: number) => [...storeKeys.details(), id] as const,
  options: (officeId?: number | null, franchiseId?: number | null) =>
    [...storeKeys.all, 'options', { officeId, franchiseId }] as const,
}

export const fileKeys = {
  all: ['files'] as const,
  downloadUrl: (id: number) => [...fileKeys.all, 'download', id] as const,
}

export const bpKeys = {
  all: ['bp'] as const,
  headOfficeTree: () => [...bpKeys.all, 'head-office-tree'] as const,
  detail: (id: number) => [...bpKeys.all, 'detail', id] as const,
}

export const commonCodeKeys = {
  all: ['common-codes'] as const,
  hierarchy: (code: string) => [...commonCodeKeys.all, 'hierarchy', code] as const,
}

export const programKeys = {
  all: ['programs'] as const,
  lists: () => [...programKeys.all, 'list'] as const,
  list: (menuKind: string) => [...programKeys.lists(), menuKind] as const,
  details: () => [...programKeys.all, 'detail'] as const,
  detail: (id: number) => [...programKeys.details(), id] as const,
}

export const storeScheduleKeys = {
  all: ['store-schedule'] as const,
  lists: () => [...storeScheduleKeys.all, 'list'] as const,
  list: (params?: unknown) => [...storeScheduleKeys.lists(), params ?? null] as const,
}

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params?: unknown) => [...employeeKeys.lists(), params ?? null] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: number) => [...employeeKeys.details(), id] as const,
  careers: (employeeId: number) => [...employeeKeys.all, 'career', employeeId] as const,
  certificates: (employeeId: number) => [...employeeKeys.all, 'certificate', employeeId] as const,
  byType: (params: { headOfficeId: number; franchiseId?: number; employeeType: string }) =>
    [...employeeKeys.all, 'by-type', params] as const,
  minimumWage: (year: number) => [...employeeKeys.all, 'minimum-wage', year] as const,
}

export interface SettingsParams {
  headOfficeId?: number
  franchiseId?: number
}

export interface ContractSearchParams {
  page?: number
  size?: number
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
  workStatus?: string
  memberName?: string
  workDays?: string[]
  memberClassification?: string
  contractClassification?: string
  contractStatus?: string
  electronicContract?: string[]
  salaryStartDt?: string
  salaryEndDt?: string
  contractStartDt?: string
  contractEndDt?: string
  isDeleted?: boolean
}

export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (params?: ContractSearchParams) => [...contractKeys.lists(), params ?? null] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: number) => [...contractKeys.details(), id] as const,
  byEmployee: (employeeId: number) => [...contractKeys.all, 'by-employee', employeeId] as const,
}

export const settingsKeys = {
  all: ['settings'] as const,
  employeeInfo: (params?: SettingsParams) => [...settingsKeys.all, 'employee-info', params ?? null] as const,
  laborContract: (params?: SettingsParams) => [...settingsKeys.all, 'labor-contract', params ?? null] as const,
  payrollStatement: (params?: SettingsParams) => [...settingsKeys.all, 'payroll-statement', params ?? null] as const,
}

export const payrollKeys = {
  all: ['payroll'] as const,
  commonCode: (params?: { headOfficeId?: number; franchiseId?: number }) =>
    [...payrollKeys.all, 'common-code', params ?? null] as const,
  bonusTypes: (params?: { headOfficeId?: number; franchiseId?: number }) =>
    [...payrollKeys.all, 'bonus-types', params ?? null] as const,
}
