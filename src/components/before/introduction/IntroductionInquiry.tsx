'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** BPTYP 공통코드 기반 업종 목록 (인증 불필요 상수) */
const BUSINESS_TYPE_OPTIONS = [
  { code: 'BPTYP_001', name: '일반음식점' },
  { code: 'BPTYP_002', name: '휴게음식점' },
  { code: 'BPTYP_003', name: '제과점' },
  { code: 'BPTYP_004', name: '위탁급식' },
  { code: 'BPTYP_005', name: '유흥주점' },
] as const

export interface IntroductionFormState {
  name: string
  businessType: string
  phone: string
  mainMenu: string
  email: string
  interestedServices: string[]
  content: string
  privacyAgreed: boolean
}

interface IntroductionFormErrors {
  name?: string
  phone?: string
  mainMenu?: string
  email?: string
  interestedServices?: string
  content?: string
  privacyAgreed?: string
}

const SERVICE_OPTIONS = ['매장운영', '재무관리', '프랜차이즈', '기타']

function validateForm(form: IntroductionFormState): IntroductionFormErrors {
  const errors: IntroductionFormErrors = {}

  if (!form.name.trim()) {
    errors.name = '이름을 입력해 주세요.'
  }
  const phoneDigits = form.phone.replace(/\D/g, '')
  if (!phoneDigits) {
    errors.phone = '숫자만 입력해 주세요.'
  }
  if (!form.mainMenu.trim()) {
    errors.mainMenu = '주력메뉴를 입력해 주세요.'
  }
  if (!form.email.trim()) {
    errors.email = '이메일을 입력해 주세요.'
  } else if (!EMAIL_REGEX.test(form.email.trim())) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }
  if (form.interestedServices.length === 0) {
    errors.interestedServices = '관심 서비스를 선택해 주세요.'
  }
  if (!form.content.trim()) {
    errors.content = '문의사항을 입력해 주세요.'
  }
  if (!form.privacyAgreed) {
    errors.privacyAgreed = '개인정보 수집 및 이용 동의를 동의해 주세요.'
  }

  return errors
}

export default function IntroductionInquiry({
  formState,
  setFormState,
  setSuccessName,
  setPersonalinformationConset,
}: {
  formState: IntroductionFormState
  setFormState: (state: IntroductionFormState) => void
  setSuccessName: (name: string) => void
  setPersonalinformationConset: (conset: boolean) => void
}) {
  const [errors, setErrors] = useState<IntroductionFormErrors>({})

  const handleChange = (field: keyof IntroductionFormState, value: string | boolean) => {
    setFormState({ ...formState, [field]: value })
    if (errors[field as keyof IntroductionFormErrors]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field as keyof IntroductionFormErrors]
        return next
      })
    }
  }

  const toggleService = (service: string) => {
    const services = formState.interestedServices.includes(service)
      ? formState.interestedServices.filter((s) => s !== service)
      : [...formState.interestedServices, service]
    setFormState({ ...formState, interestedServices: services })
    if (errors.interestedServices) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.interestedServices
        return next
      })
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateForm(formState)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    setSuccessName(formState.name.trim())
  }

  return (
    <form className="introduction-wrap" onSubmit={handleSubmit} noValidate>
      <div className="introduction-form">
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              이름 <span className="red">*</span>
            </div>
            <div className="before">
              <input
                type="text"
                placeholder="이름을 입력해 주세요."
                value={formState.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
          <div className="introduction-item">
            <div className="introduction-item-tit">업종</div>
            <div className="before">
              <select
                value={formState.businessType}
                onChange={(e) => handleChange('businessType', e.target.value)}
              >
                <option value="">선택</option>
                {BUSINESS_TYPE_OPTIONS.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              휴대전화번호 <span className="red">*</span>
            </div>
            <div className="before">
              <input
                type="text"
                inputMode="numeric"
                placeholder="숫자만 입력해주세요."
                value={formState.phone}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
              />
            </div>
            {errors.phone && <div className="error-message">{errors.phone}</div>}
          </div>
          <div className="introduction-item">
            <div className="introduction-item-tit">
              주력메뉴 <span className="red">*</span>
            </div>
            <div className="before">
              <input
                type="text"
                placeholder="커피, 디저트 등 간단하게 입력해 주세요."
                value={formState.mainMenu}
                onChange={(e) => handleChange('mainMenu', e.target.value)}
              />
            </div>
            {errors.mainMenu && <div className="error-message">{errors.mainMenu}</div>}
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              이메일 <span className="red">*</span>
            </div>
            <div className="before">
              <input
                type="email"
                placeholder="이메일을 입력해주세요."
                value={formState.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              관심 서비스 <span className="red">*</span> <b>(복수선택 가능)</b>
            </div>
            <div className="introduction-select">
              {SERVICE_OPTIONS.map((service) => (
                <button
                  key={service}
                  type="button"
                  className={`introduction-select-btn ${formState.interestedServices.includes(service) ? 'checked' : ''}`}
                  onClick={() => toggleService(service)}
                >
                  {service}
                </button>
              ))}
            </div>
            {errors.interestedServices && <div className="error-message">{errors.interestedServices}</div>}
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              문의사항 <span className="red">*</span>
            </div>
            <div className="before">
              <textarea
                placeholder="궁금하신 내용을 입력해 주세요. 도입을 희망하는 기능과 예상인원을 함께 적어 주시면 더욱 정확한 상담이 가능합니다."
                value={formState.content}
                onChange={(e) => handleChange('content', e.target.value)}
              />
            </div>
            {errors.content && <div className="error-message">{errors.content}</div>}
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              개인정보 수집 및 이용 동의 <span className="red">*</span>
            </div>
            <div className="before">
              <div className="introduction-check">
                <div className="check-form-box">
                  <input
                    type="checkbox"
                    id="introduction-agree"
                    checked={formState.privacyAgreed}
                    onChange={(e) => handleChange('privacyAgreed', e.target.checked)}
                  />
                  <label htmlFor="introduction-agree">
                    <span>(필수)</span>개인정보 수집 및 이용 동의
                  </label>
                </div>
                <button type="button" className="introduction-check-btn" onClick={() => setPersonalinformationConset(true)}>
                  전문보기
                </button>
              </div>
            </div>
            {errors.privacyAgreed && <div className="error-message">{errors.privacyAgreed}</div>}
          </div>
        </div>
      </div>
      <div className="introduction-btn-wrap">
        <button type="submit" className="introduction-btn">
          제출
        </button>
      </div>
    </form>
  )
}
