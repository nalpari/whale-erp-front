'use client'
import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import DatePicker from '@/components/ui/common/DatePicker'
import HeadOfficeFranchiseStoreSelect from '@/components/ui/common/HeadOfficeFranchiseStoreSelect'

// 점포 검색 필터 상태
export interface StoreSearchFilters {
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  status: 'ALL' | string
  from: Date | null
  to: Date | null
}

// 셀렉트 옵션 공통 타입
// 검색 영역 컴포넌트 props
interface StoreSearchProps {
  filters: StoreSearchFilters
  statusOptions: { value: string; label: string }[]
  resultCount: number
  onChange: (next: Partial<StoreSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
}

// 점포 목록 검색 영역
export default function StoreSearch({
  filters,
  statusOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
}: StoreSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
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
                  officeId={filters.officeId ?? null}
                  franchiseId={filters.franchiseId ?? null}
                  storeId={filters.storeId ?? null}
                  onChange={(next) =>
                    onChange({
                      officeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: next.store,
                    })
                  }
                />
              </tr>
              <tr>
                <th>운영여부</th>
                <td>
                  <div className="filed-check-flx">
                    <div className="radio-form-box">
                      <input
                        type="radio"
                        name="status"
                        id="status-all"
                        checked={filters.status === 'ALL'}
                        onChange={() => onChange({ status: 'ALL' })}
                      />
                      <label htmlFor="status-all">전체</label>
                    </div>
                    {statusOptions.map((option) => (
                      <div className="radio-form-box" key={option.value}>
                        <input
                          type="radio"
                          name="status"
                          id={`status-${option.value}`}
                          checked={filters.status === option.value}
                          onChange={() => onChange({ status: option.value })}
                        />
                        <label htmlFor={`status-${option.value}`}>{option.label}</label>
                      </div>
                    ))}
                  </div>
                </td>
                <th>등록일</th>
                <td colSpan={3}>
                  <div className="date-picker-wrap">
                    <DatePicker value={filters.from} onChange={(date) => onChange({ from: date })} />
                    <span>~</span>
                    <DatePicker value={filters.to} onChange={(date) => onChange({ to: date })} />
                  </div>
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
            <button className="btn-form basic" onClick={onSearch} type="button">
              검색
            </button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
