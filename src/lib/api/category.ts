import api, { getWithSchema, postWithSchema, putWithSchema } from '@/lib/api'
import type { Category } from '@/types/category'
import type { CategorySearchParams } from '@/types/category'
import type { CategoryCreateRequest, CategoryUpdateRequest } from '@/lib/schemas/category'
import { categoryListResponseSchema, categoryResponseSchema } from '@/lib/schemas/category'

export interface CategorySortOrderRequest {
  bpId: number
  categoryId: number
  sortOrder: number
}

/**
 * 카테고리 목록 조회
 */
export async function fetchCategories(params: CategorySearchParams, signal?: AbortSignal): Promise<Category[]> {
  const response = await getWithSchema('/api/master/category/master', categoryListResponseSchema, {
    params,
    signal,
  })
  return response.data
}

/**
 * 카테고리 생성
 */
export async function createCategory(data: CategoryCreateRequest): Promise<Category> {
  const response = await postWithSchema('/api/master/category/master', data, categoryResponseSchema)
  return response.data
}

/**
 * 카테고리 수정
 */
export async function updateCategory(id: number, data: CategoryUpdateRequest): Promise<Category> {
  const response = await putWithSchema(`/api/master/category/master/${id}`, data, categoryResponseSchema)
  return response.data
}

/**
 * 카테고리 삭제
 */
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/api/master/category/master/${id}`)
}

export interface CategoryOperationStatusRequest {
  bpId: number
  categoryIds: number[]
  isActive: boolean
}

/**
 * 카테고리 운영 상태 변경
 */
export async function updateCategoryOperationStatus(data: CategoryOperationStatusRequest): Promise<void> {
  await api.patch('/api/master/category/master/operation-status', data)
}

/**
 * 카테고리 순서 변경
 */
export async function reorderCategories(data: CategorySortOrderRequest[]): Promise<void> {
  await api.patch('/api/master/category/master/sort-orders', data)
}
