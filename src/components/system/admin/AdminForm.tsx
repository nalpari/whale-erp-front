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
    rank: '',
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
// 전화번호 포맷 유틸
// ============================================

function formatPhoneDisplay(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return cleaned
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
}: AdminFormProps) {
  const { data: authorities = [] } = useAuthorityOptions()
  const { mutateAsync: checkLoginId } = useCheckAdminLoginId()
  const { mutateAsync: resetPassword } = useResetAdminPassword()
  const { children: rankChildren } = useCommonCode('RNK')
  const { alert, confirm } = useAlert()
  const [idChecked, setIdChecked] = useState(false)
  const [idCheckMessage, setIdCheckMessage] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(true)

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
      alert('ID는 영문과 숫자를 포함하여 8자 이상이어야 합니다.')
      return
    }

    try {
      const isDuplicate = await checkLoginId(formData.loginId)
      if (isDuplicate) {
        setIdCheckMessage('사용할 수 없는 ID 입니다.')
        setIdChecked(false)
        alert('사용할 수 없는 ID 입니다.')
      } else {
        setIdCheckMessage('사용할 수 있는 ID 입니다.')
        setIdChecked(true)
        alert('사용할 수 있는 ID 입니다.')
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

  // 숫자만 입력 핸들러
  const handlePhoneInput = (field: 'mobilePhone' | 'officePhone' | 'extensionNumber', value: string) => {
    const numericOnly = value.replace(/\D/g, '')
    onChange({ [field]: numericOnly })
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
                    <div className="mx-500">
                      <input
                        type="text"
                        className={`input-frame ${errors.name ? 'err' : ''}`}
                        value={formData.name}
                        onChange={(e) => onChange({ name: e.target.value })}
                      />
                      {errors.name && <div className="warning-txt mt5" role="alert">* {errors.name}</div>}
                    </div>
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
                        placeholder="선택"
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
                      <input
                        type="text"
                        className="input-frame"
                        value={formData.department}
                        onChange={(e) => onChange({ department: e.target.value })}
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
                        placeholder="선택"
                      />
                    </div>
                  </td>
                </tr>

                {/* 휴대폰 번호 */}
                <tr>
                  <th>휴대폰 번호 <span className="red">*</span></th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-500">
                        <input
                          type="text"
                          className={`input-frame ${errors.mobilePhone ? 'err' : ''}`}
                          value={formData.mobilePhone ? formatPhoneDisplay(formData.mobilePhone) : ''}
                          onChange={(e) => handlePhoneInput('mobilePhone', e.target.value)}
                          placeholder="숫자만 입력"
                          maxLength={13}
                        />
                        {errors.mobilePhone && <div className="warning-txt mt5" role="alert">* {errors.mobilePhone}</div>}
                      </div>
                      <span className="text-sm text-gray-400 whitespace-nowrap">※ 숫자만 입력</span>
                    </div>
                  </td>
                </tr>

                {/* 연락처 */}
                <tr>
                  <th>연락처</th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-500">
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.officePhone ? formatPhoneDisplay(formData.officePhone) : ''}
                          onChange={(e) => handlePhoneInput('officePhone', e.target.value)}
                          placeholder="숫자만 입력"
                          maxLength={13}
                        />
                      </div>
                      <span style={{ padding: '0 4px', whiteSpace: 'nowrap' }}>내선번호</span>
                      <div style={{ width: '100px' }}>
                        <input
                          type="text"
                          className="input-frame"
                          value={formData.extensionNumber}
                          onChange={(e) => handlePhoneInput('extensionNumber', e.target.value)}
                          placeholder="내선번호"
                          maxLength={6}
                        />
                      </div>
                      <span className="text-sm text-gray-400 whitespace-nowrap">※ 숫자만 입력</span>
                    </div>
                  </td>
                </tr>

                {/* ID */}
                <tr>
                  <th>ID <span className="red">*</span></th>
                  <td>
                    <div className="filed-flx">
                      <div className="flex items-center gap-2 mx-500">
                        <input
                          type="text"
                          className={`input-frame ${errors.loginId ? 'err' : ''}`}
                          value={formData.loginId}
                          onChange={(e) => {
                            onChange({ loginId: e.target.value })
                            setIdChecked(false)
                            setIdCheckMessage(null)
                          }}
                          readOnly={mode === 'edit'}
                          placeholder="영문+숫자 조합 8자 이상"
                          style={{ flex: 1 }}
                        />
                        {mode === 'create' && (
                          <button className="btn-form gray" onClick={handleCheckLoginId} type="button">
                            중복체크
                          </button>
                        )}
                      </div>
                      <span className="text-sm text-gray-400 whitespace-nowrap">※ 영문과 숫자를 조합하여 8자 이상 입력</span>
                    </div>
                    {errors.loginId && <div className="warning-txt mt5 mx-500" role="alert">* {errors.loginId}</div>}
                    {idCheckMessage && !errors.loginId && (
                      <div className={`mt5 mx-500 ${idChecked ? 'text-blue-600' : 'text-red-600'}`} style={{ fontSize: '12px' }}>
                        {idCheckMessage}
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
                          <input
                            type="password"
                            className={`input-frame ${errors.password ? 'err' : ''}`}
                            value={formData.password}
                            onChange={(e) => onChange({ password: e.target.value })}
                            placeholder="영문+숫자+특수문자 조합 8~20자"
                          />
                          {errors.password && <div className="warning-txt mt5" role="alert">* {errors.password}</div>}
                        </div>
                        <span className="text-sm text-gray-400 whitespace-nowrap">※ 영문과 숫자와 특수문자를 조합하여 8자 이상 입력</span>
                      </div>
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
                    <div className="mx-500">
                      <input
                        type="email"
                        className="input-frame"
                        value={formData.email}
                        onChange={(e) => onChange({ email: e.target.value })}
                        placeholder="이메일 주소"
                      />
                    </div>
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
                          placeholder="권한을 선택해주세요"
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
                    <div className="mx-500">
                      <input
                        type="text"
                        className={`input-frame ${errors.inquiryResponderName ? 'err' : ''}`}
                        value={formData.inquiryResponderName}
                        onChange={(e) => onChange({ inquiryResponderName: e.target.value })}
                      />
                      {errors.inquiryResponderName && (
                        <div className="warning-txt mt5" role="alert">* {errors.inquiryResponderName}</div>
                      )}
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
                  <Input value={admin.createdBy ? `${admin.createdByName}(${admin.createdBy})` : '-'} disabled />
                </td>
                <th>등록일</th>
                <td>
                  <Input value={formatDateYmd(admin.createdAt)} disabled />
                </td>
              </tr>
              <tr>
                <th>최종 수정자</th>
                <td>
                  <Input value={admin.updatedBy ? `${admin.updatedByName}(${admin.updatedBy})` : '-'} disabled />
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
