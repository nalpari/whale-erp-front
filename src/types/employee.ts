// 근무처 유형
export type WorkplaceType = 'HEAD_OFFICE' | 'FRANCHISE'

// 계약 분류 유형
export type ContractClassificationType = 'CNTCFWK_001' | 'CNTCFWK_002' | 'CNTCFWK_003'

// 급여 주기
export type SalaryCycle = 'SLRCC_001' | 'SLRCC_002'

// 급여 지급 월
export type SalaryMonth = 'SLRCF_001' | 'SLRCF_002'

// 요일 유형
export type DayType =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'
  | 'WEEKDAY'
  | 'WEEKEND'

// 근무 시간 정보 DTO
export interface EmploymentContractWorkHourDto {
  workHourId?: number | null
  dayType: DayType
  isWork: boolean
  isBreak: boolean
  everySaturdayWork?: boolean
  firstSaturdayWorkDay?: string | null
  everySundayWork?: boolean
  firstSundayWorkDay?: string | null
  workStartTime?: string | null // HH:mm:ss
  workEndTime?: string | null // HH:mm:ss
  breakStartTime?: string | null // HH:mm:ss
  breakEndTime?: string | null // HH:mm:ss
}

// 직원 등록 요청 DTO
export interface PostEmployeeInfoRequest {
  // 기본 정보
  workplaceType: WorkplaceType
  headOfficeOrganizationId: number
  franchiseOrganizationId?: number | null
  storeId?: number | null
  employeeName: string
  mobilePhone?: string | null
  hireDate: string // YYYY-MM-DD

  // 계약 정보
  contractClassification: ContractClassificationType
  nationalPensionEnrolled?: boolean
  healthInsuranceEnrolled?: boolean
  employmentInsuranceEnrolled?: boolean
  workersCompensationEnrolled?: boolean
  salaryCycle: SalaryCycle
  salaryMonth: SalaryMonth
  salaryDay: number
  contractStartDate: string // YYYY-MM-DD
  contractEndDate: string // YYYY-MM-DD
  jobDescription?: string | null

  // 근무 시간 정보
  workHours: EmploymentContractWorkHourDto[]
}

// 직원 상세 조회 응답 DTO (GET /api/employee/info/{id})
export interface EmployeeInfoDetailResponse {
  id: number
  memberId?: number | null
  memberLoginId?: string | null
  memberAuthorityNames?: string[] | null
  memberCreatedAt?: string | null
  workplaceType: WorkplaceType
  headOfficeOrganizationId: number
  headOfficeOrganizationName?: string | null
  franchiseOrganizationId?: number | null
  franchiseOrganizationName?: string | null
  storeId?: number | null
  storeName?: string | null
  employeeName: string
  employeeNumber: string
  workStatus?: string | null
  workStatusName?: string | null
  birthDate?: string | null
  mobilePhone?: string | null
  emergencyContact?: string | null
  email?: string | null
  zipCode?: string | null
  address?: string | null
  addressDetail?: string | null
  // 직원 분류 및 계약 정보
  employeeClassification?: string | null
  employeeClassificationName?: string | null
  contractClassification?: string | null
  contractClassificationName?: string | null
  rank?: string | null
  rankName?: string | null
  position?: string | null
  positionName?: string | null
  hireDate?: string | null
  resignationDate?: string | null
  resignationReason?: string | null
  // 급여 계좌 정보
  salaryBank?: string | null
  salaryAccountNumber?: string | null
  salaryAccountHolder?: string | null
  // 파일 ID
  residentRegistrationFileId?: number | null
  familyRelationFileId?: number | null
  healthCheckFileId?: number | null
  healthCheckExpiryDate?: string | null
  resumeFileId?: number | null
  // 기타
  memo?: string | null
  iconType?: number | null
  isEmailSend?: boolean | null
  emailSendDate?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  createdByName?: string | null
  updatedByName?: string | null
}
export type EmployeeInfoListResponse = {
  employeeInfoId: number
  memberId: number
  rowNumber: number
  workStatus?: string | null
  workStatusName?: string | null
  headOfficeOrganizationName: string
  franchiseOrganizationName?: string | null
  storeName?: string | null
  employeeName: string
  employeeClassification?: string | null
  employeeClassificationName?: string | null
  contractClassification?: string | null
  contractClassificationName?: string | null
  rank?: string | null
  rankName?: string | null
  position?: string | null
  positionName?: string | null
  hireDate: string
  resignationDate?: string | null
  resignationReason?: string | null
  salaryBank?: string | null
  salaryAccountNumber?: string | null
  salaryAccountHolder?: string | null
  residentRegistrationFileId?: number | null
  familyRelationFileId?: number | null
  healthCheckFileId?: number | null
  healthCheckExpiryDate?: string | null
  resumeFileId?: number | null
  memo?: string | null
  iconType?: number | null
  isEmailSend?: boolean | null
  emailSendDate?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

// 직원 등록 응답 DTO (POST 응답용 - 기존 호환)
export interface EmployeeInfoResponse {
  employeeId: number
  employeeName: string
  mobilePhone?: string | null
  hireDate: string
  workplaceType: WorkplaceType
}

// 직원 목록 조회 검색 파라미터
export interface EmployeeSearchParams {
  page?: number
  size?: number
  headOfficeOrganizationId?: number
  franchiseOrganizationId?: number
  storeId?: number
  workStatus?: 'EMPWK_001' | 'EMPWK_002' | 'EMPWK_003'  // EMPWK_001: 근무, EMPWK_002: 휴직, EMPWK_003: 퇴사
  employeeName?: string
  employeeClassification?: string
  contractClassification?: string
  adminAuthority?: string
  memberStatus?: string
  hireDateFrom?: string
  hireDateTo?: string
  healthCheckExpiryFrom?: string
  healthCheckExpiryTo?: string
}

// 직원 목록 조회 응답 DTO
export interface EmployeeListResponse {
  content: EmployeeListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// 직원 목록 아이템
export interface EmployeeListItem {
  employeeInfoId: number  // 백엔드 API 응답 필드명과 일치
  rowNumber: number
  workStatus: string | null
  workStatusName: string | null
  memberId?: number | null  // 회원 ID (연결된 경우)
  isEmailSend?: boolean | null  // 이메일 발송 여부
  memberStatus: string  // 직원 회원 상태 (가입완료/가입요청/가입요청전)
  headOfficeName: string  // headOfficeOrganizationName
  franchiseName: string | null  // franchiseOrganizationName
  storeName: string | null
  employeeName: string
  employeeClassification: string | null
  employeeClassificationName: string | null
  contractClassification: string | null
  contractClassificationName: string | null
  hireDate: string
  healthCheckExpiryDate?: string  // 건강진단 만료일
  memo?: string  // 메모
}

// 경력 정보 DTO
export interface EmployeeCareerResponse {
  id: number
  employeeInfoId: number
  companyName: string
  workplaceType?: string | null
  workplaceTypeName?: string | null
  startDate: string
  endDate?: string | null
  contractClassification?: string | null
  contractClassificationName?: string | null
  rank?: string | null
  rankName?: string | null
  position?: string | null
  positionName?: string | null
  jobDescription?: string | null
  resignationReason?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface EmployeeCareerItem {
  id?: number | null
  companyName: string
  workplaceType?: string | null
  startDate: string
  endDate?: string | null
  contractClassification?: string | null
  rank?: string | null
  position?: string | null
  jobDescription?: string | null
  resignationReason?: string | null
}

export interface SaveEmployeeCareersRequest {
  careers: EmployeeCareerItem[]
}

// 자격증 정보 DTO
export interface EmployeeCertificateResponse {
  id: number
  employeeInfoId: number
  certificateName: string
  validityStartDate?: string | null
  validityEndDate?: string | null
  acquisitionDate: string
  issuingOrganization?: string | null
  certificateFileId?: number | null
  certificateFileName?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface EmployeeCertificateItem {
  id?: number | null
  certificateName: string
  validityStartDate?: string | null
  validityEndDate?: string | null
  acquisitionDate: string
  issuingOrganization?: string | null
  certificateFileId?: number | null
  fileIndex?: number | null  // 파일 인덱스 (files 리스트에서의 인덱스)
}

export interface SaveEmployeeCertificatesRequest {
  certificates: EmployeeCertificateItem[]
}

// 직원 수정 요청 DTO
export interface UpdateEmployeeInfoRequest {
  // 사번 (기존에 사번이 없는 경우에만 설정 가능)
  employeeNumber?: string | null
  // 근무 상태
  workStatus?: string | null
  // 개인 정보
  birthDate?: string | null
  mobilePhone?: string | null
  emergencyContact?: string | null
  email?: string | null
  // 주소 정보
  zipCode?: string | null
  address?: string | null
  addressDetail?: string | null
  // 분류 정보
  employeeClassification?: string | null
  contractClassification?: string | null
  rank?: string | null
  position?: string | null
  // 입퇴사 정보
  hireDate: string  // 필수값
  resignationDate?: string | null
  resignationReason?: string | null
  // 급여 정보
  salaryBank?: string | null
  salaryAccountNumber?: string | null
  salaryAccountHolder?: string | null
  // 파일 ID
  residentRegistrationFileId?: number | null
  familyRelationFileId?: number | null
  healthCheckFileId?: number | null
  healthCheckExpiryDate?: string | null
  resumeFileId?: number | null
  // 기타
  memo?: string | null
  iconType?: number | null
}
