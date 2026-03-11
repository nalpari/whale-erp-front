'use client'

import AnimateHeight from 'react-animate-height'
import { useEffect, useState } from 'react'
import SearchSelect from '@/components/ui/common/SearchSelect'
import RangeDatePicker from '@/components/ui/common/RangeDatePicker'
import { useAdminSelectOptions, useAuthorityOptions } from '@/hooks/queries/use-admin-queries'
import { WORK_STATUS_OPTIONS } from '@/lib/schemas/admin'
import type { AdminSearchParams } from '@/lib/schemas/admin'
import { formatDateYmdOrUndefined } from '@/util/date-util'

interface AdminSearchProps {
  params: AdminSearchParams
  onSearch: (params: AdminSearchParams) => void
  resultCount?: number
}

export default function AdminSearch({
  params,
  onSearch,
  resultCount = 0,
}: AdminSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [localParams, setLocalParams] = useState<AdminSearchParams>(params)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  useEffect(() => {
    setLocalParams(params)
  }, [params])

  const { data: adminOptions = [] } = useAdminSelectOptions()
  const { data: authorities = [] } = useAuthorityOptions()

  const adminSelectOptions = adminOptions.map((admin) => ({
    value: String(admin.id),
    label: admin.name,
  }))

  const authoritySelectOptions = authorities.map((auth) => ({
    value: String(auth.id),
    label: auth.name,
  }))

  const workStatusSelectOptions = [
    ...WORK_STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
  ]

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string }[] = []
  if (params.admin_id != null) {
    const label = adminSelectOptions.find((o) => o.value === String(params.admin_id))?.label
    if (label) appliedTags.push({ key: 'admin', value: label, category: '관리자' })
  }
  if (params.user_type) {
    const label = workStatusSelectOptions.find((o) => o.value === params.user_type)?.label
    if (label) appliedTags.push({ key: 'workStatus', value: label, category: '근무여부' })
  }
  if (params.authority_id != null) {
    const label = authoritySelectOptions.find((o) => o.value === String(params.authority_id))?.label
    if (label) appliedTags.push({ key: 'authority', value: label, category: '권한' })
  }
  if (params.start_date || params.end_date) {
    const from = params.start_date ?? ''
    const to = params.end_date ?? ''
    appliedTags.push({ key: 'date', value: `${from} ~ ${to}`, category: '등록일' })
  }

  const handleRemoveTag = (key: string) => {
    const resetMap: Record<string, Partial<AdminSearchParams>> = {
      admin: { admin_id: undefined },
      workStatus: { user_type: undefined },
      authority: { authority_id: undefined },
      date: { start_date: undefined, end_date: undefined },
    }
    const patch = resetMap[key]
    if (!patch) return
    const nextParams = { ...localParams, ...patch }
    setLocalParams(nextParams)
    if (key === 'date') {
      setStartDate(null)
      setEndDate(null)
    }
    onSearch(nextParams)
  }

  const handleSearch = () => {
    onSearch(localParams)
    setSearchOpen(false)
  }

  const handleReset = () => {
    setLocalParams({})
    setStartDate(null)
    setEndDate(null)
  }

  const handleAdminChange = (option: { value: string; label: string } | null) => {
    setLocalParams({
      ...localParams,
      admin_id: option ? Number(option.value) : undefined,
    })
  }

  const handleWorkStatusChange = (option: { value: string; label: string } | null) => {
    setLocalParams({
      ...localParams,
      user_type: option?.value || undefined,
    })
  }

  const handleAuthorityChange = (option: { value: string; label: string } | null) => {
    setLocalParams({
      ...localParams,
      authority_id: option ? Number(option.value) : undefined,
    })
  }

  const handleDateChange = (range: { startDate: Date | null; endDate: Date | null }) => {
    setStartDate(range.startDate)
    setEndDate(range.endDate)
    setLocalParams({
      ...localParams,
      start_date: formatDateYmdOrUndefined(range.startDate),
      end_date: formatDateYmdOrUndefined(range.endDate),
    })
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
        <button className="search-filed-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="검색 조건 펼치기/접기"></button>
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
                <th>관리자</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={adminSelectOptions}
                      value={
                        localParams.admin_id
                          ? adminSelectOptions.find((opt) => opt.value === String(localParams.admin_id)) ?? null
                          : null
                      }
                      onChange={handleAdminChange}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
                <th>근무여부</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={workStatusSelectOptions}
                      value={
                        localParams.user_type
                          ? workStatusSelectOptions.find((opt) => opt.value === localParams.user_type) ?? null
                          : null
                      }
                      onChange={handleWorkStatusChange}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
                <th>권한</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={authoritySelectOptions}
                      value={
                        localParams.authority_id
                          ? authoritySelectOptions.find((opt) => opt.value === String(localParams.authority_id)) ?? null
                          : null
                      }
                      onChange={handleAuthorityChange}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <th>등록일</th>
                <td>
                  <div className="data-filed">
                    <RangeDatePicker
                      startDate={startDate}
                      endDate={endDate}
                      onChange={handleDateChange}
                      startDatePlaceholder="시작일"
                      endDatePlaceholder="종료일"
                    />
                  </div>
                </td>
                <td colSpan={4} style={{ backgroundColor: '#fff' }}></td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray" onClick={() => setSearchOpen(false)}>
              닫기
            </button>
            <button className="btn-form gray" onClick={handleReset}>
              초기화
            </button>
            <button className="btn-form basic" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
