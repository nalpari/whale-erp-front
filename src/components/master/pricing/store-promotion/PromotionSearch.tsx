'use client'

import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { Input } from '@/components/common/ui'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'

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
  promotionStatusOptions: SelectOption[]
  resultCount: number
  onChange: (next: Partial<PromotionSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
}

export default function PromotionSearch({
  filters,
  promotionStatusOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
}: PromotionSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const handleMultiOffice = (isMulti: boolean) => {
    if (isMulti) {
      setSearchOpen(true)
      setShowOfficeError(true)
    } else {
      setShowOfficeError(false)
    }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <div className="search-result">
          검색결과<span>{resultCount.toLocaleString()}건</span>
        </div>
        <ul className="search-result-list" />
        <button className="search-filed-btn" onClick={() => setSearchOpen(!searchOpen)}></button>
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
