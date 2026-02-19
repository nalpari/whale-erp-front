import { z } from 'zod'
import { apiResponseSchema } from './api'
import type { Category } from '@/types/category'

/**
 * 카테고리 스키마 (API 응답 형태)
 * 재귀적 구조: 대분류 > 소분류
 */
export const categorySchema: z.ZodType<Category> = z.object({
  id: z.number().nullable(),
  bpId: z.number(),
  companyName: z.string(),
  categoryCode: z.string().nullable(),
  categoryName: z.string(),
  depth: z.number(),
  parentCategoryId: z.number().nullable(),
  isFixed: z.boolean(),
  isActive: z.boolean(),
  isDeleted: z.boolean(),
  sortOrder: z.number(),
  createdBy: z.number(),
  updatedBy: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  children: z.lazy(() => z.array(categorySchema)).default([]),
})

/**
 * 카테고리 목록 응답 스키마 (ApiResponse<List<Category>>)
 */
export const categoryListResponseSchema = apiResponseSchema(z.array(categorySchema))

/**
 * 카테고리 단일 응답 스키마 (ApiResponse<Category>)
 */
export const categoryResponseSchema = apiResponseSchema(categorySchema)

/**
 * 카테고리 폼 밸리데이션 스키마 (생성/수정 공통)
 */
export const categoryFormSchema = z.object({
  categoryName: z.string().trim().min(1, '※ 필수 입력입니다.'),
  isActive: z.boolean(),
  isFixed: z.boolean(),
})

/**
 * 카테고리 폼 데이터
 */
export type CategoryFormData = z.infer<typeof categoryFormSchema>

/**
 * 카테고리 생성 요청 (API)
 */
export interface CategoryCreateRequest {
  parentCategoryId: number | null
  categoryName: string
  depth: number
  sortOrder: number
  isActive: boolean
  isFixed: boolean
  bpId: number
}

/**
 * 카테고리 수정 요청 (API)
 */
export interface CategoryUpdateRequest {
  id: number
  bpId: number
  categoryName?: string
  isActive?: boolean
  isFixed?: boolean
}
