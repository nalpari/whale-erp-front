import { z } from 'zod'
import { apiResponseSchema, pageResponseSchema } from '@/lib/schemas/api'
import { loginIdRegex } from '@/lib/schemas/admin'

export const adminTypeSchema = z.enum(['HEAD_OFFICE', 'FRANCHISE'])
export type AdminType = z.infer<typeof adminTypeSchema>

export const bpAdminItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  adminType: adminTypeSchema,
  headOfficeOrganizationId: z.number().nullable(),
  headOfficeOrganizationName: z.string().nullable(),
  franchiseOrganizationId: z.number().nullable(),
  franchiseOrganizationName: z.string().nullable(),
  authorityId: z.number().nullable(),
  authorityName: z.string().nullable(),
  loginId: z.string(),
  userType: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.string().nullable(),
})

export const bpAdminDetailSchema = bpAdminItemSchema.extend({
  department: z.string().nullable(),
  rank: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  officePhone: z.string().nullable(),
  extensionNumber: z.string().nullable(),
})

export type BpAdminItem = z.infer<typeof bpAdminItemSchema>
export type BpAdminDetail = z.infer<typeof bpAdminDetailSchema>

export const bpAdminListResponseSchema = apiResponseSchema(pageResponseSchema(bpAdminItemSchema))
export const bpAdminDetailResponseSchema = apiResponseSchema(bpAdminDetailSchema)
export const bpAdminIdCheckResponseSchema = apiResponseSchema(z.object({ available: z.boolean() }))

export const bpAdminCreateRequestSchema = z.object({
  adminType: adminTypeSchema,
  headOfficeOrganizationId: z.number(),
  franchiseOrganizationId: z.number().nullable(),
  name: z.string().min(1, '이름을 입력해주세요.'),
  userType: z.string(),
  department: z.string().optional().nullable(),
  rank: z.string(),
  mobilePhone: z.string().optional().nullable(),
  officePhone: z.string().optional().nullable(),
  extensionNumber: z.string().optional().nullable(),
  loginId: z.string().regex(loginIdRegex, '로그인 ID 형식이 올바르지 않습니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  authorityId: z.number(),
  email: z.string().email('이메일 형식이 올바르지 않습니다.'),
})

export const bpAdminUpdateRequestSchema = bpAdminCreateRequestSchema
  .omit({ loginId: true, password: true })
  .extend({
    password: z.string().min(8).optional().nullable(),
  })

export type BpAdminCreateRequest = z.infer<typeof bpAdminCreateRequestSchema>
export type BpAdminUpdateRequest = z.infer<typeof bpAdminUpdateRequestSchema>

export const bpAdminAuthorityCandidateSchema = z.object({
  id: z.number(),
  name: z.string(),
  authorityKind: z.string().nullable(),
  authorityKindName: z.string().nullable(),
  isUsed: z.boolean(),
})

export type BpAdminAuthorityCandidate = z.infer<typeof bpAdminAuthorityCandidateSchema>

export const bpAdminAuthorityCandidateListResponseSchema = apiResponseSchema(
  z.array(bpAdminAuthorityCandidateSchema),
)
