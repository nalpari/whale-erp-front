/** 가입 방식 */
export type VerificationMethod = 'business-number' | 'invitation-code'

/** 사업자 유형 */
export type BusinessType = 'HEAD_OFFICE' | 'FRANCHISE' | 'GENERAL'

/** 초대 검증 API 응답 */
export interface InvitationVerifyResponse {
  bpCode: string
  invitationStatus: string
  companyName: string
  businessRegistrationNumber: string
  representativeName: string
  representativeEmail: string
  representativeMobilePhone: string
  headOfficeName: string
  headOfficeBrandName: string
  headOfficeId: number
  organizationId: number
}

/** 회원가입 전체 폼 데이터 (SignupLayout에서 스텝 간 공유) */
export interface SignupFormData {
  // Step 1
  verificationMethod: VerificationMethod
  representativeName: string
  openDate: string
  businessRegistrationNumber: string
  businessRegistrationFile?: File
  invitationCode: string

  // Step 1 탭2 → API 응답
  invitationData?: InvitationVerifyResponse

  // Step 2
  companyName: string

  // Step 3
  businessType: BusinessType | ''
  mainMenu: string

  // Step 4
  headOfficeName: string
  brandName: string
  address1: string
  address2: string
  email: string
  businessCategory: string
  logoFile?: File

  // Step 5
  masterId: string
  password: string
  passwordConfirm: string
}

/** 회원가입 요청 DTO (POST /api/signup) */
export interface SignupRequest {
  verificationMethod: VerificationMethod
  businessRegistrationNumber: string
  representativeName: string
  businessType: BusinessType
  mainMenu: string
  companyName: string
  brandName: string
  address1: string
  address2: string
  email: string
  businessCategory: string
  masterId: string
  password: string
  bpCode?: string
  logoFile?: File
}

/** SignupFormData 초기값 */
export const initialSignupFormData: SignupFormData = {
  verificationMethod: 'business-number',
  representativeName: '',
  openDate: '',
  businessRegistrationNumber: '',
  invitationCode: '',
  companyName: '',
  businessType: '',
  mainMenu: '',
  headOfficeName: '',
  brandName: '',
  address1: '',
  address2: '',
  email: '',
  businessCategory: '',
  masterId: '',
  password: '',
  passwordConfirm: '',
}
