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

// 일별 출퇴근 기록 항목
export interface AttendanceRecordItem {
  recordId: number | null
  date: string // YYYY-MM-DD
  day: string // 월요일, 화요일, ...
  isHoliday: boolean
  contractStartTime: string | null // 계약 출근시간 (HH:mm:ss)
  contractEndTime: string | null // 계약 퇴근시간 (HH:mm:ss)
  workStartTime: string | null // 실제 출근시간 (HH:mm:ss)
  workEndTime: string | null // 실제 퇴근시간 (HH:mm:ss)
}

// 출퇴근 기록 상세 응답
export interface AttendanceRecordResponse {
  officeId: number
  officeName: string
  franchiseId: number | null
  franchiseName: string | null
  storeId: number
  storeName: string
  employeeId: number
  employeeName: string
  employeeNumber: string | null
  dateFrom: string
  dateEnd: string
  record: AttendanceRecordItem[]
}

// 출퇴근 기록 상세 조회 파라미터
export interface AttendanceRecordParams {
  officeId: number
  franchiseId?: number
  storeId?: number
  employeeId: number
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
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
