'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BusinessType, SignupFormData } from '@/types/signup'
import { step3Schema } from '@/lib/schemas/signup'
import { formatZodFieldErrors } from '@/lib/zod-utils'

interface Props {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
  setStep: (step: number) => void
}

const BUSINESS_TYPES: { value: BusinessType; label: string; desc: string; id: string }[] = [
  {
    value: 'HEAD_OFFICE',
    label: '프랜차이즈 본사',
    desc: '프랜차이즈업을 영위하는 본사 사업자에 해당합니다. 가맹점을 보유하고 있으며, 가맹점에서도 WHALE ERP를 사용할 예정입니다.',
    id: 'franchise-boss',
  },
  {
    value: 'FRANCHISE',
    label: '프랜차이즈 가맹점',
    desc: '프랜차이즈의 가맹점 사업자에 해당합니다.\n※ 본사 소속으로 본 시스템을 이용하시려면 본사에 초청을 요청해야 합니다.',
    id: 'franchise-franchise',
  },
  {
    value: 'GENERAL',
    label: '일반 사업장',
    desc: '단독 매장을 운영하는 사업자에 해당합니다. 프랜차이즈 가맹점이지만, 독자적인 운영을 원하실 경우에도 선택해 주세요.',
    id: 'general-shop',
  },
]

const SignupStep03 = ({ formData, updateFormData, setStep }: Props) => {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isInvitation = formData.verificationMethod === 'invitation-code'

  const handleNext = () => {
    setErrors({})

    const result = step3Schema.safeParse({
      businessType: formData.businessType,
      mainMenu: formData.mainMenu,
    })

    if (!result.success) {
      setErrors(formatZodFieldErrors(result.error))
      return
    }

    setStep(4)
  }

  const handleCancel = () => {
    router.push('/main')
  }

  return (
    <div className="signup-wrap">
      <div className="signup-form-wrap">
        <div className="signup-form-header">
          <div className="signup-form-header-tit">사업자 유형 선택</div>
          <div className="signup-form-header-desc">
            <span>대표자 본인인증에 성공하였습니다.</span>
            <span>사업자 유형을 선택해 주세요.</span>
          </div>
        </div>
        <div className="signup-bussiness-type-wrap">
          <div className="signup-bussiness-type-tit">사업자 유형</div>
          <div className="signup-bussiness-type-list">
            {BUSINESS_TYPES.map((type) => (
              <div
                key={type.value}
                className={`signup-bussiness-type-item${formData.businessType === type.value ? ' act' : ''}`}
              >
                <div className="signup-bussiness-type-item-tit">
                  <div className="signup-bussiness-type-item-name">{type.label}</div>
                  <div className="radio-form-box no-txt">
                    <input
                      type="radio"
                      id={type.id}
                      name="bussiness-type"
                      checked={formData.businessType === type.value}
                      onChange={() => updateFormData({ businessType: type.value })}
                      disabled={isInvitation}
                    />
                    <label htmlFor={type.id}></label>
                  </div>
                </div>
                <div className="signup-bussiness-type-item-desc">
                  {type.value === 'FRANCHISE' ? (
                    <span>
                      프랜차이즈의 가맹점 사업자에 해당합니다.
                      <br /> ※ 본사 소속으로 본 시스템을 이용하시려면 본사에 초청을 요청해야 합니다.
                    </span>
                  ) : (
                    <span>{type.desc}</span>
                  )}
                </div>
              </div>
            ))}
            <div className="signup-bussiness-type-item">
              <div className="signup-bussiness-type-item-tit">
                <div className="signup-bussiness-type-item-name">대표 메뉴</div>
              </div>
              <div className="signup-bussiness-type-item-desc">
                <span>판매하시는 대표 메뉴를 입력해 주세요.(예 : 커피)</span>
                <span>ERP 사용 환경을 자동으로 추천해 드립니다.</span>
              </div>
              <div className="block mt15">
                <input
                  type="text"
                  className="input-frame"
                  placeholder="ex)커피"
                  value={formData.mainMenu}
                  onChange={(e) => updateFormData({ mainMenu: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
        {errors.businessType && (
          <div className="signup-txt-message err">※ {errors.businessType}</div>
        )}
      </div>
      <div className="introduction-btn-wrap">
        <button type="button" className="introduction-btn gray" onClick={handleCancel}>
          가입 취소
        </button>
        <button type="button" className="introduction-btn" onClick={handleNext}>
          다음으로 이동
        </button>
      </div>
    </div>
  )
}

export default SignupStep03
