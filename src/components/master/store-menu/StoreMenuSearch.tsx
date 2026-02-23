'use client'

import '@/components/common/custom-css/FormHelper.css'
import AnimateHeight from 'react-animate-height'
import { useMemo, useState } from 'react'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { RadioButtonGroup } from '@/components/common/ui'
import Input from '@/components/common/ui/Input'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useCategoryList } from '@/hooks/queries/use-category-queries'
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

interface StoreMenuSearchProps {
  filters: StoreMenuSearchFilters
  operationStatusOptions: { value: string; label: string }[]
  menuTypeOptions: { value: string; label: string }[]
  menuClassificationOptions: { value: string; label: string }[]
  resultCount: number
  onChange: (next: Partial<StoreMenuSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
}

export default function StoreMenuSearch({
  filters,
  operationStatusOptions,
  menuTypeOptions,
  menuClassificationOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
}: StoreMenuSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const handleMultiOffice = (isMulti: boolean) => {
    if (isMulti) {
      setSearchOpen(true)
      setShowOfficeError(true)
    }
  }

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

  // 카테고리 목록 조회 (본사 선택 시만 활성화, depth=1 고정)
  const { data: categories = [] } = useCategoryList(
    { bpId: filters.officeId ?? undefined, depth: 1 },
    !!filters.officeId
  )

  // 카테고리 이름 원문 맵 (선택된 값 표시용)
  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    const collect = (items: Category[]) => {
      for (const item of items) {
        map[String(item.id)] = item.categoryName
        if (item.children?.length) collect(item.children)
      }
    }
    collect(categories)
    return map
  }, [categories])

  // 카테고리 트리를 평탄화하여 드롭다운 옵션 생성 (depth별 들여쓰기로 계층 표현)
  const categorySelectOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = []
    const flattenTree = (items: Category[], depth: number) => {
      for (const item of items) {
        const prefix = depth > 1 ? '\u00A0\u00A0\u00A0'.repeat(depth - 1) : ''
        options.push({
          value: String(item.id),
          label: `${prefix}${item.categoryName}`,
        })
        if (item.children?.length) {
          flattenTree(item.children, depth + 1)
        }
      }
    }
    flattenTree(categories, 1)
    return options
  }, [categories])

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

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <div className="search-result">
          검색결과 <span>{resultCount}건</span>
        </div>
        <ul className="search-result-list">
          <li />
        </ul>
        <button
          className="search-filed-btn"
          onClick={() => setSearchOpen(!searchOpen)}
        />
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
                    const updates: Partial<StoreMenuSearchFilters> = {
                      officeId: next.head_office,
                      storeId: next.store,
                    }
                    // 본사 변경 시 카테고리 초기화
                    if (next.head_office !== undefined && next.head_office !== filters.officeId) {
                      updates.categoryId = null
                    }
                    onChange(updates)
                  }}
                  onMultiOffice={handleMultiOffice}
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
                          ? { value: String(filters.categoryId), label: categoryNameMap[String(filters.categoryId)] ?? '' }
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
                      isDisabled={!filters.officeId}
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
