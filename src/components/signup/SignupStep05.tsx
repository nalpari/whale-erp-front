'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SignupFormData, SignupRequest } from '@/types/signup'
import { step5Schema, step5MasterIdSchema, step5PasswordSchema } from '@/lib/schemas/signup'
import { formatZodFieldErrors } from '@/lib/zod-utils'
import { useSignup } from '@/hooks/queries/use-signup-queries'
import { useAlert } from '@/components/common/ui/Alert'
import api, { getErrorMessage } from '@/lib/api'

interface Props {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
  setStep: (step: number) => void
}

export default function SignupStep05({ formData, updateFormData, setStep }: Props) {
  const router = useRouter()
  const { alert } = useAlert()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [idCheckResult, setIdCheckResult] = useState<'available' | 'duplicate' | null>(null)
  const signup = useSignup()

  const handleCheckId = async () => {
    if (!formData.masterId || formData.masterId.length < 8) {
      setErrors((prev) => ({ ...prev, masterId: '마스터 ID는 8자 이상이어야 합니다' }))
      return
    }

    try {
      const response = await api.get('/api/auth/check-login-id', {
        params: { loginId: formData.masterId },
      })
      const isAvailable = response.data.data.available
      setIdCheckResult(isAvailable ? 'available' : 'duplicate')
      setErrors((prev) => {
        const next = { ...prev }
        delete next.masterId
        return next
      })
    } catch {
      setIdCheckResult('duplicate')
    }
  }

  const handleSubmit = async () => {
    setErrors({})

    const result = step5Schema.safeParse({
      masterId: formData.masterId,
      password: formData.password,
      passwordConfirm: formData.passwordConfirm,
    })

    const newErrors = result.success ? {} : formatZodFieldErrors(result.error)

    if (idCheckResult !== 'available') {
      newErrors.masterId = newErrors.masterId ?? 'ID 중복체크를 해주세요.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const isInvitation = formData.verificationMethod === 'invitation-code'

    const request: SignupRequest = {
      verificationMethod: formData.verificationMethod,
      businessRegistrationNumber: formData.businessRegistrationNumber,
      representativeName: formData.representativeName,
      businessType: (formData.businessType || 'HEAD_OFFICE') as 'HEAD_OFFICE' | 'FRANCHISE' | 'GENERAL',
      mainMenu: formData.mainMenu,
      companyName: isInvitation ? (formData.invitationData?.headOfficeName ?? '') : formData.companyName,
      brandName: isInvitation ? (formData.invitationData?.headOfficeBrandName ?? '') : formData.brandName,
      address1: formData.address1,
      address2: formData.address2,
      email: formData.email,
      businessCategory: formData.businessCategory,
      masterId: formData.masterId,
      password: formData.password,
      bpCode: isInvitation ? formData.invitationCode : undefined,
    }

    try {
      await signup.mutateAsync(request)
      router.push('/login')
    } catch (error) {
      await alert(getErrorMessage(error, '회원가입 중 오류가 발생했습니다.'))
    }
  }

  return (
    <div className="signup-wrap">
      <div className="signup-form-wrap">
        <div className="signup-form-header">
          <div className="signup-form-header-tit">로그인 계정(MASTER ID와 비밀번호) 설정</div>
          <div className="signup-form-header-desc">
            <span>WHALE ERP의 PARTNER OFFICE에 로그인할 수 있는 계정을 설정해 주세요.</span>
          </div>
        </div>
        <div className="signup-form-content">
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">MASTER ID</div>
            <div className="singup-flx-item">
              <div className="block">
                <input
                  type="text"
                  className="input-frame"
                  value={formData.masterId}
                  onChange={(e) => {
                    const value = e.target.value
                    updateFormData({ masterId: value })
                    setIdCheckResult(null)
                    if (value) {
                      const result = step5MasterIdSchema.safeParse(value)
                      if (!result.success) {
                        setErrors((prev) => ({ ...prev, masterId: result.error.issues[0].message }))
                      } else {
                        setErrors((prev) => {
                          const next = { ...prev }
                          delete next.masterId
                          return next
                        })
                      }
                    } else {
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.masterId
                        return next
                      })
                    }
                  }}
                />
              </div>
              <button type="button" className="btn-form" onClick={handleCheckId}>
                중복체크
              </button>
            </div>
            <div className="signup-txt-message ">※ 영문, 숫자 포함  8자 이상 입력</div>
            {errors.masterId && (
              <div className="signup-txt-message err">※ {errors.masterId}</div>
            )}
            {idCheckResult === 'available' && (
              <div className="signup-txt-message mt10 !text-green-500">※ 사용 할 수 있는 ID입니다.</div>
            )}
            {idCheckResult === 'duplicate' && (
              <div className="signup-txt-message err">※ 사용할 수 없는 ID입니다.</div>
            )}
          </div>
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">비밀번호</div>
            <div className="block">
              <input
                type="password"
                className="input-frame"
                value={formData.password}
                onChange={(e) => {
                  const value = e.target.value
                  updateFormData({ password: value })
                  if (value) {
                    const result = step5PasswordSchema.safeParse(value)
                    if (!result.success) {
                      setErrors((prev) => ({ ...prev, password: result.error.issues[0].message }))
                    } else {
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.password
                        return next
                      })
                    }
                  } else {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.password
                      return next
                    })
                  }
                  if (formData.passwordConfirm) {
                    if (value !== formData.passwordConfirm) {
                      setErrors((prev) => ({ ...prev, passwordConfirm: '비밀번호가 일치하지 않습니다' }))
                    } else {
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.passwordConfirm
                        return next
                      })
                    }
                  }
                }}
              />
            </div>
            <div className="signup-txt-message ">※ 영문, 숫자, 특수문자를 포함하여 8자 이상 입력</div>
            {errors.password && (
              <div className="signup-txt-message err">※ {errors.password}</div>
            )}
          </div>
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">비밀번호 재입력</div>
            <div className="block">
              <input
                type="password"
                className="input-frame"
                value={formData.passwordConfirm}
                onChange={(e) => {
                  const value = e.target.value
                  updateFormData({ passwordConfirm: value })
                  if (value) {
                    if (value !== formData.password) {
                      setErrors((prev) => ({ ...prev, passwordConfirm: '비밀번호가 일치하지 않습니다' }))
                    } else {
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.passwordConfirm
                        return next
                      })
                    }
                  } else {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.passwordConfirm
                      return next
                    })
                  }
                }}
              />
            </div>
            <div className="signup-txt-message ">※ 상단에서 입력한 비밀번호를 다시 입력</div>
            {errors.passwordConfirm && (
              <div className="signup-txt-message err">※ {errors.passwordConfirm}</div>
            )}
          </div>
        </div>
        <div className="singup-account-guide">
          <span>본 계정은 MASTER 계정입니다.</span>
          <span>직원들과 계정을 공유할 경우 보안문제가 발생할 수 있습니다.</span>
          <span>
            직원이 함께 이용하시기를 원하시면 직원이 직원 회원으로 등록하고, 점주님이 직원별로 관리자 계정을 부여하는
            것을 권장합니다.
          </span>
        </div>
      </div>
      <div className="introduction-btn-wrap">
        <button type="button" className="introduction-btn gray" onClick={() => setStep(4)}>
          이전으로 이동
        </button>
        <button
          type="button"
          className="introduction-btn"
          onClick={handleSubmit}
          disabled={signup.isPending}
        >
          {signup.isPending ? '가입 처리 중...' : '가입 완료'}
        </button>
      </div>
    </div>
  )
}
