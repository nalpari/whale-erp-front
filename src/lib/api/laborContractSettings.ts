import api from '../api'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID } from '../constants/organization'

// 기타 항목 타입
export interface OtherItem {
  id: number
  content: string
  sortOrder: number
}

// 정직원 계약서 설정 타입
export interface FulltimeContractSettings {
  workPlace: 'company' | 'store'
  workPlaceStore: string
  holidayAdditional: string
  annualLeaveAdditional: string
  resignationAdditional: string
  otherItems: OtherItem[]
}

// 파트타이머 계약서 설정 타입
export interface ParttimeContractSettings {
  annualLeaveAdditional: string
  severancePayAdditional: string
  otherItems: OtherItem[]
}

// 근로계약서 설정 공통코드 내용 타입
export interface LaborContractCodeMemoContent {
  fulltime: FulltimeContractSettings
  parttime: ParttimeContractSettings
}

// 근로계약서 설정 공통코드 응답 타입
export interface LaborContractSettingsCodeResponse {
  codeId: number
  code: string
  codeMemoContent: LaborContractCodeMemoContent | null
}

// 근로계약서 설정 공통코드 조회 파라미터
export interface GetLaborContractSettingsCodeParams {
  headOfficeId?: number
  franchiseId?: number
}

// 근로계약서 설정 공통코드 저장 요청
export interface SaveLaborContractSettingsCodeRequest {
  headOfficeId: number
  franchiseId?: number
  codeMemoContent: LaborContractCodeMemoContent
}

/**
 * 근로계약서 설정 공통코드 조회
 */
export async function getLaborContractSettingsCode(
  params?: GetLaborContractSettingsCodeParams
): Promise<LaborContractSettingsCodeResponse | null> {
  try {
    const defaultParams = {
      headOfficeId: params?.headOfficeId ?? DEFAULT_HEAD_OFFICE_ID,
      franchiseId: params?.franchiseId ?? DEFAULT_FRANCHISE_ID
    }
    const response = await api.get<{ data: LaborContractSettingsCodeResponse | null }>(
      '/api/employee/contract/common-code',
      { params: defaultParams }
    )
    return response.data.data
  } catch (error) {
    console.error('근로계약서 설정 공통코드 조회 실패:', error)
    return null
  }
}

/**
 * 근로계약서 설정 공통코드 저장 (Upsert)
 */
export async function saveLaborContractSettingsCode(
  request: SaveLaborContractSettingsCodeRequest
): Promise<number | null> {
  try {
    const response = await api.post<{ data: number }>(
      '/api/employee/contract/common-code',
      request
    )
    return response.data.data
  } catch (error) {
    console.error('근로계약서 설정 공통코드 저장 실패:', error)
    throw error
  }
}

// 기본 설정값 (데이터가 없을 때 사용)
export const DEFAULT_FULLTIME_SETTINGS: FulltimeContractSettings = {
  workPlace: 'company',
  workPlaceStore: '',
  holidayAdditional: '',
  annualLeaveAdditional: '',
  resignationAdditional: '',
  otherItems: []
}

export const DEFAULT_PARTTIME_SETTINGS: ParttimeContractSettings = {
  annualLeaveAdditional: '',
  severancePayAdditional: '',
  otherItems: []
}
