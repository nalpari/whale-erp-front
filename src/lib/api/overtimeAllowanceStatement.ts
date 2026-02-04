import api from '../api'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID, DEFAULT_STORE_ID } from '../constants/organization'

// 연장근무 수당 상세 항목 타입
export interface OvertimeAllowanceItemDto {
  id?: number
  workDay: string
  workHour: number
  breakTimeHour: number
  contractTimelyAmount: number
  applyTimelyAmount: number
  expectedOvertimeHours?: number
  actualOvertimeHours: number
  overtimeStartTime?: string
  overtimeEndTime?: string
  deductionAmount: number
  actualPaymentAmount: number
  remarks?: string
}

// 연장근무 수당명세서 응답 타입 (리스트용)
export interface OvertimeAllowanceStatementResponse {
  id: number
  memberId: number
  memberName: string
  workStatus?: string
  headOfficeName?: string
  franchiseName?: string
  storeName?: string
  employeeClassification?: string
  workDays?: string
  allowanceYearMonth: string
  paymentDate?: string
  isEmailSend: boolean
  createdAt: string
}

// 연장근무 수당명세서 상세 응답 타입
export interface OvertimeAllowanceStatementDetailResponse {
  id: number
  memberId: number
  memberName: string
  allowanceYearMonth: string
  calculationStartDate: string
  calculationEndDate: string
  totalWorkDays: number
  totalOvertimeHours: number
  grossOvertimeAmount: number
  totalDeductionAmount: number
  totalAmount: number
  actualOvertimeAmount: number
  paymentDate?: string
  remarks?: string
  details: OvertimeAllowanceItemDto[]
  isEmailSend?: boolean
  createdAt?: string
  updatedAt?: string
  createdByName?: string
  updatedByName?: string
}

// 연장근무 수당명세서 리스트 응답 타입
export interface OvertimeAllowanceStatementListResponse {
  content: OvertimeAllowanceStatementResponse[]
  totalElements: number
  totalPages: number
  pageNumber: number
  pageSize: number
  isFirst: boolean
  isLast: boolean
  hasNext: boolean
}

// 연장근무 수당명세서 조회 파라미터
export interface GetOvertimeAllowanceStatementParams {
  page?: number
  size?: number
  headOfficeId?: number
  franchiseStoreId?: number
  storeId?: number
  workStatus?: string
  memberName?: string
  workDays?: string[]
  contractClassification?: string
  employeeClassification?: string
  allowanceYearMonth?: string
  calculationStartDate?: string
  calculationEndDate?: string
  paymentStartDate?: string
  paymentEndDate?: string
}

// 연장근무 수당명세서 목록 조회
export async function getOvertimeAllowanceStatements(params?: GetOvertimeAllowanceStatementParams): Promise<OvertimeAllowanceStatementListResponse> {
  const defaultParams = {
    headOfficeId: DEFAULT_HEAD_OFFICE_ID,
    franchiseStoreId: DEFAULT_FRANCHISE_ID,
    storeId: DEFAULT_STORE_ID,
    ...params
  }
  const response = await api.get<{ data: OvertimeAllowanceStatementListResponse }>(
    '/api/employee/payroll/overtime',
    { params: defaultParams }
  )

  if (!response.data?.data) {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: 0,
      pageSize: params?.size || 50,
      isFirst: true,
      isLast: true,
      hasNext: false
    }
  }

  return response.data.data
}

// 연장근무 수당명세서 상세 조회
export async function getOvertimeAllowanceStatement(id: number): Promise<OvertimeAllowanceStatementDetailResponse> {
  const response = await api.get<{ data: OvertimeAllowanceStatementDetailResponse }>(
    `/api/employee/payroll/overtime/${id}`
  )
  return response.data.data
}

// 일별 연장근무 시간 조회 파라미터
export interface GetDailyOvertimeHoursParams {
  headOfficeId?: number
  franchiseStoreId?: number
  storeId?: number
  employeeInfoId: number
  startDate: string
  endDate: string
}

// 일별 연장근무 시간 Summary 응답 타입
// Note: getDailyOvertimeHoursSummary를 사용하세요 (동일 엔드포인트, 올바른 응답 타입)
export interface DailyOvertimeRecord {
  date: string
  dayOfWeek: string
  dayOfWeekKorean: string
  overtimeHours: number
  overtimeStartTime?: string
  overtimeEndTime?: string
  contractTimelyAmount: number
  applyTimelyAmount: number
  paymentAmount: number
  deductionAmount: number
  totalAmount: number
}

export interface WeeklyOvertimeSubtotal {
  weekStartDate: string
  weekEndDate: string
  weekNumber: number
  totalOvertimeHours: number
  totalPaymentAmount: number
  totalDeductionAmount: number
  totalAmount: number
}

export type OvertimeHoursItemType = 'DAILY' | 'WEEKLY_SUBTOTAL'

export interface DailyOvertimeHoursItem {
  type: OvertimeHoursItemType
  dailyRecord?: DailyOvertimeRecord
  weeklySubtotal?: WeeklyOvertimeSubtotal
}

export interface DailyOvertimeHoursSummaryResponse {
  employeeInfoId: number
  memberId: number
  memberName: string
  startDate: string
  endDate: string
  applyTimelyAmount: number
  items: DailyOvertimeHoursItem[]
  grandTotalOvertimeHours: number
  grandTotalPaymentAmount: number
  grandTotalDeductionAmount: number
  grandTotalAmount: number
}

// 일별 연장근무 시간 Summary 조회
export async function getDailyOvertimeHoursSummary(params: GetDailyOvertimeHoursParams): Promise<DailyOvertimeHoursSummaryResponse | null> {
  const defaultParams = {
    headOfficeId: DEFAULT_HEAD_OFFICE_ID,
    franchiseStoreId: DEFAULT_FRANCHISE_ID,
    storeId: DEFAULT_STORE_ID,
    ...params
  }
  const response = await api.get<{ data: DailyOvertimeHoursSummaryResponse }>(
    '/api/employee/payroll/overtime/daily-overtime-hours',
    { params: defaultParams }
  )

  if (!response.data?.data) {
    return null
  }

  return response.data.data
}

// 연장근무 수당명세서 생성 요청 타입
export interface PostOvertimeAllowanceStatementRequest {
  employeeInfoId: number
  allowanceYearMonth: string
  calculationStartDate: string
  calculationEndDate: string
  paymentDate?: string
  remarks?: string
  details: OvertimeAllowanceItemDto[]
}

// 연장근무 수당명세서 수정 요청 타입
export interface PutOvertimeAllowanceStatementRequest {
  allowanceYearMonth: string
  calculationStartDate: string
  calculationEndDate: string
  paymentDate?: string
  remarks?: string
  details: OvertimeAllowanceItemDto[]
}

// 연장근무 수당명세서 생성
export async function createOvertimeAllowanceStatement(
  request: PostOvertimeAllowanceStatementRequest
): Promise<OvertimeAllowanceStatementDetailResponse> {
  const response = await api.post<{ data: OvertimeAllowanceStatementDetailResponse }>(
    '/api/employee/payroll/overtime',
    request
  )
  return response.data.data
}

// 연장근무 수당명세서 수정
export async function updateOvertimeAllowanceStatement(
  id: number,
  request: PutOvertimeAllowanceStatementRequest
): Promise<OvertimeAllowanceStatementDetailResponse> {
  const response = await api.put<{ data: OvertimeAllowanceStatementDetailResponse }>(
    `/api/employee/payroll/overtime/${id}`,
    request
  )
  return response.data.data
}

// 연장근무 수당명세서 삭제
export async function deleteOvertimeAllowanceStatement(id: number): Promise<void> {
  await api.delete(`/api/employee/payroll/overtime/${id}`)
}

// 연장근무 수당명세서 이메일 전송
export async function sendOvertimeAllowanceEmail(id: number): Promise<void> {
  await api.post(`/api/employee/payroll/overtime/${id}/send-email`)
}

// 연장근무 수당명세서 엑셀 다운로드
export async function downloadOvertimeAllowanceExcel(id: number): Promise<Blob> {
  const response = await api.get<Blob>(
    `/api/employee/payroll/overtime/${id}/download-excel`,
    { responseType: 'blob' }
  )
  return response.data
}
