import api from '../api'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID } from '../constants/organization'

// 공통코드 순서 변경 요청 타입
export interface CommonCodeReorderRequest {
  parent_id: number | null
  orders: Array<{ id: number; sort_order: number }>
}

// 공통코드 생성/수정 요청 타입
export interface CommonCodeCreateRequest {
  code: string
  name: string
  description?: string | null
  parentId?: number | null
  sortOrder?: number
  isActive?: boolean
  codeGroup: string
  headOffice?: string | null
  franchise?: string | null
}

// 공통코드 응답 타입
export interface CommonCodeResponse {
  id: number
  code: string
  name: string
  description: string | null
  parentId: number | null
  depth: number
  sortOrder: number
  isActive: boolean
  codeGroup: string
  headOffice: string | null
  franchise: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 공통코드 순서 변경
 */
export async function reorderCommonCodes(data: CommonCodeReorderRequest): Promise<void> {
  await api.put('/api/v1/common-codes/reorder', data)
}

/**
 * 공통코드 생성
 */
export async function createCommonCode(data: CommonCodeCreateRequest): Promise<CommonCodeResponse> {
  const response = await api.post<{ data: CommonCodeResponse }>('/api/v1/common-codes', data)
  return response.data.data
}

/**
 * 공통코드 수정
 */
export async function updateCommonCode(id: number, data: CommonCodeCreateRequest): Promise<CommonCodeResponse> {
  const response = await api.put<{ data: CommonCodeResponse }>(`/api/v1/common-codes/${id}`, data)
  return response.data.data
}

// 급여명세서 공통코드 응답 타입
export interface PayrollCommonCodeResponse {
  codeId: number
  code: string
  codeMemoContent: {
    bonusInfo?: BonusTypeInfo[]
    payrollType?: string
    note?: string
    [key: string]: unknown
  } | null
}

// 상여금 종류 정보
export interface BonusTypeInfo {
  id: string
  code: string // 상여금 코드 (CommonCode 코드)
  name: string
  amount?: number
  remark?: string
  description?: string
}

// 급여명세서 공통코드 조회
export async function getPayrollCommonCode(params?: {
  headOfficeId?: number
  franchiseId?: number
}): Promise<PayrollCommonCodeResponse | null> {
  try {
    const defaultParams = {
      headOfficeId: params?.headOfficeId ?? DEFAULT_HEAD_OFFICE_ID,
      franchiseId: params?.franchiseId ?? DEFAULT_FRANCHISE_ID
    }
    const response = await api.get<{ data: PayrollCommonCodeResponse | null }>(
      '/api/employee/payroll/regular/common-code',
      { params: defaultParams }
    )
    return response.data.data
  } catch (error) {
    console.error('급여명세서 공통코드 조회 실패:', error)
    return null
  }
}

// 상여금 종류 조회 (bonusInfo 키에서 가져옴)
export async function getBonusTypes(headOfficeId?: number, franchiseId?: number): Promise<BonusTypeInfo[]> {
  const commonCode = await getPayrollCommonCode({
    headOfficeId: headOfficeId ?? DEFAULT_HEAD_OFFICE_ID,
    franchiseId: franchiseId ?? DEFAULT_FRANCHISE_ID
  })

  if (!commonCode?.codeMemoContent?.bonusInfo) {
    return []
  }

  return commonCode.codeMemoContent.bonusInfo
}
