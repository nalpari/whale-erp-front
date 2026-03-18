'use client'

import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { Input } from '@/components/common/ui'
import RadioButtonGroup, { type RadioOption } from '@/components/common/ui/RadioButtonGroup'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import type { BpSearchFilters } from '@/types/bp'

interface BpMasterSearchProps {
  filters: BpSearchFilters
  appliedFilters: BpSearchFilters
  operationStatusOptions: RadioOption[]
  subscriptionPlanOptions: SelectOption[]
  franchiseOptions: SelectOption[]
  officeNameMap: Map<number, string>
  operationStatusCodeMap: Map<string, string>
  subscriptionPlanCodeMap: Map<string, string>
  resultCount: number
  onChange: (next: Partial<BpSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
  onRemoveFilter: (key: string) => void
  onInviteFranchise: () => void
}

const formatDateLabel = (date: Date | null): string => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const BpMasterSearch = ({
  filters,
  appliedFilters,
  operationStatusOptions,
  subscriptionPlanOptions,
  franchiseOptions,
  officeNameMap,
  operationStatusCodeMap,
  subscriptionPlanCodeMap,
  resultCount,
  onChange,
  onSearch,
  onReset,
  onRemoveFilter,
  onInviteFranchise,
}: BpMasterSearchProps) => {
  const [searchOpen, setSearchOpen] = useState(true)

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string }[] = []
  if (appliedFilters.officeId != null) {
    const name = officeNameMap.get(appliedFilters.officeId)
    if (name) appliedTags.push({ key: 'office', value: name, category: '본사' })
  }
  if (appliedFilters.bpoprType) {
    const name = operationStatusCodeMap.get(appliedFilters.bpoprType)
    if (name) appliedTags.push({ key: 'bpoprType', value: name, category: '운영여부' })
  }
  if (appliedFilters.subscriptionPlanType) {
    const name = subscriptionPlanCodeMap.get(appliedFilters.subscriptionPlanType)
    if (name) appliedTags.push({ key: 'subscriptionPlanType', value: name, category: '구독정보' })
  }
  if (appliedFilters.representativeName) {
    appliedTags.push({ key: 'representativeName', value: appliedFilters.representativeName, category: '대표자명' })
  }
  if (appliedFilters.createdAtFrom || appliedFilters.createdAtTo) {
    const from = formatDateLabel(appliedFilters.createdAtFrom)
    const to = formatDateLabel(appliedFilters.createdAtTo)
    appliedTags.push({ key: 'createdAt', value: `${from} ~ ${to}`, category: '등록일' })
  }

  const handleRemoveTag = (key: string) => {
    onRemoveFilter(key)
  }

  const handleSearch = () => {
    onSearch()
    setSearchOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="invite-btn al-r mb10">
        <button className="btn-form basic" onClick={onInviteFranchise} type="button">
          가맹점 초대
        </button>
      </div>
      <div className="search-result-wrap">
        <ul className="search-result-list">
          {appliedTags.map((tag) => (
            <li key={tag.key} className="search-result-item">
              <div className="search-result-item-txt">
                <span>{tag.value}</span> ({tag.category})
              </div>
              <button
                type="button"
                className="search-result-item-btn"
                onClick={() => handleRemoveTag(tag.key)}
                aria-label={`${tag.category} 필터 제거`}
              ></button>
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
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="검색 영역 열기/닫기"
        ></button>
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
              {/* 1행: 본사*, 가맹점, 대표자명 */}
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  fields={['office']}
                  isHeadOfficeRequired={false}
                  officeId={filters.officeId}
                  franchiseId={null}
                  storeId={null}
                  onChange={(next) => {
                    onChange({
                      officeId: next.head_office,
                      franchiseId: null,
                    })
                  }}
                />
                <th>가맹점</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={franchiseOptions}
                      value={franchiseOptions.find((opt) => opt.value === String(filters.franchiseId)) ?? null}
                      onChange={(opt) => onChange({ franchiseId: opt ? Number(opt.value) : null })}
                      placeholder="전체"
                      isClearable
                      isDisabled={!filters.officeId}
                    />
                  </div>
                </td>
                <th>대표자명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      placeholder="대표자명 입력"
                      value={filters.representativeName}
                      onChange={(e) => onChange({ representativeName: e.target.value })}
                      onKeyDown={handleKeyDown}
                      showClear
                      onClear={() => onChange({ representativeName: '' })}
                    />
                  </div>
                </td>
              </tr>
              {/* 2행: 운영여부, 구독정보, 등록일 */}
              <tr>
                <th>운영여부</th>
                <td>
                  <div className="data-filed">
                    <RadioButtonGroup
                      options={operationStatusOptions}
                      value={filters.bpoprType}
                      onChange={(value) => onChange({ bpoprType: value })}
                    />
                  </div>
                </td>
                <th>구독정보</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={subscriptionPlanOptions}
                      value={subscriptionPlanOptions.find((opt) => opt.value === filters.subscriptionPlanType) ?? null}
                      onChange={(opt) => onChange({ subscriptionPlanType: opt?.value ?? '' })}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
                <th>등록일</th>
                <td>
                  <RangeDatePicker
                    startDate={filters.createdAtFrom}
                    endDate={filters.createdAtTo}
                    onChange={(range: DateRange) => {
                      onChange({ createdAtFrom: range.startDate, createdAtTo: range.endDate })
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

export default BpMasterSearch
