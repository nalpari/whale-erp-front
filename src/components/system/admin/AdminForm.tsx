'use client'

import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import SearchSelect from '@/components/ui/common/SearchSelect'
import { Input, useAlert } from '@/components/common/ui'
import { useAuthorityOptions, useCheckAdminLoginId, useResetAdminPassword } from '@/hooks/queries/use-admin-queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { WORK_STATUS_OPTIONS } from '@/lib/schemas/admin'
import type { AdminDetail } from '@/lib/schemas/admin'
import { formatDateYmd } from '@/util/date-util'

// ============================================
// 폼 데이터 타입
// ============================================

export interface AdminFormData {
  name: string
  userType: string
  department: string
  rank: string
  mobilePhone: string
  officePhone: string
  extensionNumber: string
  loginId: string
  password: string
  authorityId: number | null
  email: string
  inquiryResponderName: string
}

export function getInitialFormData(admin?: AdminDetail | null): AdminFormData {
  if (admin) {
    return {
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
      inquiryResponderName: admin.inquiryResponderName || '',
    }
  }
  return {
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
    inquiryResponderName: '',
  }
}


// ============================================
// 컴포넌트
// ============================================

interface AdminFormProps {
  mode: 'create' | 'edit'
  formData: AdminFormData
  errors: Record<string, string>
  admin?: AdminDetail | null
  onChange: (data: Partial<AdminFormData>) => void
  onSave: () => void
  onDelete?: () => void
  onList: () => void
  onIdCheckStatusChange?: (checked: boolean) => void
}

export default function AdminForm({
  mode,
  formData,
  errors,
  admin,
  onChange,
  onSave,
  onDelete,
  onList,
  onIdCheckStatusChange,
}: AdminFormProps) {
  const { data: authorities = [] } = useAuthorityOptions()
  const { mutateAsync: checkLoginId } = useCheckAdminLoginId()
  const { mutateAsync: resetPassword } = useResetAdminPassword()
  const { children: rankChildren } = useCommonCode('RNK')
  const { alert, confirm } = useAlert()
  const [idCheckMessage, setIdCheckMessage] = useState<string | null>(null)
  const [idCheckPassed, setIdCheckPassed] = useState(false)
  const [formOpen, setFormOpen] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const authorityOptions = authorities.map((auth) => ({
    value: String(auth.id),
    label: auth.name,
  }))

  const workStatusSelectOptions = WORK_STATUS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

  const positionSelectOptions = [
    { value: '', label: '선택' },
    ...rankChildren.map((c) => ({ value: c.code, label: c.name })),
  ]

  // ID 중복체크
  const handleCheckLoginId = async () => {
    const loginIdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
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
      await resetPassword(admin.id)
      await alert('비밀번호가 초기화 처리되었습니다. 초기화 비밀번호는 hc1234567 입니다.')
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
            <button className="slidebox-btn" type="button" onClick={onList}>목록</button>
            {mode === 'edit' && onDelete && (
              <button className="slidebox-btn" type="button" onClick={onDelete}>삭제</button>
            )}
            <button className="slidebox-btn" type="button" onClick={onSave}>저장</button>
            <button className="slidebox-btn arr" onClick={() => setFormOpen(!formOpen)}>
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
                    <Input
                      value={formData.department}
                      onChange={(e) => onChange({ department: e.target.value })}
                    />
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
                      <Input
                        type={showPassword ? 'text' : 'password'}

                        value={formData.password}
                        onChange={(e) => onChange({ password: e.target.value })}
                        error={!!errors.password}
                        helpText={errors.password}
                        showClear={false}
                        endAdornment={
                          <>
                            <button
                              type="button"
                              className={`input-icon-btn ${showPassword ? 'hide' : 'show'}`}
                              onClick={() => setShowPassword(!showPassword)}
                            />
                            <span className="text-sm text-gray-400 whitespace-nowrap">※ 영문과 숫자와 특수문자를 조합하여 8자 이상 입력</span>
                          </>
                        }
                      />
                    ) : (
                      <button className="btn-form gray" onClick={handleResetPassword} type="button">
                        비밀번호 초기화
                      </button>
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
                          onChange={(opt) => onChange({ authorityId: opt ? Number(opt.value) : null })}

                          error={!!errors.authorityId}
                        />
                        {errors.authorityId && <div className="warning-txt mt5" role="alert">* {errors.authorityId}</div>}
                      </div>
                      <span className="text-sm text-gray-400 whitespace-nowrap">※ 권한에 따라 관리자가 각 메뉴의 컨텐츠를 접근, 등록, 수정, 삭제를 할 수 있습니다</span>
                    </div>
                  </td>
                </tr>

                {/* 1:1문의 답변자 네이밍 */}
                <tr>
                  <th>1:1문의 답변자 네이밍 <span className="red">*</span></th>
                  <td>
                    <Input
                      value={formData.inquiryResponderName}
                      onChange={(e) => onChange({ inquiryResponderName: e.target.value })}
                      error={!!errors.inquiryResponderName}
                      helpText={errors.inquiryResponderName}
                    />
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
