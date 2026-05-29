'use client'

import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import type { AuthoritySearchParams } from '@/lib/schemas/authority'
import { useCommonCodeHierarchy } from '@/hooks/queries/use-common-code-queries'
import { useBpHeadOfficeTree } from '@/hooks/queries'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import type { OfficeFranchiseStoreValue } from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { RadioButtonGroup } from '@/components/common/ui'
import { useAuthStore } from '@/stores/auth-store'

/**
 * 권한 관리 검색 컴포넌트
 *
 * 권한 Group, 본사, 가맹점, 권한명, 운영여부로 검색 가능
 *
 * @param params - 현재 검색 파라미터
 * @param onSearch - 검색 버튼 클릭 시 실행할 함수
 * @param resultCount - 검색 결과 개수
 */
interface AuthoritySearchProps {
  params: AuthoritySearchParams
  onSearch: (params: AuthoritySearchParams) => void
  resultCount?: number
  context?: 'platform' | 'bp'
  onAutoSelect?: (value: OfficeFranchiseStoreValue) => void
}

export default function AuthoritySearch({
  params,
  onSearch,
  resultCount = 0,
  context,
  onAutoSelect,
}: AuthoritySearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [localParams, setLocalParams] = useState<AuthoritySearchParams>(params)

  // 권한 Group 공통코드 조회
  const { data: ownerGroupOptions = [] } = useCommonCodeHierarchy('PRGRP')

  // 잠금 정책 (accountType 기반) — 다른 검색 컴포넌트와 일관
  const accountType = useAuthStore((s) => s.accountType)
  const isOfficeFixed = accountType === 'HEAD_OFFICE' || accountType === 'FRANCHISE'
  const isFranchiseFixed = accountType === 'FRANCHISE'

  // 본사/가맹 이름 조회용 트리
  const { data: bpTree = [] } = useBpHeadOfficeTree()

  // 적용된 검색 조건 태그 (params 기준 — onSearch 후 부모가 갱신)
  const appliedTags: { key: string; value: string; category: string; removable?: boolean }[] = []
  if (params.head_office_id != null) {
    const officeName = bpTree.find((o) => o.id === params.head_office_id)?.name
    if (officeName) appliedTags.push({ key: 'office', value: officeName, category: '본사', removable: !isOfficeFixed })
  }
  if (params.franchisee_id != null) {
    const franchise = bpTree.flatMap((o) => o.franchises).find((f) => f.id === params.franchisee_id)
    if (franchise) appliedTags.push({ key: 'franchise', value: franchise.name, category: '가맹점', removable: !isFranchiseFixed })
  }
  if (params.name) {
    appliedTags.push({ key: 'name', value: params.name, category: '권한명' })
  }
  if (params.is_used !== undefined) {
    appliedTags.push({ key: 'is_used', value: params.is_used ? '운영' : '미운영', category: '운영여부' })
  }

  const handleRemoveTag = (key: string) => {
    const nextParams = { ...params }
    if (key === 'office') {
      delete nextParams.head_office_id
      delete nextParams.franchisee_id
    } else if (key === 'franchise') {
      delete nextParams.franchisee_id
    } else if (key === 'name') {
      delete nextParams.name
    } else if (key === 'is_used') {
      delete nextParams.is_used
    }
    setLocalParams(nextParams)
    onSearch(nextParams)
  }

  // 플랫폼일 때는 본사/가맹점 비활성화
  const isBpDisabled = localParams.owner_group !== 'PRGRP_002'

  const handleOwnerGroupChange = (value: string) => {
    setLocalParams({
      ...localParams,
      owner_group: value,
      head_office_id: undefined,
      franchisee_id: undefined,
    })
  }

  const handleBpSelectChange = (value: { head_office: number | null; franchise: number | null; store: number | null }) => {
    setLocalParams({
      ...localParams,
      head_office_id: value.head_office ?? undefined,
      franchisee_id: value.franchise ?? undefined,
    })
  }

  const handleNameChange = (value: string) => {
    setLocalParams({
      ...localParams,
      name: value || undefined,
    })
  }

  const handleIsUsedChange = (value: string) => {
    setLocalParams({
      ...localParams,
      is_used: value === 'all' ? undefined : value === 'true',
    })
  }

  const handleSearch = () => {
    onSearch(localParams)
  }

  const handleReset = () => {
    const resetParams: AuthoritySearchParams = {
      owner_group: context === 'bp' ? 'PRGRP_002' : (ownerGroupOptions[0]?.code || 'PRGRP_001'),
    }
    setLocalParams(resetParams)
    // 초기화는 검색 조건만 리셋, 검색 버튼을 눌러야 실제 검색 실행
  }

  const handleClose = () => {
    setSearchOpen(false)
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
              {context !== 'bp' && (
                <>
                  <col width="120px" />
                  <col />
                </>
              )}
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                {context !== 'bp' && (
                  <>
                    <th>
                      권한 Group <span className="red">*</span>
                    </th>
                    <td>
                      <RadioButtonGroup
                        options={ownerGroupOptions.map((option) => ({
                          value: option.code,
                          label: option.name,
                        }))}
                        value={localParams.owner_group}
                        onChange={handleOwnerGroupChange}
                        name="owner_group"
                      />
                    </td>
                  </>
                )}
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={false}
                  fields={['office', 'franchise']}
                  officeId={localParams.head_office_id ?? null}
                  franchiseId={localParams.franchisee_id ?? null}
                  storeId={null}
                  onChange={handleBpSelectChange}
                  isDisabled={context === 'bp' ? false : isBpDisabled}
                  autoSelect={context === 'bp'}
                  onAutoSelect={onAutoSelect}
                />
              </tr>
              <tr>
                <th>권한명</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="text"
                      className="input-frame"
                      value={localParams.name || ''}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>
                </td>
                <th>운영여부</th>
                <td colSpan={context !== 'bp' ? 3 : 1}>
                  <RadioButtonGroup
                    options={[
                      { value: 'all', label: '전체' },
                      { value: 'true', label: '운영' },
                      { value: 'false', label: '미운영' },
                    ]}
                    value={
                      localParams.is_used === undefined
                        ? 'all'
                        : localParams.is_used === true
                          ? 'true'
                          : 'false'
                    }
                    onChange={handleIsUsedChange}
                    name="is_used"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray" onClick={handleClose}>
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
