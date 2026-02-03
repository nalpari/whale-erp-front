import api from '@/lib/api'
import type {
  PostEmployeeInfoRequest,
  EmployeeInfoResponse,
  EmployeeInfoDetailResponse,
  UpdateEmployeeInfoRequest,
  EmployeeSearchParams,
  EmployeeListResponse,
  EmployeeCareerResponse,
  EmployeeCareerItem,
  SaveEmployeeCareersRequest,
  EmployeeCertificateResponse,
  EmployeeCertificateItem,
  SaveEmployeeCertificatesRequest
} from '@/types/employee'

// 직원 등록
export async function createEmployee(data: PostEmployeeInfoRequest): Promise<EmployeeInfoResponse> {
  const response = await api.post<{ data: EmployeeInfoResponse }>('/api/employee/info', data)
  return response.data.data
}

// 백엔드 API 응답 타입 (실제 API 응답 구조)
interface EmployeeInfoListApiResponse {
  employeeInfoId: number
  rowNumber: number
  workStatus: string | null
  workStatusName: string | null
  headOfficeOrganizationName: string
  franchiseOrganizationName: string | null
  storeName: string | null
  employeeName: string
  employeeClassification: string | null
  employeeClassificationName: string | null
  contractClassification: string | null
  contractClassificationName: string | null
  hireDate: string
  memberId: number | null
  isEmailSend: boolean | null
  memberStatus: string
  healthCheckExpiryDate: string | null
  memo: string | null
}

interface EmployeeListApiResponse {
  content: EmployeeInfoListApiResponse[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// 직원 목록 조회
export async function getEmployeeList(params?: EmployeeSearchParams): Promise<EmployeeListResponse> {
  const response = await api.get<{ data: EmployeeListApiResponse }>('/api/employee/info', { params })
  const apiData = response.data.data

  // API 응답을 프론트엔드 타입으로 변환
  return {
    ...apiData,
    content: apiData.content.map((item) => ({
      employeeInfoId: item.employeeInfoId,
      rowNumber: item.rowNumber,
      workStatus: item.workStatus,
      workStatusName: item.workStatusName,
      memberId: item.memberId,
      isEmailSend: item.isEmailSend,
      memberStatus: item.memberStatus,
      headOfficeName: item.headOfficeOrganizationName,
      franchiseName: item.franchiseOrganizationName,
      storeName: item.storeName,
      employeeName: item.employeeName,
      employeeClassification: item.employeeClassification,
      employeeClassificationName: item.employeeClassificationName,
      contractClassification: item.contractClassification,
      contractClassificationName: item.contractClassificationName,
      hireDate: item.hireDate,
      healthCheckExpiryDate: item.healthCheckExpiryDate ?? undefined,
      memo: item.memo ?? undefined
    }))
  }
}

// 직원 상세 조회
export async function getEmployee(id: number): Promise<EmployeeInfoDetailResponse> {
  const response = await api.get<{ data: EmployeeInfoDetailResponse }>(`/api/employee/info/${id}`)
  return response.data.data
}

// 사번 중복 확인
export async function checkEmployeeNumber(
  employeeNumber: string,
  headOfficeOrganizationId: number,
  franchiseOrganizationId?: number | null,
  storeId?: number | null
): Promise<{ isDuplicate: boolean; message: string }> {
  const response = await api.get<{ data: boolean; message: string }>(
    '/api/employee/info/check-employee-number',
    {
      params: {
        employeeNumber,
        headOfficeOrganizationId,
        ...(franchiseOrganizationId && { franchiseOrganizationId }),
        ...(storeId && { storeId })
      }
    }
  )
  return {
    isDuplicate: response.data.data,
    message: response.data.message || ''
  }
}

// 직원 정보 수정
export async function updateEmployee(id: number, data: UpdateEmployeeInfoRequest): Promise<EmployeeInfoResponse> {
  const response = await api.put<{ data: EmployeeInfoResponse }>(`/api/employee/info/${id}`, data)
  return response.data.data
}

// 직원 파일 업로드 인터페이스
export interface EmployeeFiles {
  residentRegistrationFile?: File | null
  familyRelationFile?: File | null
  healthCheckFile?: File | null
  resumeFile?: File | null
}

// 직원 정보 수정 (파일 포함) - 트랜잭션 처리
export async function updateEmployeeWithFiles(
  id: number,
  data: UpdateEmployeeInfoRequest,
  files: EmployeeFiles
): Promise<EmployeeInfoResponse> {
  const formData = new FormData()

  // JSON 데이터를 Blob으로 변환하여 추가
  const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  formData.append('data', jsonBlob)

  // 파일 추가 (있는 경우에만)
  if (files.residentRegistrationFile) {
    formData.append('residentRegistrationFile', files.residentRegistrationFile)
  }
  if (files.familyRelationFile) {
    formData.append('familyRelationFile', files.familyRelationFile)
  }
  if (files.healthCheckFile) {
    formData.append('healthCheckFile', files.healthCheckFile)
  }
  if (files.resumeFile) {
    formData.append('resumeFile', files.resumeFile)
  }

  const response = await api.put<{ data: EmployeeInfoResponse }>(
    `/api/employee/info/${id}/with-files`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data.data
}

// 최저시급 조회 (단일 년도)
export async function getMinimumWage(year: number): Promise<number> {
  const response = await api.get<{ data: { minimumWage: number } }>(`/api/employee/contract/minimum-wage/${year}`)
  return response.data.data.minimumWage
}

// 최저시급 인터페이스
export interface MinimumWageInfo {
  year: number
  minimumWage: number
}

// 최저시급 목록 조회 (현재년도 + 다음년도)
export async function getMinimumWageList(): Promise<MinimumWageInfo[]> {
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  const result: MinimumWageInfo[] = []

  // 현재년도 조회
  try {
    const currentWage = await getMinimumWage(currentYear)
    result.push({ year: currentYear, minimumWage: currentWage })
  } catch (error) {
    console.error(`${currentYear}년 최저시급 조회 실패:`, error)
  }

  // 다음년도 조회 (등록되어 있지 않으면 무시)
  try {
    const nextWage = await getMinimumWage(nextYear)
    result.push({ year: nextYear, minimumWage: nextWage })
  } catch (error) {
    // 다음년도 최저시급이 등록되어 있지 않으면 현재년도만 반환
    console.log(`${nextYear}년 최저시급 미등록`)
  }

  return result
}

// 직원 회원 가입 요청 이메일 전송
export async function sendEmployeeRegistrationEmail(employeeId: number): Promise<void> {
  await api.post(`/api/employee/info/${employeeId}/send-registration-email`)
}

// ========== 경력 정보 API ==========

// 직원의 경력 정보 목록 조회
export async function getEmployeeCareers(employeeInfoId: number): Promise<EmployeeCareerResponse[]> {
  const response = await api.get<{ data: EmployeeCareerResponse[] }>(
    `/api/employee/info/${employeeInfoId}/careers`
  )
  return response.data.data
}

// 경력 정보 단건 조회
export async function getEmployeeCareer(employeeInfoId: number, careerId: number): Promise<EmployeeCareerResponse> {
  const response = await api.get<{ data: EmployeeCareerResponse }>(
    `/api/employee/info/${employeeInfoId}/careers/${careerId}`
  )
  return response.data.data
}

// 경력 정보 일괄 저장
export async function saveEmployeeCareers(
  employeeInfoId: number,
  data: SaveEmployeeCareersRequest
): Promise<EmployeeCareerResponse[]> {
  const response = await api.put<{ data: EmployeeCareerResponse[] }>(
    `/api/employee/info/${employeeInfoId}/careers`,
    data
  )
  return response.data.data
}

// 직원의 모든 경력 정보 삭제
export async function deleteAllEmployeeCareers(employeeInfoId: number): Promise<void> {
  await api.delete(`/api/employee/info/${employeeInfoId}/careers`)
}

// ========== 자격증 정보 API ==========

// 직원의 자격증 정보 목록 조회
export async function getEmployeeCertificates(employeeInfoId: number): Promise<EmployeeCertificateResponse[]> {
  const response = await api.get<{ data: EmployeeCertificateResponse[] }>(
    `/api/employee/info/${employeeInfoId}/certificates`
  )
  return response.data.data
}

// 자격증 정보 단건 조회
export async function getEmployeeCertificate(employeeInfoId: number, certificateId: number): Promise<EmployeeCertificateResponse> {
  const response = await api.get<{ data: EmployeeCertificateResponse }>(
    `/api/employee/info/${employeeInfoId}/certificates/${certificateId}`
  )
  return response.data.data
}

// 자격증 정보 일괄 저장
export async function saveEmployeeCertificates(
  employeeInfoId: number,
  data: SaveEmployeeCertificatesRequest
): Promise<EmployeeCertificateResponse[]> {
  const response = await api.put<{ data: EmployeeCertificateResponse[] }>(
    `/api/employee/info/${employeeInfoId}/certificates`,
    data
  )
  return response.data.data
}

// 자격증 정보 일괄 저장 (파일 포함)
export async function saveEmployeeCertificatesWithFiles(
  employeeInfoId: number,
  data: SaveEmployeeCertificatesRequest,
  files: File[]
): Promise<EmployeeCertificateResponse[]> {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))

  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await api.put<{ data: EmployeeCertificateResponse[] }>(
    `/api/employee/info/${employeeInfoId}/certificates/with-files`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data.data
}

// 직원의 모든 자격증 정보 삭제
export async function deleteAllEmployeeCertificates(employeeInfoId: number): Promise<void> {
  await api.delete(`/api/employee/info/${employeeInfoId}/certificates`)
}

// 직원 정보 삭제 (soft delete)
export async function deleteEmployee(employeeInfoId: number): Promise<void> {
  await api.delete(`/api/employee/info/${employeeInfoId}`)
}

// ========== 권한 관련 API ==========

// 권한 목록 응답 타입
export interface AuthorityItem {
  id: number
  name: string
  ownerCode: string
  isUsed: boolean
  description?: string
}

// 권한 목록 조회 (조직별)
export async function getAuthoritiesByOrganization(
  ownerGroup: string,
  headOfficeCode?: string,
  franchiseeCode?: string
): Promise<AuthorityItem[]> {
  const params: Record<string, string> = { owner_group: ownerGroup }
  if (headOfficeCode) params.head_office_code = headOfficeCode
  if (franchiseeCode) params.franchisee_code = franchiseeCode

  const response = await api.get<{ data: { content: AuthorityItem[] } }>('/api/system/authorities', { params })
  return response.data.data.content
}

// 직원 로그인 정보 업데이트 요청 타입
export interface UpdateEmployeeLoginInfoRequest {
  partnerOfficeAuthorityId?: number | null
}

// 직원 로그인 정보 업데이트
export async function updateEmployeeLoginInfo(
  employeeInfoId: number,
  request: UpdateEmployeeLoginInfoRequest
): Promise<void> {
  await api.patch(`/api/employee/info/${employeeInfoId}/login-info`, request)
}

// 직원 회원 탈퇴 처리
export async function withdrawEmployeeMember(employeeInfoId: number): Promise<void> {
  await api.post(`/api/employee/info/${employeeInfoId}/withdraw`)
}

// ========== 직원 타입별 목록 조회 API ==========

// 직원 타입
export type EmployeeType = 'ALL' | 'FULL_TIME' | 'PART_TIME'

// 직원 간단 목록 응답 타입
export interface EmployeeSimpleListResponse {
  employeeInfoId: number
  memberId: number | null
  employeeNumber: string
  employeeName: string
  headOfficeName: string
  franchiseName: string | null
  storeName: string | null
  contractClassification: string | null
  contractClassificationName: string | null
  employmentContractId: number | null
  salaryMonth: string | null // SLRCF_001: 당월, SLRCF_002: 익월
  salaryDay: number | null
}

// 직원 타입별 목록 조회 파라미터
export interface GetEmployeeListByTypeParams {
  headOfficeId: number
  franchiseId?: number
  employeeType: EmployeeType
}

// 직원 타입별 목록 조회
export async function getEmployeeListByType(
  params: GetEmployeeListByTypeParams
): Promise<EmployeeSimpleListResponse[]> {
  const queryParams: Record<string, string | number> = {
    headOfficeId: params.headOfficeId,
    employeeType: params.employeeType
  }
  if (params.franchiseId) {
    queryParams.franchiseId = params.franchiseId
  }

  const response = await api.get<{ data: EmployeeSimpleListResponse[] }>(
    '/api/employee/info/by-type',
    { params: queryParams }
  )
  return response.data.data
}
