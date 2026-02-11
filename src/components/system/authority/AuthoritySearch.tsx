'use client'

import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { RadioButtonGroup } from '@/components/common/ui'
import { useCommonCodeHierarchy } from '@/hooks/queries/use-common-code-queries'
import type { AuthoritySearchParams } from '@/lib/schemas/authority'

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
}

export default function AuthoritySearch({
  params,
  onSearch,
  resultCount = 0,
}: AuthoritySearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [localParams, setLocalParams] = useState<AuthoritySearchParams>(params)

  // 권한 Group 공통코드 조회
  const { data: ownerGroupOptions = [] } = useCommonCodeHierarchy('PRGRP')

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
      owner_group: ownerGroupOptions[0]?.code || 'PRGRP_001',
    }
    setLocalParams(resetParams)
    // 초기화는 검색 조건만 리셋, 검색 버튼을 눌러야 실제 검색 실행
  }

  const handleClose = () => {
    setSearchOpen(false)
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="searh-result-wrap">
        <div className="search-result">
          검색결과 <span>{resultCount}건</span>
        </div>
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
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={false}
                  fields={['office', 'franchise']}
                  officeId={localParams.head_office_id ?? null}
                  franchiseId={localParams.franchisee_id ?? null}
                  storeId={null}
                  onChange={handleBpSelectChange}
                  isDisabled={isBpDisabled}
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
                <td colSpan={3}>
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
