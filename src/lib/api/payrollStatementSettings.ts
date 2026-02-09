import api from '../api'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID } from '../constants/organization'

// 상여금 분류 타입 (UI용)
export interface BonusCategory {
  id: number
  code: string // 상여금 코드 (CommonCode 코드)
  name: string
  amount: number
  remark: string
  sortOrder: number
}

// 급여명세서 설정 타입 (UI용)
export interface PayrollStatementSettingsContent {
  // 급여 기준 정보
  fulltimePaydayMonth: 'CURRENT' | 'NEXT' // 당월/익월
  fulltimePaydayDay: number // 급여일
  parttimePaydayMonth: 'CURRENT' | 'NEXT' // 당월/익월
  parttimePaydayDay: number // 급여일
  parttimeIncomeTaxRate: number // 파트타이머 근로소득세율 (%)
  parttimeLocalTaxRate: number // 파트타이머 지방소득세율 (%)
  overtimeWorkRate: number // 연장 또는 추가 근무 세율 (%)
  // 상여금 정보
  bonusCategories: BonusCategory[]
}

// 기본 설정값 (데이터가 없을 때 사용) - 함수에서 참조하기 전에 선언
export const DEFAULT_PAYROLL_STATEMENT_SETTINGS: PayrollStatementSettingsContent = {
  fulltimePaydayMonth: 'CURRENT',
  fulltimePaydayDay: 5,
  parttimePaydayMonth: 'CURRENT',
  parttimePaydayDay: 5,
  parttimeIncomeTaxRate: 3,
  parttimeLocalTaxRate: 0.3,
  overtimeWorkRate: 17,
  bonusCategories: []
}

// API 응답 타입 (서버에서 오는 형태)
interface ApiPayrollCodeMemoContent {
  bonusInfo?: Array<{
    code: string // 상여금 코드 (CommonCode 코드)
    name: string
    amount: number
    remark: string
  }>
  payrollStandard?: {
    fullTimePayday?: {
      paymentDay: number
      paymentMonth: 'CURRENT' | 'NEXT'
    }
    partTimePayday?: {
      paymentDay: number
      paymentMonth: 'CURRENT' | 'NEXT'
    }
    overtimeWorkTaxRate?: number
    partTimeLocalTaxRate?: number
    partTimeIncomeTaxRate?: number
  }
}

// 급여명세서 설정 공통코드 응답 타입
export interface PayrollStatementSettingsCodeResponse {
  codeId: number
  code: string
  codeMemoContent: ApiPayrollCodeMemoContent | null
}

// 급여명세서 설정 공통코드 조회 파라미터
export interface GetPayrollStatementSettingsCodeParams {
  headOfficeId?: number
  franchiseId?: number
}

// 급여명세서 설정 공통코드 저장 요청 (서버로 보내는 형태)
export interface SavePayrollStatementSettingsCodeRequest {
  headOfficeId: number
  franchiseId?: number
  codeMemoContent: ApiPayrollCodeMemoContent
}

// API 응답을 UI 타입으로 변환
export function apiToUiSettings(apiData: ApiPayrollCodeMemoContent | null): PayrollStatementSettingsContent {
  if (!apiData) {
    return DEFAULT_PAYROLL_STATEMENT_SETTINGS
  }

  const { bonusInfo, payrollStandard } = apiData

  // 기존 데이터에 코드가 없으면 자동 생성
  const bonusCategories = (bonusInfo || []).map((item, index) => ({
    id: index + 1,
    code: item.code || `BONUS_${String(index + 1).padStart(3, '0')}`,
    name: item.name,
    amount: item.amount,
    remark: item.remark || '',
    sortOrder: index + 1
  }))

  return {
    fulltimePaydayMonth: payrollStandard?.fullTimePayday?.paymentMonth || 'CURRENT',
    fulltimePaydayDay: payrollStandard?.fullTimePayday?.paymentDay || 5,
    parttimePaydayMonth: payrollStandard?.partTimePayday?.paymentMonth || 'CURRENT',
    parttimePaydayDay: payrollStandard?.partTimePayday?.paymentDay || 5,
    parttimeIncomeTaxRate: payrollStandard?.partTimeIncomeTaxRate || 3,
    parttimeLocalTaxRate: payrollStandard?.partTimeLocalTaxRate || 0.3,
    overtimeWorkRate: payrollStandard?.overtimeWorkTaxRate || 17,
    bonusCategories
  }
}

// UI 타입을 API 요청으로 변환
export function uiToApiSettings(uiData: PayrollStatementSettingsContent): ApiPayrollCodeMemoContent {
  return {
    bonusInfo: uiData.bonusCategories
      .filter(item => item.name.trim() !== '')
      .map(item => ({
        code: item.code,
        name: item.name,
        amount: item.amount,
        remark: item.remark
      })),
    payrollStandard: {
      fullTimePayday: {
        paymentDay: uiData.fulltimePaydayDay,
        paymentMonth: uiData.fulltimePaydayMonth
      },
      partTimePayday: {
        paymentDay: uiData.parttimePaydayDay,
        paymentMonth: uiData.parttimePaydayMonth
      },
      overtimeWorkTaxRate: uiData.overtimeWorkRate,
      partTimeLocalTaxRate: uiData.parttimeLocalTaxRate,
      partTimeIncomeTaxRate: uiData.parttimeIncomeTaxRate
    }
  }
}

/**
 * 급여명세서 설정 공통코드 조회
 */
export async function getPayrollStatementSettingsCode(
  params?: GetPayrollStatementSettingsCodeParams
): Promise<PayrollStatementSettingsContent> {
  try {
    const defaultParams = {
      headOfficeId: params?.headOfficeId ?? DEFAULT_HEAD_OFFICE_ID,
      franchiseId: params?.franchiseId ?? DEFAULT_FRANCHISE_ID
    }
    const response = await api.get<{ data: PayrollStatementSettingsCodeResponse | null }>(
      '/api/employee/payroll/regular/common-code',
      { params: defaultParams }
    )
    return apiToUiSettings(response.data.data?.codeMemoContent || null)
  } catch (error) {
    console.error('급여명세서 설정 공통코드 조회 실패:', error)
    return DEFAULT_PAYROLL_STATEMENT_SETTINGS
  }
}

/**
 * 급여명세서 설정 공통코드 저장 (Upsert)
 */
export async function savePayrollStatementSettingsCode(
  headOfficeId: number,
  franchiseId: number | undefined,
  settings: PayrollStatementSettingsContent
): Promise<number | null> {
  try {
    const response = await api.post<{ data: number }>(
      '/api/employee/payroll/regular/common-code',
      {
        headOfficeId,
        franchiseId,
        codeMemoContent: uiToApiSettings(settings)
      }
    )
    return response.data.data
  } catch (error) {
    console.error('급여명세서 설정 공통코드 저장 실패:', error)
    throw error
  }
}
