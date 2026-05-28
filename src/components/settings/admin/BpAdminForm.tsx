'use client'

import { useState, useRef, useEffect } from 'react'
import AnimateHeight from 'react-animate-height'
import SearchSelect from '@/components/ui/common/SearchSelect'
import { Input, useAlert } from '@/components/common/ui'
import {
  useBpAdminAuthorityCandidates,
  useCheckBpAdminLoginId,
  useResetBpAdminPassword,
} from '@/hooks/queries/use-bp-admin-queries'
import { useBpHeadOfficeTree } from '@/hooks/queries/use-bp-queries'
import { useStoreOptions } from '@/hooks/queries/use-store-queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { WORK_STATUS_OPTIONS, loginIdRegex } from '@/lib/schemas/admin'
import type { BpAdminDetail } from '@/lib/schemas/bp-admin'
import type { AdminType, BpAdminFormData } from '@/types/bp-admin'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateYmd } from '@/util/date-util'

export type { BpAdminFormData }

export function getInitialFormData(admin?: BpAdminDetail | null): BpAdminFormData {
  if (admin) {
    // BE 신규 명세: organizationId 단일 + organizationType 으로 식별
    // FRANCHISE 인 경우 본사 ID는 detail 응답에 없음 — 컴포넌트에서 bpTree로 역추적
    const adminType: AdminType = admin.organizationType ?? 'HEAD_OFFICE'
    const headOfficeOrganizationId =
      adminType === 'HEAD_OFFICE' ? admin.organizationId : null
    const franchiseOrganizationId =
      adminType === 'FRANCHISE' ? admin.organizationId : null

    return {
      adminType,
      headOfficeOrganizationId,
      franchiseOrganizationId,
      storeId: admin.storeId ?? null,
      name: admin.name || '',
      userType: admin.userType || 'MSTWK_001',
      department: admin.department || '',
      rank: admin.rank || '',
      mobilePhone: admin.mobilePhone?.replace(/\D/g, '') || '',
      officePhone: admin.officePhone?.replace(/\D/g, '') || '',
      extensionNumber: admin.extensionNumber || '',
      loginId: admin.loginId || '',
      password: '',
      authorityId: admin.authorityId,
      email: admin.email || '',
    }
  }
  return {
    adminType: 'HEAD_OFFICE',
    headOfficeOrganizationId: null,
    franchiseOrganizationId: null,
    storeId: null,
    name: '',
    userType: 'MSTWK_001',
    department: '',
    rank: 'RNK_001',
    mobilePhone: '',
    officePhone: '',
    extensionNumber: '',
    loginId: '',
    password: '',
    authorityId: null,
    email: '',
  }
}

// ============================================
// 컴포넌트
// ============================================

interface BpAdminFormProps {
  mode: 'create' | 'edit'
  formData: BpAdminFormData
  errors: Record<string, string>
  admin?: BpAdminDetail | null
  onChange: (data: Partial<BpAdminFormData>) => void
  onSave: () => void
  onDelete?: () => void
  onList: () => void
  onIdCheckStatusChange?: (checked: boolean) => void
}

/**
 * BP 관리자 등록/수정 공통 폼.
 *
 * 자동선택/잠금 정책은 mount 시점의 `mode` 값을 기준으로 1회만 적용된다.
 * 동일 인스턴스에서 mode가 'create' ↔ 'edit'로 전환될 경우 가드(`autoApplied`)가 stale 상태로 남으므로,
 * 부모는 mode 전환 시 반드시 `key` prop으로 컴포넌트를 리마운트해야 한다
 * (예: `<BpAdminForm key={`${mode}-${admin?.id ?? 'new'}`} … />`).
 */
export default function BpAdminForm({
  mode,
  formData,
  errors,
  admin,
  onChange,
  onSave,
  onDelete,
  onList,
  onIdCheckStatusChange,
}: BpAdminFormProps) {
  const { mutateAsync: checkLoginId } = useCheckBpAdminLoginId()
  const { mutateAsync: resetPassword } = useResetBpAdminPassword()
  const { children: rankChildren } = useCommonCode('RNK')
  const { children: departmentChildren } = useCommonCode('ADMNF_DEPT')
  const { alert, confirm } = useAlert()
  const [idCheckMessage, setIdCheckMessage] = useState<string | null>(null)
  const [idCheckPassed, setIdCheckPassed] = useState(false)
  const [formOpen, setFormOpen] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  // BP 트리 데이터
  const { data: bpTree = [], isPending: bpLoading } = useBpHeadOfficeTree()

  // 권한 정책 (BE PR #152 accountType 기반)
  // - PLATFORM: 자동선택/잠금 없음
  // - HEAD_OFFICE: 본사 자동선택 + 본사 잠금 (가맹은 1개여도 고정 X — 종류·가맹 자유)
  // - FRANCHISE: 본사+가맹 자동선택 + 모두 잠금 + 종류=FRANCHISE 고정
  const accountType = useAuthStore((s) => s.accountType)
  const isHeadOfficeUser = accountType === 'HEAD_OFFICE'
  const isFranchiseUser = accountType === 'FRANCHISE'

  // edit 모드 — BE update API (bpAdminUpdateRequestSchema) 가 organizationId 를 omit 하므로
  // 본사/가맹/관리자종류 변경을 UI 에서도 차단. PLATFORM 계정도 edit 에선 org 변경 불가.
  // storeId / authorityId 는 update body 에 포함되므로 edit 에서 변경 가능 (현재 org 산하 옵션만).
  const isEditMode = mode === 'edit'
  const isAdminTypeFixed = isFranchiseUser || isEditMode
  const isOfficeFixed = isHeadOfficeUser || isFranchiseUser || isEditMode
  const isFranchiseFixed = isFranchiseUser || isEditMode

  const headOfficeOptions = bpTree.map((office) => ({
    value: String(office.id),
    label: office.name,
  }))

  const selectedOffice = formData.headOfficeOrganizationId != null
    ? bpTree.find((o) => o.id === formData.headOfficeOrganizationId)
    : null

  const franchiseOptions =
    selectedOffice?.franchises.map((f) => ({
      value: String(f.id),
      label: f.name,
    })) ?? []

  // 권한 후보: organizationId 단일 모델
  // FRANCHISE → franchiseOrganizationId, HEAD_OFFICE → headOfficeOrganizationId
  const effectiveOrganizationId =
    formData.adminType === 'FRANCHISE'
      ? formData.franchiseOrganizationId
      : formData.headOfficeOrganizationId

  const { data: authorityCandidates = [], isPending: authorityLoading } =
    useBpAdminAuthorityCandidates(effectiveOrganizationId)

  const authorityOptions = authorityCandidates.map((a) => ({
    value: String(a.id),
    label: a.name,
  }))

  // 점포 옵션 — 본사(officeId)와 가맹(franchiseId) 둘 다 전달
  // - HEAD_OFFICE 관리자: officeId 만 전달
  // - FRANCHISE 관리자: officeId + franchiseId 둘 다 전달
  const storeQueryOfficeId = formData.headOfficeOrganizationId
  const storeQueryFranchiseId =
    formData.adminType === 'FRANCHISE' ? formData.franchiseOrganizationId : null

  const storeOptionsEnabled =
    storeQueryOfficeId != null &&
    (formData.adminType !== 'FRANCHISE' || storeQueryFranchiseId != null)

  const {
    data: storeOptionsData = [],
    isSuccess: storeOptionsLoaded,
    isPending: storeOptionsPending,
  } = useStoreOptions(
    storeQueryOfficeId,
    storeQueryFranchiseId,
    storeOptionsEnabled,
  )

  const storeOptions = storeOptionsData.map((s) => ({
    value: String(s.id),
    label: s.storeName,
  }))

  const workStatusSelectOptions = WORK_STATUS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

  const departmentSelectOptions = [
    { value: '', label: '선택' },
    ...departmentChildren.map((c) => ({ value: c.code, label: c.name })),
  ]

  const positionSelectOptions = [
    { value: '', label: '선택' },
    ...rankChildren.map((c) => ({ value: c.code, label: c.name })),
  ]

  // 권한별 자동선택 — useEffect 패턴.
  // render-time에 부모 onChange (= setFormData) 를 호출하면 React가 "Cannot update a component
  // while rendering a different component" 경고를 띄우므로 effect로 미룬다.
  // autoApplied/franchiseParentResolved는 state 대신 ref로 — set-state-in-effect 회피.
  // ref.current = ... 갱신은 effect 안에서만 수행 (react-hooks/refs 규칙).
  const autoAppliedRef = useRef(mode === 'edit')
  const franchiseParentResolvedRef = useRef(false)

  // edit 모드의 FRANCHISE 관리자: detail 응답엔 본사 ID가 없으므로 bpTree에서 역추적
  useEffect(() => {
    if (
      mode !== 'edit' ||
      franchiseParentResolvedRef.current ||
      bpLoading ||
      bpTree.length === 0 ||
      formData.adminType !== 'FRANCHISE' ||
      formData.franchiseOrganizationId == null ||
      formData.headOfficeOrganizationId != null
    ) {
      return
    }
    franchiseParentResolvedRef.current = true
    const parent = bpTree.find((office) =>
      office.franchises.some((f) => f.id === formData.franchiseOrganizationId),
    )
    if (parent) {
      onChange({ headOfficeOrganizationId: parent.id })
    }
  }, [
    mode,
    bpLoading,
    bpTree,
    formData.adminType,
    formData.franchiseOrganizationId,
    formData.headOfficeOrganizationId,
    onChange,
  ])

  // edit 모드 진입 후 storeId 가 옵션 목록에 없으면 자동 null 처리.
  // BP 소속 변경 이력 등으로 storeId 가 stale 한 경우 대비 (mass-assignment 방지 보조).
  const storeStaleResolvedRef = useRef(false)
  useEffect(() => {
    if (
      mode !== 'edit' ||
      storeStaleResolvedRef.current ||
      !storeOptionsEnabled ||
      formData.storeId == null
    ) {
      return
    }
    // 쿼리 로딩 중이면 대기 — isSuccess 로 분기 (length === 0 은 "BE 가 합법적으로 0 store 응답" 도 포함하므로 부적합)
    if (!storeOptionsLoaded) {
      return
    }
    const found = storeOptionsData.some((s) => s.id === formData.storeId)
    if (!found) {
      storeStaleResolvedRef.current = true
      if (process.env.NODE_ENV === 'development') {
        console.warn('[BpAdminForm] stale storeId — auto reset', {
          storeId: formData.storeId,
          options: storeOptionsData,
        })
      }
      onChange({ storeId: null })
    } else {
      storeStaleResolvedRef.current = true
    }
  }, [mode, storeOptionsEnabled, storeOptionsLoaded, storeOptionsData, formData.storeId, onChange])

  useEffect(() => {
    if (mode !== 'create' || autoAppliedRef.current) return
    if (accountType == null) return
    if (bpLoading || bpTree.length === 0) return

    // BE 명세상 본사BP/가맹BP 계정은 자기 조직만 내려와야 함. 위반 시 dev warning (Boston #8).
    if (process.env.NODE_ENV === 'development') {
      if (isHeadOfficeUser && bpTree.length > 1) {
        console.warn('[BpAdminForm] HEAD_OFFICE 계정에 본사 2개+ 내려옴 — BE 명세 위반 의심', bpTree)
      }
      if (isFranchiseUser && (bpTree.length > 1 || (bpTree[0]?.franchises.length ?? 0) > 1)) {
        console.warn('[BpAdminForm] FRANCHISE 계정에 다중 본사/가맹 내려옴 — BE 명세 위반 의심', bpTree)
      }
    }

    if (isFranchiseUser) {
      const targetOffice = bpTree[0]
      const targetFranchise = targetOffice?.franchises[0]
      if (targetOffice && targetFranchise) {
        autoAppliedRef.current = true
        onChange({
          adminType: 'FRANCHISE',
          headOfficeOrganizationId: targetOffice.id,
          franchiseOrganizationId: targetFranchise.id,
          storeId: null,
          authorityId: null,
        })
      }
    } else if (isHeadOfficeUser) {
      const targetOffice = bpTree[0]
      if (targetOffice) {
        autoAppliedRef.current = true
        onChange({
          headOfficeOrganizationId: targetOffice.id,
          franchiseOrganizationId: null,
          storeId: null,
          authorityId: null,
        })
      }
    } else {
      // PLATFORM: 자동선택 없이 가드만 적용
      autoAppliedRef.current = true
    }
  }, [mode, accountType, bpLoading, bpTree, isFranchiseUser, isHeadOfficeUser, onChange])

  // ID 중복체크
  const handleCheckLoginId = async () => {
    if (!formData.loginId || !loginIdRegex.test(formData.loginId)) {
      onChange({ loginId: formData.loginId })
      setIdCheckMessage('ID는 영문과 숫자를 포함하여 8자 이상이어야 합니다.')
      setIdCheckPassed(false)
      onIdCheckStatusChange?.(false)
      return
    }

    try {
      const isDuplicate = await checkLoginId(formData.loginId)
      // 중복체크 결과 표시를 위해 기존 loginId 에러 클리어
      onChange({ loginId: formData.loginId })
      if (isDuplicate) {
        setIdCheckMessage('사용할 수 없는 ID 입니다.')
        setIdCheckPassed(false)
        onIdCheckStatusChange?.(false)
      } else {
        setIdCheckMessage('사용할 수 있는 ID 입니다.')
        setIdCheckPassed(true)
        onIdCheckStatusChange?.(true)
      }
    } catch {
      alert('ID 중복 확인 중 오류가 발생했습니다.')
    }
  }

  // 비밀번호 초기화
  const handleResetPassword = async () => {
    if (!admin) return
    const confirmed = await confirm('비밀번호를 초기화 처리하시겠습니까?')
    if (!confirmed) return

    try {
      const tempPassword = await resetPassword(admin.id)
      await alert(`비밀번호가 초기화 처리되었습니다. 초기화 비밀번호는 ${tempPassword} 입니다.`)
    } catch {
      await alert('비밀번호 초기화에 실패했습니다.')
    }
  }

  return (
    <div className="master-detail-data">
      {/* 관리자 정보 섹션 */}
      <div className={`slidebox-wrap ${formOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>관리자 정보</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" type="button" onClick={onList}>취소</button>
            {mode === 'edit' && onDelete && (
              <button className="slidebox-btn" type="button" onClick={onDelete}>삭제</button>
            )}
            <button className="slidebox-btn" type="button" onClick={onSave}>저장</button>
            <button className="slidebox-btn arr" type="button" onClick={() => setFormOpen(!formOpen)}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={formOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <table className="default-table">
              <colgroup>
                <col width="190px" />
                <col />
              </colgroup>
              <tbody>
                {/* 관리자 종류 — 라디오 (StaffInvitationPop 패턴) */}
                <tr>
                  <th>관리자 종류 <span className="red">*</span></th>
                  <td>
                    <div className="filed-check-flx">
                      <div className="radio-form-box">
                        <input
                          type="radio"
                          name="bpAdminType"
                          id="bpAdminType-headoffice"
                          checked={formData.adminType === 'HEAD_OFFICE'}
                          onChange={() =>
                            onChange({
                              adminType: 'HEAD_OFFICE',
                              // 종류 변경 → 가맹/점포/권한 초기화
                              franchiseOrganizationId: null,
                              storeId: null,
                              authorityId: null,
                            })
                          }
                          disabled={isAdminTypeFixed}
                        />
                        <label htmlFor="bpAdminType-headoffice">본사</label>
                      </div>
                      <div className="radio-form-box">
                        <input
                          type="radio"
                          name="bpAdminType"
                          id="bpAdminType-franchise"
                          checked={formData.adminType === 'FRANCHISE'}
                          onChange={() =>
                            onChange({
                              adminType: 'FRANCHISE',
                              storeId: null,
                              authorityId: null,
                            })
                          }
                          disabled={isAdminTypeFixed}
                        />
                        <label htmlFor="bpAdminType-franchise">가맹점</label>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 본사 / 가맹점 — 표준 filed-flx + block 패턴 (StaffInvitationPop 동일) */}
                <tr>
                  <th>본사/가맹점 <span className="red">*</span></th>
                  <td>
                    <div className="filed-flx">
                      <div className="block">
                        <SearchSelect
                          options={headOfficeOptions}
                          value={
                            formData.headOfficeOrganizationId != null
                              ? headOfficeOptions.find(
                                  (opt) => opt.value === String(formData.headOfficeOrganizationId),
                                ) ?? null
                              : null
                          }
                          onChange={(opt) =>
                            onChange({
                              headOfficeOrganizationId: opt?.value ? Number(opt.value) : null,
                              // 본사 변경 → 가맹/점포/권한 초기화
                              franchiseOrganizationId: null,
                              storeId: null,
                              authorityId: null,
                            })
                          }
                          isDisabled={isOfficeFixed}
                          error={!!errors.headOfficeOrganizationId}
                          placeholder="본사 선택"
                        />
                        {errors.headOfficeOrganizationId && (
                          <div className="warning-txt mt5" role="alert">* {errors.headOfficeOrganizationId}</div>
                        )}
                      </div>
                      {formData.adminType === 'FRANCHISE' && (
                        <div className="block">
                          <SearchSelect
                            options={franchiseOptions}
                            value={
                              formData.franchiseOrganizationId != null
                                ? franchiseOptions.find(
                                    (opt) => opt.value === String(formData.franchiseOrganizationId),
                                  ) ?? null
                                : null
                            }
                            onChange={(opt) =>
                              onChange({
                                franchiseOrganizationId: opt?.value ? Number(opt.value) : null,
                                // 가맹 변경 → 점포/권한 초기화
                                storeId: null,
                                authorityId: null,
                              })
                            }
                            isDisabled={isFranchiseFixed || formData.headOfficeOrganizationId == null}
                            error={!!errors.franchiseOrganizationId}
                            placeholder="가맹점 선택"
                          />
                          {errors.franchiseOrganizationId && (
                            <div className="warning-txt mt5" role="alert">* {errors.franchiseOrganizationId}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 점포 — optional, 단일 선택 */}
                <tr>
                  <th>점포</th>
                  <td>
                    <div className="filed-flx">
                      <div className="block">
                        <SearchSelect
                          options={storeOptions}
                          value={
                            formData.storeId != null
                              ? storeOptions.find(
                                  (opt) => opt.value === String(formData.storeId),
                                ) ?? null
                              : null
                          }
                          onChange={(opt) =>
                            onChange({
                              storeId: opt?.value ? Number(opt.value) : null,
                            })
                          }
                          isDisabled={!storeOptionsEnabled}
                          error={!!errors.storeId}
                          placeholder={
                            !storeOptionsEnabled
                              ? formData.adminType === 'FRANCHISE'
                                ? '가맹점을 먼저 선택해 주세요.'
                                : '본사를 먼저 선택해 주세요.'
                              : storeOptionsPending
                              ? '점포 로딩 중...'
                              : storeOptions.length === 0
                              ? '등록된 점포가 없습니다.'
                              : '점포 선택'
                          }
                        />
                        {errors.storeId && (
                          <div className="warning-txt mt5" role="alert">* {errors.storeId}</div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 관리자명 */}
                <tr>
                  <th>관리자명 <span className="red">*</span></th>
                  <td>
                    <Input
                      value={formData.name}
                      onChange={(e) => onChange({ name: e.target.value })}
                      error={!!errors.name}
                      helpText={errors.name}
                    />
                  </td>
                </tr>

                {/* 근무여부 */}
                <tr>
                  <th>근무여부 <span className="red">*</span></th>
                  <td>
                    <div className="mx-500">
                      <SearchSelect
                        options={workStatusSelectOptions}
                        value={workStatusSelectOptions.find((opt) => opt.value === formData.userType) ?? null}
                        onChange={(opt) => onChange({ userType: opt?.value || 'MSTWK_001' })}
                        error={!!errors.userType}
                      />
                      {errors.userType && <div className="warning-txt mt5" role="alert">* {errors.userType}</div>}
                    </div>
                  </td>
                </tr>

                {/* 부서 */}
                <tr>
                  <th>부서</th>
                  <td>
                    <div className="mx-500">
                      <SearchSelect
                        options={departmentSelectOptions}
                        value={departmentSelectOptions.find((opt) => opt.value === formData.department) ?? departmentSelectOptions[0]}
                        onChange={(opt) => onChange({ department: opt?.value || '' })}
                      />
                    </div>
                  </td>
                </tr>

                {/* 직급 */}
                <tr>
                  <th>직급</th>
                  <td>
                    <div className="mx-500">
                      <SearchSelect
                        options={positionSelectOptions}
                        value={positionSelectOptions.find((opt) => opt.value === formData.rank) ?? positionSelectOptions[0]}
                        onChange={(opt) => onChange({ rank: opt?.value || '' })}
                      />
                    </div>
                  </td>
                </tr>

                {/* 휴대폰 번호 */}
                <tr>
                  <th>휴대폰 번호 <span className="red">*</span></th>
                  <td>
                    <Input
                      type="cellphone"
                      value={formData.mobilePhone}
                      onChange={(e) => onChange({ mobilePhone: e.target.value })}
                      error={!!errors.mobilePhone}
                      helpText={errors.mobilePhone}
                      endAdornment={<span className="text-sm text-gray-400 whitespace-nowrap">※ 숫자만 입력</span>}
                    />
                  </td>
                </tr>

                {/* 연락처 */}
                <tr>
                  <th>연락처</th>
                  <td>
                    <Input
                      type="cellphone"
                      value={formData.officePhone}
                      onChange={(e) => onChange({ officePhone: e.target.value })}
                      error={!!errors.officePhone}
                      helpText={errors.officePhone}
                      endAdornment={
                        <>
                          <span style={{ padding: '0 4px', whiteSpace: 'nowrap' }}>내선번호</span>
                          <div style={{ width: '100px' }}>
                            <Input
                              type="number"
                              value={formData.extensionNumber}
                              onChange={(e) => onChange({ extensionNumber: e.target.value })}
                              maxLength={6}
                              containerClassName="w-full"
                            />
                          </div>
                          <span className="text-sm text-gray-400 whitespace-nowrap">※ 숫자만 입력</span>
                        </>
                      }
                    />
                  </td>
                </tr>

                {/* ID */}
                <tr>
                  <th>ID <span className="red">*</span></th>
                  <td>
                    <Input
                      value={formData.loginId}
                      onChange={(e) => {
                        onChange({ loginId: e.target.value })
                        onIdCheckStatusChange?.(false)
                        setIdCheckPassed(false)
                        setIdCheckMessage(null)
                      }}
                      readOnly={mode === 'edit'}
                      error={!!errors.loginId}
                      helpText={errors.loginId}
                      endAdornment={
                        <>
                          {mode === 'create' && (
                            <button className="btn-form gray" onClick={handleCheckLoginId} type="button">
                              중복체크
                            </button>
                          )}
                          <span className="text-sm text-gray-400 whitespace-nowrap">※ 영문과 숫자를 조합하여 8자 이상 입력</span>
                        </>
                      }
                    />
                    {idCheckMessage && !errors.loginId && (
                      <div className={`mt5 mx-500 ${idCheckPassed ? 'text-blue-600 text-xs' : 'warning-txt'}`} role={idCheckPassed ? undefined : 'alert'}>
                        {idCheckPassed ? idCheckMessage : `* ${idCheckMessage}`}
                      </div>
                    )}
                  </td>
                </tr>

                {/* 비밀번호 */}
                <tr>
                  <th>비밀번호 {mode === 'create' && <span className="red">*</span>}</th>
                  <td>
                    {mode === 'create' ? (
                      <div className="filed-flx">
                        <div className="mx-500">
                          <div className={`input-icon-frame${errors.password ? ' err' : ''}`}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) => onChange({ password: e.target.value })}
                              aria-invalid={!!errors.password}
                            />
                            <button
                              type="button"
                              className={`input-icon-btn ${showPassword ? 'hide' : 'show'}`}
                              onClick={() => setShowPassword(!showPassword)}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-400 whitespace-nowrap">※ 영문과 숫자와 특수문자를 조합하여 8자 이상 입력</span>
                      </div>
                    ) : (
                      <button className="btn-form gray" onClick={handleResetPassword} type="button">
                        비밀번호 초기화
                      </button>
                    )}
                    {errors.password && (
                      <div className="warning-txt mt5" role="alert">* {errors.password}</div>
                    )}
                  </td>
                </tr>

                {/* 이메일 */}
                <tr>
                  <th>이메일</th>
                  <td>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => onChange({ email: e.target.value })}
                      error={!!errors.email}
                      helpText={errors.email}
                    />
                  </td>
                </tr>

                {/* 권한 선택 */}
                <tr>
                  <th>권한 선택 <span className="red">*</span></th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-500">
                        <SearchSelect
                          options={authorityOptions}
                          value={
                            formData.authorityId
                              ? authorityOptions.find((opt) => opt.value === String(formData.authorityId)) ?? null
                              : null
                          }
                          onChange={(opt) =>
                            onChange({ authorityId: opt?.value ? Number(opt.value) : null })
                          }
                          isDisabled={effectiveOrganizationId == null || authorityLoading}
                          placeholder={
                            effectiveOrganizationId == null
                              ? '본사/가맹 선택 후 권한 부여 가능'
                              : '권한 선택'
                          }
                          error={!!errors.authorityId}
                        />
                        {errors.authorityId && <div className="warning-txt mt5" role="alert">* {errors.authorityId}</div>}
                      </div>
                      <span className="text-sm text-gray-400 whitespace-nowrap">※ 권한에 따라 관리자가 각 메뉴의 컨텐츠를 접근, 등록, 수정, 삭제를 할 수 있습니다</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AnimateHeight>
      </div>

      {/* 메타데이터 테이블 (수정 모드에서만) */}
      {mode === 'edit' && admin && (
        <div className="detail-data-info-wrap">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>등록자</th>
                <td>
                  <Input value={admin.createdByLoginId ? `${admin.createdByName}(${admin.createdByLoginId})` : '-'} disabled />
                </td>
                <th>등록일</th>
                <td>
                  <Input value={formatDateYmd(admin.createdAt)} disabled />
                </td>
              </tr>
              <tr>
                <th>최종 수정자</th>
                <td>
                  <Input value={admin.updatedByLoginId ? `${admin.updatedByName}(${admin.updatedByLoginId})` : '-'} disabled />
                </td>
                <th>최종 수정일</th>
                <td>
                  <Input value={formatDateYmd(admin.updatedAt)} disabled />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
