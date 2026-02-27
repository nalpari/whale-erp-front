'use client'

import { useState, useCallback, useMemo } from 'react'
import { useMasterCategoryList } from '@/hooks/queries/use-master-category-queries'
import SearchSelect from '@/components/ui/common/SearchSelect'
import type { CategoryResponse } from '@/types/menu'

interface SelectedCategory {
  id: number
  name: string
  isActive: boolean
}

interface CategorySelectSectionProps {
  bpId: number | null
  selectedCategories: SelectedCategory[]
  onChange: (categories: SelectedCategory[]) => void
  error?: string
}

export default function CategorySelectSection({
  bpId,
  selectedCategories,
  onChange,
  error,
}: CategorySelectSectionProps) {
  const [selectedOption, setSelectedOption] = useState<{ value: string; label: string } | null>(null)
  const { data: categories = [] } = useMasterCategoryList(bpId)

  const categoryOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []
    const flattenTree = (items: CategoryResponse[], depth: number) => {
      for (const item of items) {
        const prefix = depth > 1 ? `${'-'.repeat(depth - 1)} ` : ''
        options.push({ value: String(item.id), label: `${prefix}${item.categoryName}` })
        if (item.children?.length) {
          flattenTree(item.children, depth + 1)
        }
      }
    }
    flattenTree(categories, 1)
    return options
  }, [categories])

  const findCategory = useCallback(
    (id: number): SelectedCategory | null => {
      const find = (cats: CategoryResponse[]): CategoryResponse | null => {
        for (const cat of cats) {
          if (cat.id === id) return cat
          if (cat.children) {
            const found = find(cat.children)
            if (found) return found
          }
        }
        return null
      }
      const cat = find(categories)
      if (!cat) return null
      return { id: cat.id, name: cat.categoryName, isActive: cat.isActive }
    },
    [categories]
  )

  const handleAdd = useCallback(() => {
    if (!selectedOption) return
    const categoryId = Number(selectedOption.value)
    if (selectedCategories.some((c) => c.id === categoryId)) {
      alert('이미 추가된 카테고리입니다.')
      return
    }
    const category = findCategory(categoryId)
    if (!category) return
    onChange([...selectedCategories, category])
    setSelectedOption(null)
  }, [selectedOption, selectedCategories, findCategory, onChange])

  const handleRemove = useCallback(
    (id: number) => {
      onChange(selectedCategories.filter((c) => c.id !== id))
    },
    [selectedCategories, onChange]
  )

  return (
    <div className="slide-table-wrap">
      <h3>카테고리 정보</h3>
      <table className="default-table white">
        <colgroup>
          <col width="190px" />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <th>
              카테고리 선택 <span className="red">*</span>
            </th>
            <td>
              <div className="filed-flx">
                <div className="mx-500">
                  <SearchSelect
                    value={selectedOption}
                    options={categoryOptions}
                    placeholder="카테고리 선택"
                    isSearchable={true}
                    isClearable={true}
                    isDisabled={!bpId}
                    onChange={(option) => setSelectedOption(option)}
                  />
                </div>
                <button
                  type="button"
                  className="btn-form outline s"
                  onClick={handleAdd}
                  disabled={!selectedOption}
                >
                  추가
                </button>
              </div>
              {selectedCategories.length > 0 && (
                <ul className="category-list">
                  {selectedCategories.map((cat) => (
                    <li key={cat.id} className="category-item">
                      <span className="category-name">
                        {cat.name}
                        {!cat.isActive && <i> 미운영</i>}
                      </span>
                      <button
                        type="button"
                        className="file-delete"
                        onClick={() => handleRemove(cat.id)}
                        aria-label={`${cat.name} 삭제`}
                      ></button>
                    </li>
                  ))}
                </ul>
              )}
              {error && (
                <div className="warning-txt mt5">* {error}</div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
