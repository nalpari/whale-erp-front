'use client'

import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import SearchSelect from '@/components/ui/common/SearchSelect'
import { Input, useAlert } from '@/components/common/ui'
import {
  useBpAdminAuthorityCandidates,
  useCheckBpAdminLoginId,
  useResetBpAdminPassword,
} from '@/hooks/queries/use-bp-admin-queries'
import { useBpHeadOfficeTree } from '@/hooks/queries/use-bp-queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { WORK_STATUS_OPTIONS, loginIdRegex } from '@/lib/schemas/admin'
import type { BpAdminDetail } from '@/lib/schemas/bp-admin'
import type { AdminType, BpAdminFormData } from '@/types/bp-admin'
import { OWNER_CODE } from '@/constants/owner-code'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateYmd } from '@/util/date-util'

export type { BpAdminFormData }

const ADMIN_TYPE_OPTIONS: { value: AdminType; label: string }[] = [
  { value: 'HEAD_OFFICE', label: '본사 관리자' },
  { value: 'FRANCHISE', label: '가맹 관리자' },
]

export function getInitialFormData(admin?: BpAdminDetail | null): BpAdminFormData {
  if (admin) {
    return {
      adminType: admin.adminType ?? 'HEAD_OFFICE',
      headOfficeOrganizationId: admin.headOfficeOrganizationId ?? null,
      franchiseOrganizationId: admin.franchiseOrganizationId ?? null,
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

  // 권한 정책: 본사/가맹 사용자는 adminType, 본사, 가맹이 자동선택 + 잠금
  const ownerCode = useAuthStore((s) => s.ownerCode)
  const isHeadOfficeUser = ownerCode === OWNER_CODE.HEAD_OFFICE
  const isFranchiseUser = ownerCode === OWNER_CODE.FRANCHISE

  const isAdminTypeFixed = isFranchiseUser
  const isOfficeFixed = isHeadOfficeUser || isFranchiseUser
  const isFranchiseFixed = isFranchiseUser

  // BP 트리 데이터
  const { data: bpTree = [], isPending: bpLoading } = useBpHeadOfficeTree()

  const adminTypeSelectOptions = ADMIN_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

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

  // 권한 후보 (본사/가맹 선택 완료 시에만 호출)
  const authorityCandidatesParams =
    formData.headOfficeOrganizationId != null &&
    (formData.adminType === 'HEAD_OFFICE' || formData.franchiseOrganizationId != null)
      ? {
          headOfficeOrganizationId: formData.headOfficeOrganizationId,
          franchiseOrganizationId:
            formData.adminType === 'FRANCHISE' ? formData.franchiseOrganizationId : null,
        }
      : null

  const { data: authorityCandidates = [], isPending: authorityLoading } =
    useBpAdminAuthorityCandidates(authorityCandidatesParams)

  const authorityOptions = authorityCandidates.map((a) => ({
    value: String(a.id),
    label: a.name,
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

  // 권한별 자동선택 (render-time setState 가드 패턴 — react-hooks/set-state-in-effect 회피)
  // edit 모드는 서버 응답으로 init되므로 자동선택 건너뜀 (autoApplied=true로 마킹).
  const [autoApplied, setAutoApplied] = useState(mode === 'edit')

  if (mode === 'create' && !autoApplied && !bpLoading && bpTree.length > 0) {
    if (isFranchiseUser) {
      const targetOffice = bpTree[0]
      const targetFranchise = targetOffice?.franchises[0]
      if (targetOffice && targetFranchise) {
        setAutoApplied(true)
        onChange({
          adminType: 'FRANCHISE',
          headOfficeOrganizationId: targetOffice.id,
          franchiseOrganizationId: targetFranchise.id,
          authorityId: null, // 명시: 자동선택 후 권한은 사용자 선택
        })
      }
    } else if (isHeadOfficeUser) {
      const targetOffice = bpTree[0]
      if (targetOffice) {
        setAutoApplied(true)
        onChange({
          adminType: 'HEAD_OFFICE',
          headOfficeOrganizationId: targetOffice.id,
          franchiseOrganizationId: null, // 명시: HEAD_OFFICE는 가맹 없음
          authorityId: null, // 명시: 자동선택 후 권한은 사용자 선택
        })
      }
    } else {
      // PLATFORM: 자동선택 없이 가드만 적용
      setAutoApplied(true)
    }
  }

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
      // checkBpAdminLoginId는 available(true=사용 가능) 반환 — 청사진(isDuplicate)과 의미 반전
      const isAvailable = await checkLoginId(formData.loginId)
      // 중복체크 결과 표시를 위해 기존 loginId 에러 클리어
      onChange({ loginId: formData.loginId })
      if (isAvailable) {
        setIdCheckMessage('사용할 수 있는 ID 입니다.')
        setIdCheckPassed(true)
        onIdCheckStatusChange?.(true)
      } else {
        setIdCheckMessage('사용할 수 없는 ID 입니다.')
        setIdCheckPassed(false)
        onIdCheckStatusChange?.(false)
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
      await resetPassword(admin.id)
      await alert('비밀번호가 초기화 처리되었습니다.')
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
                {/* 관리자 종류 */}
                <tr>
                  <th>관리자 종류 <span className="red">*</span></th>
                  <td>
                    <div className="mx-500">
                      <SearchSelect
                        options={adminTypeSelectOptions}
                        value={
                          adminTypeSelectOptions.find((opt) => opt.value === formData.adminType) ?? null
                        }
                        onChange={(opt) => {
                          const next = ((opt?.value as AdminType | undefined) ?? 'HEAD_OFFICE') as AdminType
                          onChange({
                            adminType: next,
                            // adminType 변경 시 가맹/권한 초기화
                            franchiseOrganizationId: null,
                            authorityId: null,
                          })
                        }}
                        isDisabled={isAdminTypeFixed}
                      />
                    </div>
                  </td>
                </tr>

                {/* 소속 본사 */}
                <tr>
                  <th>소속 본사 <span className="red">*</span></th>
                  <td>
                    <div className="mx-500">
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
                            // 본사 변경 → 가맹/권한 초기화
                            franchiseOrganizationId: null,
                            authorityId: null,
                          })
                        }
                        isDisabled={isOfficeFixed}
                        error={!!errors.headOfficeOrganizationId}
                      />
                      {errors.headOfficeOrganizationId && (
                        <div className="warning-txt mt5" role="alert">* {errors.headOfficeOrganizationId}</div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 소속 가맹 (FRANCHISE 일 때만 노출) */}
                {formData.adminType === 'FRANCHISE' && (
                  <tr>
                    <th>소속 가맹 <span className="red">*</span></th>
                    <td>
                      <div className="mx-500">
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
                              // 가맹 변경 → 권한 초기화
                              authorityId: null,
                            })
                          }
                          isDisabled={isFranchiseFixed && formData.franchiseOrganizationId != null}
                          error={!!errors.franchiseOrganizationId}
                        />
                        {errors.franchiseOrganizationId && (
                          <div className="warning-txt mt5" role="alert">* {errors.franchiseOrganizationId}</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

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
                          isDisabled={authorityCandidatesParams == null || authorityLoading}
                          placeholder={
                            authorityCandidatesParams == null
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
                <th>등록일</th>
                <td>
                  <Input value={formatDateYmd(admin.createdAt)} disabled />
                </td>
                <th></th>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
