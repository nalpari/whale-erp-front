'use client'

import type { ReactNode } from 'react'

import { RadioButtonGroup } from '@/components/common/ui'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import type { AuthorityCreateRequest, AuthorityUpdateRequest } from '@/lib/schemas/authority'

interface AuthorityFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<AuthorityCreateRequest>
  onChange: (data: Partial<AuthorityCreateRequest | AuthorityUpdateRequest>) => void
  onList?: () => void
  onDelete?: () => void
  onSave?: () => void
  onAuthorityManager?: () => void
  children?: ReactNode
  errors?: Record<string, string>
}

export default function AuthorityForm({
  mode,
  initialData = {},
  onChange,
  onList,
  onDelete,
  onSave,
  onAuthorityManager,
  children,
  errors = {},
}: AuthorityFormProps) {
  // 현재 폼 데이터
  const formData = {
    owner_code: initialData.owner_code || 'PRGRP_001_001',
    head_office_id: initialData.head_office_id,
    franchisee_id: initialData.franchisee_id,
    name: initialData.name || '',
    is_used: initialData.is_used ?? true,
    description: initialData.description || '',
  }

  // owner_code에 따라 본사/가맹점 선택 활성화
  const showHeadOffice = formData.owner_code !== 'PRGRP_001_001'
  const showFranchise = formData.owner_code === 'PRGRP_002_002'
  const isBpDisabled = mode === 'edit'

  const handleOwnerCodeChange = (value: string) => {
    const newData: Partial<AuthorityCreateRequest> = {
      owner_code: value as 'PRGRP_001_001' | 'PRGRP_002_001' | 'PRGRP_002_002',
      head_office_id: undefined,
      franchisee_id: undefined,
    }
    onChange(newData)
  }

  const handleBpSelectChange = (value: { head_office: number | null; franchise: number | null; store: number | null }) => {
    onChange({
      head_office_id: value.head_office ?? undefined,
      franchisee_id: value.franchise ?? undefined,
    })
  }

  const handleNameChange = (value: string) => {
    onChange({ name: value })
  }

  const handleIsUsedChange = (value: boolean) => {
    onChange({ is_used: value })
  }

  const handleDescriptionChange = (value: string) => {
    onChange({ description: value })
  }

  return (
    <>
      <div className="contents-btn">
        {onList && (
          <button className="btn-form gray" onClick={onList} type="button">
            목록
          </button>
        )}
        {mode === 'edit' && onAuthorityManager && (
          <button className="btn-form gray" onClick={onAuthorityManager} type="button">
            권한 관리자
          </button>
        )}
        {mode === 'edit' && onDelete && (
          <button className="btn-form gray" onClick={onDelete} type="button">
            삭제
          </button>
        )}
        {onSave && (
          <button className="btn-form basic" onClick={onSave} type="button">
            저장
          </button>
        )}
      </div>
      <div className="contents-body">
        <div className="content-wrap">
          <table className="default-table">
            <colgroup>
              <col width="180px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>
                  권한 소유 <span className="red">*</span>
                </th>
                <td>
                  <RadioButtonGroup
                    options={[
                      { value: 'PRGRP_001_001', label: '플랫폼' },
                      { value: 'PRGRP_002_001', label: '본사' },
                      { value: 'PRGRP_002_002', label: '가맹점' },
                    ]}
                    value={formData.owner_code}
                    onChange={handleOwnerCodeChange}
                    disabled={mode === 'edit'}
                    name="authority-owner"
                  />
                  {errors.owner_code && <div className="warning-txt mt5" role="alert">* {errors.owner_code}</div>}
                </td>
              </tr>
              {showHeadOffice && (
                <tr>
                  <th>
                    본사/가맹점 선택 <span className="red">*</span>
                  </th>
                  <td>
                    <table className="default-table">
                      <colgroup>
                        <col width="120px" />
                        <col />
                        {showFranchise && <col width="120px" />}
                        {showFranchise && <col />}
                      </colgroup>
                      <tbody>
                        <tr>
                          <HeadOfficeFranchiseStoreSelect
                            isHeadOfficeRequired={true}
                            showHeadOfficeError={!!errors.head_office_id}
                            fields={showFranchise ? ['office', 'franchise'] : ['office']}
                            officeId={formData.head_office_id ?? null}
                            franchiseId={formData.franchisee_id ?? null}
                            storeId={null}
                            onChange={handleBpSelectChange}
                            isDisabled={isBpDisabled}
                          />
                        </tr>
                      </tbody>
                    </table>
                    {errors.head_office_id && (
                      <div className="warning-txt mt5" role="alert">* {errors.head_office_id}</div>
                    )}
                    {errors.franchisee_id && (
                      <div className="warning-txt mt5" role="alert">* {errors.franchisee_id}</div>
                    )}
                  </td>
                </tr>
              )}
              <tr>
                <th>
                  권한명 <span className="red">*</span>
                </th>
                <td>
                  <div className="mx-500">
                    <input
                      type="text"
                      className={`input-frame ${errors.name ? 'err' : ''}`}
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                    {errors.name && <div className="warning-txt mt5" role="alert">* {errors.name}</div>}
                  </div>
                </td>
              </tr>
              <tr>
                <th>
                  운영여부 <span className="red">*</span>
                </th>
                <td>
                  <div className="filed-flx">
                    <RadioButtonGroup
                      options={[
                        { value: 'true', label: '운영' },
                        { value: 'false', label: '미운영' },
                      ]}
                      value={formData.is_used ? 'true' : 'false'}
                      onChange={(value) => handleIsUsedChange(value === 'true')}
                      name="authority-status"
                    />
                    <div className="explain">※ &apos;운영&apos;인 경우에만 관리자에게 권한을 부여할 수 있습니다.</div>
                    {errors.is_used && <div className="warning-txt mt5" role="alert">* {errors.is_used}</div>}
                  </div>
                </td>
              </tr>
              <tr>
                <th>권한 설명</th>
                <td>
                  <div className="block">
                    <input
                      type="text"
                      className="input-frame"
                      value={formData.description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {children}
      </div>
    </>
  )
}
