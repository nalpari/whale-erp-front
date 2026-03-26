'use client'

import '@/components/common/custom-css/FormHelper.css'
import AnimateHeight from 'react-animate-height'
import { useMemo, useState } from 'react'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import HeadOfficeFranchiseStoreSelect, { type OfficeFranchiseStoreValue } from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { RadioButtonGroup } from '@/components/common/ui'
import Input from '@/components/common/ui/Input'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useCategoryList } from '@/hooks/queries/use-category-queries'
import { useBpHeadOfficeTree, useStoreOptions } from '@/hooks/queries'
import type { Category } from '@/types/category'
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'

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
  appliedFilters: StoreMenuSearchFilters
  operationStatusOptions: { value: string; label: string }[]
  menuTypeOptions: { value: string; label: string }[]
  menuClassificationOptions: { value: string; label: string }[]
  resultCount: number
  onChange: (next: Partial<StoreMenuSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
  onRemoveFilter: (key: string) => void
  onAutoSelect?: (value: OfficeFranchiseStoreValue) => void
}

const formatDateLabel = (date: Date | null): string => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function StoreMenuSearch({
  filters,
  appliedFilters,
  operationStatusOptions,
  menuTypeOptions,
  menuClassificationOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
  onRemoveFilter,
  onAutoSelect,
}: StoreMenuSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const ownerCode = useAuthStore((s) => s.ownerCode)
  const isOfficeFixed = ownerCode === OWNER_CODE.HEAD_OFFICE || ownerCode === OWNER_CODE.FRANCHISE

  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const { data: storeOptionsList = [] } = useStoreOptions(
    appliedFilters.officeId ?? null,
    null,
    appliedFilters.officeId != null
  )

  const handleMultiOffice = (isMulti: boolean) => {
    if (isMulti && appliedFilters.officeId == null) {
      setSearchOpen(true)
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

  const classificationSelectOptions: SelectOption[] = menuClassificationOptions

  // 카테고리 목록 조회 (본사 선택 시만 활성화, depth=1 고정)
  const { data: categories = [] } = useCategoryList(
    { bpId: filters.officeId ?? undefined, depth: 1 },
    !!filters.officeId
  )

  // appliedFilters 기준 카테고리 조회 (태그 이름 표시용)
  const { data: appliedCategories = [] } = useCategoryList(
    { bpId: appliedFilters.officeId ?? undefined, depth: 1 },
    !!appliedFilters.officeId
  )

  // 카테고리 이름 원문 맵 (필터 드롭다운 표시용)
  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    const collect = (items: Category[]) => {
      for (const item of items) {
        if (item.id != null) {
          map[String(item.id)] = item.categoryName
        }
        if (item.children?.length) collect(item.children)
      }
    }
    collect(categories)
    return map
  }, [categories])

  // appliedFilters 기준 카테고리 이름 맵 (태그 표시용)
  const appliedCategoryNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    const collect = (items: Category[]) => {
      for (const item of items) {
        if (item.id != null) {
          map[String(item.id)] = item.categoryName
        }
        if (item.children?.length) collect(item.children)
      }
    }
    collect(appliedCategories)
    return map
  }, [appliedCategories])

  // 카테고리 트리를 평탄화하여 드롭다운 옵션 생성 (depth별 들여쓰기로 계층 표현)
  const categorySelectOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = []
    const flattenTree = (items: Category[], depth: number) => {
      for (const item of items.filter((i) => i.id != null)) {
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

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string; removable?: boolean }[] = []
  if (appliedFilters.officeId != null) {
    const name = bpTree.find((o) => o.id === appliedFilters.officeId)?.name
    if (name) appliedTags.push({ key: 'office', value: name, category: '본사', removable: !isOfficeFixed })
  }
  if (appliedFilters.storeId != null) {
    const store = storeOptionsList.find((s) => s.id === appliedFilters.storeId)
    if (store) appliedTags.push({ key: 'store', value: store.storeName, category: '점포' })
  }
  if (appliedFilters.menuName) {
    appliedTags.push({ key: 'menuName', value: appliedFilters.menuName, category: '메뉴명' })
  }
  if (appliedFilters.operationStatus && appliedFilters.operationStatus !== 'ALL') {
    const label = operationStatusOptions.find((o) => o.value === appliedFilters.operationStatus)?.label
    if (label) appliedTags.push({ key: 'operationStatus', value: label, category: '운영여부' })
  }
  if (appliedFilters.menuType && appliedFilters.menuType !== 'ALL') {
    const label = menuTypeOptions.find((o) => o.value === appliedFilters.menuType)?.label
    if (label) appliedTags.push({ key: 'menuType', value: label, category: '메뉴 타입' })
  }
  if (appliedFilters.menuClassificationCode) {
    const label = menuClassificationOptions.find((o) => o.value === appliedFilters.menuClassificationCode)?.label
    if (label) appliedTags.push({ key: 'menuClassificationCode', value: label, category: '메뉴 분류' })
  }
  if (appliedFilters.categoryId != null) {
    const name = appliedCategoryNameMap[String(appliedFilters.categoryId)]
    if (name) appliedTags.push({ key: 'categoryId', value: name, category: '카테고리' })
  }
  if (appliedFilters.from || appliedFilters.to) {
    const from = formatDateLabel(appliedFilters.from)
    const to = formatDateLabel(appliedFilters.to)
    appliedTags.push({ key: 'date', value: `${from} ~ ${to}`, category: '등록일' })
  }

  const handleRemoveTag = (key: string) => {
    if (key === 'office') {
      setShowOfficeError(true)
      setSearchOpen(true)
    }
    onRemoveFilter(key)
  }

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
        <ul className="search-result-list">
          {appliedTags.map((tag) => (
            <li key={tag.key} className="search-result-item">
              <div className="search-result-item-txt">
                <span>{tag.value}</span> ({tag.category})
              </div>
              {tag.removable !== false && (
                <button type="button" className="search-result-item-btn" onClick={() => handleRemoveTag(tag.key)} aria-label={`${tag.category} 필터 제거`}></button>
              )}
            </li>
          ))}
          <li className="search-result-item">
            <div className="search-result-item-txt">
              <span>{resultCount.toLocaleString()}건</span>
            </div>
          </li>
        </ul>
        <button
          type="button"
          className="search-filed-btn"
          aria-label={searchOpen ? '검색 조건 닫기' : '검색 조건 열기'}
          aria-expanded={searchOpen}
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
                    // 본사 변경 시 점포값 유지 (공통 컴포넌트가 store: null로 보내도 기존값 복원)
                    const updates: Partial<StoreMenuSearchFilters> = {
                      officeId: next.head_office,
                      storeId: next.store ?? filters.storeId,
                    }
                    // 본사 변경 시 카테고리 초기화
                    if (next.head_office !== undefined && next.head_office !== filters.officeId) {
                      updates.categoryId = null
                    }
                    onChange(updates)
                  }}
                  onMultiOffice={handleMultiOffice}
                  onAutoSelect={onAutoSelect}
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
