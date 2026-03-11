'use client'

import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { Input } from '@/components/common/ui'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import { useBpHeadOfficeTree, useStoreOptions } from '@/hooks/queries'

export interface PromotionSearchFilters {
  officeId: number | null
  franchiseId: number | null
  storeId: number | null
  promotionStatus: string
  menuName: string
  from: Date | null
  to: Date | null
}

interface PromotionSearchProps {
  filters: PromotionSearchFilters
  appliedFilters: PromotionSearchFilters
  promotionStatusOptions: SelectOption[]
  resultCount: number
  onChange: (next: Partial<PromotionSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
  onRemoveFilter: (key: string) => void
}

const formatDateLabel = (date: Date | null): string => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function PromotionSearch({
  filters,
  appliedFilters,
  promotionStatusOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
  onRemoveFilter,
}: PromotionSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const { data: storeOptionsList = [] } = useStoreOptions(
    appliedFilters.officeId,
    appliedFilters.franchiseId,
    appliedFilters.officeId != null
  )

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string }[] = []
  if (appliedFilters.officeId != null) {
    const name = bpTree.find((o) => o.id === appliedFilters.officeId)?.name
    if (name) appliedTags.push({ key: 'office', value: name, category: '본사' })
  }
  if (appliedFilters.franchiseId != null) {
    const franchise = bpTree.flatMap((o) => o.franchises).find((f) => f.id === appliedFilters.franchiseId)
    if (franchise) appliedTags.push({ key: 'franchise', value: franchise.name, category: '가맹점' })
  }
  if (appliedFilters.storeId != null) {
    const store = storeOptionsList.find((s) => s.id === appliedFilters.storeId)
    if (store) appliedTags.push({ key: 'store', value: store.storeName, category: '점포' })
  }
  if (appliedFilters.promotionStatus) {
    const label = promotionStatusOptions.find((o) => o.value === appliedFilters.promotionStatus)?.label
    if (label) appliedTags.push({ key: 'promotionStatus', value: label, category: '프로모션 상태' })
  }
  if (appliedFilters.menuName) {
    appliedTags.push({ key: 'menuName', value: appliedFilters.menuName, category: '메뉴명' })
  }
  if (appliedFilters.from || appliedFilters.to) {
    const from = formatDateLabel(appliedFilters.from)
    const to = formatDateLabel(appliedFilters.to)
    appliedTags.push({ key: 'date', value: `${from} ~ ${to}`, category: '프로모션 기간' })
  }

  const handleRemoveTag = (key: string) => {
    if (key === 'office') {
      setShowOfficeError(true)
      setSearchOpen(true)
    }
    onRemoveFilter(key)
  }

  const handleMultiOffice = (isMulti: boolean) => {
    if (isMulti) {
      setSearchOpen(true)
      setShowOfficeError(true)
    } else {
      setShowOfficeError(false)
    }
  }

  const handleSearch = () => {
    const hasOfficeError = filters.officeId == null
    setShowOfficeError(hasOfficeError)
    if (hasOfficeError) return
    onSearch()
    setSearchOpen(false)
  }

  const handleReset = () => {
    setShowOfficeError(false)
    onReset()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
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
              <button type="button" className="search-result-item-btn" onClick={() => handleRemoveTag(tag.key)} aria-label={`${tag.category} 필터 제거`}></button>
            </li>
          ))}
          <li className="search-result-item">
            <div className="search-result-item-txt">
              <span>{resultCount.toLocaleString()}건</span>
            </div>
          </li>
        </ul>
        <button
          className="search-filed-btn"
          aria-label={searchOpen ? '검색 조건 닫기' : '검색 조건 열기'}
          aria-expanded={searchOpen}
          aria-controls="promotion-search-panel"
          onClick={() => setSearchOpen(!searchOpen)}
        />
      </div>
      <AnimateHeight duration={300} height={searchOpen ? 'auto' : 0}>
        <div className="search-filed" id="promotion-search-panel">
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
              {/* 1행: 본사*, 가맹점, 점포 */}
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={true}
                  showHeadOfficeError={showOfficeError}
                  officeId={filters.officeId}
                  franchiseId={filters.franchiseId}
                  storeId={filters.storeId}
                  onChange={(next) => {
                    if (next.head_office) setShowOfficeError(false)
                    onChange({
                      officeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: next.store,
                    })
                  }}
                  onMultiOffice={handleMultiOffice}
                />
              </tr>
              {/* 2행: 프로모션 상태, 메뉴명, 프로모션 기간 */}
              <tr>
                <th>프로모션 상태</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={promotionStatusOptions}
                      value={promotionStatusOptions.find((opt) => opt.value === filters.promotionStatus) ?? null}
                      onChange={(opt) => onChange({ promotionStatus: opt?.value ?? '' })}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
                <th>메뉴명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      placeholder="메뉴명 입력"
                      value={filters.menuName}
                      onChange={(e) => onChange({ menuName: e.target.value })}
                      onKeyDown={handleKeyDown}
                      showClear
                      onClear={() => onChange({ menuName: '' })}
                    />
                  </div>
                </td>
                <th>프로모션 기간</th>
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
