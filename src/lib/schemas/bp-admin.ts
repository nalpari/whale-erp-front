import { z } from 'zod'
import { apiResponseSchema, pageResponseSchema } from '@/lib/schemas/api'

export const adminTypeSchema = z.enum(['HEAD_OFFICE', 'FRANCHISE'])
export type AdminType = z.infer<typeof adminTypeSchema>

// 목록 item — 마스킹된 응답
export const bpAdminItemSchema = z.object({
  id: z.number(),
  memberId: z.number().nullable(),
  name: z.string(),
  loginId: z.string(),
  userType: z.string().nullable(),
  userTypeName: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  email: z.string().nullable(),
  organizationId: z.number(),
  organizationName: z.string(),
  organizationType: adminTypeSchema,
  parentOrganizationName: z.string().nullable(),
  authorityId: z.number().nullable(),
  authorityName: z.string().nullable(),
  storeId: z.number().nullish(),
  storeName: z.string().nullish(),
  createdAt: z.string().nullable(),
})

// 상세 — 원본 + 메타
export const bpAdminDetailSchema = bpAdminItemSchema.extend({
  department: z.string().nullable(),
  rank: z.string().nullable(),
  officePhone: z.string().nullable(),
  extensionNumber: z.string().nullable(),
  createdByName: z.string().nullable(),
  createdByLoginId: z.string().nullable(),
  updatedByName: z.string().nullable(),
  updatedByLoginId: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export type BpAdminItem = z.infer<typeof bpAdminItemSchema>
export type BpAdminDetail = z.infer<typeof bpAdminDetailSchema>

export const bpAdminListResponseSchema = apiResponseSchema(pageResponseSchema(bpAdminItemSchema))
export const bpAdminDetailResponseSchema = apiResponseSchema(bpAdminDetailSchema)

// check-login-id: data 는 boolean (true=중복)
export const bpAdminIdCheckResponseSchema = apiResponseSchema(z.boolean())

// 비밀번호 초기화: data = { password: string }
export const bpAdminResetPasswordResponseSchema = apiResponseSchema(
  z.object({ password: z.string() }),
)

// 등록 요청
export const bpAdminCreateRequestSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  userType: z.string().min(1, '근무여부를 선택해주세요.'),
  department: z.string().optional().nullable(),
  rank: z.string().optional().nullable(),
  mobilePhone: z
    .string()
    .min(1, '휴대폰 번호를 입력해주세요.')
    .regex(/^\d{10,11}$/, '유효하지 않은 전화번호입니다.'),
  officePhone: z.string().optional().nullable(),
  extensionNumber: z.string().optional().nullable(),
  loginId: z
    .string()
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      'ID는 영문과 숫자를 포함하여 8자 이상이어야 합니다.',
    ),
  password: z
    .string()
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
      '비밀번호는 영문, 숫자, 특수문자를 조합하여 8자 이상이어야 합니다.',
    ),
  email: z.string().email('이메일 형식이 올바르지 않습니다.').optional().nullable(),
  organizationId: z.number({ message: '소속 조직을 선택해주세요.' }),
  authorityId: z.number({ message: '권한을 선택해주세요.' }),
  storeId: z.number().nullable().optional(),
})

// 수정 요청 — loginId/password/organizationId 제외
export const bpAdminUpdateRequestSchema = bpAdminCreateRequestSchema.omit({
  loginId: true,
  password: true,
  organizationId: true,
})

export type BpAdminCreateRequest = z.infer<typeof bpAdminCreateRequestSchema>
export type BpAdminUpdateRequest = z.infer<typeof bpAdminUpdateRequestSchema>

// 권한 후보 (authority-options)
export const bpAdminAuthorityCandidateSchema = z.object({
  id: z.number(),
  name: z.string(),
})
export type BpAdminAuthorityCandidate = z.infer<typeof bpAdminAuthorityCandidateSchema>
export const bpAdminAuthorityCandidateListResponseSchema = apiResponseSchema(
  z.array(bpAdminAuthorityCandidateSchema),
)

// 조직 후보 (organization-options) — 신규
export const bpAdminOrganizationOptionSchema = z.object({
  organizationId: z.number(),
  organizationName: z.string(),
  organizationType: adminTypeSchema,
  parentOrganizationName: z.string().nullable(),
})
export type BpAdminOrganizationOption = z.infer<typeof bpAdminOrganizationOptionSchema>
export const bpAdminOrganizationOptionListResponseSchema = apiResponseSchema(
  z.array(bpAdminOrganizationOptionSchema),
)
