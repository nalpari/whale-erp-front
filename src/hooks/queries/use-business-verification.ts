import { useMutation } from '@tanstack/react-query'

export interface BusinessVerificationInput {
  /** 사업자등록번호 (10자리 숫자) */
  businessRegistrationNumber: string
  /** 개업일자 (YYYYMMDD) */
  startDate: string
  /** 대표자명 */
  representativeName: string
}

export interface BusinessVerificationResult {
  isValid: boolean
  rawResult: unknown
}

/**
 * 입력값 사전 검증
 * @returns 에러 메시지 (없으면 null)
 */
const validateInput = (input: BusinessVerificationInput): string | null => {
  if (!input.businessRegistrationNumber || !/^\d{10}$/.test(input.businessRegistrationNumber)) {
    return '사업자등록번호는 10자리 숫자입니다'
  }
  if (!input.startDate) {
    return '개업일자를 입력해주세요'
  }
  if (!input.representativeName.trim()) {
    return '대표자명을 입력해주세요'
  }
  return null
}

/**
 * 국세청 사업자등록번호 인증 공통 훅
 *
 * Next.js API route(/api/business-verification)를 통해 서버사이드에서 국세청 API 호출
 * BpInvitationManage, Signup Step01 등에서 공통으로 사용
 */
export const useBusinessVerification = () => {
  return useMutation({
    mutationFn: async (input: BusinessVerificationInput): Promise<BusinessVerificationResult> => {
      const validationError = validateInput(input)
      if (validationError) {
        throw new Error(validationError)
      }

      const response = await fetch('/api/business-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(json.error || '사업자 인증에 실패했습니다.')
      }

      return json.data
    },
  })
}
