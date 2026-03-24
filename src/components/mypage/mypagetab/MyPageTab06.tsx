'use client'
import { useState } from 'react'
import { useAlert } from '@/components/common/ui'
import { useChangePasswordMutation } from '@/hooks/queries/use-change-password-mutation'
import { useMyPageStore } from '@/stores/mypage-store'
import { getErrorMessage } from '@/lib/api'
import { changePasswordSchema } from '@/lib/schemas/forms'
import { formatZodFieldErrors } from '@/lib/zod-utils'

export default function MyPageTab06() {
  const { alert, confirm } = useAlert()
  const closeMyPage = useMyPageStore((state) => state.closeMyPage)
  const { mutateAsync: changePassword } = useChangePasswordMutation()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const result = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword })
    if (result.success) {
      setErrors({})
      return true
    }
    setErrors(formatZodFieldErrors(result.error))
    return false
  }

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSave = async () => {
    if (!validate()) return

    const confirmed = await confirm('비밀번호를 변경하시겠습니까?')
    if (!confirmed) return

    try {
      await changePassword({ currentPassword, newPassword })
      await alert('비밀번호가 변경되었습니다.')
      closeMyPage()
    } catch (error) {
      await alert(getErrorMessage(error, '비밀번호 변경에 실패했습니다.'))
    }
  }

  return (
    <div className="mypage-frame-wrap">
      <div className="password-change-wrap">
        <div className="password-change-inner">
          <div className="filed-wrap">
            {/* 현재 비밀번호 */}
            <div className="filed-item">
              <div className="filed-tit">현재 비밀번호 <span className="red">*</span></div>
              <div className="filed-input">
                <div className="input-icon-log-frame">
                  <input
                    placeholder="현재 비밀번호를 입력해 주세요"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); clearError('currentPassword') }}
                  />
                  <button
                    type="button"
                    className={`input-icon-btn ${showCurrent ? 'show' : 'hide'}`}
                    onClick={() => setShowCurrent(!showCurrent)}
                  />
                </div>
              </div>
              {errors.currentPassword && <div className="filed-error">{errors.currentPassword}</div>}
            </div>

            {/* 신규 비밀번호 */}
            <div className="filed-item">
              <div className="filed-tit">신규 비밀번호 <span className="red">*</span></div>
              <div className="filed-input">
                <div className="input-icon-log-frame">
                  <input
                    placeholder="영문+숫자+특수문자(@$!%*#?&), 8~20자"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); clearError('newPassword') }}
                  />
                  <button
                    type="button"
                    className={`input-icon-btn ${showNew ? 'show' : 'hide'}`}
                    onClick={() => setShowNew(!showNew)}
                  />
                </div>
              </div>
              {errors.newPassword && <div className="filed-error">{errors.newPassword}</div>}
            </div>

            {/* 비밀번호 확인 */}
            <div className="filed-item">
              <div className="filed-tit">비밀번호 확인 <span className="red">*</span></div>
              <div className="filed-input">
                <div className="input-icon-log-frame">
                  <input
                    placeholder="신규 비밀번호를 다시 입력해 주세요"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
                  />
                  <button
                    type="button"
                    className={`input-icon-btn ${showConfirm ? 'show' : 'hide'}`}
                    onClick={() => setShowConfirm(!showConfirm)}
                  />
                </div>
              </div>
              {errors.confirmPassword && <div className="filed-error">{errors.confirmPassword}</div>}
            </div>
          </div>
        </div>
        <div className="password-change-btn">
          <button type="button" className="btn-form gray" onClick={closeMyPage}>취소</button>
          <button type="button" className="btn-form basic" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  )
}
