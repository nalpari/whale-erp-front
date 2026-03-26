'use client'

import type { ReactNode } from 'react'

import { RadioButtonGroup } from '@/components/common/ui'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useCommonCodeHierarchy } from '@/hooks/queries/use-common-code-queries'
import type { AuthorityCreateRequest, AuthorityUpdateRequest, OwnerCode } from '@/lib/schemas/authority'

interface AuthorityFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<AuthorityCreateRequest>
  onChange: (data: Partial<AuthorityCreateRequest & AuthorityUpdateRequest>) => void
  onList?: () => void
  onDelete?: () => void
  onSave?: () => void
  onAuthorityManager?: () => void
  children?: ReactNode
  errors?: Record<string, string>
  context?: 'platform' | 'bp'
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
  context,
}: AuthorityFormProps) {
  // 요금제 공통코드 조회
  const { data: planTypes, isError: isPlanTypesError } = useCommonCodeHierarchy('PLNTYP')
  const planTypeOptions: SelectOption[] = (planTypes ?? []).map((plan) => ({
    value: plan.code,
    label: plan.name,
  }))

  // 현재 폼 데이터
  const formData = {
    owner_code: initialData.owner_code || 'PRGRP_001_001',
    head_office_id: initialData.head_office_id,
    franchisee_id: initialData.franchisee_id,
    name: initialData.name || '',
    is_bp_master: initialData.is_bp_master ?? false,
    plan_type_code: initialData.plan_type_code,
    is_used: initialData.is_used ?? true,
    description: initialData.description || '',
  }

  // owner_code에 따라 본사/가맹점 선택 활성화
  const showHeadOffice = formData.owner_code !== 'PRGRP_001_001'
  const showFranchise = formData.owner_code === 'PRGRP_002_002'
  const isBpDisabled = mode === 'edit'
  const isPlatform = formData.owner_code === 'PRGRP_001_001'

  const handleOwnerCodeChange = (value: string) => {
    const newData: Partial<AuthorityCreateRequest> = {
      owner_code: value as OwnerCode,
      head_office_id: undefined,
      franchisee_id: undefined,
      // 플랫폼이 아니면 BP Master 초기화
      ...(value !== 'PRGRP_001_001' && { is_bp_master: false, plan_type_code: undefined }),
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

  const handleBpMasterChange = (checked: boolean) => {
    onChange({
      is_bp_master: checked,
      plan_type_code: checked ? formData.plan_type_code : undefined,
    })
  }

  const handlePlanTypeChange = (value: string | undefined) => {
    onChange({ plan_type_code: value })
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
              <col style={{ width: '180px' }} />
              <col />
              {showFranchise && <col style={{ width: '120px' }} />}
              {showFranchise && <col />}
            </colgroup>
            <tbody>
              {context !== 'bp' && (
                <tr>
                  <th>
                    권한 소유 <span className="red">*</span>
                  </th>
                  <td colSpan={showFranchise ? 3 : undefined}>
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
              )}
              {showHeadOffice && (
                <tr>
                  <HeadOfficeFranchiseStoreSelect
                    isHeadOfficeRequired={true}
                    showHeadOfficeError={!!errors.head_office_id}
                    isFranchiseRequired={showFranchise}
                    fields={showFranchise ? ['office', 'franchise'] : ['office']}
                    officeId={formData.head_office_id ?? null}
                    franchiseId={formData.franchisee_id ?? null}
                    storeId={null}
                    onChange={handleBpSelectChange}
                    isDisabled={isBpDisabled}
                  />
                </tr>
              )}
              <tr>
                <th>
                  권한명 <span className="red">*</span>
                </th>
                <td colSpan={showFranchise ? 3 : undefined}>
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
              {isPlatform && (
                <tr>
                  <th>BP Master 권한</th>
                  <td colSpan={showFranchise ? 3 : undefined}>
                    <div className="filed-flx" style={{ gap: '12px', alignItems: 'center' }}>
                      <div className="toggle-btn">
                        <input
                          type="checkbox"
                          id="toggle-bp-master"
                          checked={formData.is_bp_master}
                          onChange={(e) => handleBpMasterChange(e.target.checked)}
                          disabled={mode === 'edit'}
                        />
                        <label className="slider" htmlFor="toggle-bp-master" />
                      </div>
                      {formData.is_bp_master && (
                        <>
                          <SearchSelect
                            options={planTypeOptions}
                            value={planTypeOptions.find((opt) => opt.value === formData.plan_type_code) ?? null}
                            onChange={(opt) => handlePlanTypeChange(opt?.value)}
                            placeholder="선택"
                            isClearable
                            isSearchable={false}
                            isDisabled={mode === 'edit'}
                            error={!!errors.plan_type_code}
                          />
                          {!formData.plan_type_code && errors.plan_type_code && (
                            <div className="warning-txt" role="alert">* {errors.plan_type_code}</div>
                          )}
                          {isPlanTypesError && (
                            <div className="warning-txt" role="alert">* 요금제 목록을 불러오지 못했습니다</div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <th>
                  운영여부 <span className="red">*</span>
                </th>
                <td colSpan={showFranchise ? 3 : undefined}>
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
                <td colSpan={showFranchise ? 3 : undefined}>
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
