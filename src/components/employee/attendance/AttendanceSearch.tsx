'use client'

import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'

export interface AttendanceSearchFilters {
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  workStatus: string // 'ALL' | 코드값
  employeeName: string
  workDays: string[] // 선택된 요일 코드 배열
  employeeClassification: string // 'ALL' | 코드값
  contractClassification: string // 'ALL' | 코드값
}

export const DEFAULT_ATTENDANCE_FILTERS: AttendanceSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  workStatus: 'ALL',
  employeeName: '',
  workDays: [],
  employeeClassification: 'ALL',
  contractClassification: 'ALL',
}

interface AttendanceSearchProps {
  filters: AttendanceSearchFilters
  workStatusOptions: { value: string; label: string }[]
  employeeClassificationOptions: { value: string; label: string }[]
  empClassDisabled?: boolean
  contractClassificationOptions: { value: string; label: string }[]
  resultCount: number
  onChange: (next: Partial<AttendanceSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
}

const WORK_DAY_OPTIONS = [
  { value: 'WEEKDAY', label: '평일' },
  { value: 'SATURDAY', label: '토' },
  { value: 'SUNDAY', label: '일' },
]

export default function AttendanceSearch({
  filters,
  workStatusOptions,
  employeeClassificationOptions,
  empClassDisabled = false,
  contractClassificationOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
}: AttendanceSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const handleSearch = () => {
    const hasOfficeError = !filters.officeId
    setShowOfficeError(hasOfficeError)
    if (hasOfficeError) return
    onSearch()
  }

  const handleReset = () => {
    setShowOfficeError(false)
    onReset()
  }

  const handleWorkDayToggle = (dayValue: string) => {
    const current = filters.workDays
    const next = current.includes(dayValue)
      ? current.filter((d) => d !== dayValue)
      : [...current, dayValue]
    onChange({ workDays: next })
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
                  isHeadOfficeRequired={true}
                  showHeadOfficeError={showOfficeError}
                  officeId={filters.officeId ?? null}
                  franchiseId={filters.franchiseId ?? null}
                  storeId={filters.storeId ?? null}
                  onChange={(next) => {
                    if (next.head_office) setShowOfficeError(false)
                    onChange({
                      officeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: next.store,
                    })
                  }}
                />
              </tr>
              <tr>
                <th>근무여부</th>
                <td>
                  <div className="data-filed">
                    <select
                      className="select-form"
                      value={filters.workStatus}
                      onChange={(e) => onChange({ workStatus: e.target.value })}
                    >
                      <option value="ALL">전체</option>
                      {workStatusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <th>직원명</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="text"
                      className="input-frame"
                      placeholder="직원명을 입력하세요"
                      value={filters.employeeName}
                      onChange={(e) => onChange({ employeeName: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch()
                      }}
                    />
                  </div>
                </td>
                <th>근무요일</th>
                <td>
                  <div className="filed-check-flx">
                    {WORK_DAY_OPTIONS.map((day) => (
                      <div className="check-form-box" key={day.value}>
                        <input
                          type="checkbox"
                          id={`workday-${day.value}`}
                          checked={filters.workDays.includes(day.value)}
                          onChange={() => handleWorkDayToggle(day.value)}
                        />
                        <label htmlFor={`workday-${day.value}`}>{day.label}</label>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <th>직원 분류</th>
                <td>
                  <div className="data-filed">
                    <select
                      className="select-form"
                      value={filters.employeeClassification}
                      disabled={empClassDisabled}
                      onChange={(e) => onChange({ employeeClassification: e.target.value })}
                    >
                      <option value="ALL">전체</option>
                      {employeeClassificationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <th>계약 분류</th>
                <td>
                  <div className="data-filed">
                    <select
                      className="select-form"
                      value={filters.contractClassification}
                      onChange={(e) => onChange({ contractClassification: e.target.value })}
                    >
                      <option value="ALL">전체</option>
                      {contractClassificationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td colSpan={2}></td>
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
