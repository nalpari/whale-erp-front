'use client'
import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import DatePicker from '@/components/ui/common/DatePicker'

export interface StoreSearchFilters {
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  status: 'ALL' | 'OPERATING' | 'NOT_OPERATING'
  from: Date | null
  to: Date | null
}

interface OptionItem {
  value: number
  label: string
}

interface StoreSearchProps {
  filters: StoreSearchFilters
  officeOptions: OptionItem[]
  franchiseOptions: OptionItem[]
  storeOptions: OptionItem[]
  resultCount: number
  onChange: (next: Partial<StoreSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
}

export default function StoreSearch({
  filters,
  officeOptions,
  franchiseOptions,
  storeOptions,
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
        <ul className="search-result-list">
          <li></li>
        </ul>
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
                <th>본사</th>
                <td>
                  <div className="data-filed">
                    <select
                      className="select-form"
                      value={filters.officeId ?? ''}
                      onChange={(event) =>
                        onChange({ officeId: event.target.value ? Number(event.target.value) : null })
                      }
                    >
                      <option value="">전체</option>
                      {officeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <th>가맹점</th>
                <td>
                  <div className="data-filed">
                    <select
                      className="select-form"
                      value={filters.franchiseId ?? ''}
                      onChange={(event) =>
                        onChange({ franchiseId: event.target.value ? Number(event.target.value) : null })
                      }
                    >
                      <option value="">전체</option>
                      {franchiseOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <th>점포</th>
                <td>
                  <div className="data-filed">
                    <select
                      className="select-form"
                      value={filters.storeId ?? ''}
                      onChange={(event) =>
                        onChange({ storeId: event.target.value ? Number(event.target.value) : null })
                      }
                    >
                      <option value="">전체</option>
                      {storeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
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
                    <div className="radio-form-box">
                      <input
                        type="radio"
                        name="status"
                        id="status-operating"
                        checked={filters.status === 'OPERATING'}
                        onChange={() => onChange({ status: 'OPERATING' })}
                      />
                      <label htmlFor="status-operating">운영</label>
                    </div>
                    <div className="radio-form-box">
                      <input
                        type="radio"
                        name="status"
                        id="status-not-operating"
                        checked={filters.status === 'NOT_OPERATING'}
                        onChange={() => onChange({ status: 'NOT_OPERATING' })}
                      />
                      <label htmlFor="status-not-operating">미운영</label>
                    </div>
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
            <button className="btn-form gray" onClick={onReset} type="button">
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
