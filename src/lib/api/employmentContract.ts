import api from '../api'
const DEFAULT_HEAD_OFFICE_ID = 1
const DEFAULT_FRANCHISE_ID = 2
const DEFAULT_STORE_ID = 1

// 계약서 파일 정보 타입
export interface ContractFileInfo {
  fileId: number
  fileName: string
  downloadUrl: string
}

// 근로 계약 응답 타입
export interface EmploymentContractResponse {
  id: number
  member?: {
    id: number
    name: string
    loginId?: string
    email?: string
    employeeNumber?: string
  } | null
  employeeInfoId?: number | null
  employeeInfoName?: string | null
  headOfficeOrganizationId?: number | null
  headOfficeOrganizationName?: string | null
  franchiseOrganizationId?: number | null
  franchiseOrganizationName?: string | null
  storeId?: number | null
  storeName?: string | null
  workStatus?: string | null
  workStatusName?: string | null
  employmentContractHeader?: {
    id: number
    contractType?: string
    contractTypeName?: string
    electronicContractStatus?: string
    contractClassification: string
    contractClassificationName?: string
    nationalPensionEnrolled: boolean
    healthInsuranceEnrolled: boolean
    employmentInsuranceEnrolled: boolean
    workersCompensationEnrolled: boolean
    salaryCycle: string
    salaryCycleName?: string
    salaryMonth: string
    salaryMonthName?: string
    salaryDay: number
    contractStartDate: string
    contractEndDate?: string
    contractDate?: string | null
    jobDescription: string
    workContractFileId?: number | null
    workContractFile?: ContractFileInfo | null
    wageContractFileId?: number | null
    wageContractFile?: ContractFileInfo | null
  }
  workHours?: {
    id: number
    dayType: string
    isWork: boolean
    isBreak: boolean
    everySaturdayWork: boolean
    firstSaturdayWorkDay?: number
    everySundayWork: boolean
    firstSundayWorkDay?: number
    workStartTime?: string
    workEndTime?: string
    breakStartTime?: string
    breakEndTime?: string
  }[]
  salaryInfo?: {
    id: number
    annualSalary: number
    monthlyTotalSalary: number
    timelySalary: number
    monthlyTime: number
    monthlyBaseSalary: number
    monthlyOvertimeAllowanceTime?: number
    monthlyOvertimeAllowance?: number
    monthlyNightAllowanceTime?: number
    monthlyNightAllowance?: number
    monthlyHolidayAllowanceTime?: number
    monthlyHolidayAllowance?: number
    monthlyAddHolidayAllowanceTime?: number
    monthlyAddHolidayAllowance?: number
    mealAllowance?: number
    vehicleAllowance?: number
    childcareAllowance?: number
    // 비포괄연봉제 추가근무시급
    weekDayAllowance?: number
    overtimeDayAllowance?: number
    nightDayAllowance?: number  // 야간근무 시급
    holidayAllowanceTime?: number  // 휴일근무 시급
    bonuses?: {
      id: number
      bonusType: string
      amount: number
      memo?: string
    }[]
  }
  createdAt: string
  updatedAt: string
}

// 근로 계약 목록 응답 타입
export interface EmploymentContractListResponse {
  content: EmploymentContractResponse[]
  totalElements: number
  totalPages: number
  pageNumber: number
  pageSize: number
  isFirst: boolean
  isLast: boolean
  hasNext: boolean
}

// 근로 계약 조회 파라미터
export interface GetEmploymentContractParams {
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
  electronicContract?: string[]  // ["Y", "N"] 형식
  salaryStartDt?: string
  salaryEndDt?: string
  contractStartDt?: string
  contractEndDt?: string
  isDeleted?: boolean
}

// 근로 계약 목록 조회
export async function getEmploymentContracts(params?: GetEmploymentContractParams): Promise<EmploymentContractListResponse> {
  const defaultParams = {
    headOfficeId: DEFAULT_HEAD_OFFICE_ID,
    franchiseId: DEFAULT_FRANCHISE_ID,
    storeId: DEFAULT_STORE_ID,
    ...params
  }
  const response = await api.get<EmploymentContractListResponse>(
    '/api/employee/contract',
    { params: defaultParams }
  )

  // API 응답이 없는 경우 빈 응답 반환
  if (!response.data) {
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

  return response.data
}

// 근로 계약 상세 조회
export async function getEmploymentContract(id: number): Promise<EmploymentContractResponse> {
  const response = await api.get<{ data: EmploymentContractResponse }>(
    `/api/employee/contract/${id}`
  )
  return response.data.data
}

// 직원 정보 ID로 근로 계약 목록 조회
export async function getEmploymentContractsByEmployeeInfoId(employeeInfoId: number): Promise<EmploymentContractResponse[]> {
  const response = await api.get<{ data: EmploymentContractResponse[] }>(
    `/api/employee/contract/by-employee-info/${employeeInfoId}`
  )
  return response.data.data
}

// ==================== 수정 API ====================

// Header 수정 요청 타입
export interface UpdateEmploymentContractHeaderRequest {
  contractType?: string  // ELECTRONIC, PAPER
  electronicContractStatus?: string  // WRITING, PROGRESS, COMPLETE, REFUSAL
  contractClassification: string  // COMPREHENSIVE_ANNUAL, MONTHLY, HOURLY 등
  nationalPensionEnrolled: boolean
  healthInsuranceEnrolled: boolean
  employmentInsuranceEnrolled: boolean
  workersCompensationEnrolled: boolean
  salaryCycle: string  // SLRCC_001: 시급, SLRCC_002: 월급
  salaryMonth: string  // SLRCF_001: 당월, SLRCF_002: 익월
  salaryDay: number
  contractStartDate: string  // YYYY-MM-DD
  contractEndDate?: string | null
  contractDate?: string | null
  jobDescription: string
  workContractFileId?: number | null
  wageContractFileId?: number | null
}

// Header 수정 요청 (파일 포함) 타입
export interface UpdateEmploymentContractHeaderWithFilesRequest {
  data: UpdateEmploymentContractHeaderRequest
  workContractFile?: File | null
  wageContractFile?: File | null
}

// 급여 정보 수정 요청 타입
export interface UpdateEmploymentContractSalaryInfoRequest {
  id: number  // 필수 - salaryInfoId
  annualAmount: number
  monthlyTotalAmount: number
  timelyAmount: number
  monthlyTime: number
  monthlyBaseAmount: number
  monthlyOvertimeAllowanceTime?: number
  monthlyOvertimeAllowanceAmount?: number
  monthlyNightAllowanceTime?: number
  monthlyNightAllowanceAmount?: number
  monthlyHolidayAllowanceTime?: number
  monthlyHolidayAllowanceAmount?: number
  monthlyAddHolidayAllowanceTime?: number
  monthlyAddHolidayAllowanceAmount?: number
  mealAllowanceAmount?: number
  vehicleAllowanceAmount?: number
  childcareAllowanceAmount?: number
  // 비포괄연봉제 추가근무시급
  weekDayAllowanceAmount?: number
  overtimeDayAllowanceAmount?: number
  nightDayAllowanceAmount?: number  // 야간근무 시급
  holidayAllowanceTimeAmount?: number  // 휴일근무 시급
  bonuses?: {
    id?: number
    bonusType: string
    amount: number
    memo?: string
  }[]
}

// 급여 정보 생성 요청 타입
export interface CreateEmploymentContractSalaryInfoRequest {
  contractId: number  // 필수 - 근로계약 ID
  annualAmount: number
  monthlyTotalAmount: number
  timelyAmount: number
  monthlyTime: number
  monthlyBaseAmount: number
  monthlyOvertimeAllowanceTime?: number
  monthlyOvertimeAllowanceAmount?: number
  monthlyNightAllowanceTime?: number
  monthlyNightAllowanceAmount?: number
  monthlyHolidayAllowanceTime?: number
  monthlyHolidayAllowanceAmount?: number
  monthlyAddHolidayAllowanceTime?: number
  monthlyAddHolidayAllowanceAmount?: number
  mealAllowanceAmount?: number
  vehicleAllowanceAmount?: number
  childcareAllowanceAmount?: number
  // 비포괄연봉제 추가근무시급
  weekDayAllowanceAmount?: number
  overtimeDayAllowanceAmount?: number
  nightDayAllowanceAmount?: number  // 야간근무 시급
  holidayAllowanceTimeAmount?: number  // 휴일근무 시급
  bonuses?: {
    bonusType: string
    amount: number
    memo?: string
  }[]
}

// 근무 시간 등록 요청 타입
export interface WorkHourDto {
  dayType: string  // WEEKDAY, MONDAY, TUESDAY, ..., SATURDAY, SUNDAY
  isWork: boolean
  isBreak: boolean
  everySaturdayWork?: boolean
  firstSaturdayWorkDay?: string | null
  everySundayWork?: boolean
  firstSundayWorkDay?: string | null
  workStartTime?: string  // HH:mm:ss
  workEndTime?: string
  breakStartTime?: string
  breakEndTime?: string
}

export interface CreateEmploymentContractWorkHoursRequest {
  contractId: number
  workHours: WorkHourDto[]
}

// ==================== 신규 생성 API ====================

// Header 생성 요청 타입
export interface CreateEmploymentContractHeaderRequest {
  // 소속 정보 (필수)
  headOfficeOrganizationId: number
  franchiseOrganizationId?: number | null
  storeId?: number | null
  // 직원 정보 (필수)
  employeeInfoId: number
  // 계약 정보
  contractType?: string  // ECNT_001: 전자계약, ECNT_002: 서류계약
  electronicContractStatus?: string  // WRITING, PROGRESS, COMPLETE, REFUSAL
  contractClassification: string  // CNTCFWK_001, CNTCFWK_002, CNTCFWK_003
  nationalPensionEnrolled: boolean
  healthInsuranceEnrolled: boolean
  employmentInsuranceEnrolled: boolean
  workersCompensationEnrolled: boolean
  salaryCycle: string  // SLRCC_001: 시급, SLRCC_002: 월급
  salaryMonth: string  // SLRCF_001: 당월, SLRCF_002: 익월
  salaryDay: number
  contractStartDate: string  // YYYY-MM-DD
  contractEndDate?: string | null
  contractDate?: string | null
  jobDescription: string
}

// Header 생성 요청 (파일 포함) 타입
export interface CreateEmploymentContractHeaderWithFilesRequest {
  data: CreateEmploymentContractHeaderRequest
  workContractFile?: File | null
  wageContractFile?: File | null
}

// Header 생성 응답 타입
export interface CreateEmploymentContractHeaderResponse {
  id: number
}

// Header 정보 생성 (JSON만 - 파일 없을 때)
export async function createEmploymentContractHeader(
  data: CreateEmploymentContractHeaderRequest
): Promise<CreateEmploymentContractHeaderResponse> {
  const response = await api.post<{ data: CreateEmploymentContractHeaderResponse }>(
    '/api/employee/contract/header',
    data
  )
  return response.data.data
}

// Header 정보 생성 (파일 포함 - multipart/form-data)
export async function createEmploymentContractHeaderWithFiles(
  request: CreateEmploymentContractHeaderWithFilesRequest
): Promise<CreateEmploymentContractHeaderResponse> {
  const formData = new FormData()
  const data = request.data

  // 소속 정보
  formData.append('headOfficeOrganizationId', String(data.headOfficeOrganizationId))
  if (data.franchiseOrganizationId) formData.append('franchiseOrganizationId', String(data.franchiseOrganizationId))
  if (data.storeId) formData.append('storeId', String(data.storeId))

  // 직원 정보
  formData.append('employeeInfoId', String(data.employeeInfoId))

  // 계약 정보
  if (data.contractType) formData.append('contractType', data.contractType)
  if (data.electronicContractStatus) formData.append('electronicContractStatus', data.electronicContractStatus)
  formData.append('contractClassification', data.contractClassification)
  formData.append('nationalPensionEnrolled', String(data.nationalPensionEnrolled))
  formData.append('healthInsuranceEnrolled', String(data.healthInsuranceEnrolled))
  formData.append('employmentInsuranceEnrolled', String(data.employmentInsuranceEnrolled))
  formData.append('workersCompensationEnrolled', String(data.workersCompensationEnrolled))
  formData.append('salaryCycle', data.salaryCycle)
  formData.append('salaryMonth', data.salaryMonth)
  formData.append('salaryDay', String(data.salaryDay))
  formData.append('contractStartDate', data.contractStartDate)
  if (data.contractEndDate) formData.append('contractEndDate', data.contractEndDate)
  if (data.contractDate) formData.append('contractDate', data.contractDate)
  formData.append('jobDescription', data.jobDescription)

  // 파일 첨부
  if (request.workContractFile) {
    formData.append('workContractFile', request.workContractFile)
  }
  if (request.wageContractFile) {
    formData.append('wageContractFile', request.wageContractFile)
  }

  const response = await api.post<{ data: CreateEmploymentContractHeaderResponse }>(
    '/api/employee/contract/header',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data.data
}

// Header 정보 수정 (JSON만 - 파일 없을 때)
export async function updateEmploymentContractHeader(
  headerId: number,
  data: UpdateEmploymentContractHeaderRequest
): Promise<void> {
  await api.put(`/api/employee/contract/header/${headerId}`, data)
}

// Header 정보 수정 (파일 포함 - multipart/form-data)
// 백엔드 @ModelAttribute 방식으로 개별 필드 전송
export async function updateEmploymentContractHeaderWithFiles(
  headerId: number,
  request: UpdateEmploymentContractHeaderWithFilesRequest
): Promise<void> {
  const formData = new FormData()
  const data = request.data

  // 개별 필드를 FormData에 추가 (Spring @ModelAttribute 호환)
  formData.append('headerId', headerId.toString())
  if (data.contractType) formData.append('contractType', data.contractType)
  if (data.electronicContractStatus) formData.append('electronicContractStatus', data.electronicContractStatus)
  formData.append('contractClassification', data.contractClassification)
  formData.append('nationalPensionEnrolled', String(data.nationalPensionEnrolled))
  formData.append('healthInsuranceEnrolled', String(data.healthInsuranceEnrolled))
  formData.append('employmentInsuranceEnrolled', String(data.employmentInsuranceEnrolled))
  formData.append('workersCompensationEnrolled', String(data.workersCompensationEnrolled))
  formData.append('salaryCycle', data.salaryCycle)
  formData.append('salaryMonth', data.salaryMonth)
  formData.append('salaryDay', String(data.salaryDay))
  formData.append('contractStartDate', data.contractStartDate)
  if (data.contractEndDate) formData.append('contractEndDate', data.contractEndDate)
  if (data.contractDate) formData.append('contractDate', data.contractDate)
  formData.append('jobDescription', data.jobDescription)

  // 기존 파일 ID 유지 (새 파일이 없을 때)
  if (data.workContractFileId) formData.append('workContractFileId', String(data.workContractFileId))
  if (data.wageContractFileId) formData.append('wageContractFileId', String(data.wageContractFileId))

  // 파일 첨부 (새 파일이 있을 때)
  if (request.workContractFile) {
    formData.append('workContractFile', request.workContractFile)
  }
  if (request.wageContractFile) {
    formData.append('wageContractFile', request.wageContractFile)
  }

  await api.put(`/api/employee/contract/header/${headerId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 급여 정보 수정
export async function updateEmploymentContractSalaryInfo(
  salaryInfoId: number,
  data: UpdateEmploymentContractSalaryInfoRequest
): Promise<void> {
  await api.put(`/api/employee/contract/salary-info/${salaryInfoId}`, data)
}

// 급여 정보 생성
export async function createEmploymentContractSalaryInfo(
  data: CreateEmploymentContractSalaryInfoRequest
): Promise<void> {
  await api.post('/api/employee/contract/salary-info', data)
}

// 근무 시간 등록 (기존 데이터 삭제 후 새로 등록)
export async function createEmploymentContractWorkHours(
  data: CreateEmploymentContractWorkHoursRequest
): Promise<void> {
  await api.post('/api/employee/contract/work-hours', data)
}
