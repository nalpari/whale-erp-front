// === 목록 ===
export interface EmployeeTodoListParams {
  headOfficeId: number
  franchiseId?: number
  storeId?: number
  employeeName?: string
  isCompleted?: boolean
  startDate?: string
  endDate?: string
  content?: string
  page: number
  size: number
}

export interface EmployeeTodoListItem {
  id: number
  headOfficeName: string
  franchiseName: string
  storeName: string
  employeeName: string
  content: string
  todoDate: string
  isCompleted: boolean
}

export interface EmployeeTodoListResponse {
  content: EmployeeTodoListItem[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  isFirst: boolean
  isLast: boolean
  hasNext: boolean
}

// === 상세 ===
export interface EmployeeTodoDetailResponse {
  id: number
  headOfficeId: number
  franchiseId: number | null
  storeId: number | null
  employeeInfoId: number
  employeeNumber: string
  employeeName: string
  content: string
  hasPeriod: boolean
  startDate: string
  endDate: string | null
  isCompleted: boolean
}

// === 등록/수정 ===
export interface EmployeeTodoCreateRequest {
  headOfficeId: number
  franchiseId?: number
  storeId?: number
  employeeInfoId: number
  content: string
  hasPeriod: boolean
  startDate: string
  endDate?: string
}

export type EmployeeTodoUpdateRequest = EmployeeTodoCreateRequest
