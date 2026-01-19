'use client'
import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import DatePicker from '@/components/ui/common/DatePicker'
import { useBp } from '@/hooks/useBp'

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
interface OptionItem {
  value: number
  label: string
}

// 검색 영역 컴포넌트 props
interface StoreSearchProps {
  filters: StoreSearchFilters
  storeOptions: OptionItem[]
  statusOptions: { value: string; label: string }[]
  resultCount: number
  onChange: (next: Partial<StoreSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
}

// 점포 목록 검색 영역
export default function StoreSearch({
  filters,
  storeOptions,
  statusOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
}: StoreSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const { data: bpTree, loading: bpLoading } = useBp()

  const officeOptions = bpTree.map((office) => ({ value: office.id, label: office.name }))
  const franchiseOptions = filters.officeId
    ? bpTree.find((office) => office.id === filters.officeId)?.franchises.map((franchise) => ({
      value: franchise.id,
      label: franchise.name,
    })) ?? []
    : bpTree.flatMap((office) =>
      office.franchises.map((franchise) => ({
        value: franchise.id,
        label: franchise.name,
      })),
    )

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
                      onChange={(event) => {
                        const nextOfficeId = event.target.value ? Number(event.target.value) : null
                        const nextFranchiseOptions = nextOfficeId
                          ? bpTree.find((office) => office.id === nextOfficeId)?.franchises ?? []
                          : bpTree.flatMap((office) => office.franchises)
                        const shouldClearFranchise =
                          filters.franchiseId !== null &&
                          filters.franchiseId !== undefined &&
                          !nextFranchiseOptions.some((franchise) => franchise.id === filters.franchiseId)

                        onChange({
                          officeId: nextOfficeId,
                          franchiseId: shouldClearFranchise ? null : filters.franchiseId ?? null,
                        })
                      }}
                      disabled={bpLoading}
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
                      disabled={bpLoading}
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
