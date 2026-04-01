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

// === 직원 선택 목록 (Selectbox) ===
export interface EmployeeTodoSelectItem {
  employeeInfoId: number
  /** 현재 프로젝트에서는 미사용. 다른 프로젝트에서 동일 API를 공유하며 memberId가 필요하여 응답에 포함됨. 추후 활용 가능성을 위해 타입에 정의 */
  memberId: number | null
  employeeNumber: string
  employeeName: string
  headOfficeName: string
  franchiseName: string | null
  storeName: string | null
}

// === 직원 선택 파라미터 ===
export type EmployeeTodoSelectPurpose = 'BROAD' | 'STRICT'

export interface EmployeeTodoSelectParams {
  purpose: EmployeeTodoSelectPurpose
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
}

// === 등록 ===
export interface EmployeeTodoCreateRequest {
  /** 미입력 시 서버가 employeeInfoId의 소속 본사를 자동 설정 */
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
  employeeInfoId: number
  content: string
  hasPeriod: boolean
  startDate: string
  endDate?: string
}

// === 수정 ===
export interface EmployeeTodoUpdateRequest {
  headOfficeId: number
  franchiseId?: number
  storeId?: number
  employeeInfoId: number
  content: string
  hasPeriod: boolean
  startDate: string
  endDate?: string
}
