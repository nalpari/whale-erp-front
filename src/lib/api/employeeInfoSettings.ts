import api from '../api'

const DEFAULT_HEAD_OFFICE_ID = 1
const DEFAULT_FRANCHISE_ID = 2

// 분류 항목 타입
export interface ClassificationItem {
  code: string
  name: string
  sortOrder: number
}

// 직원 정보 공통코드 응답 타입
export interface EmployeeInfoCommonCodeResponse {
  codeId: number
  code: string
  codeMemoContent: {
    EMPLOYEE?: ClassificationItem[]
    RANK?: ClassificationItem[]
    POSITION?: ClassificationItem[]
  } | null
}

// 직원 정보 공통코드 조회 파라미터
export interface GetEmployeeInfoCommonCodeParams {
  headOfficeId?: number
  franchiseId?: number
}

// 직원 정보 공통코드 저장 요청
export interface SaveEmployeeInfoCommonCodeRequest {
  headOfficeId: number
  franchiseId?: number
  codeMemoContent: {
    EMPLOYEE: ClassificationItem[]
    RANK: ClassificationItem[]
    POSITION: ClassificationItem[]
  }
}

/**
 * 직원 정보 공통코드 조회 (직원 분류, 직급, 직책)
 */
export async function getEmployeeInfoCommonCode(
  params?: GetEmployeeInfoCommonCodeParams
): Promise<EmployeeInfoCommonCodeResponse | null> {
  try {
    const defaultParams = {
      headOfficeId: params?.headOfficeId ?? DEFAULT_HEAD_OFFICE_ID,
      franchiseId: params?.franchiseId ?? DEFAULT_FRANCHISE_ID
    }
    const response = await api.get<{ data: EmployeeInfoCommonCodeResponse | null }>(
      '/api/employee/info/common-code',
      { params: defaultParams }
    )
    return response.data.data
  } catch (error) {
    console.error('직원 정보 공통코드 조회 실패:', error)
    return null
  }
}

/**
 * 직원 정보 공통코드 저장 (Upsert)
 */
export async function saveEmployeeInfoCommonCode(
  request: SaveEmployeeInfoCommonCodeRequest
): Promise<number | null> {
  try {
    const response = await api.post<{ data: number }>(
      '/api/employee/info/common-code',
      request
    )
    return response.data.data
  } catch (error) {
    console.error('직원 정보 공통코드 저장 실패:', error)
    throw error
  }
}

/**
 * 직원 분류 목록 조회
 */
export async function getEmployeeClassifications(
  headOfficeId?: number,
  franchiseId?: number
): Promise<ClassificationItem[]> {
  const commonCode = await getEmployeeInfoCommonCode({
    headOfficeId: headOfficeId ?? DEFAULT_HEAD_OFFICE_ID,
    franchiseId: franchiseId ?? DEFAULT_FRANCHISE_ID
  })

  if (!commonCode?.codeMemoContent?.EMPLOYEE) {
    return []
  }

  return commonCode.codeMemoContent.EMPLOYEE
}

/**
 * 직급 분류 목록 조회
 */
export async function getRankClassifications(
  headOfficeId?: number,
  franchiseId?: number
): Promise<ClassificationItem[]> {
  const commonCode = await getEmployeeInfoCommonCode({
    headOfficeId: headOfficeId ?? DEFAULT_HEAD_OFFICE_ID,
    franchiseId: franchiseId ?? DEFAULT_FRANCHISE_ID
  })

  if (!commonCode?.codeMemoContent?.RANK) {
    return []
  }

  return commonCode.codeMemoContent.RANK
}

/**
 * 직책 분류 목록 조회
 */
export async function getPositionClassifications(
  headOfficeId?: number,
  franchiseId?: number
): Promise<ClassificationItem[]> {
  const commonCode = await getEmployeeInfoCommonCode({
    headOfficeId: headOfficeId ?? DEFAULT_HEAD_OFFICE_ID,
    franchiseId: franchiseId ?? DEFAULT_FRANCHISE_ID
  })

  if (!commonCode?.codeMemoContent?.POSITION) {
    return []
  }

  return commonCode.codeMemoContent.POSITION
}
