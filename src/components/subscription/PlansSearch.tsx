'use client'

import { useMemo } from 'react'
import AnimateHeight from 'react-animate-height'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { Input } from '@/components/common/ui'
import { useCommonCodeHierarchy } from '@/hooks/queries'
import { usePlansSearchStore } from '@/stores/plans-search-store'

interface PlansSearchProps {
  resultCount: number
}

export default function PlansSearch({ resultCount }: PlansSearchProps) {
  const filters = usePlansSearchStore((s) => s.filters)
  const appliedFilters = usePlansSearchStore((s) => s.appliedFilters)
  const searchOpen = usePlansSearchStore((s) => s.searchOpen)
  const setFilters = usePlansSearchStore((s) => s.setFilters)
  const applyFilters = usePlansSearchStore((s) => s.applyFilters)
  const setSearchOpen = usePlansSearchStore((s) => s.setSearchOpen)
  const removeFilter = usePlansSearchStore((s) => s.removeFilter)
  const reset = usePlansSearchStore((s) => s.reset)

  const { data: planTypeCodes = [] } = useCommonCodeHierarchy('PLNTYP')

  const planTypeOptions = useMemo<SelectOption[]>(() =>
    planTypeCodes.map((code) => ({ label: code.name, value: code.code })),
  [planTypeCodes])

  const planTypeCodeMap = useMemo(() => {
    const map = new Map<string, string>()
    planTypeCodes.forEach((code) => map.set(code.code, code.name))
    return map
  }, [planTypeCodes])

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string }[] = []
  if (appliedFilters.planType) {
    const name = planTypeCodeMap.get(appliedFilters.planType)
    if (name) appliedTags.push({ key: 'planType', value: name, category: '요금제명' })
  }
  if (appliedFilters.updater) {
    appliedTags.push({ key: 'updater', value: appliedFilters.updater, category: '수정자' })
  }

  const handleSearch = () => {
    applyFilters()
    setSearchOpen(false)
  }

  const handleReset = () => {
    reset()
  }

  const handleRemoveTag = (key: string) => {
    removeFilter(key)
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
            </colgroup>
            <tbody>
              <tr>
                <th>요금제명</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={planTypeOptions}
                      value={planTypeOptions.find((opt) => opt.value === filters.planType) ?? null}
                      onChange={(opt) => setFilters({ planType: opt?.value ?? '' })}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
                <th>수정자</th>
                <td>
                  <div className="data-filed">
                    <Input
                      placeholder="수정자 입력"
                      value={filters.updater}
                      onChange={(e) => setFilters({ updater: e.target.value })}
                      onKeyDown={handleKeyDown}
                      showClear
                      onClear={() => setFilters({ updater: '' })}
                    />
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
