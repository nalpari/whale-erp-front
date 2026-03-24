'use client'

import AnimateHeight from 'react-animate-height'
import { useState, useMemo } from 'react'
import { Input } from '@/components/common/ui'
import HeadOfficeFranchiseStoreSelect, { type OfficeFranchiseStoreValue } from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useBpHeadOfficeTree, useStoreOptions } from '@/hooks/queries'
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'

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
  appliedFilters: AttendanceSearchFilters
  workStatusOptions: { value: string; label: string }[]
  employeeClassificationOptions: { value: string; label: string }[]
  empClassDisabled?: boolean
  contractClassificationOptions: { value: string; label: string }[]
  resultCount: number
  onChange: (next: Partial<AttendanceSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
  onRemoveFilter: (key: string) => void
  onAutoSelect?: (value: OfficeFranchiseStoreValue) => void
}

const WORK_DAY_OPTIONS = [
  { value: 'WEEKDAY', label: '평일' },
  { value: 'SATURDAY', label: '토요일' },
  { value: 'SUNDAY', label: '일요일' },
]

export default function AttendanceSearch({
  filters,
  appliedFilters,
  workStatusOptions,
  employeeClassificationOptions,
  empClassDisabled = false,
  contractClassificationOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
  onRemoveFilter,
  onAutoSelect,
}: AttendanceSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const ownerCode = useAuthStore((s) => s.ownerCode)
  const isOfficeFixed = ownerCode === OWNER_CODE.HEAD_OFFICE || ownerCode === OWNER_CODE.FRANCHISE
  const isFranchiseFixed = ownerCode === OWNER_CODE.FRANCHISE

  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const { data: storeOptionsList = [] } = useStoreOptions(
    appliedFilters.officeId ?? null,
    appliedFilters.franchiseId ?? null,
    appliedFilters.officeId != null
  )

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

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string; removable?: boolean }[] = []
  if (appliedFilters.officeId != null) {
    const name = bpTree.find((o) => o.id === appliedFilters.officeId)?.name
    if (name) appliedTags.push({ key: 'office', value: name, category: '본사', removable: !isOfficeFixed })
  }
  if (appliedFilters.franchiseId != null) {
    const franchise = bpTree.flatMap((o) => o.franchises).find((f) => f.id === appliedFilters.franchiseId)
    if (franchise) appliedTags.push({ key: 'franchise', value: franchise.name, category: '가맹점', removable: !isFranchiseFixed })
  }
  if (appliedFilters.storeId != null) {
    const store = storeOptionsList.find((s) => s.id === appliedFilters.storeId)
    if (store) appliedTags.push({ key: 'store', value: store.storeName, category: '점포' })
  }
  if (appliedFilters.workStatus && appliedFilters.workStatus !== 'ALL') {
    const label = workStatusOptions.find((o) => o.value === appliedFilters.workStatus)?.label
    if (label) appliedTags.push({ key: 'workStatus', value: label, category: '근무여부' })
  }
  if (appliedFilters.employeeName) {
    appliedTags.push({ key: 'employeeName', value: appliedFilters.employeeName, category: '직원명' })
  }
  if (appliedFilters.workDays.length > 0) {
    const dayLabels = appliedFilters.workDays.map((d) => WORK_DAY_OPTIONS.find((o) => o.value === d)?.label ?? d)
    appliedTags.push({ key: 'workDays', value: dayLabels.join(', '), category: '근무요일' })
  }
  if (appliedFilters.employeeClassification && appliedFilters.employeeClassification !== 'ALL') {
    const label = employeeClassificationOptions.find((o) => o.value === appliedFilters.employeeClassification)?.label
    if (label) appliedTags.push({ key: 'employeeClassification', value: label, category: '직원 분류' })
  }
  if (appliedFilters.contractClassification && appliedFilters.contractClassification !== 'ALL') {
    const label = contractClassificationOptions.find((o) => o.value === appliedFilters.contractClassification)?.label
    if (label) appliedTags.push({ key: 'contractClassification', value: label, category: '계약 분류' })
  }

  const handleRemoveTag = (key: string) => {
    if (key === 'office') {
      setShowOfficeError(true)
      setSearchOpen(true)
    }
    onRemoveFilter(key)
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
        <ul className="search-result-list">
          {appliedTags.map((tag) => (
            <li key={tag.key} className="search-result-item">
              <div className="search-result-item-txt">
                <span>{tag.value}</span> ({tag.category})
              </div>
              {tag.removable !== false && (
                <button type="button" className="search-result-item-btn" onClick={() => handleRemoveTag(tag.key)} aria-label={`${tag.category} 필터 제거`}></button>
              )}
            </li>
          ))}
          <li className="search-result-item">
            <div className="search-result-item-txt">
              <span>{resultCount.toLocaleString()}건</span>
            </div>
          </li>
        </ul>
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
                  onAutoSelect={onAutoSelect}
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
