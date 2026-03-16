import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

const BUSINESS_VALIDATE_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/validate'
const BUSINESS_VALIDATE_KEY = 'AsoOkjYzxLNpwF0ZK5rGPOIX5cp3e4Kp3P9A5VkILMZdy2Cx7Rwt5%2FB2qqLbmD%2FtEt38CvjYKB8ElFeRhFfrfQ%3D%3D'

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
 * BpInvitationManage, Signup Step01 등에서 공통으로 사용
 */
export const useBusinessVerification = () => {
  return useMutation({
    mutationFn: async (input: BusinessVerificationInput): Promise<BusinessVerificationResult> => {
      const validationError = validateInput(input)
      if (validationError) {
        throw new Error(validationError)
      }

      const response = await axios.post(
        `${BUSINESS_VALIDATE_URL}?serviceKey=${BUSINESS_VALIDATE_KEY}`,
        {
          businesses: [
            {
              b_no: input.businessRegistrationNumber,
              start_dt: input.startDate,
              p_nm: input.representativeName,
            },
          ],
        }
      )

      const result = response.data?.data?.[0]
      return {
        isValid: result?.valid === '01',
        rawResult: result,
      }
    },
  })
}
