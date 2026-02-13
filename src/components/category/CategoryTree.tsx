'use client'

import { useState } from 'react'
import type { Category } from '@/types/category'
import DraggableTree, { type DragHandleProps } from '@/components/common/DraggableTree'
import CategoryFormModal from '@/components/category/CategoryFormModal'
import type { CategoryFormData } from '@/lib/schemas/category'

interface CategoryTreeProps {
  categories: Category[]
  onCreateCategory: (parentId: number | null, data: CategoryFormData, bpId: number, franchiseId: number | null) => void
  onUpdateCategory: (id: number, data: CategoryFormData) => void
  onDeleteCategory: (id: number, categoryName: string) => void
  onToggleActive: (categoryIds: number[], isActive: boolean) => void
  onReorder: (parentId: number | null, reorderedItems: Category[]) => void
  bpId: number | null
  franchiseId: number | null
}

function buildActiveMap(categories: Category[]): Map<number, boolean> {
  const map = new Map<number, boolean>()
  for (const cat of categories) {
    if (cat.id !== null) map.set(cat.id, cat.isActive)
    for (const child of cat.children) {
      if (child.id !== null) map.set(child.id, child.isActive)
    }
  }
  return map
}

export default function CategoryTree({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleActive,
  onReorder,
  bpId,
  franchiseId,
}: CategoryTreeProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(() => {
    const ids = new Set<number>()
    for (const cat of categories) {
      if (cat.id !== null) ids.add(cat.id)
    }
    return ids
  })

  const [activeMap, setActiveMap] = useState<Map<number, boolean>>(() => buildActiveMap(categories))

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [modalCategory, setModalCategory] = useState<Category | null>(null)

  const toggleItem = (id: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const openModal = (mode: 'create' | 'edit', category?: Category) => {
    setModalMode(mode)
    setModalCategory(category ?? null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalCategory(null)
  }

  const handleSubmit = (data: CategoryFormData) => {
    if (modalMode === 'create') {
      const parentId = modalCategory?.id ?? null
      onCreateCategory(parentId, data, bpId!, franchiseId ?? null)
    } else if (modalMode === 'edit' && modalCategory?.id !== null && modalCategory?.id !== undefined) {
      onUpdateCategory(modalCategory.id, data)
    }
    closeModal()
  }

  const getParentCategory = (): Category | undefined => {
    if (modalMode === 'create' && modalCategory) {
      return modalCategory
    }
    if (modalMode === 'edit' && modalCategory?.parentCategoryId) {
      return categories.find((cat) => cat.id === modalCategory.parentCategoryId)
    }
    return undefined
  }

  const renderCategoryItem = (
    category: Category,
    depth: number,
    dragHandleProps: DragHandleProps,
    hasChildren: boolean,
    isOpen: boolean,
  ) => {
    // 대분류(depth=1)만 하위 추가 가능, 소분류(depth=2)는 불가
    const canAddChild = category.depth < 2
    const isActive = category.id !== null ? (activeMap.get(category.id) ?? category.isActive) : category.isActive

    return (
      <div className={`hierarchy-item ${!isActive ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}>
        <div className="hierarchy-depth">
          <button
            className="order-btn"
            aria-label="순서 변경"
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
          ></button>
          <div className="depth-inner">
            {hasChildren ? (
              <button
                className="depth-arr"
                onClick={() => category.id !== null && toggleItem(category.id)}
                aria-label="하위 카테고리 토글"
              ></button>
            ) : null}
            <div className="depth-name">{category.categoryName}</div>
          </div>
          <div className="depth-right">
            <span style={{ fontSize: '13px', color: isActive ? '#2563eb' : '#9ca3af', marginRight: '8px' }}>
              {isActive ? '운영' : '미운영'}
            </span>
            <div
              className="toggle-btn"
              onClick={() => {
                if (category.id === null) return
                const newValue = !isActive
                const targetIds: number[] = [category.id]
                for (const child of category.children) {
                  if (child.id !== null) targetIds.push(child.id)
                }
                setActiveMap((prev) => {
                  const next = new Map(prev)
                  for (const id of targetIds) {
                    next.set(id, newValue)
                  }
                  return next
                })
                onToggleActive(targetIds, newValue)
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                readOnly
              />
              <label className="slider"></label>
            </div>
            <div className="depth-btn-wrap">
              {canAddChild ? (
                <button
                  className="depth-btn create"
                  aria-label="하위 카테고리 추가"
                  onClick={() => openModal('create', category)}
                ></button>
              ) : null}
              <button
                className="depth-btn edit"
                aria-label="카테고리 수정"
                onClick={() => openModal('edit', category)}
              ></button>
              <button
                className="depth-btn delete"
                aria-label="카테고리 삭제"
                onClick={() => category.id !== null && onDeleteCategory(category.id, category.categoryName)}
              ></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="content-wrap">
        <div className="data-list-header">
          <div className="hierarchy-bx">
            <div className="hierarchy-tit">카테고리 계층 관리</div>
            <div className="hierarchy-txt">드래그 앤 드롭을 사용하여 동일 레벨 내 순서를 변경할 수 있습니다.</div>
          </div>
          <div className="data-header-right">
            <button className="btn-form gray s" onClick={() => setOpenItems(new Set())}>
              All Close
            </button>
            <button className="btn-form basic s" onClick={() => openModal('create')}>
              <i className="plus"></i> 대분류 추가
            </button>
          </div>
        </div>
        <div className="hierarchy-wrap">
          {categories.length === 0 ? (
            <div>등록된 카테고리가 없습니다.</div>
          ) : (
            <DraggableTree
              items={categories}
              openItems={openItems}
              renderItem={renderCategoryItem}
              onReorder={onReorder}
            />
          )}
        </div>
      </div>
      <CategoryFormModal
        key={isModalOpen ? `${modalMode}-${modalCategory?.id || 'new'}` : 'closed'}
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        parentName={getParentCategory()?.categoryName}
        parentCode={getParentCategory()?.categoryCode ?? undefined}
        editData={modalMode === 'edit' ? modalCategory : null}
      />
    </>
  )
}
