'use client'

import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { RadioButtonGroup } from '@/components/common/ui'
import type { CommonCodeSearchParams } from '@/lib/schemas/common-code'

const OWNER_GROUP_OPTIONS = [
  { value: 'platform', label: '플랫폼' },
  { value: 'bp', label: 'BP' },
]

/**
 * 공통코드 관리 검색 컴포넌트
 *
 * 공통코드 Group, 본사, 가맹점, 운영여부, Relation code 유무,
 * Header Code, Header ID, Header code name, Header code Description 로 검색 가능
 *
 * @param params - 현재 검색 파라미터
 * @param onSearch - 검색 버튼 클릭 시 실행할 함수
 * @param resultCount - 검색 결과 개수
 */
interface CommonCodeSearchProps {
  params: CommonCodeSearchParams
  onSearch: (params: CommonCodeSearchParams) => void
  resultCount?: number
}

export default function CommonCodeSearch({
  params,
  onSearch,
  resultCount = 0,
}: CommonCodeSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [localParams, setLocalParams] = useState<CommonCodeSearchParams>(params)

  // 플랫폼일 때는 본사/가맹점 비활성화
  const isBpDisabled = localParams.ownerGroup !== 'bp'

  const handleOwnerGroupChange = (value: string) => {
    setLocalParams({
      ...localParams,
      ownerGroup: value,
      headOfficeId: undefined,
      franchiseeId: undefined,
    })
  }

  const handleBpSelectChange = (value: { head_office: number | null; franchise: number | null; store: number | null }) => {
    setLocalParams({
      ...localParams,
      headOfficeId: value.head_office ?? undefined,
      franchiseeId: value.franchise ?? undefined,
    })
  }

  const handleIsActiveChange = (value: string) => {
    setLocalParams({
      ...localParams,
      isActive: value === 'all' ? undefined : value === 'true',
    })
  }

  const handleHasRelationCodeChange = (value: string) => {
    setLocalParams({
      ...localParams,
      hasRelationCode: value === 'all' ? undefined : value === 'true',
    })
  }

  const handleInputChange = (field: keyof CommonCodeSearchParams, value: string) => {
    setLocalParams({
      ...localParams,
      [field]: value || undefined,
    })
  }

  const handleSearch = () => {
    onSearch(localParams)
    setSearchOpen(false)
  }

  const handleReset = () => {
    const resetParams: CommonCodeSearchParams = {
      ownerGroup: 'platform',
    }
    setLocalParams(resetParams)
  }

  const handleClose = () => {
    setSearchOpen(false)
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <div className="search-result">
          검색결과 <span>{resultCount}건</span>
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
                <th>
                  공통코드 Group <span className="red">*</span>
                </th>
                <td>
                  <RadioButtonGroup
                    options={OWNER_GROUP_OPTIONS}
                    value={localParams.ownerGroup}
                    onChange={handleOwnerGroupChange}
                    name="ownerGroup"
                  />
                </td>
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={false}
                  fields={['office', 'franchise']}
                  officeId={localParams.headOfficeId ?? null}
                  franchiseId={localParams.franchiseeId ?? null}
                  storeId={null}
                  onChange={handleBpSelectChange}
                  isDisabled={isBpDisabled}
                />
              </tr>
              <tr>
                <th>운영여부</th>
                <td>
                  <RadioButtonGroup
                    options={[
                      { value: 'all', label: '전체' },
                      { value: 'true', label: '운영' },
                      { value: 'false', label: '미운영' },
                    ]}
                    value={
                      localParams.isActive === undefined
                        ? 'all'
                        : localParams.isActive === true
                          ? 'true'
                          : 'false'
                    }
                    onChange={handleIsActiveChange}
                    name="isActive"
                  />
                </td>
                <th>Relation code 유무</th>
                <td>
                  <RadioButtonGroup
                    options={[
                      { value: 'all', label: '전체' },
                      { value: 'true', label: '있음' },
                      { value: 'false', label: '없음' },
                    ]}
                    value={
                      localParams.hasRelationCode === undefined
                        ? 'all'
                        : localParams.hasRelationCode === true
                          ? 'true'
                          : 'false'
                    }
                    onChange={handleHasRelationCodeChange}
                    name="hasRelationCode"
                  />
                </td>
                <th>Header Code</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="text"
                      className="input-frame"
                      value={localParams.headerCode || ''}
                      onChange={(e) => handleInputChange('headerCode', e.target.value)}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <th>Header ID</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="text"
                      className="input-frame"
                      value={localParams.headerId || ''}
                      onChange={(e) => handleInputChange('headerId', e.target.value)}
                    />
                  </div>
                </td>
                <th>Header code name</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="text"
                      className="input-frame"
                      value={localParams.headerName || ''}
                      onChange={(e) => handleInputChange('headerName', e.target.value)}
                    />
                  </div>
                </td>
                <th>Header code Description</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="text"
                      className="input-frame"
                      value={localParams.headerDescription || ''}
                      onChange={(e) => handleInputChange('headerDescription', e.target.value)}
                    />
                  </div>
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
