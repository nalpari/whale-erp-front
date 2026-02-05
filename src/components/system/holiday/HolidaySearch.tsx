'use client'

import '@/components/common/custom-css/FormHelper.css'
import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'

export interface HolidaySearchFilters {
  year: number | null
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  holidayType?: 'LEGAL' | 'PARTNER' | null
}

interface HolidaySearchProps {
  filters: HolidaySearchFilters
  resultCount: number
  onChange: (next: Partial<HolidaySearchFilters>) => void
  onSearch: () => void
  onReset: () => void
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

export default function HolidaySearch({
  filters,
  resultCount,
  onChange,
  onSearch,
  onReset,
}: HolidaySearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showYearError, setShowYearError] = useState(false)

  const handleSearch = () => {
    if (!filters.year) {
      setShowYearError(true)
      return
    }
    setShowYearError(false)
    onSearch()
  }

  const handleReset = () => {
    setShowYearError(false)
    onReset()
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="searh-result-wrap">
        <div className="search-result">
          검색결과<span>{resultCount}건</span>
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
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={false}
                  officeId={filters.officeId ?? null}
                  franchiseId={filters.franchiseId ?? null}
                  storeId={filters.storeId ?? null}
                  onChange={(next) => {
                    onChange({
                      officeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: next.store,
                    })
                  }}
                />
              </tr>
              <tr>
                <th>연도 <span className="red">*</span></th>
                <td>
                  <div className="data-filed">
                    <select
                      className="select-form"
                      value={filters.year ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        onChange({ year: val ? Number(val) : null })
                        if (val) setShowYearError(false)
                      }}
                    >
                      <option value="">선택</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}년
                        </option>
                      ))}
                    </select>
                    {showYearError && !filters.year && (
                      <span className="warning-txt">※ 필수 입력 항목입니다.</span>
                    )}
                  </div>
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
