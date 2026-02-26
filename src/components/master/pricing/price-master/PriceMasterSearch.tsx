'use client'

import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { Input, RadioButtonGroup, type RadioOption } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import DatePicker from '@/components/ui/common/DatePicker'

export interface PriceMasterSearchFilters {
  officeId: number | null
  franchiseId: number | null
  operationStatus: string
  menuClassificationCode: string
  menuName: string
  priceAppliedAtFrom: Date | null
  priceAppliedAtTo: Date | null
  salePriceFrom: string
  salePriceTo: string
  discountPriceFrom: string
  discountPriceTo: string
}

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const ALL_MINUTES = Array.from({ length: 6 }, (_, i) => String(i * 10).padStart(2, '0'))

const isToday = (date: Date | null): boolean => {
  if (!date) return false
  const now = new Date()
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
}

const getFilteredHours = (date: Date | null): string[] => {
  if (!isToday(date)) return ALL_HOURS
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  // 현재 분이 50 초과면 이번 시간대에 선택 가능한 분이 없으므로 다음 시간부터
  const minHour = currentMinute > 50 ? currentHour + 1 : currentHour
  return ALL_HOURS.filter((h) => parseInt(h, 10) >= minHour)
}

const getFilteredMinutes = (date: Date | null, hour: string): string[] => {
  if (!isToday(date)) return ALL_MINUTES
  const now = new Date()
  const selectedHour = parseInt(hour, 10)
  if (selectedHour > now.getHours()) return ALL_MINUTES
  if (selectedHour < now.getHours()) return []
  // selectedHour === currentHour: getFilteredHours가 minute>50일 때 이 시간을 제외하므로
  // 정상적으로 이 분기에 도달하면 선택 가능한 분이 존재함
  const currentMinute = now.getMinutes()
  return ALL_MINUTES.filter((m) => parseInt(m, 10) >= currentMinute)
}

interface PriceMasterSearchProps {
  filters: PriceMasterSearchFilters
  appliedFilters: PriceMasterSearchFilters
  operationStatusOptions: RadioOption[]
  menuClassificationOptions: SelectOption[]
  officeNameMap: Map<number, string>
  operationStatusCodeMap: Map<string, string>
  menuClassCodeMap: Map<string, string>
  resultCount: number
  hasCheckedRows: boolean
  scheduleDate: Date | null
  scheduleHour: string
  scheduleMinute: string
  onScheduleDateChange: (date: Date | null) => void
  onScheduleHourChange: (hour: string) => void
  onScheduleMinuteChange: (minute: string) => void
  onCancelSchedule: () => void
  onApplySchedule: () => void
  onChange: (next: Partial<PriceMasterSearchFilters>) => void
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

const formatCurrencyLabel = (value: string): string => {
  if (!value) return ''
  const n = parseInt(value, 10)
  return isNaN(n) ? '' : n.toLocaleString('ko-KR')
}

const PriceMasterSearch = ({
  filters,
  appliedFilters,
  operationStatusOptions,
  menuClassificationOptions,
  officeNameMap,
  operationStatusCodeMap,
  menuClassCodeMap,
  resultCount,
  hasCheckedRows,
  scheduleDate,
  scheduleHour,
  scheduleMinute,
  onScheduleDateChange,
  onScheduleHourChange,
  onScheduleMinuteChange,
  onCancelSchedule,
  onApplySchedule,
  onChange,
  onSearch,
  onReset,
  onRemoveFilter,
}: PriceMasterSearchProps) => {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showOfficeError, setShowOfficeError] = useState(false)

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; label: string }[] = []
  if (appliedFilters.officeId != null) {
    const name = officeNameMap.get(appliedFilters.officeId)
    if (name) appliedTags.push({ key: 'office', label: `본사: ${name}` })
  }
  if (appliedFilters.operationStatus) {
    const name = operationStatusCodeMap.get(appliedFilters.operationStatus)
    if (name) appliedTags.push({ key: 'operationStatus', label: `운영여부: ${name}` })
  }
  if (appliedFilters.menuClassificationCode) {
    const name = menuClassCodeMap.get(appliedFilters.menuClassificationCode)
    if (name) appliedTags.push({ key: 'menuClassificationCode', label: `메뉴분류: ${name}` })
  }
  if (appliedFilters.menuName) {
    appliedTags.push({ key: 'menuName', label: `메뉴명: ${appliedFilters.menuName}` })
  }
  if (appliedFilters.priceAppliedAtFrom || appliedFilters.priceAppliedAtTo) {
    const from = formatDateLabel(appliedFilters.priceAppliedAtFrom)
    const to = formatDateLabel(appliedFilters.priceAppliedAtTo)
    appliedTags.push({ key: 'priceAppliedAt', label: `반영일: ${from} ~ ${to}` })
  }
  if (appliedFilters.salePriceFrom || appliedFilters.salePriceTo) {
    const from = formatCurrencyLabel(appliedFilters.salePriceFrom)
    const to = formatCurrencyLabel(appliedFilters.salePriceTo)
    appliedTags.push({ key: 'salePrice', label: `판매가: ${from} ~ ${to}` })
  }
  if (appliedFilters.discountPriceFrom || appliedFilters.discountPriceTo) {
    const from = formatCurrencyLabel(appliedFilters.discountPriceFrom)
    const to = formatCurrencyLabel(appliedFilters.discountPriceTo)
    appliedTags.push({ key: 'discountPrice', label: `할인가: ${from} ~ ${to}` })
  }

  const handleRemoveTag = (key: string) => {
    if (key === 'office') {
      onReset()
      setSearchOpen(true)
    } else {
      onRemoveFilter(key)
    }
  }

  const handleSearch = () => {
    if (!filters.officeId) {
      setShowOfficeError(true)
      return
    }
    onSearch()
    setSearchOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const effectiveSearchOpen = hasCheckedRows ? false : searchOpen

  const today = new Date()
  const filteredHours = getFilteredHours(scheduleDate)
  const filteredMinutes = getFilteredMinutes(scheduleDate, scheduleHour)

  const handleScheduleDateChange = (date: Date | null) => {
    onScheduleDateChange(date)
    // 오늘 선택 시 현재 시각 이전의 시간/분이면 보정
    if (date && isToday(date)) {
      const nowHour = new Date().getHours()
      const nowMinute = new Date().getMinutes()
      const selectedHour = parseInt(scheduleHour, 10)
      if (selectedHour < nowHour) {
        onScheduleHourChange(String(nowHour).padStart(2, '0'))
        const nextMinutes = getFilteredMinutes(date, String(nowHour).padStart(2, '0'))
        if (nextMinutes.length > 0 && !nextMinutes.includes(scheduleMinute)) {
          onScheduleMinuteChange(nextMinutes[0])
        }
      } else if (selectedHour === nowHour && parseInt(scheduleMinute, 10) < nowMinute) {
        const nextMinutes = getFilteredMinutes(date, scheduleHour)
        if (nextMinutes.length > 0) {
          onScheduleMinuteChange(nextMinutes[0])
        }
      }
    }
  }

  const handleScheduleHourChange = (hour: string) => {
    onScheduleHourChange(hour)
    // 오늘 + 현재 시간 선택 시 분 보정
    if (isToday(scheduleDate)) {
      const nextMinutes = getFilteredMinutes(scheduleDate, hour)
      if (nextMinutes.length > 0 && !nextMinutes.includes(scheduleMinute)) {
        onScheduleMinuteChange(nextMinutes[0])
      }
    }
  }

  return (
    <div className={`search-wrap ${effectiveSearchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        {hasCheckedRows ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn-form gray" onClick={onCancelSchedule} type="button">
              예약취소
            </button>
            <div style={{ width: 160, flexShrink: 0 }}>
              <DatePicker
                value={scheduleDate}
                onChange={handleScheduleDateChange}
                placeholder="날짜 선택"
                minDate={today}
              />
            </div>
            {filteredHours.length === 0 ? (
              <span className="text-red-500 text-xs whitespace-nowrap">오늘은 예약 가능한 시간이 없습니다. 내일 이후 날짜를 선택해주세요.</span>
            ) : (
              <>
                <select
                  value={scheduleHour}
                  onChange={(e) => handleScheduleHourChange(e.target.value)}
                  className="select-form"
                  style={{ width: 100, minWidth: 100, flexShrink: 0 }}
                >
                  {filteredHours.map((h) => (
                    <option key={h} value={h}>{h}시</option>
                  ))}
                </select>
                <select
                  value={scheduleMinute}
                  onChange={(e) => onScheduleMinuteChange(e.target.value)}
                  className="select-form"
                  style={{ width: 100, minWidth: 100, flexShrink: 0 }}
                >
                  {filteredMinutes.map((m) => (
                    <option key={m} value={m}>{m}분</option>
                  ))}
                </select>
                <button className="btn-form basic" onClick={onApplySchedule} type="button">
                  반영예약
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="search-result">
              {appliedTags.map((tag) => (
                <span key={tag.key} className="mr-2">
                  {tag.label}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.key)}
                    className="ml-1 text-red-600 bg-transparent border-none cursor-pointer font-bold text-xs p-0"
                  >
                    &nbsp;✕
                  </button>
                </span>
              ))}
              {appliedTags.length > 0 && <span className="mr-2"> / </span>}
              검색결과 <span>{resultCount.toLocaleString()}건</span>
            </div>
            <button className="search-filed-btn" onClick={() => setSearchOpen(!searchOpen)}></button>
          </>
        )}
      </div>
      <AnimateHeight duration={300} height={effectiveSearchOpen ? 'auto' : 0}>
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
              {/* 1행: 본사*, 가맹점, 운영여부 */}
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  fields={['office']}
                  isHeadOfficeRequired={true}
                  showHeadOfficeError={showOfficeError}
                  headOfficeErrorMessage="필수 선택 조건입니다"
                  officeId={filters.officeId}
                  franchiseId={null}
                  storeId={null}
                  onChange={(next) => {
                    if (next.head_office) setShowOfficeError(false)
                    onChange({
                      officeId: next.head_office,
                    })
                  }}
                />
                <th>가맹점</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={[]}
                      value={null}
                      placeholder="전체"
                      isDisabled={true}
                    />
                  </div>
                </td>
                <th>운영여부</th>
                <td>
                  <div className="data-filed">
                    <RadioButtonGroup
                      options={operationStatusOptions}
                      value={filters.operationStatus}
                      onChange={(value) => onChange({ operationStatus: value })}
                    />
                  </div>
                </td>
              </tr>
              {/* 2행: 메뉴분류, 메뉴명, 반영일 */}
              <tr>
                <th>메뉴분류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={menuClassificationOptions}
                      value={menuClassificationOptions.find((opt) => opt.value === filters.menuClassificationCode) ?? null}
                      onChange={(opt) => onChange({ menuClassificationCode: opt?.value ?? '' })}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
                <th>메뉴명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      placeholder="메뉴명 입력"
                      value={filters.menuName}
                      onChange={(e) => onChange({ menuName: e.target.value })}
                      onKeyDown={handleKeyDown}
                      showClear
                      onClear={() => onChange({ menuName: '' })}
                    />
                  </div>
                </td>
                <th>반영일</th>
                <td>
                  <RangeDatePicker
                    startDate={filters.priceAppliedAtFrom}
                    endDate={filters.priceAppliedAtTo}
                    onChange={(range: DateRange) => {
                      onChange({ priceAppliedAtFrom: range.startDate, priceAppliedAtTo: range.endDate })
                    }}
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
                  />
                </td>
              </tr>
              {/* 3행: 판매가 범위, 할인가 범위 */}
              <tr>
                <th>판매가</th>
                <td>
                  <div className="filed-flx">
                    <Input
                      type="currency"
                      placeholder="최소"
                      value={filters.salePriceFrom}
                      onChange={(e) => onChange({ salePriceFrom: e.target.value })}
                      onKeyDown={handleKeyDown}
                    />
                    <span className="explain">~</span>
                    <Input
                      type="currency"
                      placeholder="최대"
                      value={filters.salePriceTo}
                      onChange={(e) => onChange({ salePriceTo: e.target.value })}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </td>
                <th>할인가</th>
                <td>
                  <div className="filed-flx">
                    <Input
                      type="currency"
                      placeholder="최소"
                      value={filters.discountPriceFrom}
                      onChange={(e) => onChange({ discountPriceFrom: e.target.value })}
                      onKeyDown={handleKeyDown}
                    />
                    <span className="explain">~</span>
                    <Input
                      type="currency"
                      placeholder="최대"
                      value={filters.discountPriceTo}
                      onChange={(e) => onChange({ discountPriceTo: e.target.value })}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </td>
                <th />
                <td />
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
            <button className="btn-form basic" onClick={handleSearch} type="button">
              검색
            </button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}

export default PriceMasterSearch
