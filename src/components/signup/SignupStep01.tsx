'use client'

import { useRef, useState } from 'react'
import type { SignupFormData } from '@/types/signup'
import { step1BusinessNumberSchema, step1InvitationCodeSchema } from '@/lib/schemas/signup'
import { useBusinessVerification } from '@/hooks/queries/use-business-verification'
import { useVerifyInvitation } from '@/hooks/queries/use-signup-queries'
import { useBusinessLicenseOcr } from '@/hooks/queries/use-ocr-queries'
import { formatZodFieldErrors } from '@/lib/zod-utils'
import FileUpload, { type FileItem } from '@/components/common/ui/FileUpload'

interface Props {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
  setStep: (step: number) => void
}

export default function SignupStep01({ formData, updateFormData, setStep }: Props) {
  const [tab, setTab] = useState<1 | 2>(formData.verificationMethod === 'invitation-code' ? 2 : 1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [verificationError, setVerificationError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [businessFiles, setBusinessFiles] = useState<FileItem[]>([])

  const businessVerification = useBusinessVerification()
  const verifyInvitation = useVerifyInvitation()
  const { mutate: ocrMutate } = useBusinessLicenseOcr()

  const handleTab1Verify = async () => {
    setErrors({})
    setVerificationError('')

    const result = step1BusinessNumberSchema.safeParse({
      representativeName: formData.representativeName,
      openDate: formData.openDate,
      businessRegistrationNumber: formData.businessRegistrationNumber,
    })

    if (!result.success) {
      setErrors(formatZodFieldErrors(result.error))
      return
    }

    try {
      const verification = await businessVerification.mutateAsync({
        businessRegistrationNumber: formData.businessRegistrationNumber,
        startDate: formData.openDate,
        representativeName: formData.representativeName,
      })

      if (!verification.isValid) {
        setVerificationError('사업자 인증에 실패했습니다. 입력 정보를 확인해주세요.')
        return
      }

      updateFormData({
        verificationMethod: 'business-number',
      })
      setStep(2)
    } catch {
      setVerificationError('사업자 인증 중 오류가 발생했습니다.')
    }
  }

  const handleTab2Verify = async () => {
    setErrors({})
    setVerificationError('')

    const result = step1InvitationCodeSchema.safeParse({
      invitationCode: formData.invitationCode,
    })

    if (!result.success) {
      setErrors(formatZodFieldErrors(result.error))
      return
    }

    try {
      const data = await verifyInvitation.mutateAsync(formData.invitationCode)

      updateFormData({
        verificationMethod: 'invitation-code',
        invitationData: data,
        companyName: data.companyName,
        businessRegistrationNumber: data.businessRegistrationNumber,
        representativeName: data.representativeName,
        email: data.representativeEmail,
        businessType: 'FRANCHISE',
        headOfficeName: data.headOfficeName,
      })
      setStep(2)
    } catch {
      setVerificationError('초대 코드 검증에 실패했습니다. 코드를 확인해주세요.')
    }
  }

  const handleFileAdd = (files: File[]) => {
    if (files.length === 0) return

    setBusinessFiles((prev) => [
      ...prev,
      ...files.map((f) => ({ name: f.name, file: f })),
    ])

    const file = files[0]
    const isOcrTarget = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)
    if (isOcrTarget) {
      ocrMutate(file, {
        onSuccess: (response) => {
          if (response.success && response.data) {
            const { representativeName, businessRegistrationNumber, openDate, companyName, businessAddress } = response.data
            const addressUpdate: Partial<SignupFormData> = {}
            if (businessAddress) {
              const commaIndex = businessAddress.indexOf(',')
              if (commaIndex !== -1) {
                addressUpdate.address1 = businessAddress.slice(0, commaIndex).trim()
                addressUpdate.address2 = businessAddress.slice(commaIndex + 1).trim()
              } else {
                addressUpdate.address1 = businessAddress
              }
            }
            updateFormData({
              ...(representativeName && { representativeName }),
              ...(businessRegistrationNumber && { businessRegistrationNumber }),
              ...(openDate && { openDate: openDate.replace(/-/g, '') }),
              ...(companyName && { companyName }),
              ...addressUpdate,
            })
          } else {
            setVerificationError('사업자등록증 인식에 실패했습니다. 정보를 직접 입력해주세요.')
          }
        },
        onError: () => {
          setVerificationError('사업자등록증 이미지 처리 중 오류가 발생했습니다. 정보를 직접 입력해주세요.')
        },
      })
    }
  }

  const handleFileRemove = (index: number) => {
    setBusinessFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const isPending = businessVerification.isPending || verifyInvitation.isPending

  return (
    <div className="signup-wrap">
      <div className="signup-step01-tab-wrap">
        <button
          type="button"
          className={`signup-step01-tab-btn ${tab === 1 ? 'act' : ''}`}
          onClick={() => setTab(1)}
        >
          사업자등록번호로 가입하기
        </button>
        <button
          type="button"
          className={`signup-step01-tab-btn ${tab === 2 ? 'act' : ''}`}
          onClick={() => setTab(2)}
        >
          초대 이메일로 가입하기
        </button>
      </div>

      {tab === 1 ? (
        <div className="signup-step01-content-wrap">
          <div className="signup-step01-item">
            <div className="signup-step01-item-tit">사업자 등록 정보를 확인합니다.</div>
            <div className="signup-step01-item-input-wrap">
              <div className="signup-step01-item-input-label">
                대표자 성명 <span className="red">*</span>
              </div>
              <div className="signup-step01-item-input">
                <input
                  type="text"
                  className="input-frame"
                  placeholder="대표자 성명을 입력해주세요."
                  value={formData.representativeName}
                  onChange={(e) => updateFormData({ representativeName: e.target.value })}
                />
              </div>
              {errors.representativeName && (
                <div className="signup-message error mt10">{errors.representativeName}</div>
              )}
            </div>
            <div className="signup-step01-item-input-wrap">
              <div className="signup-step01-item-input-label">
                개업일자 <span className="red">*</span>
              </div>
              <div className="signup-step01-item-input">
                <input
                  type="text"
                  className="input-frame"
                  placeholder="개업일자를 입력해주세요."
                  value={formData.openDate}
                  onChange={(e) => updateFormData({ openDate: e.target.value })}
                />
              </div>
              {errors.openDate && (
                <div className="signup-message error mt10">{errors.openDate}</div>
              )}
            </div>
            <div className="signup-step01-item-input-wrap">
              <div className="signup-step01-item-input-label">
                사업자등록번호 <span className="red">*</span>
              </div>
              <div className="signup-step01-item-input">
                <input
                  type="text"
                  className="input-frame"
                  placeholder="사업자등록번호를 입력해주세요."
                  value={formData.businessRegistrationNumber}
                  onChange={(e) => updateFormData({ businessRegistrationNumber: e.target.value })}
                />
              </div>
              <div className="signup-txt-message mt10">- 없이 숫자 10자리를 입력해 주세요</div>
              {errors.businessRegistrationNumber && (
                <div className="signup-message error mt10">{errors.businessRegistrationNumber}</div>
              )}
            </div>
            {verificationError && (
              <div className="signup-message error mt10">{verificationError}</div>
            )}
            <div className="signup-step01-item-desc">
              <span>
                사업자 정보 확인(인증)에 문제가 있을 경우, 사업자등록증 사본 파일을 첨부하고{' '}
                <b>master@erpwhale.co.kr</b>로 연락처 및 신청인 정보를 보내주세요.
              </span>
              <span>사업자등록번호를 도용하여 가입 시 형사 처벌을 받을 수 있습니다.</span>
            </div>
          </div>
          <div className="signup-step01-item">
            <div className="signup-step01-item-tit">손쉽게 가입하기</div>
            <div className="signup-step01-item-desc">
              <span>
                사업자등록증 이미지를 Drag &amp; Drop으로 옮기시면 정보가 자동으로 입력되고, 이후 사업자와 관련된 정보를
                입력할 필요가 없습니다.
              </span>
            </div>
            <div className="signup-step01-item-file">
              <div className="filed-file">
                <input
                  type="file"
                  className="file-input"
                  id="file-input"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : []
                    if (files.length > 0) handleFileAdd(files)
                    e.target.value = ''
                  }}
                />
                <label htmlFor="file-input" className="btn-form">
                  파일 찾기
                </label>
              </div>
              <FileUpload
                files={businessFiles}
                onAdd={handleFileAdd}
                onRemove={handleFileRemove}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                guideText="Drag & Drop으로 파일을 옮겨주세요."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="signup-step01-content-wrap">
          <div className="signup-step01-item">
            <div className="signup-step01-item-tit">Business Partner 코드를 확인합니다.</div>
            <div className="signup-step01-item-input-wrap">
              <div className="signup-step01-item-input">
                <input
                  type="text"
                  className="input-frame"
                  placeholder="Business Partner 코드를 입력해 주세요."
                  value={formData.invitationCode}
                  onChange={(e) => updateFormData({ invitationCode: e.target.value })}
                />
              </div>
              {errors.invitationCode && (
                <div className="signup-message error mt10">{errors.invitationCode}</div>
              )}
              {verificationError && (
                <div className="signup-message error mt10">{verificationError}</div>
              )}
            </div>
            <div className="signup-step01-item-desc">
              <span>초대 이메일에 기제된 Business Partner 코드를 입력해 주세요.</span>
              <span>
                Business Partner 코드(인증)에 문제가 있을 경우, 사업자등록증 사본 파일을 첨부하고{' '}
                <b>master@erpwhale.co.kr</b>로 연락처 및 신청인 정보를 보내주세요.
              </span>
              <span>사업자등록번호를 도용하여 가입 시 형사 처벌을 받을 수 있습니다.</span>
            </div>
          </div>
        </div>
      )}

      <div className="introduction-btn-wrap">
        <button
          type="button"
          className="introduction-btn"
          onClick={tab === 1 ? handleTab1Verify : handleTab2Verify}
          disabled={isPending}
        >
          {isPending ? '인증 중...' : '인증하기'}
        </button>
      </div>
    </div>
  )
}
