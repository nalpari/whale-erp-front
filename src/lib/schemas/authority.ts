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
  can_read?: boolean
  can_create_delete?: boolean
  can_update?: boolean
  // 생성 모드에서 본인이 가진 최대 권한 (UI 제한용)
  max_can_read?: boolean
  max_can_create_delete?: boolean
  max_can_update?: boolean
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

// ============================================
// Zod 스키마
// ============================================

// 권한 생성 스키마
export const authorityCreateSchema = z.object({
  owner_code: z.enum(['PRGRP_001_001', 'PRGRP_002_001', 'PRGRP_002_002'], {
    message: '권한 소유를 선택해주세요',
  }),
  head_office_id: z.number().optional(),
  franchisee_id: z.number().optional(),
  name: z.string().min(2, '권한명은 2자 이상이어야 합니다'),
  is_used: z.boolean(),
  description: z.string().optional(),
  details: z.array(z.object({
    program_id: z.number(),
    can_read: z.boolean(),
    can_create_delete: z.boolean(),
    can_update: z.boolean(),
  })).optional(),
}).refine(
  (data) => {
    // 본사 권한인 경우 head_office_id 필수
    if (data.owner_code === 'PRGRP_002_001') {
      return !!data.head_office_id
    }
    return true
  },
  { message: '본사를 선택해주세요', path: ['head_office_id'] }
).refine(
  (data) => {
    // 가맹점 권한인 경우 head_office_id, franchisee_id 필수
    if (data.owner_code === 'PRGRP_002_002') {
      return !!data.head_office_id && !!data.franchisee_id
    }
    return true
  },
  { message: '본사와 가맹점을 선택해주세요', path: ['franchisee_id'] }
)

export type AuthorityCreateRequest = z.infer<typeof authorityCreateSchema>

// 권한 수정 스키마 (기본정보만)
export const authorityUpdateSchema = z.object({
  name: z.string().min(2, '권한명은 2자 이상이어야 합니다'),
  is_used: z.boolean(),
  description: z.string().optional(),
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
    can_read: z.boolean().optional(),
    can_create_delete: z.boolean().optional(),
    can_update: z.boolean().optional(),
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
