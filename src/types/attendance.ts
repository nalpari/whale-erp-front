// 근태 기록 목록 항목 타입
export interface AttendanceListItem {
  contractId: number
  employeeId: number // 직원 ID
  workStatus: string // 근무여부 명
  officeName: string // 본사명
  officeId: number // 본사 ID
  franchiseName: string // 가맹점명
  franchiseId: number // 가맹점 ID
  storeName: string // 점포명
  storeId: number // 점포 ID
  employeeName: string // 직원 명
  employeeClassify: string // 직원 분류 
  contractClassify: string // 계약 분류
  workDay: string[] // 근무요일 코드 배열
}

// 근태 기록 목록 응답 타입
export interface AttendanceListResponse {
  content: AttendanceListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// 근태 기록 검색 파라미터
export interface AttendanceListParams {
  officeId?: number
  franchiseId?: number
  storeId?: number
  status?: string | null
  employeeName?: string | null
  dayType?: string[] | null
  employeeClassify?: string | null
  contractClassify?: string | null
  page?: number
  size?: number
}
