'use client'

import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { Input, RadioButtonGroup, type RadioOption } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'

export interface PriceHistorySearchFilters {
  officeId: number | null
  franchiseId: number | null
  operationStatus: string
  menuClassificationCode: string
  menuName: string
  priceAppliedAtFrom: Date | null
  priceAppliedAtTo: Date | null
}

interface PriceHistorySearchProps {
  filters: PriceHistorySearchFilters
  appliedFilters: PriceHistorySearchFilters
  operationStatusOptions: RadioOption[]
  menuClassificationOptions: SelectOption[]
  officeNameMap: Map<number, string>
  operationStatusCodeMap: Map<string, string>
  menuClassCodeMap: Map<string, string>
  resultCount: number
  onChange: (next: Partial<PriceHistorySearchFilters>) => void
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

const PriceHistorySearch = ({
  filters,
  appliedFilters,
  operationStatusOptions,
  menuClassificationOptions,
  officeNameMap,
  operationStatusCodeMap,
  menuClassCodeMap,
  resultCount,
  onChange,
  onSearch,
  onReset,
  onRemoveFilter,
}: PriceHistorySearchProps) => {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showOfficeError, setShowOfficeError] = useState(false)

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string }[] = []
  if (appliedFilters.officeId != null) {
    const name = officeNameMap.get(appliedFilters.officeId)
    if (name) appliedTags.push({ key: 'office', value: name, category: '본사' })
  }
  if (appliedFilters.operationStatus) {
    const name = operationStatusCodeMap.get(appliedFilters.operationStatus)
    if (name) appliedTags.push({ key: 'operationStatus', value: name, category: '운영여부' })
  }
  if (appliedFilters.menuClassificationCode) {
    const name = menuClassCodeMap.get(appliedFilters.menuClassificationCode)
    if (name) appliedTags.push({ key: 'menuClassificationCode', value: name, category: '메뉴분류' })
  }
  if (appliedFilters.menuName) {
    appliedTags.push({ key: 'menuName', value: appliedFilters.menuName, category: '메뉴명' })
  }
  if (appliedFilters.priceAppliedAtFrom || appliedFilters.priceAppliedAtTo) {
    const from = formatDateLabel(appliedFilters.priceAppliedAtFrom)
    const to = formatDateLabel(appliedFilters.priceAppliedAtTo)
    appliedTags.push({ key: 'priceAppliedAt', value: `${from} ~ ${to}`, category: '반영일' })
  }

  const handleRemoveTag = (key: string) => {
    if (key === 'office') {
      onReset()
      setSearchOpen(true)
    } else {
      onRemoveFilter(key)
    }
  }

  const handleSearch = () => {
    if (!filters.officeId) {
      setShowOfficeError(true)
      return
    }
    onSearch()
    setSearchOpen(false)
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
        <button type="button" className="search-filed-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="검색 영역 열기/닫기"></button>
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
              {/* 1행: 본사*, 가맹점(disabled), 운영여부 */}
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  fields={['office']}
                  isHeadOfficeRequired={true}
                  showHeadOfficeError={showOfficeError}
                  headOfficeErrorMessage="필수 선택 조건입니다"
                  officeId={filters.officeId}
                  franchiseId={null}
                  storeId={null}
                  onChange={(next) => {
                    if (next.head_office) setShowOfficeError(false)
                    onChange({
                      officeId: next.head_office,
                    })
                  }}
                />
                <th>가맹점</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={[]}
                      value={null}
                      placeholder="전체"
                      isDisabled={true}
                    />
                  </div>
                </td>
                <th>운영여부</th>
                <td>
                  <div className="data-filed">
                    <RadioButtonGroup
                      options={operationStatusOptions}
                      value={filters.operationStatus}
                      onChange={(value) => onChange({ operationStatus: value })}
                    />
                  </div>
                </td>
              </tr>
              {/* 2행: 메뉴분류, 메뉴명, 반영일 */}
              <tr>
                <th>메뉴분류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={menuClassificationOptions}
                      value={menuClassificationOptions.find((opt) => opt.value === filters.menuClassificationCode) ?? null}
                      onChange={(opt) => onChange({ menuClassificationCode: opt?.value ?? '' })}
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
                <th>반영일</th>
                <td>
                  <RangeDatePicker
                    startDate={filters.priceAppliedAtFrom}
                    endDate={filters.priceAppliedAtTo}
                    onChange={(range: DateRange) => {
                      onChange({ priceAppliedAtFrom: range.startDate, priceAppliedAtTo: range.endDate })
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
            <button className="btn-form gray" onClick={onReset} type="button">
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

export default PriceHistorySearch
