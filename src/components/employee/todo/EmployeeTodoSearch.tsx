'use client'

import { useMemo, useState } from 'react'
import AnimateHeight from 'react-animate-height'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import RangeDatePicker from '@/components/ui/common/RangeDatePicker'
import RadioButtonGroup from '@/components/common/ui/RadioButtonGroup'
import { Input } from '@/components/common/ui'
import { useBpHeadOfficeTree, useStoreOptions, useEmployeeTodoSelectList } from '@/hooks/queries'
import { formatDateYmd } from '@/util/date-util'
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'
import type { OfficeFranchiseStoreValue } from '@/components/common/HeadOfficeFranchiseStoreSelect'

export type TodoCompletedFilter = 'ALL' | 'true' | 'false'

export interface EmployeeTodoSearchFilters {
  officeId: number | null
  franchiseId: number | null
  storeId: number | null
  employeeName: string
  isCompleted: TodoCompletedFilter
  startDate: string
  endDate: string
  content: string
}

export type EmployeeTodoFilterTagKey =
  | 'office' | 'franchise' | 'store' | 'employeeName'
  | 'isCompleted' | 'date' | 'content'

export const DEFAULT_TODO_FILTERS: EmployeeTodoSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  employeeName: '',
  isCompleted: 'ALL',
  startDate: '',
  endDate: '',
  content: '',
}

const COMPLETED_OPTIONS: { value: TodoCompletedFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'false', label: '미완료' },
  { value: 'true', label: '완료' },
]

interface EmployeeTodoSearchProps {
  filters: EmployeeTodoSearchFilters
  appliedFilters: EmployeeTodoSearchFilters
  resultCount: number
  onChange: (next: Partial<EmployeeTodoSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
  onRemoveFilter: (key: EmployeeTodoFilterTagKey) => void
  onAutoSelect?: (value: OfficeFranchiseStoreValue) => void
}

export default function EmployeeTodoSearch({
  filters,
  appliedFilters,
  resultCount,
  onChange,
  onSearch,
  onReset,
  onRemoveFilter,
  onAutoSelect,
}: EmployeeTodoSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const ownerCode = useAuthStore((s) => s.ownerCode)
  const isOfficeFixed = ownerCode === OWNER_CODE.HEAD_OFFICE || ownerCode === OWNER_CODE.FRANCHISE
  const isFranchiseFixed = ownerCode === OWNER_CODE.FRANCHISE

  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const { data: storeOptionsList = [] } = useStoreOptions(
    appliedFilters.officeId ?? null,
    appliedFilters.franchiseId ?? null,
  )

  // 직원 selectbox (creatable — 자유 입력 허용)
  // /api/v1/employee-todos/employees 는 재직 중이며 삭제되지 않은 직원만 반환
  const {
    data: employeeList,
    isPending: isEmployeeLoading,
    error: employeeError,
  } = useEmployeeTodoSelectList(
    {
      purpose: 'BROAD',
      headOfficeId: filters.officeId ?? undefined,
      franchiseId: filters.franchiseId ?? undefined,
      storeId: filters.storeId ?? undefined,
    },
    true,
  )
  const employeeOptions: SelectOption[] = useMemo(
    () => (employeeList ?? []).map((e) => ({ value: e.employeeName, label: `${e.employeeName} (${e.employeeNumber})` })),
    [employeeList],
  )

  const handleMultiOffice = (isMulti: boolean) => {
    if (isMulti && appliedFilters.officeId == null) {
      setSearchOpen(true)
    }
  }

  const handleSearch = () => {
    const hasOfficeError = filters.officeId == null
    setShowOfficeError(hasOfficeError)
    if (hasOfficeError) return
    onSearch()
    setSearchOpen(false)
  }

  const handleRemoveTag = (key: string) => {
    if (key === 'office') {
      setShowOfficeError(true)
      setSearchOpen(true)
    }
    onRemoveFilter(key as EmployeeTodoFilterTagKey)
  }

  // 적용된 필터 기반 태그
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
  if (appliedFilters.employeeName) {
    appliedTags.push({ key: 'employeeName', value: appliedFilters.employeeName, category: '직원명' })
  }
  if (appliedFilters.isCompleted && appliedFilters.isCompleted !== 'ALL') {
    appliedTags.push({ key: 'isCompleted', value: appliedFilters.isCompleted === 'true' ? '완료' : '미완료', category: '완료 여부' })
  }
  if (appliedFilters.startDate || appliedFilters.endDate) {
    const dateStr = [appliedFilters.startDate, appliedFilters.endDate].filter(Boolean).join(' ~ ')
    appliedTags.push({ key: 'date', value: dateStr, category: '기간' })
  }
  if (appliedFilters.content) {
    appliedTags.push({ key: 'content', value: appliedFilters.content, category: '할 일 내용' })
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
                <button type="button" className="search-result-item-btn" onClick={() => handleRemoveTag(tag.key)} aria-label={`${tag.category} 필터 제거`} />
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
          type="button"
          className="search-filed-btn"
          aria-label={searchOpen ? '검색 조건 닫기' : '검색 조건 열기'}
          aria-expanded={searchOpen}
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
              {/* 행1: 본사/가맹점/점포 */}
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired
                  showHeadOfficeError={showOfficeError}
                  officeId={filters.officeId ?? null}
                  franchiseId={filters.franchiseId ?? null}
                  storeId={filters.storeId ?? null}
                  onChange={(next) => {
                    if (next.head_office) setShowOfficeError(false)
                    // 상위 조직 변경 시 하위 값 초기화, 점포 직접 삭제(x) 시에는 null 적용
                    const isOrgChanged = next.head_office !== filters.officeId || next.franchise !== filters.franchiseId
                    const isStoreChanged = !isOrgChanged && next.store !== filters.storeId
                    onChange({
                      officeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: isOrgChanged ? null : next.store,
                      // 조직 변경 시 직원 선택 초기화 (소속 불일치 방지)
                      ...((isOrgChanged || isStoreChanged) ? { employeeName: '' } : {}),
                    })
                  }}
                  onMultiOffice={handleMultiOffice}
                  onAutoSelect={onAutoSelect}
                />
              </tr>
              {/* 행2: 직원명, 완료 여부 */}
              <tr>
                <th>직원명</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      value={filters.employeeName ? employeeOptions.find((opt) => opt.value === filters.employeeName) ?? { value: filters.employeeName, label: filters.employeeName } : null}
                      options={employeeOptions}
                      placeholder={employeeError ? '전체' : isEmployeeLoading ? '직원 정보를 조회중입니다.' : '직원 선택'}
                      isDisabled={isEmployeeLoading || Boolean(employeeError)}
                      isSearchable
                      isClearable
                      creatable
                      formatCreateLabel={(input) => `"${input}" 로 검색`}
                      onChange={(option) => onChange({ employeeName: option?.value ?? '' })}
                    />
                  </div>
                </td>
                <th>완료 여부</th>
                <td colSpan={3}>
                  <RadioButtonGroup
                    className="filed-check-flx"
                    name="isCompleted"
                    options={COMPLETED_OPTIONS}
                    value={filters.isCompleted}
                    onChange={(value) => onChange({ isCompleted: value })}
                  />
                </td>
              </tr>
              {/* 행3: 기간, 할 일 내용 */}
              <tr>
                <th>기간</th>
                <td>
                  <RangeDatePicker
                    startDate={filters.startDate ? new Date(filters.startDate) : null}
                    endDate={filters.endDate ? new Date(filters.endDate) : null}
                    onChange={(range) =>
                      onChange({
                        startDate: range.startDate ? formatDateYmd(range.startDate, '') : '',
                        endDate: range.endDate ? formatDateYmd(range.endDate, '') : '',
                      })
                    }
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
                  />
                </td>
                <th>할 일 내용</th>
                <td colSpan={3}>
                  <Input
                    value={filters.content}
                    onChange={(e) => onChange({ content: e.target.value })}
                    placeholder="할 일 내용 검색"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray" onClick={() => setSearchOpen(false)} type="button">닫기</button>
            <button className="btn-form gray" onClick={onReset} type="button">초기화</button>
            <button className="btn-form basic" onClick={handleSearch} type="button">검색</button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
