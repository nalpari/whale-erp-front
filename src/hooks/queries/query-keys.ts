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


export interface PlansListParams {
  planType?: string | null
  updater?: string | null
  page?: number
  size?: number
  sort?: string
}

export const plansKeys = {
  all: ['plans'] as const,
  lists: () => [...plansKeys.all, 'list'] as const,
  list: (params: PlansListParams) => [...plansKeys.lists(), params] as const,
}