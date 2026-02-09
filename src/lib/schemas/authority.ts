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
 */
export interface AuthorityDetailNode {
  program_id: number
  program_name: string
  can_read: boolean
  can_create_delete: boolean
  can_update: boolean
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
  head_office_code?: string
  franchisee_code?: string
  name?: string
  is_used?: boolean
  page?: number
  size?: number
}

/**
 * 권한 목록 아이템
 */
export interface AuthorityListItem {
  id: number
  owner_code: string
  owner_group: string
  head_office_code: string | null
  franchisee_code: string | null
  name: string
  is_used: boolean
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * 권한 상세 응답 (프로그램 트리 포함)
 */
export interface AuthorityResponse extends AuthorityListItem {
  details: AuthorityDetailNode[]
}

// ============================================
// Zod 스키마
// ============================================

// 권한 생성 스키마
export const authorityCreateSchema = z.object({
  owner_code: z.enum(['PRGRP_001_001', 'PRGRP_002_001', 'PRGRP_002_002'], {
    message: '권한 소유를 선택해주세요',
  }),
  head_office_code: z.string().optional(),
  franchisee_code: z.string().optional(),
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
    // 본사 권한인 경우 head_office_code 필수
    if (data.owner_code === 'PRGRP_002_001') {
      return !!data.head_office_code
    }
    return true
  },
  { message: '본사를 선택해주세요', path: ['head_office_code'] }
).refine(
  (data) => {
    // 가맹점 권한인 경우 head_office_code, franchisee_code 필수
    if (data.owner_code === 'PRGRP_002_002') {
      return !!data.head_office_code && !!data.franchisee_code
    }
    return true
  },
  { message: '본사와 가맹점을 선택해주세요', path: ['franchisee_code'] }
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
    can_read: z.boolean(),
    can_create_delete: z.boolean(),
    can_update: z.boolean(),
    children: z.array(authorityDetailNodeSchema).optional(),
  })
)

export const authorityListItemSchema = z.object({
  id: z.number(),
  owner_code: z.string(),
  owner_group: z.string(),
  head_office_code: z.string().nullable(),
  franchisee_code: z.string().nullable(),
  name: z.string(),
  is_used: z.boolean(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const authorityResponseSchema = authorityListItemSchema.extend({
  details: z.array(authorityDetailNodeSchema),
})

export const authorityListResponseSchema = pagedApiResponseSchema(authorityListItemSchema)

export const authorityDetailResponseSchema = apiResponseSchema(authorityResponseSchema)
