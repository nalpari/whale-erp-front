'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SignupFormData } from '@/types/signup'
import type { DaumPostcodeData } from '@/components/common/ui/AddressSearch'
import { step4Schema } from '@/lib/schemas/signup'
import { formatZodFieldErrors } from '@/lib/zod-utils'
import { useBpTypCodes } from '@/hooks/queries/use-signup-queries'
import FileUpload, { type FileItem } from '@/components/common/ui/FileUpload'
import { useAlert } from '@/components/common/ui/Alert'

interface Props {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
  setStep: (step: number) => void
}

let isScriptLoaded = false
let isScriptLoading = false
const scriptLoadCallbacks: (() => void)[] = []

const loadDaumPostcodeScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isScriptLoaded) {
      resolve()
      return
    }
    if (isScriptLoading) {
      scriptLoadCallbacks.push(resolve)
      return
    }
    isScriptLoading = true
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => {
      isScriptLoaded = true
      isScriptLoading = false
      resolve()
      scriptLoadCallbacks.forEach((cb) => cb())
      scriptLoadCallbacks.length = 0
    }
    script.onerror = () => {
      isScriptLoading = false
      reject(new Error('주소 검색 스크립트를 불러올 수 없습니다.'))
    }
    document.head.appendChild(script)
  })
}

export default function SignupStep04({ formData, updateFormData, setStep }: Props) {
  const { alert } = useAlert()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoFiles, setLogoFiles] = useState<FileItem[]>(() =>
    formData.logoFile ? [{ name: formData.logoFile.name, file: formData.logoFile }] : []
  )
  const detailRef = useRef<HTMLInputElement>(null)
  const { data: bpTypeCodes = [] } = useBpTypCodes()
  const isInvitation = formData.verificationMethod === 'invitation-code'

  const handleLogoAdd = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    setLogoFiles([{ name: file.name, file }])
    updateFormData({ logoFile: file })
  }, [updateFormData])

  const handleLogoRemove = useCallback(() => {
    setLogoFiles([])
    updateFormData({ logoFile: undefined })
  }, [updateFormData])

  useEffect(() => {
    loadDaumPostcodeScript()
  }, [])

  const handleOpenPostcode = async () => {
    try {
      await loadDaumPostcodeScript()
    } catch {
      await alert('주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    const PostcodeCtor = window.daum?.Postcode
    if (!PostcodeCtor) return

    const width = 500
    const height = 600

    new PostcodeCtor({
      oncomplete: (data: DaumPostcodeData) => {
        let fullAddress = data.address
        let extraAddress = ''

        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddress += extraAddress !== '' ? ', ' + data.buildingName : data.buildingName
          }
          if (extraAddress !== '') {
            fullAddress += ` (${extraAddress})`
          }
        }

        updateFormData({ address1: fullAddress })
        setTimeout(() => detailRef.current?.focus(), 100)
      },
      width: '100%',
      height: '100%',
    }).open({
      left: Math.round((window.screen.width - width) / 2),
      top: Math.round((window.screen.height - height) / 2),
      popupTitle: '주소 검색',
    })
  }

  const handleNext = () => {
    setErrors({})

    const headOfficeName = isInvitation
      ? (formData.invitationData?.headOfficeName ?? '')
      : formData.companyName
    const brandName = isInvitation
      ? (formData.invitationData?.headOfficeBrandName ?? '')
      : formData.brandName

    const result = step4Schema.safeParse({
      headOfficeName,
      brandName,
      address1: formData.address1,
      address2: formData.address2,
      email: formData.email,
      businessCategory: formData.businessCategory,
    })

    if (!result.success) {
      setErrors(formatZodFieldErrors(result.error))
      return
    }

    setStep(5)
  }

  return (
    <div className="signup-wrap">
      <div className="signup-form-wrap">
        <div className="signup-form-header">
          <div className="signup-form-header-tit">사업자 운영 정보 등록</div>
          <div className="signup-form-header-desc">
            <span>사업자와 관련한 상세 정보를 입력해 주세요.</span>
          </div>
        </div>
        <div className="signup-form-content">
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">
              {formData.businessType === 'FRANCHISE' ? '본사' : '업체명'} <span className="red">*</span>
            </div>
            <div className="block">
              <input
                type="text"
                className="input-frame"
                value={isInvitation ? (formData.invitationData?.headOfficeName ?? '') : formData.companyName}
                onChange={(e) => updateFormData({ companyName: e.target.value })}
                readOnly={isInvitation}
              />
            </div>
            {errors.headOfficeName && (
              <div className="signup-txt-message err">※ {errors.headOfficeName}</div>
            )}
          </div>
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">
              브랜드명 <span className="red">*</span>
            </div>
            <div className="block">
              <input
                type="text"
                className="input-frame"
                value={isInvitation ? (formData.invitationData?.headOfficeBrandName ?? '') : formData.brandName}
                onChange={(e) => updateFormData({ brandName: e.target.value })}
                readOnly={isInvitation}
              />
            </div>
            {!isInvitation && (
              <div className="signup-txt-message ">※ 프랜차이즈의 브랜드명을 입력해 주세요.</div>
            )}
            {errors.brandName && (
              <div className="signup-txt-message err">※ {errors.brandName}</div>
            )}
          </div>
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">
              주소 <span className="red">*</span>
            </div>
            <div className="singup-flx-item">
              <button type="button" className="btn-form" onClick={handleOpenPostcode}>
                주소 찾기
              </button>
              <div className="block">
                <input
                  type="text"
                  className="input-frame"
                  placeholder="(우편번호) 도로명/지번"
                  value={formData.address1}
                  readOnly
                />
              </div>
              <div className="block">
                <input
                  type="text"
                  className="input-frame"
                  ref={detailRef}
                  value={formData.address2}
                  onChange={(e) => updateFormData({ address2: e.target.value })}
                />
              </div>
            </div>
            {errors.address1 && (
              <div className="signup-txt-message err">※ {errors.address1}</div>
            )}
          </div>
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">
              이메일 <span className="red">*</span>
            </div>
            <div className="block">
              <input
                type="text"
                className="input-frame"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
              />
            </div>
            {errors.email && (
              <div className="signup-txt-message err">※ {errors.email}</div>
            )}
          </div>
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">
              영업 분류 <span className="red">*</span>
            </div>
            <div className="block">
              <select
                className="select-form"
                value={formData.businessCategory}
                onChange={(e) => updateFormData({ businessCategory: e.target.value })}
              >
                <option value="">선택</option>
                {bpTypeCodes.map((code) => (
                  <option key={code.code} value={code.code}>
                    {code.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.businessCategory && (
              <div className="signup-txt-message err">※ {errors.businessCategory}</div>
            )}
          </div>
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">로고 등록</div>
            <div className="block">
              <FileUpload
                files={logoFiles}
                onAdd={handleLogoAdd}
                onRemove={handleLogoRemove}
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                guideText="Drag & Drop으로 파일을 옮겨주세요."
              />
            </div>
          </div>
        </div>
      </div>
      <div className="introduction-btn-wrap">
        <button type="button" className="introduction-btn gray" onClick={() => setStep(3)}>
          이전으로 이동
        </button>
        <button type="button" className="introduction-btn" onClick={handleNext}>
          다음으로 이동
        </button>
      </div>
    </div>
  )
}
