import { z } from 'zod'
import { apiResponseSchema, pagedApiResponseSchema } from '@/lib/schemas/api'

/**
 * 권한 관리 Zod 스키마 및 타입 정의
 */

// ============================================
// 타입 정의 (먼저 정의)
// ============================================

/**
 * 권한 상세 노드 (프로그램 트리)
 *
 * 백엔드에서:
 * - 실제 권한이 있는 프로그램: can_read/can_create_delete/can_update가 true/false
 * - 계층 구조상 필요한 상위 프로그램: 권한 필드가 null
 */
export interface AuthorityDetailNode {
  program_id: number
  program_name: string
  can_read?: boolean | null
  can_create_delete?: boolean | null
  can_update?: boolean | null
  children?: AuthorityDetailNode[]
}

/**
 * 권한 필터 타입 (프로그램 트리 하이라이트용)
 */
export type AuthorityFilterType = 'read' | 'create_delete' | 'update' | null

/**
 * 권한 목록 검색 파라미터
 */
export interface AuthoritySearchParams {
  owner_group: string // PRGRP_001 | PRGRP_002
  head_office_id?: number
  franchisee_id?: number
  name?: string
  is_used?: boolean
  page?: number
  size?: number
}

// AuthorityListItem, AuthorityResponse 타입은 Zod 스키마에서 추론 (하단 참조)

/**
 * 권한 소유 코드 타입
 */
export const OWNER_CODES = ['PRGRP_001_001', 'PRGRP_002_001', 'PRGRP_002_002'] as const
export type OwnerCode = typeof OWNER_CODES[number]

// ============================================
// Zod 스키마
// ============================================

// 권한 생성 스키마
// BE PR #141 — is_bp_master → is_subscription, kind_code → authority_kind, is_basic → is_default
// authority_kind 는 PRKND_001~004 필수, is_subscription 은 PLATFORM 전용, is_default 는 BP 전용
export const authorityCreateSchema = z.object({
  owner_code: z.enum(OWNER_CODES, {
    message: '권한 소유를 선택해주세요',
  }),
  head_office_id: z.number().optional(),
  franchisee_id: z.number().optional(),
  name: z.string().min(2, '권한명은 2자 이상이어야 합니다'),
  is_subscription: z.boolean().nullable().optional(),
  plan_type_code: z.string().optional(),
  // PLATFORM 페이지에서 본사·가맹점 owner_code 선택 시 권한 종류 row 가 숨겨지므로 optional 허용.
  // 값이 있으면 PRKND_001~004 형식이라 min(1) 유지. validateForm 에서 가시 조건 시 사용자 입력 강제.
  authority_kind: z.string().min(1, '권한 종류를 선택해주세요').optional(),
  is_default: z.boolean().nullable().optional(),
  is_used: z.boolean(),
  description: z.string().optional(),
  details: z.array(z.object({
    program_id: z.number(),
    can_read: z.boolean(),
    can_create_delete: z.boolean(),
    can_update: z.boolean(),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.is_subscription && !data.plan_type_code) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['plan_type_code'],
      message: '요금제를 선택해주세요',
    })
  }

  // 구독 권한이 아닌데 plan_type_code가 있으면 차단
  if (!data.is_subscription && data.plan_type_code) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['plan_type_code'],
      message: '구독 권한이 아닌 경우 요금제 설정 불가',
    })
  }

  // 본사 권한인 경우 head_office_id 필수
  if (data.owner_code === 'PRGRP_002_001' && !data.head_office_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['head_office_id'],
      message: '본사를 선택해주세요',
    })
  }

  // 가맹점 권한인 경우 head_office_id, franchisee_id 필수
  if (data.owner_code === 'PRGRP_002_002') {
    if (!data.head_office_id || !data.franchisee_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['franchisee_id'],
        message: '본사와 가맹점을 선택해주세요',
      })
    }
  }

  // PR #97 코드리뷰 #2/#5 — PLATFORM/BP 교차검증
  // 클라이언트 가드(useAuthorityForm.handleSave) 와 별개로 schema 단에서도 검증하여 변조/회귀 차단.
  // 진짜 방어선은 BE 가드이며 이 superRefine 은 회귀 방지/UX 차원.
  const isPlatformOwner = data.owner_code === 'PRGRP_001_001'
  if (!isPlatformOwner) {
    // 본사·가맹점 권한 — is_subscription / plan_type_code 는 PLATFORM 전용
    // (authority_kind PRKND_001 은 BE 명세상 "본사 BP" 종류이므로 본사 owner 에서 정상 사용됨)
    if (data.is_subscription === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['is_subscription'],
        message: '구독 권한은 플랫폼 전용입니다',
      })
    }
    if (data.plan_type_code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['plan_type_code'],
        message: '요금제는 플랫폼 전용입니다',
      })
    }
  } else {
    // PLATFORM 권한 — is_default 는 본사·가맹점 전용
    if (data.is_default === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['is_default'],
        message: '기초 권한은 본사·가맹점 전용입니다',
      })
    }
  }
})

export type AuthorityCreateRequest = z.infer<typeof authorityCreateSchema>

// 권한 수정 스키마
// BE PR #141 — is_bp_master, plan_type_code 는 수정 불가로 제거
// authority_kind / is_default 는 수정 허용 (선택)
export const authorityUpdateSchema = z.object({
  name: z.string().min(2, '권한명은 2자 이상이어야 합니다'),
  is_used: z.boolean(),
  description: z.string().optional(),
  authority_kind: z.string().optional(),
  is_default: z.boolean().nullable().optional(),
})

export type AuthorityUpdateRequest = z.infer<typeof authorityUpdateSchema>

// 프로그램 권한 수정 스키마
export const authorityDetailUpdateSchema = z.object({
  can_read: z.boolean(),
  can_create_delete: z.boolean(),
  can_update: z.boolean(),
})

export type AuthorityDetailUpdateRequest = z.infer<typeof authorityDetailUpdateSchema>

// 응답 스키마 - 재귀 구조 (프로그램 트리)
export const authorityDetailNodeSchema: z.ZodType<AuthorityDetailNode> = z.lazy(() =>
  z.object({
    program_id: z.number(),
    program_name: z.string(),
    can_read: z.boolean().nullable().optional(),
    can_create_delete: z.boolean().nullable().optional(),
    can_update: z.boolean().nullable().optional(),
    children: z.array(authorityDetailNodeSchema).optional(),
  })
)

export const authorityListItemSchema = z.object({
  id: z.number(),
  owner_code: z.string(),
  owner_group: z.string(),
  head_office_id: z.number().nullable(),
  head_office_code: z.string().nullable(),
  head_office_name: z.string().nullable(),
  franchisee_id: z.number().nullable(),
  franchisee_code: z.string().nullable(),
  franchisee_name: z.string().nullable(),
  name: z.string(),
  // BE PR #141 — is_bp_master → is_subscription (nullable, PLATFORM 전용)
  is_subscription: z.boolean().nullable(),
  plan_type_code: z.string().nullable(),
  // BE PR #141 — kind_code → authority_kind, is_basic → is_default
  authority_kind: z.string().nullable().optional(),
  is_default: z.boolean().nullable().optional(),
  is_used: z.boolean(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type AuthorityListItem = z.infer<typeof authorityListItemSchema>

export const authorityResponseSchema = authorityListItemSchema.extend({
  details: z.array(authorityDetailNodeSchema),
})

export type AuthorityResponse = z.infer<typeof authorityResponseSchema>

export const authorityListResponseSchema = pagedApiResponseSchema(authorityListItemSchema)

export const authorityDetailResponseSchema = apiResponseSchema(authorityResponseSchema)

// 직원 BP 권한 스키마 (GET /api/employee/info/{id}/bp-authorities)
export const employeeBpAuthoritySchema = z.object({
  id: z.number(),
  name: z.string(),
})

export type EmployeeBpAuthority = z.infer<typeof employeeBpAuthoritySchema>

export const employeeBpAuthorityListResponseSchema = apiResponseSchema(z.array(employeeBpAuthoritySchema))

// 권한 목록 조회 (조직별) 응답용 아이템 스키마
export const authorityItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  owner_code: z.string(),
  is_used: z.boolean(),
  description: z.string().optional(),
  head_office_id: z.number().nullable().optional(),
  franchisee_id: z.number().nullable().optional(),
})

export type AuthorityItem = z.infer<typeof authorityItemSchema>

export const authorityItemListResponseSchema = apiResponseSchema(
  z.object({ content: z.array(authorityItemSchema) })
)

// 권한 후보 응답 스키마 (직원 초대 / BP 수정 selectbox 옵션 용도).
// BE 가 신규 endpoint /system/authorities/employee-invitation, /system/authorities/bp-edit 에서 반환.
// 응답 케이스: camelCase (기존 authorityItemSchema 의 snake_case 와 다름).
export const authorityCandidateSchema = z.object({
  id: z.number(),
  name: z.string(),
  authorityKind: z.string(),
  authorityKindName: z.string(),
  ownerCode: z.string(),
  planTypeCode: z.string().nullable(),
  isDefault: z.boolean().nullable(),
  isSubscription: z.boolean().nullable(),
  isUsed: z.boolean(),
})

export type AuthorityCandidate = z.infer<typeof authorityCandidateSchema>

export const authorityCandidateListResponseSchema = apiResponseSchema(z.array(authorityCandidateSchema))
