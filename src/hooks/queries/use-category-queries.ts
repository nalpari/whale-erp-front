import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategories, createCategory, updateCategory, deleteCategory, updateCategoryOperationStatus, reorderCategories } from '@/lib/api/category'
import type { CategoryCreateRequest, CategoryUpdateRequest } from '@/lib/schemas/category'
import type { CategorySortOrderRequest, CategoryOperationStatusRequest } from '@/lib/api/category'
import type { CategorySearchParams } from '@/types/category'
import { categoryKeys } from '@/hooks/queries/query-keys'

/**
 * 카테고리 목록 조회
 */
export const useCategoryList = (params: CategorySearchParams, enabled = true) => {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: ({ signal }) => fetchCategories(params, signal),
    staleTime: 60 * 1000,
    enabled,
  })
}

/**
 * 카테고리 생성
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoryCreateRequest) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

/**
 * 카테고리 수정
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoryUpdateRequest) => updateCategory(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

/**
 * 카테고리 삭제
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

/**
 * 카테고리 운영 상태 변경
 */
export const useUpdateCategoryOperationStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoryOperationStatusRequest) => updateCategoryOperationStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

/**
 * 카테고리 순서 변경
 */
export const useReorderCategories = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategorySortOrderRequest[]) => reorderCategories(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}
