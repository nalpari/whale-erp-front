'use client'

import { useState } from 'react'

import CategorySearch, { type CategorySearchFilters } from '@/components/category/CategorySearch'
import CategoryTree from '@/components/category/CategoryTree'
import { useCategoryList, useCreateCategory, useUpdateCategory, useDeleteCategory, useUpdateCategoryOperationStatus, useReorderCategories } from '@/hooks/queries/use-category-queries'
import type { CategorySearchParams, Category } from '@/types/category'
import type { CategoryFormData } from '@/lib/schemas/category'
import { getErrorMessage } from '@/lib/api'

const INITIAL_FILTERS: CategorySearchFilters = {
  officeId: null,
  categoryName: '',
  level: 1,
  isActive: 'all',
}

export default function CategoryManage() {
  const [filters, setFilters] = useState<CategorySearchFilters>({ ...INITIAL_FILTERS })
  const [searchParams, setSearchParams] = useState<CategorySearchParams | null>(null)
  const [searched, setSearched] = useState(false)

  const { data: categories = [], isPending } = useCategoryList(
    searchParams ?? { depth: 1 },
    searched && searchParams !== null,
  )

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()
  const operationStatusMutation = useUpdateCategoryOperationStatus()
  const reorderMutation = useReorderCategories()

  const handleSearch = () => {
    const params: CategorySearchParams = {
      bpId: filters.officeId ?? undefined,
      categoryName: filters.categoryName || undefined,
      depth: filters.level === 2 ? 2 : 1,
      isActive: filters.isActive === 'all' ? undefined : filters.isActive === 'true',
    }
    setSearchParams(params)
    setSearched(true)
  }

  const handleReset = () => {
    setFilters({ ...INITIAL_FILTERS })
    setSearchParams(null)
    setSearched(false)
  }

  const handleCreateCategory = async (
    parentId: number | null,
    data: CategoryFormData,
    bpId: number,
  ) => {
    let maxSortOrder = 0
    if (parentId) {
      const parent = categories.find((cat) => cat.id === parentId)
      for (const child of parent?.children ?? []) {
        if (child.sortOrder > maxSortOrder) maxSortOrder = child.sortOrder
      }
    } else {
      for (const cat of categories) {
        if (cat.sortOrder > maxSortOrder) maxSortOrder = cat.sortOrder
      }
    }

    try {
      await createMutation.mutateAsync({
        parentCategoryId: parentId,
        categoryName: data.categoryName,
        depth: parentId ? 2 : 1,
        sortOrder: maxSortOrder + 1,
        isActive: data.isActive,
        isFixed: data.isFixed,
        bpId,
      })
    } catch (error) {
      alert(getErrorMessage(error, '카테고리 생성에 실패했습니다.'))
    }
  }

  const handleUpdateCategory = async (id: number, data: CategoryFormData) => {
    const bpId = filters.officeId
    if (!bpId) return
    try {
      await updateMutation.mutateAsync({
        id,
        bpId,
        categoryName: data.categoryName,
        isActive: data.isActive,
        isFixed: data.isFixed,
      })
    } catch (error) {
      alert(getErrorMessage(error, '카테고리 수정에 실패했습니다.'))
    }
  }

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      alert(getErrorMessage(error, '카테고리 삭제에 실패했습니다.'))
    }
  }

  const handleToggleActive = async (categoryIds: number[], isActive: boolean) => {
    const bpId = filters.officeId
    if (!bpId) return
    try {
      await operationStatusMutation.mutateAsync({ bpId, categoryIds, isActive })
    } catch (error) {
      alert(getErrorMessage(error, '운영 상태 변경에 실패했습니다.'))
    }
  }

  const handleReorder = async (parentId: number | null, reorderedItems: Category[]) => {
    const bpId = filters.officeId
    if (!bpId) return

    const sortOrders = reorderedItems
      .filter((item): item is Category & { id: number } => item.id !== null)
      .map((item, index) => ({
        bpId,
        categoryId: item.id,
        sortOrder: index + 1,
      }))

    try {
      await reorderMutation.mutateAsync(sortOrders)
    } catch (error) {
      alert(getErrorMessage(error, '카테고리 순서 변경에 실패했습니다.'))
    }
  }

  // 전체 카테고리 수 계산 (대분류 + 소분류)
  const totalCount = categories.reduce(
    (acc, cat) => acc + 1 + (cat.children?.length ?? 0),
    0,
  )

  return (
    <div className="contents-wrap">
      <div className="contents-body">
        <CategorySearch
          filters={filters}
          resultCount={searched ? totalCount : 0}
          onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
          onSearch={handleSearch}
          onReset={handleReset}
        />
        {searched ? (
          isPending ? (
            <div className="content-wrap">
              <div></div>
            </div>
          ) : (
            <CategoryTree
              categories={categories}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onToggleActive={handleToggleActive}
              onReorder={handleReorder}
              bpId={filters.officeId ?? null}
            />
          )
        ) : (
          <div className="content-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        )}
      </div>
    </div>
  )
}
