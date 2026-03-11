'use client'
import '@/components/common/custom-css/FormHelper.css'
import AnimateHeight from 'react-animate-height'
import { useMemo, useState } from 'react'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { RadioButtonGroup } from '@/components/common/ui'
import { useBpHeadOfficeTree, useStoreOptions } from '@/hooks/queries'


// 점포 검색 필터 상태
export interface StoreSearchFilters {
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  status: 'ALL' | string
  from: Date | null
  to: Date | null
}

// 검색 영역 컴포넌트 props
interface StoreSearchProps {
  filters: StoreSearchFilters
  appliedFilters: StoreSearchFilters
  statusOptions: { value: string; label: string }[]
  resultCount: number
  onChange: (next: Partial<StoreSearchFilters>) => void
  onSearch: () => void
  onReset: () => void
  onRemoveFilter: (key: string) => void
}

const formatDateLabel = (date: Date | null): string => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 점포 목록 검색 영역 (본사 필수/기간 유효성 검사 포함)
export default function StoreSearch({
  filters,
  appliedFilters,
  statusOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
  onRemoveFilter,
}: StoreSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const { data: storeOptionsList = [] } = useStoreOptions(
    appliedFilters.officeId ?? null,
    appliedFilters.franchiseId ?? null,
    appliedFilters.officeId != null
  )

  const statusRadioOptions = useMemo(
    () => [{ value: 'ALL', label: '전체' }, ...statusOptions],
    [statusOptions]
  )

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string }[] = []
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
  if (appliedFilters.status && appliedFilters.status !== 'ALL') {
    const label = statusOptions.find((o) => o.value === appliedFilters.status)?.label
    if (label) appliedTags.push({ key: 'status', value: label, category: '운영여부' })
  }
  if (appliedFilters.from || appliedFilters.to) {
    const from = formatDateLabel(appliedFilters.from)
    const to = formatDateLabel(appliedFilters.to)
    appliedTags.push({ key: 'date', value: `${from} ~ ${to}`, category: '등록일' })
  }

  const handleRemoveTag = (key: string) => {
    if (key === 'office') {
      setShowOfficeError(true)
      setSearchOpen(true)
    }
    onRemoveFilter(key)
  }

  const handleMultiOffice = (isMulti: boolean) => {
    if (isMulti) {
      setSearchOpen(true)
      setShowOfficeError(true)
    }
  }

  const handleSearch = () => {
    const hasOfficeError = !filters.officeId
    setShowOfficeError(hasOfficeError)
    if (hasOfficeError) {
      return
    }
    onSearch()
    setSearchOpen(false)
  }

  const handleReset = () => {
    setShowOfficeError(false)
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
                    if (next.head_office) {
                      setShowOfficeError(false)
                    }
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
                <th>운영여부</th>
                <td>
                  <RadioButtonGroup
                    className="filed-check-flx"
                    name="status"
                    options={statusRadioOptions}
                    value={filters.status}
                    onChange={(nextValue) => onChange({ status: nextValue })}
                  />
                </td>
                <th>등록일</th>
                <td colSpan={3}>
                  <RangeDatePicker
                    startDate={filters.from}
                    endDate={filters.to}
                    onChange={(range: DateRange) => {
                      onChange({ from: range.startDate, to: range.endDate })
                    }}
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
                  />
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
