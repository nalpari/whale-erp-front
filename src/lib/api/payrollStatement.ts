import api from '../api'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID, DEFAULT_STORE_ID } from '../constants/organization'

// 지급 항목 타입
export interface PaymentItemDto {
  id?: number
  itemCode: string
  itemOrder: number
  amount: number
  remarks?: string
}

// 공제 항목 타입
export interface DeductionItemDto {
  id?: number
  itemCode: string
  itemOrder: number
  amount: number
  remarks?: string
}

// 상여금 타입
export interface PayrollBonusDto {
  id?: number
  bonusType: string
  amount: number
  memo?: string
}

// 급여 명세서 응답 타입
export interface PayrollStatementResponse {
  id: number
  memberId: number
  memberName: string
  payrollYearMonth: string
  settlementStartDate: string
  settlementEndDate: string
  paymentDate: string
  totalPaymentAmount: number
  totalDeductionAmount: number
  actualPaymentAmount: number
  attachmentFileId?: number
  remarks?: string
  isEmailSend: boolean
  paymentItems: PaymentItemDto[]
  deductionItems: DeductionItemDto[]
  bonuses: PayrollBonusDto[]
  // 추가 필드 (리스트용)
  headOfficeName?: string
  franchiseName?: string
  storeName?: string
  workStatus?: string
  contractClassification?: string
  employeeClassification?: string
  // 등록/수정 이력
  createdAt?: string
  updatedAt?: string
  createdByName?: string
  updatedByName?: string
}

// 급여 명세서 리스트 응답 타입
export interface PayrollStatementListResponse {
  content: PayrollStatementResponse[]
  totalElements: number
  totalPages: number
  pageNumber: number
  pageSize: number
  isFirst: boolean
  isLast: boolean
  hasNext: boolean
}

// 급여 명세서 조회 파라미터
export interface GetPayrollStatementParams {
  page?: number
  size?: number
  headOfficeId?: number
  franchiseStoreId?: number
  storeId?: number
  workStatus?: string
  memberName?: string
  contractClassification?: string
  employeeClassification?: string
  memberId?: number
  payrollYearMonth?: string
  paymentStartDate?: string
  paymentEndDate?: string
  isEmailSend?: boolean
  isDelete?: boolean
}

// 급여 명세서 목록 조회
export async function getPayrollStatements(params?: GetPayrollStatementParams): Promise<PayrollStatementListResponse> {
  const defaultParams = {
    headOfficeId: DEFAULT_HEAD_OFFICE_ID,
    franchiseStoreId: DEFAULT_FRANCHISE_ID,
    storeId: DEFAULT_STORE_ID,
    ...params
  }
  const response = await api.get<{ data: PayrollStatementListResponse }>(
    '/api/employee/payroll/regular',
    { params: defaultParams }
  )

  // API 응답이 없는 경우 빈 응답 반환
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

// 급여 명세서 상세 조회
export async function getPayrollStatement(id: number): Promise<PayrollStatementResponse> {
  const response = await api.get<{ data: PayrollStatementResponse }>(
    `/api/employee/payroll/regular/${id}`
  )
  return response.data.data
}

// 중복 직원 정보 타입
export interface DuplicateEmployeeInfo {
  employeeNumber: string
  employeeName: string
}

// 급여 명세서 엑셀 업로드 응답 타입
export interface PayrollExcelUploadResponse {
  totalRows: number
  successCount: number
  failedCount: number
  successIds: number[]
  failures: {
    rowNumber: number
    employeeNumber: string | null
    employeeName: string | null
    errorCode: string
    errorMessage: string
  }[]
  hasDuplicates: boolean
  duplicateEmployees: DuplicateEmployeeInfo[]
}

// 급여 명세서 엑셀 다운로드
export async function downloadPayrollExcel(id: number): Promise<Blob> {
  const response = await api.get(`/api/employee/payroll/regular/${id}/download-excel`, {
    responseType: 'blob'
  })
  return response.data
}

// 급여 명세서 이메일 전송
export async function sendPayrollEmail(id: number): Promise<void> {
  await api.post(`/api/employee/payroll/regular/${id}/send-email`)
}

// 급여 명세서 수정 요청 타입
export interface UpdatePayrollStatementRequest {
  payrollYearMonth: string
  settlementStartDate: string
  settlementEndDate: string
  paymentDate: string
  attachmentFileId?: number
  remarks?: string
  paymentItems: PaymentItemDto[]
  deductionItems: DeductionItemDto[]
}

// 급여 명세서 수정
export async function updatePayrollStatement(id: number, request: UpdatePayrollStatementRequest): Promise<void> {
  await api.put(`/api/employee/payroll/regular/${id}`, request)
}

// 급여 명세서 삭제
export async function deletePayrollStatement(id: number): Promise<void> {
  await api.delete(`/api/employee/payroll/regular/${id}`)
}

// 급여 명세서 생성 요청 타입
export interface CreatePayrollStatementRequest {
  employeeInfoId: number
  payrollYearMonth: string
  settlementStartDate: string
  settlementEndDate: string
  paymentDate: string
  remarks?: string
  paymentItems: PaymentItemDto[]
  deductionItems: DeductionItemDto[]
}

// 급여 명세서 생성
export async function createPayrollStatement(
  request: CreatePayrollStatementRequest,
  attachmentFile?: File
): Promise<PayrollStatementResponse> {
  const formData = new FormData()

  // JSON 필드를 개별적으로 추가 (Multipart/form-data 방식)
  formData.append('employeeInfoId', String(request.employeeInfoId))
  formData.append('payrollYearMonth', request.payrollYearMonth)
  formData.append('settlementStartDate', request.settlementStartDate)
  formData.append('settlementEndDate', request.settlementEndDate)
  formData.append('paymentDate', request.paymentDate)
  if (request.remarks) {
    formData.append('remarks', request.remarks)
  }

  // attachmentFile이 있으면 파일만 전송, 없으면 지급/공제 항목 전송
  if (attachmentFile) {
    formData.append('attachmentFile', attachmentFile)
  } else {
    // 지급/공제 항목을 개별 필드로 추가
    request.paymentItems.forEach((item, index) => {
      formData.append(`paymentItems[${index}].itemCode`, item.itemCode)
      formData.append(`paymentItems[${index}].itemOrder`, String(item.itemOrder))
      formData.append(`paymentItems[${index}].amount`, String(item.amount))
      if (item.remarks) {
        formData.append(`paymentItems[${index}].remarks`, item.remarks)
      }
    })

    request.deductionItems.forEach((item, index) => {
      formData.append(`deductionItems[${index}].itemCode`, item.itemCode)
      formData.append(`deductionItems[${index}].itemOrder`, String(item.itemOrder))
      formData.append(`deductionItems[${index}].amount`, String(item.amount))
      if (item.remarks) {
        formData.append(`deductionItems[${index}].remarks`, item.remarks)
      }
    })
  }

  const response = await api.post<{ data: PayrollStatementResponse }>(
    '/api/employee/payroll/regular',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data.data
}

// 급여 명세서 엑셀 업로드
export async function uploadPayrollExcel(
  file: File,
  payrollYearMonth: string,
  overwrite: boolean = false
): Promise<PayrollExcelUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('payrollYearMonth', payrollYearMonth)
  formData.append('overwrite', String(overwrite))
  const response = await api.post<{ data: PayrollExcelUploadResponse }>(
    '/api/employee/payroll/regular/upload-excel',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data.data
}

// 이전 급여 정보 응답 타입
export interface LatestPayrollResponse {
  payrollYearMonth: string
  paymentItems: PaymentItemDto[]
  deductionItems: DeductionItemDto[]
}

// 이전 급여 정보 조회
export async function getLatestPayroll(employeeInfoId: number): Promise<{ data: LatestPayrollResponse | null; message: string }> {
  const response = await api.get<{ data: LatestPayrollResponse | null; message: string }>(
    `/api/employee/payroll/regular/employee/${employeeInfoId}/latest`
  )
  return response.data
}
