'use client'

import '@/components/common/custom-css/FormHelper.css'
import AnimateHeight from 'react-animate-height'
import { useMemo, useState } from 'react'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { RadioButtonGroup } from '@/components/common/ui'
import Input from '@/components/common/ui/Input'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import type { Category } from '@/types/category'

export interface StoreMenuSearchFilters {
  officeId?: number | null
  storeId?: number | null
  menuName: string
  operationStatus: string
  menuType: string
  menuClassificationCode: string
  categoryId?: number | null
  from: Date | null
  to: Date | null
}

export interface SearchTag {
  key: keyof StoreMenuSearchFilters
  label: string
  removable?: boolean
}

interface StoreMenuSearchProps {
  filters: StoreMenuSearchFilters
  operationStatusOptions: { value: string; label: string }[]
  menuTypeOptions: { value: string; label: string }[]
  menuClassificationOptions: { value: string; label: string }[]
  categories: Category[]
  resultCount: number
  appliedTags: SearchTag[]
  onChange: (next: Partial<StoreMenuSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
  onRemoveTag: (key: keyof StoreMenuSearchFilters) => void
  onClearAllTags: () => void
}

/** 라벨에서 괄호 앞 텍스트(파란색)와 괄호 텍스트(검은색)를 분리 */
function splitLabel(label: string) {
  const idx = label.lastIndexOf(' (')
  if (idx === -1) return { value: label, suffix: '' }
  return { value: label.slice(0, idx), suffix: label.slice(idx) }
}

export default function StoreMenuSearch({
  filters,
  operationStatusOptions,
  menuTypeOptions,
  menuClassificationOptions,
  categories,
  resultCount,
  appliedTags,
  onChange,
  onSearch,
  onReset,
  onRemoveTag,
  onClearAllTags,
}: StoreMenuSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const statusRadioOptions = useMemo(
    () => [{ value: 'ALL', label: '전체' }, ...operationStatusOptions],
    [operationStatusOptions]
  )

  const menuTypeRadioOptions = useMemo(
    () => [{ value: 'ALL', label: '전체' }, ...menuTypeOptions],
    [menuTypeOptions]
  )

  const classificationSelectOptions: SelectOption[] = useMemo(
    () => menuClassificationOptions.map((opt) => ({ value: opt.value, label: opt.label })),
    [menuClassificationOptions]
  )

  const categorySelectOptions: SelectOption[] = useMemo(
    () =>
      categories.map((cat) => ({
        value: String(cat.id),
        label: cat.categoryName,
      })),
    [categories]
  )

  const handleSearch = () => {
    const hasOfficeError = !filters.officeId
    setShowOfficeError(hasOfficeError)
    if (hasOfficeError) return
    onSearch()
    setSearchOpen(false)
  }

  const handleReset = () => {
    setShowOfficeError(false)
    onReset()
  }

  const removableTags = appliedTags.filter((t) => t.removable !== false)

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <div className="search-result">
          검색결과 <span>{resultCount}건</span>
        </div>
        <ul
          className="search-result-list"
          style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', whiteSpace: 'nowrap' }}
        >
          {appliedTags.map((tag, i) => {
            const { value, suffix } = splitLabel(tag.label)
            return (
              <li
                key={tag.key}
                style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, fontSize: '16px', listStyle: 'none' }}
              >
                {i > 0 && <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>}
                <span style={{ color: '#2563eb', marginLeft: '4px' }}>{value}</span>
                {suffix && <span style={{ color: '#111827' }}>{suffix}</span>}
                {tag.removable !== false && (
                  <button
                    type="button"
                    style={{ marginLeft: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', flexShrink: 0, borderRadius: '50%', color: '#9ca3af', border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={() => onRemoveTag(tag.key)}
                  >
                    &times;
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', flexShrink: 0 }}>
          {removableTags.length > 0 && (
            <button
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '35px', height: '35px', borderRadius: '50%', color: '#9ca3af', border: '1px solid #d1d5db', background: 'none', cursor: 'pointer', fontSize: '25px', lineHeight: 1 }}
              onClick={onClearAllTags}
              title="전체삭제"
            >
              &times;
            </button>
          )}
          <button
            className="search-filed-btn"
            style={{ marginLeft: 0 }}
            onClick={() => setSearchOpen(!searchOpen)}
          />
        </div>
      </div>
      <AnimateHeight duration={300} height={searchOpen ? 'auto' : 0}>
        <div className="search-filed">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              {/* 본사 / 점포 / 메뉴명 */}
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={true}
                  showHeadOfficeError={showOfficeError}
                  fields={['office', 'store']}
                  officeId={filters.officeId ?? null}
                  franchiseId={null}
                  storeId={filters.storeId ?? null}
                  onChange={(next) => {
                    if (next.head_office) {
                      setShowOfficeError(false)
                    }
                    onChange({
                      officeId: next.head_office,
                      storeId: next.store,
                    })
                  }}
                />
                <th>메뉴명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      type="text"
                      placeholder="메뉴명을 입력하세요"
                      value={filters.menuName}
                      onChange={(e) => onChange({ menuName: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch()
                      }}
                      showClear
                      onClear={() => onChange({ menuName: '' })}
                    />
                  </div>
                </td>
              </tr>

              {/* 메뉴 분류 / 카테고리 / 운영여부 */}
              <tr>
                <th>메뉴 분류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={classificationSelectOptions}
                      value={
                        classificationSelectOptions.find(
                          (opt) => opt.value === filters.menuClassificationCode
                        ) || null
                      }
                      onChange={(opt) =>
                        onChange({ menuClassificationCode: opt?.value || '' })
                      }
                      placeholder="전체"
                      isClearable={true}
                    />
                  </div>
                </td>
                <th>카테고리</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={categorySelectOptions}
                      value={
                        filters.categoryId
                          ? categorySelectOptions.find(
                              (opt) => opt.value === String(filters.categoryId)
                            ) || null
                          : null
                      }
                      onChange={(opt) =>
                        onChange({
                          categoryId: opt ? Number(opt.value) : null,
                        })
                      }
                      placeholder="전체"
                      isClearable={true}
                      isSearchable={true}
                    />
                  </div>
                </td>
                <th>운영여부</th>
                <td>
                  <RadioButtonGroup
                    className="filed-check-flx"
                    name="operationStatus"
                    options={statusRadioOptions}
                    value={filters.operationStatus}
                    onChange={(nextValue) => onChange({ operationStatus: nextValue })}
                  />
                </td>
              </tr>

              {/* 등록일 / 메뉴 타입 */}
              <tr>
                <th>등록일</th>
                <td>
                  <RangeDatePicker
                    startDate={filters.from}
                    endDate={filters.to}
                    onChange={(range: DateRange) => {
                      onChange({ from: range.startDate, to: range.endDate })
                    }}
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
                  />
                </td>
                <th>메뉴 타입</th>
                <td colSpan={3}>
                  <RadioButtonGroup
                    className="filed-check-flx"
                    name="menuType"
                    options={menuTypeRadioOptions}
                    value={filters.menuType}
                    onChange={(nextValue) => onChange({ menuType: nextValue })}
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
