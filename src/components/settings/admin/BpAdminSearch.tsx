'use client'

import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import SearchSelect from '@/components/ui/common/SearchSelect'
import RangeDatePicker from '@/components/ui/common/RangeDatePicker'
import { useAuthorityOptions } from '@/hooks/queries/use-admin-queries'
import { useBpHeadOfficeTree } from '@/hooks/queries/use-bp-queries'
import { WORK_STATUS_OPTIONS } from '@/lib/schemas/admin'
import type { BpAdminSearchParams, AdminType } from '@/types/bp-admin'
import { formatDateYmdOrUndefined } from '@/util/date-util'
import { OWNER_CODE } from '@/constants/owner-code'
import { useAuthStore } from '@/stores/auth-store'

interface BpAdminSearchProps {
  params: BpAdminSearchParams
  onSearch: (params: BpAdminSearchParams) => void
  onReset?: () => void
  resultCount?: number
}

const ADMIN_TYPE_OPTIONS: { value: AdminType; label: string }[] = [
  { value: 'HEAD_OFFICE', label: '본사 관리자' },
  { value: 'FRANCHISE', label: '가맹 관리자' },
]

export default function BpAdminSearch({
  params,
  onSearch,
  onReset,
  resultCount = 0,
}: BpAdminSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [localParams, setLocalParams] = useState<BpAdminSearchParams>(params)
  const [prevParams, setPrevParams] = useState(params)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // 부모에서 params가 갱신되면 동기화 (AdminSearch와 동일한 render-time setState 패턴)
  if (params !== prevParams) {
    setPrevParams(params)
    setLocalParams(params)
  }

  // 권한 정책: 본사/가맹 사용자는 admin_type, 본사, 가맹이 자동선택 + 잠금
  const ownerCode = useAuthStore((s) => s.ownerCode)
  const isHeadOfficeUser = ownerCode === OWNER_CODE.HEAD_OFFICE
  const isFranchiseUser = ownerCode === OWNER_CODE.FRANCHISE

  const isAdminTypeFixed = isFranchiseUser
  const isOfficeFixed = isHeadOfficeUser || isFranchiseUser
  const isFranchiseFixed = isFranchiseUser

  // 옵션 데이터
  const { data: bpTree = [], isPending: bpLoading } = useBpHeadOfficeTree()
  const { data: authorities = [] } = useAuthorityOptions()

  const adminTypeSelectOptions = ADMIN_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

  const headOfficeOptions = bpTree.map((office) => ({
    value: String(office.id),
    label: office.name,
  }))

  const selectedOffice = localParams.head_office_organization_id
    ? bpTree.find((o) => o.id === localParams.head_office_organization_id)
    : null

  const franchiseOptions =
    selectedOffice?.franchises.map((f) => ({
      value: String(f.id),
      label: f.name,
    })) ?? []

  const authoritySelectOptions = authorities.map((auth) => ({
    value: String(auth.id),
    label: auth.name,
  }))

  const workStatusSelectOptions = WORK_STATUS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

  // 권한별 자동선택 (render-time setState 가드 패턴 — react-hooks/set-state-in-effect 회피)
  // bpTree 로드 완료 + 가드 미적용 시 1회 자동선택 + 부모 onSearch 호출.
  const [autoApplied, setAutoApplied] = useState(false)

  if (!autoApplied && !bpLoading && bpTree.length > 0) {
    if (isFranchiseUser) {
      const targetOffice = bpTree[0]
      const targetFranchise = targetOffice?.franchises[0]
      if (targetOffice && targetFranchise) {
        setAutoApplied(true)
        const nextParams: BpAdminSearchParams = {
          ...localParams,
          admin_type: 'FRANCHISE',
          head_office_organization_id: targetOffice.id,
          franchise_organization_id: targetFranchise.id,
        }
        setLocalParams(nextParams)
        setPrevParams(nextParams)
        onSearch(nextParams)
      }
    } else if (isHeadOfficeUser) {
      const targetOffice = bpTree[0]
      if (targetOffice) {
        setAutoApplied(true)
        const nextParams: BpAdminSearchParams = {
          ...localParams,
          head_office_organization_id: targetOffice.id,
        }
        setLocalParams(nextParams)
        setPrevParams(nextParams)
        onSearch(nextParams)
      }
    } else {
      // PLATFORM: bpTree.length === 1 이면 자연 잠금 효과
      setAutoApplied(true)
    }
  }

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string }[] = []
  if (params.admin_type) {
    const label = adminTypeSelectOptions.find((o) => o.value === params.admin_type)?.label
    if (label) appliedTags.push({ key: 'adminType', value: label, category: '관리자 종류' })
  }
  if (params.head_office_organization_id != null) {
    const label = headOfficeOptions.find(
      (o) => o.value === String(params.head_office_organization_id),
    )?.label
    if (label) appliedTags.push({ key: 'headOffice', value: label, category: '본사' })
  }
  if (params.franchise_organization_id != null) {
    const office = bpTree.find((o) =>
      o.franchises.some((f) => f.id === params.franchise_organization_id),
    )
    const label = office?.franchises.find((f) => f.id === params.franchise_organization_id)?.name
    if (label) appliedTags.push({ key: 'franchise', value: label, category: '가맹' })
  }
  if (params.authority_id != null) {
    const label = authoritySelectOptions.find((o) => o.value === String(params.authority_id))?.label
    if (label) appliedTags.push({ key: 'authority', value: label, category: '권한' })
  }
  if (params.user_type) {
    const label = workStatusSelectOptions.find((o) => o.value === params.user_type)?.label
    if (label) appliedTags.push({ key: 'workStatus', value: label, category: '근무여부' })
  }
  if (params.start_date || params.end_date) {
    const from = params.start_date ?? ''
    const to = params.end_date ?? ''
    appliedTags.push({ key: 'date', value: `${from} ~ ${to}`, category: '등록일' })
  }

  const handleRemoveTag = (key: string) => {
    // 잠금 필드는 제거 불가
    if (key === 'adminType' && isAdminTypeFixed) return
    if (key === 'headOffice' && isOfficeFixed) return
    if (key === 'franchise' && isFranchiseFixed) return

    const resetMap: Record<string, Partial<BpAdminSearchParams>> = {
      adminType: { admin_type: undefined },
      headOffice: {
        head_office_organization_id: undefined,
        franchise_organization_id: undefined,
      },
      franchise: { franchise_organization_id: undefined },
      authority: { authority_id: undefined },
      workStatus: { user_type: undefined },
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
    // 잠금 필드는 보존
    const preserved: BpAdminSearchParams = {}
    if (isAdminTypeFixed) preserved.admin_type = localParams.admin_type
    if (isOfficeFixed) preserved.head_office_organization_id = localParams.head_office_organization_id
    if (isFranchiseFixed) preserved.franchise_organization_id = localParams.franchise_organization_id
    setLocalParams(preserved)
    // 부모 params 동기화 전에 prevParams 도 갱신해 render-time 동기화 루프 방지
    setPrevParams(preserved)
    setStartDate(null)
    setEndDate(null)
    // 부모 params 까지 잠금 필드 보존된 상태로 동기화
    onSearch(preserved)
    onReset?.()
  }

  const handleAdminTypeChange = (option: { value: string; label: string } | null) => {
    setLocalParams({
      ...localParams,
      admin_type: (option?.value as AdminType | undefined) || undefined,
    })
  }

  const handleHeadOfficeChange = (option: { value: string; label: string } | null) => {
    setLocalParams({
      ...localParams,
      head_office_organization_id: option ? Number(option.value) : undefined,
      // 본사가 바뀌면 가맹 선택 초기화
      franchise_organization_id: undefined,
    })
  }

  const handleFranchiseChange = (option: { value: string; label: string } | null) => {
    setLocalParams({
      ...localParams,
      franchise_organization_id: option ? Number(option.value) : undefined,
    })
  }

  const handleAuthorityChange = (option: { value: string; label: string } | null) => {
    setLocalParams({
      ...localParams,
      authority_id: option ? Number(option.value) : undefined,
    })
  }

  const handleWorkStatusChange = (option: { value: string; label: string } | null) => {
    setLocalParams({
      ...localParams,
      user_type: option?.value || undefined,
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
          {appliedTags.map((tag) => {
            const isFixedTag =
              (tag.key === 'adminType' && isAdminTypeFixed) ||
              (tag.key === 'headOffice' && isOfficeFixed) ||
              (tag.key === 'franchise' && isFranchiseFixed)
            return (
              <li key={tag.key} className="search-result-item">
                <div className="search-result-item-txt">
                  <span>{tag.value}</span> ({tag.category})
                </div>
                {!isFixedTag && (
                  <button
                    type="button"
                    className="search-result-item-btn"
                    onClick={() => handleRemoveTag(tag.key)}
                    aria-label={`${tag.category} 필터 제거`}
                  ></button>
                )}
              </li>
            )
          })}
          <li className="search-result-item">
            <div className="search-result-item-txt">
              <span>{resultCount.toLocaleString()}건</span>
            </div>
          </li>
        </ul>
        <button
          className="search-filed-btn"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="검색 조건 펼치기/접기"
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
                <th>관리자 종류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={adminTypeSelectOptions}
                      value={
                        localParams.admin_type
                          ? adminTypeSelectOptions.find(
                              (opt) => opt.value === localParams.admin_type,
                            ) ?? null
                          : null
                      }
                      onChange={handleAdminTypeChange}
                      placeholder="전체"
                      isClearable={!isAdminTypeFixed}
                      isDisabled={isAdminTypeFixed}
                    />
                  </div>
                </td>
                <th>본사</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={headOfficeOptions}
                      value={
                        localParams.head_office_organization_id != null
                          ? headOfficeOptions.find(
                              (opt) =>
                                opt.value === String(localParams.head_office_organization_id),
                            ) ?? null
                          : null
                      }
                      onChange={handleHeadOfficeChange}
                      placeholder="전체"
                      isClearable={!isOfficeFixed}
                      isDisabled={isOfficeFixed}
                    />
                  </div>
                </td>
                <th>가맹</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={franchiseOptions}
                      value={
                        localParams.franchise_organization_id != null
                          ? franchiseOptions.find(
                              (opt) =>
                                opt.value === String(localParams.franchise_organization_id),
                            ) ?? null
                          : null
                      }
                      onChange={handleFranchiseChange}
                      placeholder="전체"
                      isClearable={!isFranchiseFixed}
                      isDisabled={isFranchiseFixed || !localParams.head_office_organization_id}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <th>권한</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={authoritySelectOptions}
                      value={
                        localParams.authority_id != null
                          ? authoritySelectOptions.find(
                              (opt) => opt.value === String(localParams.authority_id),
                            ) ?? null
                          : null
                      }
                      onChange={handleAuthorityChange}
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
                          ? workStatusSelectOptions.find(
                              (opt) => opt.value === localParams.user_type,
                            ) ?? null
                          : null
                      }
                      onChange={handleWorkStatusChange}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
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
