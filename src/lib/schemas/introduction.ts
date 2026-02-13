import { z } from 'zod'

export const introductionFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.'),
  businessType: z.string(),
  phone: z.string()
    .min(1, '휴대전화번호를 입력해 주세요.')
    .regex(/^\d{10,11}$/, '휴대전화번호는 10~11자리로 입력해 주세요.'),
  mainMenu: z.string().min(1, '주력메뉴를 입력해 주세요.'),
  email: z.string()
    .min(1, '이메일을 입력해 주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  interestedServices: z.array(z.string()).min(1, '관심 서비스를 선택해 주세요.'),
  content: z.string().min(1, '문의사항을 입력해 주세요.'),
  privacyAgreed: z.boolean().refine((val) => val === true, {
    message: '개인정보 수집 및 이용 동의를 동의해 주세요.',
  }),
})

export type IntroductionFormState = z.infer<typeof introductionFormSchema>
