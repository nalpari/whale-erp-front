import api from '../api'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID, DEFAULT_STORE_ID } from '../constants/organization'

// 파트타이머 지급 항목 응답 타입
export interface PartTimerPaymentItemResponse {
  id: number
  workDay: string
  workHour: number
  breakTimeHour: number
  contractTimelyAmount: number
  applyTimelyAmount: number
  totalAmount: number
  deductionAmount: number
  remarks?: string
}

// 주휴수당 항목 응답 타입
export interface WeeklyPaidHolidayAllowanceResponse {
  id: number
  workWeek: number
  workTime: number
  applyTimelyAmount: number
  totalAmount: number
  deductionAmount: number
  netAmount: number
  remarks?: string
  weekStartDate?: string
  weekEndDate?: string
  isCrossMonth: boolean
}

// 파트타이머 급여 명세서 응답 타입 (리스트용)
export interface PartTimerPayrollStatementListItem {
  id: number
  memberId: number
  memberName: string
  workStatus?: string
  headOfficeName?: string
  franchiseName?: string
  storeName?: string
  employeeClassification?: string
  payrollYearMonth: string
  paymentDate: string
  workDays?: string
  isEmailSend: boolean
  createdAt: string
}

// 파트타이머 급여 명세서 응답 타입 (상세용)
export interface PartTimerPayrollStatementResponse {
  id: number
  memberId: number
  memberName: string
  payrollYearMonth: string
  settlementStartDate: string
  settlementEndDate: string
  paymentDate: string
  totalAmount: number
  totalDeductionAmount: number
  actualPaymentAmount: number
  remarks?: string
  isEmailSend: boolean
  paymentItems: PartTimerPaymentItemResponse[]
  weeklyPaidHolidayAllowances: WeeklyPaidHolidayAllowanceResponse[]
  createdAt?: string
  updatedAt?: string
  createdByName?: string
  updatedByName?: string
}

// 파트타이머 급여 명세서 리스트 응답 타입
export interface PartTimerPayrollStatementListResponse {
  content: PartTimerPayrollStatementListItem[]
  totalElements: number
  totalPages: number
  pageNumber: number
  pageSize: number
  isFirst: boolean
  isLast: boolean
  hasNext: boolean
}

// 파트타이머 급여 명세서 조회 파라미터
export interface GetPartTimerPayrollStatementParams {
  page?: number
  size?: number
  headOfficeId?: number
  franchiseStoreId?: number
  storeId?: number
  workStatus?: string
  memberName?: string
  workDays?: string[]
  memberId?: number
  payrollYearMonth?: string
  startDate?: string
  endDate?: string
}

// 파트타이머 급여 명세서 목록 조회
export async function getPartTimerPayrollStatements(params?: GetPartTimerPayrollStatementParams): Promise<PartTimerPayrollStatementListResponse> {
  const defaultParams = {
    headOfficeId: DEFAULT_HEAD_OFFICE_ID,
    franchiseStoreId: DEFAULT_FRANCHISE_ID,
    storeId: DEFAULT_STORE_ID,
    ...params
  }
  const response = await api.get<{ data: PartTimerPayrollStatementListResponse }>(
    '/api/employee/payroll/parttime',
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

// 파트타이머 급여 명세서 상세 조회
export async function getPartTimerPayrollStatement(id: number): Promise<PartTimerPayrollStatementResponse> {
  const response = await api.get<{ data: PartTimerPayrollStatementResponse }>(
    `/api/employee/payroll/parttime/${id}`
  )
  return response.data.data
}

// 일별 근무 기록 타입
export interface DailyWorkRecord {
  date: string
  dayOfWeek: string
  dayOfWeekKorean: string
  workHours: number
  applyTimelyAmount: number
  paymentAmount: number
  deductionAmount: number
  totalAmount: number
}

// 주간 소계 타입
export interface WeeklySubtotal {
  weekStartDate: string
  weekEndDate: string
  weekNumber: number
  totalWorkHours: number
  totalPaymentAmount: number
  totalDeductionAmount: number
  totalAmount: number
}

// 주휴수당 타입
export interface WeeklyHolidayAllowance {
  weekStartDate: string
  weekEndDate: string
  weekNumber: number
  totalWorkHours: number
  holidayAllowanceHours: number
  applyTimelyAmount: number
  holidayAllowanceAmount: number
  deductionAmount: number
  totalAmount: number
  isEligible: boolean
}

// 주간 합계 타입
export interface WeeklyTotal {
  weekStartDate: string
  weekEndDate: string
  weekNumber: number
  totalWorkHours: number
  applyTimelyAmount: number
  totalPaymentAmount: number
  totalDeductionAmount: number
  totalAmount: number
}

// 일별 근무시간 항목 타입
export type WorkHoursItemType = 'DAILY' | 'WEEKLY_SUBTOTAL' | 'WEEKLY_HOLIDAY_ALLOWANCE' | 'WEEKLY_TOTAL'

// 일별 근무시간 응답 항목
export interface DailyWorkHoursItem {
  type: WorkHoursItemType
  dailyRecord?: DailyWorkRecord
  weeklySubtotal?: WeeklySubtotal
  weeklyHolidayAllowance?: WeeklyHolidayAllowance
  weeklyTotal?: WeeklyTotal
}

// 계약서 시급 정보
export interface ContractHourlyWageInfo {
  weekDayHourlyWage: number
  overtimeHourlyWage: number
  holidayHourlyWage: number
}

// 일별 근무시간 조회 전체 응답
export interface DailyWorkHoursSummaryResponse {
  memberId: number
  memberName: string
  startDate: string
  endDate: string
  applyTimelyAmount: number
  contractHourlyWageInfo: ContractHourlyWageInfo
  items: DailyWorkHoursItem[]
  grandTotalWorkHours: number
  grandTotalPaymentAmount: number
  grandTotalDeductionAmount: number
  grandTotalAmount: number
  previousMonthWorkHours: number  // 첫 주 이전 달 근무시간 (월 경계 주휴수당 계산용)
  previousMonthWorkStartDate?: string  // 이전 달 근무 시작일
  previousMonthWorkEndDate?: string    // 이전 달 근무 종료일
}

// 일별 근무 시간 조회 파라미터
export interface GetDailyWorkHoursParams {
  headOfficeId?: number
  franchiseStoreId?: number
  storeId?: number
  employeeInfoId: number
  startDate: string
  endDate: string
}

// 일별 근무 시간 조회
export async function getDailyWorkHours(params: GetDailyWorkHoursParams): Promise<DailyWorkHoursSummaryResponse | null> {
  const defaultParams = {
    headOfficeId: DEFAULT_HEAD_OFFICE_ID,
    franchiseStoreId: DEFAULT_FRANCHISE_ID,
    storeId: DEFAULT_STORE_ID,
    ...params
  }
  const response = await api.get<{ data: DailyWorkHoursSummaryResponse }>(
    '/api/employee/payroll/parttime/daily-work-hours',
    { params: defaultParams }
  )

  if (!response.data?.data) {
    return null
  }

  return response.data.data
}

// 파트타이머 급여 명세서 삭제
export async function deletePartTimerPayrollStatement(id: number): Promise<void> {
  await api.delete(`/api/employee/payroll/parttime/${id}`)
}

// 파트타이머 급여 명세서 이메일 전송
export async function sendPartTimerPayrollEmail(id: number): Promise<void> {
  await api.post(`/api/employee/payroll/parttime/${id}/send-email`)
}

// 파트타이머 급여 명세서 엑셀 다운로드
export async function downloadPartTimerPayrollExcel(id: number): Promise<Blob> {
  const response = await api.get(`/api/employee/payroll/parttime/${id}/download-excel`, {
    responseType: 'blob'
  })
  return response.data
}

// 파트타이머 지급 항목 요청 타입
export interface PartTimerPaymentItemRequest {
  workDay: string // YYYY-MM-DD
  workHour: number
  breakTimeHour: number
  contractTimelyAmount: number
  applyTimelyAmount: number
  totalAmount: number
  deductionAmount?: number
  remarks?: string
}

// 파트타이머 공제 항목 요청 타입
export interface PartTimerDeductionItemRequest {
  itemCode: string
  itemOrder: number
  amount: number
  remarks?: string
}

// 파트타이머 급여 명세서 생성 요청 타입
export interface CreatePartTimerPayrollStatementRequest {
  employeeInfoId: number
  payrollYearMonth: string // YYYYMM
  settlementStartDate: string // YYYY-MM-DD
  settlementEndDate: string // YYYY-MM-DD
  paymentDate: string // YYYY-MM-DD
  remarks?: string
  paymentItems: PartTimerPaymentItemRequest[]
  deductionItems?: PartTimerDeductionItemRequest[]
}

// 파트타이머 급여 명세서 생성
export async function createPartTimerPayrollStatement(
  request: CreatePartTimerPayrollStatementRequest
): Promise<PartTimerPayrollStatementResponse> {
  const response = await api.post<{ data: PartTimerPayrollStatementResponse }>(
    '/api/employee/payroll/parttime',
    request
  )
  return response.data.data
}
