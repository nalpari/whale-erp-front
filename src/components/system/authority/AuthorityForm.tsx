'use client'

import type { ReactNode } from 'react'

import { RadioButtonGroup } from '@/components/common/ui'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useCommonCodeHierarchy } from '@/hooks/queries/use-common-code-queries'
import { AUTHORITY_KIND } from '@/constants/authority-kind'
import { OWNER_CODE } from '@/constants/owner-code'
import type { AuthorityCreateRequest, AuthorityUpdateRequest, OwnerCode } from '@/lib/schemas/authority'
import {
  type AuthorityFormContext,
  isBasicRowVisible,
  isKindRowVisible,
  isSubscriptionRowVisible,
} from '@/lib/authority-visibility'

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
  context: AuthorityFormContext
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

  // 권한 종류 공통코드 조회 (BP context 는 PLATFORM 전용 종류 제외)
  const { data: kindCodes, isPending: isKindCodesPending, isError: isKindCodesError } =
    useCommonCodeHierarchy('PRKND')
  const kindOptions: SelectOption[] = (kindCodes ?? [])
    // BP context (환경설정/권한 관리) 에서는 본사 BP(PRKND_001) 종류 등록 흐름이 없으므로 옵션에서 제외
    // (기존 동작 유지 — PRKND_002 등 다른 종류 제외 여부는 별도 결정 필요시 추가)
    .filter((c) => (context === 'bp' ? c.code !== AUTHORITY_KIND.HEAD_OFFICE_BP : true))
    .map((c) => ({ value: c.code, label: c.name }))

  // 현재 폼 데이터 — BE PR #141 필드 rename 반영
  const formData = {
    owner_code: initialData.owner_code || 'PRGRP_001_001',
    head_office_id: initialData.head_office_id,
    franchisee_id: initialData.franchisee_id,
    name: initialData.name || '',
    is_subscription: initialData.is_subscription ?? false,
    plan_type_code: initialData.plan_type_code,
    authority_kind: initialData.authority_kind,
    is_default: initialData.is_default ?? false,
    is_used: initialData.is_used ?? true,
    description: initialData.description || '',
  }

  // owner_code에 따라 본사/가맹점 선택 활성화
  // context="bp" + create 모드: 가맹점 셀렉트를 항상 표시해야 owner_code를 가맹점으로 전환할 수 있음
  const isBpCreateMode = context === 'bp' && mode === 'create'
  const showHeadOffice = formData.owner_code !== 'PRGRP_001_001'
  const showFranchise = isBpCreateMode || formData.owner_code === OWNER_CODE.FRANCHISE
  const isBpDisabled = mode === 'edit'
  // 가시 조건은 lib/authority-visibility 의 단일 정의 사용 — useAuthorityForm 의 검증/페이로드와 동일하게 평가되어야 함
  const showSubscriptionRow = isSubscriptionRowVisible(context, formData.owner_code)
  const showKindRow = isKindRowVisible(context, formData.owner_code, formData.is_subscription)
  const showBasicRow = isBasicRowVisible(context, formData.owner_code)

  const handleOwnerCodeChange = (value: string) => {
    // BE 가 authority_kind 필수값 검증을 제외하므로 본사/가맹점 owner 자동 매핑(FRANCHISE_BP) 제거.
    // owner 전환 시 이전 값이 남지 않도록 단순 undefined 리셋.
    // 부모 onChange 가 부분 업데이트라 키 누락 시 stale 값 잔존 → 명시적 undefined 필요.
    const newData: Partial<AuthorityCreateRequest> = {
      owner_code: value as OwnerCode,
      head_office_id: undefined,
      franchisee_id: undefined,
      authority_kind: undefined,
      // 플랫폼이 아니면 구독 권한/요금제 초기화 (PLATFORM 일 때는 기존 값 유지)
      ...(value !== 'PRGRP_001_001' && {
        is_subscription: false,
        plan_type_code: undefined,
      }),
    }
    onChange(newData)
  }

  const handleBpSelectChange = (value: { head_office: number | null; franchise: number | null; store: number | null }) => {
    const update: Partial<AuthorityCreateRequest & AuthorityUpdateRequest> = {
      head_office_id: value.head_office ?? undefined,
      franchisee_id: value.franchise ?? undefined,
    }
    // 환경설정 > 권한등록에서는 가맹점 선택 여부로 owner_code 자동 전환
    // - 가맹점 선택 → PRGRP_002_002 (가맹점 권한)
    // - 가맹점 미선택 → PRGRP_002_001 (본사 권한)
    if (isBpCreateMode) {
      update.owner_code = value.franchise != null ? OWNER_CODE.FRANCHISE : OWNER_CODE.HEAD_OFFICE
    }
    onChange(update)
  }

  const handleNameChange = (value: string) => {
    onChange({ name: value })
  }

  const handleIsUsedChange = (value: boolean) => {
    onChange({ is_used: value })
  }

  const handleSubscriptionChange = (checked: boolean) => {
    // 구독 토글 off 시 권한 종류 row 가 숨겨지므로 stale 값 잔존 방지 위해 함께 리셋
    onChange({
      is_subscription: checked,
      plan_type_code: checked ? formData.plan_type_code : undefined,
      authority_kind: checked ? formData.authority_kind : undefined,
    })
  }

  const handlePlanTypeChange = (value: string | undefined) => {
    onChange({ plan_type_code: value })
  }

  const handleDescriptionChange = (value: string) => {
    onChange({ description: value })
  }

  const handleAuthorityKindChange = (value: string) => {
    onChange({ authority_kind: value })
  }

  const handleIsDefaultChange = (checked: boolean) => {
    onChange({ is_default: checked })
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
                    isFranchiseRequired={showFranchise && formData.owner_code === OWNER_CODE.FRANCHISE}
                    fields={showFranchise ? ['office', 'franchise'] : ['office']}
                    officeId={formData.head_office_id ?? null}
                    franchiseId={formData.franchisee_id ?? null}
                    storeId={null}
                    onChange={handleBpSelectChange}
                    isDisabled={isBpDisabled}
                    autoSelect={isBpCreateMode}
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
              {showSubscriptionRow && (
                <tr>
                  <th>구독 권한 여부</th>
                  <td colSpan={showFranchise ? 3 : undefined}>
                    <div className="filed-flx" style={{ gap: '12px', alignItems: 'center' }}>
                      <div className="toggle-btn">
                        <input
                          type="checkbox"
                          id="toggle-is-subscription"
                          checked={formData.is_subscription}
                          onChange={(e) => handleSubscriptionChange(e.target.checked)}
                          disabled={mode === 'edit'}
                        />
                        <label className="slider" htmlFor="toggle-is-subscription" />
                      </div>
                      <SearchSelect
                        options={planTypeOptions}
                        value={planTypeOptions.find((opt) => opt.value === formData.plan_type_code) ?? null}
                        onChange={(opt) => handlePlanTypeChange(opt?.value)}
                        placeholder="선택"
                        isClearable
                        isSearchable={false}
                        isDisabled={!formData.is_subscription || mode === 'edit'}
                        error={!!errors.plan_type_code}
                      />
                      {formData.is_subscription && !formData.plan_type_code && errors.plan_type_code && (
                        <div className="warning-txt" role="alert">* {errors.plan_type_code}</div>
                      )}
                      {formData.is_subscription && isPlanTypesError && (
                        <div className="warning-txt" role="alert">* 요금제 목록을 불러오지 못했습니다</div>
                      )}
                    </div>
                    {mode === 'edit' && (
                      <div className="explain">※ 구독 권한과 요금제는 등록 시에만 설정 가능하며 수정할 수 없습니다.</div>
                    )}
                  </td>
                </tr>
              )}
              {showKindRow && (
                <tr>
                  <th>
                    권한 종류
                    {context === 'platform' && <> <span className="red">*</span></>}
                  </th>
                  <td colSpan={showFranchise ? 3 : undefined}>
                    <RadioButtonGroup
                      options={kindOptions}
                      value={formData.authority_kind ?? ''}
                      onChange={handleAuthorityKindChange}
                      name="authority-kind"
                      disabled={isKindCodesPending || isKindCodesError}
                    />
                    {isKindCodesPending && (
                      <div className="explain mt5">권한 종류 목록을 불러오는 중...</div>
                    )}
                    {errors.authority_kind && (
                      <div className="warning-txt mt5" role="alert">* {errors.authority_kind}</div>
                    )}
                    {isKindCodesError && (
                      <div className="warning-txt mt5" role="alert">* 권한 종류 목록을 불러오지 못했습니다</div>
                    )}
                  </td>
                </tr>
              )}
              {showBasicRow && (
                <tr>
                  <th>기초 권한</th>
                  <td colSpan={showFranchise ? 3 : undefined}>
                    <div className="filed-flx" style={{ gap: '12px', alignItems: 'center' }}>
                      <div className="toggle-btn">
                        <input
                          type="checkbox"
                          id="toggle-is-default"
                          checked={formData.is_default}
                          onChange={(e) => handleIsDefaultChange(e.target.checked)}
                        />
                        <label className="slider" htmlFor="toggle-is-default" />
                      </div>
                      <div className="explain">※ 기초 권한으로 설정 시, 해당 권한 종류의 기본 권한으로 사용됩니다.</div>
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
