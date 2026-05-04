'use client'

import '@/components/common/custom-css/FormHelper.css'
import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { useBpHeadOfficeTree, useStoreOptions } from '@/hooks/queries'

export interface HolidaySearchFilters {
  year: number | null
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  holidayType?: 'LEGAL' | 'PARTNER' | null
}

interface HolidaySearchProps {
  filters: HolidaySearchFilters
  appliedFilters: HolidaySearchFilters
  resultCount: number
  onChange: (next: Partial<HolidaySearchFilters>) => void
  onSearch: () => void
  onReset: () => void
  onRemoveFilter: (key: string) => void
  onAutoSelect?: (value: { head_office: number | null; franchise: number | null; store: number | null }) => void
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

export default function HolidaySearch({
  filters,
  appliedFilters,
  resultCount,
  onChange,
  onSearch,
  onReset,
  onRemoveFilter,
  onAutoSelect,
}: HolidaySearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [showYearError, setShowYearError] = useState(false)

  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const { data: storeOptionsList = [] } = useStoreOptions(
    appliedFilters.officeId ?? null,
    appliedFilters.franchiseId ?? null,
    appliedFilters.officeId != null
  )

  // 검색 조건 태그
  // - year(필수값): filters 기준 — x 클릭 시 즉시 사라지고, 검색 버튼에서 필수 체크
  // - office/franchise/store: appliedFilters 기준 — 검색 적용 후의 조건만 표시
  // (변수명 appliedTags지만 year만 미적용 상태 반영. 향후 displayedTags로 리팩토링 검토)
  const appliedTags: { key: string; value: string; category: string }[] = []
  if (filters.year != null) {
    appliedTags.push({ key: 'year', value: `${filters.year}년`, category: '연도' })
  }
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

  const handleRemoveTag = (key: string) => {
    if (key === 'year') {
      setShowYearError(true)
      setSearchOpen(true)
    }
    onRemoveFilter(key)
  }

  const handleSearch = () => {
    if (!filters.year) {
      setShowYearError(true)
      return
    }
    setShowYearError(false)
    onSearch()
    setSearchOpen(false)
  }

  const handleReset = () => {
    setShowYearError(false)
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
          type="button"
          className="search-filed-btn"
          aria-label={searchOpen ? '검색 조건 닫기' : '검색 조건 열기'}
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
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={false}
                  officeId={filters.officeId ?? null}
                  franchiseId={filters.franchiseId ?? null}
                  storeId={filters.storeId ?? null}
                  onChange={(next) => {
                    // 본사/가맹점 변경 시 점포값 유지, 점포 직접 삭제(x) 시에는 null 적용
                    const isOrgChanged = next.head_office !== filters.officeId || next.franchise !== filters.franchiseId
                    onChange({
                      officeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: isOrgChanged ? (next.store ?? filters.storeId) : next.store,
                    })
                  }}
                  onAutoSelect={onAutoSelect}
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
                <td colSpan={4} style={{ backgroundColor: '#fff' }}></td>
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
