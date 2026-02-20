'use client'
import '@/components/common/custom-css/FormHelper.css'
import AnimateHeight from 'react-animate-height'
import { useMemo, useState } from 'react'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { RadioButtonGroup } from '@/components/common/ui'


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

// 점포 목록 검색 영역 (본사 필수/기간 유효성 검사 포함)
export default function StoreSearch({
  filters,
  statusOptions,
  resultCount,
  onChange,
  onSearch,
  onReset,
}: StoreSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const statusRadioOptions = useMemo(
    () => [{ value: 'ALL', label: '전체' }, ...statusOptions],
    [statusOptions]
  )

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
  }

  const handleReset = () => {
    setShowOfficeError(false)
    onReset()
  }
  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
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
