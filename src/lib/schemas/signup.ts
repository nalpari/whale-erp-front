import { z } from 'zod'

/** Step 1 탭1: 사업자등록번호 인증 */
export const step1BusinessNumberSchema = z.object({
  representativeName: z.string().min(1, '대표자 성명을 입력해주세요'),
  openDate: z.string().min(1, '개업일자를 입력해주세요'),
  businessRegistrationNumber: z
    .string()
    .regex(/^\d{10}$/, '사업자등록번호는 10자리 숫자입니다'),
})

/** Step 1 탭2: 초대 코드 인증 */
export const step1InvitationCodeSchema = z.object({
  invitationCode: z.string().min(1, 'BP 코드를 입력해주세요'),
})

/** Step 3: 사업자 유형 선택 */
export const step3Schema = z.object({
  businessType: z.enum(['HEAD_OFFICE', 'FRANCHISE', 'GENERAL'], {
    message: '사업자 유형을 선택해주세요',
  }),
  mainMenu: z.string().optional(),
})

/** Step 4: 운영 정보 등록 */
export const step4Schema = z.object({
  headOfficeName: z.string().min(1, '업체명을 입력해주세요'),
  brandName: z.string().min(1, '브랜드명을 입력해주세요'),
  address1: z.string().min(1, '주소를 입력해주세요'),
  address2: z.string().optional(),
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  businessCategory: z.string().min(1, '영업 분류를 선택해주세요'),
})

/** Step 5: 마스터 ID 단독 검증 (실시간 validation용) */
export const step5MasterIdSchema = z
  .string()
  .min(8, '마스터 ID는 8자 이상이어야 합니다')
  .regex(/^[a-zA-Z0-9]+$/, '영문과 숫자만 사용 가능합니다')

/** Step 5: 비밀번호 단독 검증 (실시간 validation용) */
export const step5PasswordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다')
  .max(20, '비밀번호는 20자 이하여야 합니다')
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/,
    '영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다'
  )

/** Step 5: 마스터 계정 설정 */
export const step5Schema = z
  .object({
    masterId: z
      .string()
      .min(8, '마스터 ID는 8자 이상이어야 합니다')
      .regex(/^[a-zA-Z0-9]+$/, '영문과 숫자만 사용 가능합니다'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다')
      .max(20, '비밀번호는 20자 이하여야 합니다')
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/,
        '영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다'
      ),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  })

/** 타입 추출 */
export type Step1BusinessNumberForm = z.infer<typeof step1BusinessNumberSchema>
export type Step1InvitationCodeForm = z.infer<typeof step1InvitationCodeSchema>
export type Step3Form = z.infer<typeof step3Schema>
export type Step4Form = z.infer<typeof step4Schema>
export type Step5Form = z.infer<typeof step5Schema>
