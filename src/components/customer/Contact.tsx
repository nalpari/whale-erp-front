'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useCreateInquiry } from '@/hooks/queries'
import { useCommonCodeHierarchy } from '@/hooks/queries/use-common-code-queries'
import { getErrorMessage } from '@/lib/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 휴대전화 숫자만 받아 010-1234-5678 형식으로 반환 (최대 11자리) */
function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.startsWith('010')) {
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
    if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
  }
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
}

interface ContactFormState {
  name: string
  phone: string
  email: string
  inquiryType: string
  content: string
}

interface ContactFormErrors {
  name?: string
  phone?: string
  email?: string
  inquiryType?: string
  content?: string
}

const createInitialForm = (): ContactFormState => ({
  name: '',
  phone: '',
  email: '',
  inquiryType: '',
  content: '',
})

/**
 * 폼 유효성 검사
 */
function validateForm(form: ContactFormState): ContactFormErrors {
  const errors: ContactFormErrors = {}

  if (!form.name.trim()) {
    errors.name = '이름을 입력해 주세요.'
  }
  const phoneDigits = form.phone.replace(/\D/g, '')
  if (!phoneDigits) {
    errors.phone = '휴대전화 번호를 입력해 주세요.'
  } else if (!/^\d+$/.test(phoneDigits)) {
    errors.phone = '숫자만 허용'
  } else if (phoneDigits.length < 9 || phoneDigits.length > 20) {
    errors.phone = '휴대전화 번호는 9~20자리로 입력해 주세요.'
  }
  if (!form.email.trim()) {
    errors.email = '이메일을 입력해 주세요.'
  } else if (!EMAIL_REGEX.test(form.email.trim())) {
    errors.email = '이메일 형식에 맞지 않습니다.'
  }
  if (!form.inquiryType) {
    errors.inquiryType = '문의유형을 선택해 주세요.'
  }
  if (!form.content.trim()) {
    errors.content = '문의내용을 입력해 주세요.'
  } else if (form.content.trim().length < 10) {
    errors.content = '최소 10자 이상 입력해 주세요.'
  }

  return errors
}

export default function Contact() {
  // auth store: 로그인 사용자 정보 (setUserInfo로 저장된 name, mobilePhone)
  const storeName = useAuthStore((s) => s.name ?? null)
  const storeMobilePhone = useAuthStore((s) => s.mobilePhone ?? null)

  const [form, setForm] = useState<ContactFormState>(() => ({
    ...createInitialForm(),
    ...(storeName && { name: storeName }),
    ...(storeMobilePhone && { phone: formatPhone(storeMobilePhone) }),
  }))
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successName, setSuccessName] = useState<string | null>(null)

  const { data: inquiryTypes = [], isPending: isTypesLoading } = useCommonCodeHierarchy('INQTYP')
  const { mutateAsync, isPending: isSubmitting } = useCreateInquiry()

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const resetForm = () => {
    setForm(() => ({
      ...createInitialForm(),
      name: storeName ?? '',
      phone: storeMobilePhone ? formatPhone(storeMobilePhone) : '',
    }))
    setErrors({})
    setSubmitError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    setSubmitError(null)

    if (Object.keys(nextErrors).length > 0) return

    try {
      await mutateAsync({
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.trim(),
        inquiryType: form.inquiryType,
        content: form.content.trim(),
      })
      setSuccessName(form.name.trim())
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, '문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.'))
    }
  }

  return (
    <>
      <form className="content-wrap" onSubmit={handleSubmit} noValidate>
        <div className="contact-wrap">
          {/* 이름 / 휴대전화 / 이메일 — 한 줄 */}
          <div className="contact-filed contact-filed-flx">
            <div className="filed-item">
              <div className="filed-tit">
                이름
              </div>
              <div className="filed-input">
                <div className={`input-icon-frame ${errors.name ? 'err' : ''}`}>
                  <input
                    type="text"
                    placeholder={storeName ? undefined : '이름을 입력해 주세요.'}
                    value={form.name}
                    disabled={!!storeName}
                    onChange={(e) => handleChange('name', e.target.value)}
                    aria-label={storeName ? '이름 (로그인 정보)' : '이름'}
                  />
                </div>
              </div>
              {errors.name && <div className="filed-error mt5">※ {errors.name}</div>}
            </div>

            <div className="filed-item">
              <div className="filed-tit">
                휴대전화 번호 <span className="red">*</span>
              </div>
              <div className={`input-icon-frame ${errors.phone ? 'err' : ''}`}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="숫자만 입력해 주세요."
                  value={form.phone}
                  onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                  disabled={!!storeMobilePhone || isSubmitting}
                  aria-label={storeMobilePhone ? '휴대전화 (로그인 정보)' : '휴대전화 번호'}
                />
                {form.phone && !storeMobilePhone ? (
                  <button
                    type="button"
                    className="input-icon-btn del"
                    onClick={() => handleChange('phone', formatPhone(''))}
                    aria-label="휴대전화 번호 지우기"
                  />
                ) : null}
              </div>
              {errors.phone && <div className="filed-error mt5">※ {errors.phone}</div>}
            </div>

            <div className="filed-item">
              <div className="filed-tit">
                이메일 <span className="red">*</span>
              </div>
              <div className={`input-icon-frame ${errors.email ? 'err' : ''}`}>
                <input
                  type="email"
                  placeholder="이메일을 입력해 주세요."
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={isSubmitting}
                />
                {form.email ? (
                  <button
                    type="button"
                    className="input-icon-btn del"
                    onClick={() => handleChange('email', '')}
                    aria-label="이메일 지우기"
                  />
                ) : null}
              </div>
              {errors.email && <div className="filed-error mt5">※ {errors.email}</div>}
            </div>
          </div>

          {/* 문의유형 — 퍼블(https://pub.whaleerp.co.kr/contact)과 동일: 한 줄, 왼쪽 정렬 버튼 */}
          <div className="contact-filed">
            <div className="filed-item">
              <div className="filed-tit">
                문의유형 <span className="s">(유형중 1개만 선택해 주세요 )</span>{' '}
                <span className="red">*</span>
              </div>
              <div className="filed-input">
                <div className="contact-check-wrap">
                  {isTypesLoading ? (
                    <span>불러오는 중...</span>
                  ) : (
                    inquiryTypes
                      .filter((item) => item.isActive)
                      .map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className={`contact-btn outline ${form.inquiryType === item.code ? 'act' : ''}`}
                          onClick={() => handleChange('inquiryType', item.code)}
                          disabled={isSubmitting}
                        >
                          {item.name}
                        </button>
                      ))
                  )}
                </div>
              </div>
              {errors.inquiryType && <div className="filed-error mt5">※ {errors.inquiryType}</div>}
            </div>
          </div>

          {/* 문의내용 */}
          <div className="contact-filed">
            <div className="filed-item">
              <div className="filed-tit">
                문의내용 <span className="red">*</span>
              </div>
              <textarea
                className={`textarea-form ${errors.content ? 'err' : ''}`}
                placeholder="궁금하신 내용을 입력해 주세요."
                value={form.content}
                onChange={(e) => handleChange('content', e.target.value)}
                disabled={isSubmitting}
              />
              {errors.content && <div className="filed-error mt5">※ {errors.content}</div>}
            </div>
          </div>

          {submitError && <div className="filed-error mt5">※ {submitError}</div>}

          {/* 버튼 */}
          <div className="contact-btn-wrap">
            <button type="button" className="btn-form gray" onClick={resetForm} disabled={isSubmitting}>
              취소
            </button>
            <button type="submit" className="btn-form basic" disabled={isSubmitting}>
              {isSubmitting ? '전송 중...' : '제출'}
            </button>
          </div>
        </div>
      </form>

      {/* 성공 팝업 */}
      {successName && (
        <div className="modal-popup" onClick={() => { resetForm(); setSuccessName(null) }}>
          <div className="modal-dialog notice" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <button
                  type="button"
                  className="modal-close"
                  aria-label="닫기"
                  onClick={() => { resetForm(); setSuccessName(null) }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="pop-frame">
                  <div className="contact-success-wrap">
                    <p className="contact-name">{successName} 님</p>
                    <p className="contact-txt">
                      <span>문의사항이 성공적으로 접수되었습니다.</span>
                      <span>입력해주신 이메일 또는 휴대전화 번호로 연락 드리겠습니다.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
