'use client'

import AnimateHeight from 'react-animate-height'
import { useState, useRef, useEffect } from 'react'
import SearchSelect from '@/components/ui/common/SearchSelect'
import RangeDatePicker from '@/components/ui/common/RangeDatePicker'
import Input from '@/components/common/ui/Input'
import { useBpAdminAuthorityCandidates } from '@/hooks/queries/use-bp-admin-queries'
import { useBpHeadOfficeTree } from '@/hooks/queries/use-bp-queries'
import { WORK_STATUS_OPTIONS } from '@/lib/schemas/admin'
import type { BpAdminSearchParams, AdminType } from '@/types/bp-admin'
import { formatDateYmdOrUndefined } from '@/util/date-util'
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

/**
 * BE 검색 모델(organization_type + head_office_id + franchise_id)을 컴포넌트 내부의
 * UI 모델(adminType + headOfficeId + franchiseId)로 분리해서 다룬다.
 * - 부모 → 컴포넌트: BE 모델 → local 변환 (마운트/params 변경 시 1회)
 * - 컴포넌트 → 부모: local 모델 → BE 모델 변환 후 onSearch 호출
 */
export default function BpAdminSearch({
  params,
  onSearch,
  onReset,
  resultCount = 0,
}: BpAdminSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  // ----- local UI state (FE 모델) -----
  const [localName, setLocalName] = useState<string>(params.name ?? '')
  const [localLoginId, setLocalLoginId] = useState<string>(params.login_id ?? '')
  const [localAdminType, setLocalAdminType] = useState<AdminType | undefined>(
    params.organization_type,
  )
  const [localHeadOfficeId, setLocalHeadOfficeId] = useState<number | null>(
    params.head_office_id ?? null,
  )
  const [localFranchiseId, setLocalFranchiseId] = useState<number | null>(
    params.franchise_id ?? null,
  )
  const [localAuthorityId, setLocalAuthorityId] = useState<number | null>(
    params.authority_id ?? null,
  )
  const [localUserType, setLocalUserType] = useState<string | undefined>(params.user_type)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // 부모에서 params가 갱신되면 local 모델로 역변환 (render-time setState 가드 패턴)
  const [prevParams, setPrevParams] = useState(params)
  if (params !== prevParams) {
    setPrevParams(params)
    setLocalName(params.name ?? '')
    setLocalLoginId(params.login_id ?? '')
    setLocalAdminType(params.organization_type)
    setLocalHeadOfficeId(params.head_office_id ?? null)
    setLocalFranchiseId(params.franchise_id ?? null)
    setLocalAuthorityId(params.authority_id ?? null)
    setLocalUserType(params.user_type)
  }

  // 옵션 데이터
  const { data: bpTree = [], isPending: bpLoading } = useBpHeadOfficeTree()

  // 권한 정책 (BE PR #152 accountType 기반) — 검색 폼 한정
  // - PLATFORM: 전체 노출 (자동선택 X, 잠금 X)
  // - HEAD_OFFICE: 본사 자동선택 + 잠금 (산하 가맹은 1개여도 고정 X — 종류·가맹 자유)
  // - FRANCHISE: 본사+가맹 자동선택 + 잠금 (관리자 종류는 자유 — 검색 UX 유연성)
  const accountType = useAuthStore((s) => s.accountType)
  const isHeadOfficeUser = accountType === 'HEAD_OFFICE'
  const isFranchiseUser = accountType === 'FRANCHISE'

  // 검색 폼에서 관리자 종류는 항상 자유 선택 가능 (등록 폼은 BpAdminForm 에서 별도 잠금).
  const isOfficeFixed = isHeadOfficeUser || isFranchiseUser
  const isFranchiseFixed = isFranchiseUser
  // 권한 옵션 (/bp-admins/authority-options):
  // - 조직 미선택 → organization_id 미전송 → 전체 권한
  // - 가맹 선택 → 가맹 id 전송 → 해당 가맹 권한
  // - 본사만 선택 → 본사 id 전송 → 해당 본사 권한
  const effectiveAuthorityOrgId = localFranchiseId ?? localHeadOfficeId
  const { data: authorities = [] } = useBpAdminAuthorityCandidates(
    effectiveAuthorityOrgId,
    { enabled: true },
  )

  const adminTypeSelectOptions = ADMIN_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

  const headOfficeOptions = bpTree.map((office) => ({
    value: String(office.id),
    label: office.name,
  }))

  const selectedOffice =
    localHeadOfficeId != null ? bpTree.find((o) => o.id === localHeadOfficeId) : null

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

  // local 모델 → BE 모델 변환
  const buildBeParams = (overrides?: {
    name?: string
    loginId?: string
    adminType?: AdminType | undefined
    headOfficeId?: number | null
    franchiseId?: number | null
    authorityId?: number | null
    userType?: string | undefined
    startDate?: string | undefined
    endDate?: string | undefined
  }): BpAdminSearchParams => {
    const name = overrides?.name ?? localName
    const loginId = overrides?.loginId ?? localLoginId
    const adminType = overrides?.adminType !== undefined ? overrides.adminType : localAdminType
    const headOfficeId =
      overrides?.headOfficeId !== undefined ? overrides.headOfficeId : localHeadOfficeId
    const franchiseId =
      overrides?.franchiseId !== undefined ? overrides.franchiseId : localFranchiseId
    const authorityId =
      overrides?.authorityId !== undefined ? overrides.authorityId : localAuthorityId
    const userType = overrides?.userType !== undefined ? overrides.userType : localUserType
    const start_date =
      overrides?.startDate !== undefined
        ? overrides.startDate
        : formatDateYmdOrUndefined(startDate)
    const end_date =
      overrides?.endDate !== undefined ? overrides.endDate : formatDateYmdOrUndefined(endDate)

    return {
      name: name.trim() || undefined,
      login_id: loginId.trim() || undefined,
      user_type: userType || undefined,
      organization_type: adminType,
      head_office_id: headOfficeId ?? undefined,
      franchise_id: franchiseId ?? undefined,
      authority_id: authorityId ?? undefined,
      start_date,
      end_date,
    }
  }

  // 권한별 자동선택 — useEffect 패턴.
  // render-time에 부모 onSearch (= setSearchParams)를 호출하면 React가
  // "Cannot update a component while rendering" 경고를 띄우므로 effect로 미룬다.
  // autoApplied는 state 대신 ref로 — set-state-in-effect 회피.
  const autoAppliedRef = useRef(false)

  useEffect(() => {
    if (autoAppliedRef.current) return
    // accountType 이 null 이면 persist hydration 전 → 가드 마킹 보류
    if (accountType == null) return
    if (bpLoading || bpTree.length === 0) return

    // BE 명세상 본사BP/가맹BP 계정은 자기 조직만 내려와야 함. 위반 시 dev warning (Boston #8).
    if (process.env.NODE_ENV === 'development') {
      if (isHeadOfficeUser && bpTree.length > 1) {
        console.warn('[BpAdminSearch] HEAD_OFFICE 계정에 본사 2개+ 내려옴 — BE 명세 위반 의심', bpTree)
      }
      if (isFranchiseUser && (bpTree.length > 1 || (bpTree[0]?.franchises.length ?? 0) > 1)) {
        console.warn('[BpAdminSearch] FRANCHISE 계정에 다중 본사/가맹 내려옴 — BE 명세 위반 의심', bpTree)
      }
    }

    // effect 안에서는 부모 onSearch 만 호출. local state 는 부모 params 변경 이후
    // render-time 가드 (params !== prevParams) 가 자동 동기화하므로 여기서 setState 안 함.
    // BE 가 자기 권한 조직만 내려주므로 bpTree[0] 가 자기 본사.
    if (isFranchiseUser) {
      const targetOffice = bpTree[0]
      const targetFranchise = targetOffice?.franchises[0]
      if (targetOffice && targetFranchise) {
        autoAppliedRef.current = true
        // 본사+가맹만 자동 고정. 관리자 종류는 자유(사용자가 종류로 추가 필터링 가능).
        onSearch({
          head_office_id: targetOffice.id,
          franchise_id: targetFranchise.id,
        })
      }
    } else if (isHeadOfficeUser) {
      const targetOffice = bpTree[0]
      if (targetOffice) {
        autoAppliedRef.current = true
        onSearch({
          head_office_id: targetOffice.id,
        })
      }
    } else {
      // PLATFORM: 자동선택 없음. 단 page 의 hasInitialApply 가드 해제를 위해 현재 params 그대로 한 번 호출.
      autoAppliedRef.current = true
      onSearch(params)
    }
  }, [accountType, bpLoading, bpTree, isFranchiseUser, isHeadOfficeUser, onSearch, params])

  // 적용된 검색 조건 태그 (parent params 기반 → 실제 조회 조건 반영)
  const appliedTags: { key: string; value: string; category: string; removable?: boolean }[] = []
  if (params.name) {
    appliedTags.push({ key: 'name', value: params.name, category: '관리자명' })
  }
  if (params.login_id) {
    appliedTags.push({ key: 'loginId', value: params.login_id, category: '로그인 ID' })
  }
  if (params.organization_type) {
    const label = adminTypeSelectOptions.find((o) => o.value === params.organization_type)?.label
    if (label) appliedTags.push({ key: 'adminType', value: label, category: '관리자 종류' })
  }
  if (params.head_office_id != null) {
    const label = headOfficeOptions.find(
      (o) => o.value === String(params.head_office_id),
    )?.label
    if (label) appliedTags.push({ key: 'headOffice', value: label, category: '본사', removable: !isOfficeFixed })
  }
  if (params.franchise_id != null) {
    const office = bpTree.find((o) =>
      o.franchises.some((f) => f.id === params.franchise_id),
    )
    const franchise = office?.franchises.find((f) => f.id === params.franchise_id)
    if (franchise) {
      appliedTags.push({ key: 'franchise', value: franchise.name, category: '가맹', removable: !isFranchiseFixed })
    }
  }
  if (params.authority_id != null) {
    const label = authoritySelectOptions.find(
      (o) => o.value === String(params.authority_id),
    )?.label
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
    // 잠금 필드는 제거 불가 (관리자 종류는 검색에서 자유)
    if (key === 'headOffice' && isOfficeFixed) return
    if (key === 'franchise' && isFranchiseFixed) return

    let next: BpAdminSearchParams
    switch (key) {
      case 'name':
        setLocalName('')
        next = buildBeParams({ name: '' })
        break
      case 'loginId':
        setLocalLoginId('')
        next = buildBeParams({ loginId: '' })
        break
      case 'adminType':
        // 관리자 종류만 해제 (본사/가맹점 잠금은 보존)
        setLocalAdminType(undefined)
        next = buildBeParams({ adminType: undefined })
        break
      case 'headOffice':
        // 본사 제거 시 가맹도 같이 초기화 (본사 컨텍스트가 사라지므로)
        setLocalHeadOfficeId(null)
        setLocalFranchiseId(null)
        next = buildBeParams({ headOfficeId: null, franchiseId: null })
        break
      case 'franchise':
        setLocalFranchiseId(null)
        next = buildBeParams({ franchiseId: null })
        break
      case 'authority':
        setLocalAuthorityId(null)
        next = buildBeParams({ authorityId: null })
        break
      case 'workStatus':
        setLocalUserType(undefined)
        next = buildBeParams({ userType: undefined })
        break
      case 'date':
        setStartDate(null)
        setEndDate(null)
        next = buildBeParams({ startDate: undefined, endDate: undefined })
        break
      default:
        return
    }
    setPrevParams(next)
    onSearch(next)
  }

  const handleSearch = () => {
    const next = buildBeParams()
    setPrevParams(next)
    onSearch(next)
    setSearchOpen(false)
  }

  const handleReset = () => {
    // 잠금 필드는 보존, 그 외는 모두 초기화 (관리자 종류는 검색에서 자유)
    const preservedAdminType: AdminType | undefined = undefined
    const preservedHeadOfficeId: number | null = isOfficeFixed ? localHeadOfficeId : null
    const preservedFranchiseId: number | null = isFranchiseFixed ? localFranchiseId : null

    setLocalName('')
    setLocalLoginId('')
    setLocalAdminType(preservedAdminType)
    setLocalHeadOfficeId(preservedHeadOfficeId)
    setLocalFranchiseId(preservedFranchiseId)
    setLocalAuthorityId(null)
    setLocalUserType(undefined)
    setStartDate(null)
    setEndDate(null)

    const next = buildBeParams({
      name: '',
      loginId: '',
      adminType: preservedAdminType,
      headOfficeId: preservedHeadOfficeId,
      franchiseId: preservedFranchiseId,
      authorityId: null,
      userType: undefined,
      startDate: undefined,
      endDate: undefined,
    })
    // 부모 params 동기화 전에 prevParams 도 갱신해 render-time 동기화 루프 방지
    setPrevParams(next)
    onSearch(next)
    onReset?.()
  }

  const handleAdminTypeChange = (option: { value: string; label: string } | null) => {
    const nextType = (option?.value as AdminType | undefined) || undefined
    setLocalAdminType(nextType)
    // 타입 변경 시 본사/가맹 선택 초기화 (잠금 사용자가 아닐 때만)
    if (!isOfficeFixed) setLocalHeadOfficeId(null)
    if (!isFranchiseFixed) setLocalFranchiseId(null)
  }

  const handleHeadOfficeChange = (option: { value: string; label: string } | null) => {
    setLocalHeadOfficeId(option ? Number(option.value) : null)
    // 본사 변경 시 가맹 초기화
    if (!isFranchiseFixed) setLocalFranchiseId(null)
  }

  const handleFranchiseChange = (option: { value: string; label: string } | null) => {
    setLocalFranchiseId(option ? Number(option.value) : null)
  }

  const handleAuthorityChange = (option: { value: string; label: string } | null) => {
    setLocalAuthorityId(option ? Number(option.value) : null)
  }

  const handleWorkStatusChange = (option: { value: string; label: string } | null) => {
    setLocalUserType(option?.value || undefined)
  }

  const handleDateChange = (range: { startDate: Date | null; endDate: Date | null }) => {
    setStartDate(range.startDate)
    setEndDate(range.endDate)
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <ul className="search-result-list">
          {appliedTags.map((tag) => {
            return (
              <li key={tag.key} className="search-result-item">
                <div className="search-result-item-txt">
                  <span>{tag.value}</span> ({tag.category})
                </div>
                <button
                  type="button"
                  className="search-result-item-btn"
                  onClick={() => {
                    if (tag.removable === false) return
                    handleRemoveTag(tag.key)
                  }}
                  aria-label={`${tag.category} 필터 제거`}
                ></button>
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
                <th>관리자명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      type="text"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      placeholder="관리자명 입력"
                      fullWidth
                    />
                  </div>
                </td>
                <th>로그인 ID</th>
                <td>
                  <div className="data-filed">
                    <Input
                      type="text"
                      value={localLoginId}
                      onChange={(e) => setLocalLoginId(e.target.value)}
                      placeholder="로그인 ID 입력"
                      fullWidth
                    />
                  </div>
                </td>
                <th>관리자 종류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={adminTypeSelectOptions}
                      value={
                        localAdminType
                          ? adminTypeSelectOptions.find((opt) => opt.value === localAdminType) ??
                            null
                          : null
                      }
                      onChange={handleAdminTypeChange}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <th>본사</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={headOfficeOptions}
                      value={
                        localHeadOfficeId != null
                          ? headOfficeOptions.find(
                              (opt) => opt.value === String(localHeadOfficeId),
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
                        localFranchiseId != null
                          ? franchiseOptions.find(
                              (opt) => opt.value === String(localFranchiseId),
                            ) ?? null
                          : null
                      }
                      onChange={handleFranchiseChange}
                      placeholder="전체"
                      isClearable={!isFranchiseFixed}
                      isDisabled={isFranchiseFixed || localHeadOfficeId == null}
                    />
                  </div>
                </td>
                <th>권한</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={authoritySelectOptions}
                      value={
                        localAuthorityId != null
                          ? authoritySelectOptions.find(
                              (opt) => opt.value === String(localAuthorityId),
                            ) ?? null
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
                <th>근무여부</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={workStatusSelectOptions}
                      value={
                        localUserType
                          ? workStatusSelectOptions.find((opt) => opt.value === localUserType) ??
                            null
                          : null
                      }
                      onChange={handleWorkStatusChange}
                      placeholder="전체"
                      isClearable
                    />
                  </div>
                </td>
                <th>등록일</th>
                <td colSpan={3}>
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
