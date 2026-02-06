import api from '../api'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID } from '../constants/organization'

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
