'use client'

import AnimateHeight from 'react-animate-height'
import { useState, useMemo } from 'react'
import { Input } from '@/components/common/ui'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'

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
  { value: 'SATURDAY', label: '토요일' },
  { value: 'SUNDAY', label: '일요일' },
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const handleMultiOffice = (isMulti: boolean) => {
    if (isMulti) {
      setSearchOpen(true)
      setShowOfficeError(true)
    }
  }

  // SearchSelect용 옵션 변환
  const workStatusSelectOptions: SelectOption[] = useMemo(
    () => [{ value: 'ALL', label: '전체' }, ...workStatusOptions.map((opt) => ({ value: opt.value, label: opt.label }))],
    [workStatusOptions]
  )
  const employeeClassSelectOptions: SelectOption[] = useMemo(
    () => [{ value: 'ALL', label: '전체' }, ...employeeClassificationOptions.map((opt) => ({ value: opt.value, label: opt.label }))],
    [employeeClassificationOptions]
  )
  const contractClassSelectOptions: SelectOption[] = useMemo(
    () => [{ value: 'ALL', label: '전체' }, ...contractClassificationOptions.map((opt) => ({ value: opt.value, label: opt.label }))],
    [contractClassificationOptions]
  )

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
      <div className="search-result-wrap">
        <div className="search-result">
          검색결과<span>{resultCount}건</span>
        </div>
        <ul className="search-result-list" />
        <button
          className="search-filed-btn"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="검색 결과 토글"
          aria-expanded={searchOpen}
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
                  onMultiOffice={handleMultiOffice}
                />
              </tr>
              <tr>
                <th>근무여부</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      value={workStatusSelectOptions.find((opt) => opt.value === filters.workStatus) || null}
                      options={workStatusSelectOptions}
                      placeholder="전체"
                      isSearchable={false}
                      isClearable={false}
                      onChange={(option) => onChange({ workStatus: option?.value ?? 'ALL' })}
                    />
                  </div>
                </td>
                <th>직원명</th>
                <td>
                  <Input
                    placeholder="직원명을 입력하세요"
                    value={filters.employeeName}
                    onChange={(e) => onChange({ employeeName: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch()
                    }}
                  />
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
                    <SearchSelect
                      value={employeeClassSelectOptions.find((opt) => opt.value === filters.employeeClassification) || null}
                      options={employeeClassSelectOptions}
                      placeholder="전체"
                      isDisabled={empClassDisabled}
                      isSearchable={false}
                      isClearable={false}
                      onChange={(option) => onChange({ employeeClassification: option?.value ?? 'ALL' })}
                    />
                  </div>
                </td>
                <th>계약 분류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      value={contractClassSelectOptions.find((opt) => opt.value === filters.contractClassification) || null}
                      options={contractClassSelectOptions}
                      placeholder="전체"
                      isSearchable={false}
                      isClearable={false}
                      onChange={(option) => onChange({ contractClassification: option?.value ?? 'ALL' })}
                    />
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
