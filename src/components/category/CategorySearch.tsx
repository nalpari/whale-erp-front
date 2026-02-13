'use client'

import '@/components/common/custom-css/FormHelper.css'
import AnimateHeight from 'react-animate-height'
import { useState } from 'react'

import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { RadioButtonGroup } from '@/components/common/ui'

export interface CategorySearchFilters {
  officeId?: number | null
  categoryName: string
  level?: number | null // 1=대분류, 2=소분류
  isActive?: string // 'all' | 'true' | 'false'
}

interface CategorySearchProps {
  filters: CategorySearchFilters
  resultCount: number
  onChange: (next: Partial<CategorySearchFilters>) => void
  onSearch: () => void
  onReset: () => void
}

export default function CategorySearch({
  filters,
  resultCount,
  onChange,
  onSearch,
  onReset,
}: CategorySearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const handleSearch = () => {
    const hasOfficeError = !filters.officeId
    setShowOfficeError(hasOfficeError)
    if (hasOfficeError) {
      return
    }
    onSearch()
  }

  const handleReset = () => {
    setShowOfficeError(false)
    onReset()
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <div className="search-result">
          검색결과<span>{resultCount}건</span>
        </div>
        <ul className="search-result-list" />
        <button className="search-filed-btn" onClick={() => setSearchOpen((prev) => !prev)}></button>
      </div>
      <AnimateHeight duration={300} height={searchOpen ? 'auto' : 0}>
        <div className="search-filed">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={true}
                  showHeadOfficeError={showOfficeError}
                  fields={['office']}
                  officeId={filters.officeId ?? null}
                  franchiseId={null}
                  storeId={null}
                  onChange={(next) => {
                    if (next.head_office) {
                      setShowOfficeError(false)
                    }
                    onChange({
                      officeId: next.head_office,
                    })
                  }}
                />
                <th>카테고리명</th>
                <td>
                  <div className="data-filed" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className="select-form"
                      style={{ width: '120px', flexShrink: 0 }}
                      value={filters.level ?? 1}
                      onChange={(e) => {
                        onChange({ level: Number(e.target.value) })
                      }}
                    >
                      <option value="1">대분류</option>
                      <option value="2">소분류</option>
                    </select>
                    <input
                      type="text"
                      className="input-frame"
                      placeholder="카테고리명 입력"
                      value={filters.categoryName}
                      onChange={(e) => onChange({ categoryName: e.target.value })}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <th>운영여부</th>
                <td colSpan={3}>
                  <RadioButtonGroup
                    options={[
                      { value: 'all', label: '전체' },
                      { value: 'true', label: '운영' },
                      { value: 'false', label: '미운영' },
                    ]}
                    value={filters.isActive ?? 'all'}
                    onChange={(value) => onChange({ isActive: value })}
                    name="category-isActive"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray" onClick={() => setSearchOpen(false)} type="button">
              닫기
            </button>
            <button className="btn-form gray" onClick={handleReset} type="button">
              초기화
            </button>
            <button className="btn-form basic" onClick={handleSearch} type="button">
              검색
            </button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
