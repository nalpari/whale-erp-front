'use client'

import type { SignupFormData } from '@/types/signup'

interface Props {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
  setStep: (step: number) => void
}

export default function SignupStep02({ formData, updateFormData, setStep }: Props) {
  return (
    <div className="signup-wrap">
      <div className="signup-form-wrap">
        <div className="signup-form-header">
          <div className="signup-form-header-tit">대표자 실명 확인을 진행해 주세요.</div>
          <div className="signup-form-header-desc">
            <span>사업자 등록 정보 인증이 완료되었습니다.</span>
            <span>등록명의자 또는 대표자 실명 확인을 진행해 주세요.</span>
          </div>
          <div className="signup-form-header-desc err">
            <span>대표자 실명 확인이 계속 실패할 경우</span>
            <span>
              사업자등록증상의 대표자와 본인 인증에서 입력하신 본인과 동일한지 확인하시고 재인증을 시도해 주세요.
            </span>
          </div>
        </div>
        <div className="signup-form-content">
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">회사명</div>
            <div className="block">
              <input
                type="text"
                className="input-frame"
                placeholder="회사명을 입력해 주세요."
                value={formData.companyName}
                onChange={(e) => updateFormData({ companyName: e.target.value })}
              />
            </div>
            <div className="signup-txt-message ">※ 사업자등록증 상의 회사명을 입력해 주세요.</div>
          </div>
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">사업자등록번호</div>
            <div className="block">
              <input
                type="text"
                className="input-frame"
                value={formData.businessRegistrationNumber}
                onChange={(e) => updateFormData({ businessRegistrationNumber: e.target.value })}
              />
            </div>
          </div>
          <div className="signup-form-content-item">
            <div className="signup-form-content-item-tit">대표자</div>
            <div className="block">
              <input
                type="text"
                className="input-frame"
                placeholder="대표자 실명을 입력해 주세요."
                value={formData.representativeName}
                onChange={(e) => updateFormData({ representativeName: e.target.value })}
              />
            </div>
            <div className="signup-txt-message ">※ 사업자등록증 상의 사업자명을 입력해 주세요.</div>
          </div>
        </div>
      </div>
      <div className="introduction-btn-wrap">
        <button type="button" className="introduction-btn" onClick={() => setStep(3)}>
          본인 인증
        </button>
      </div>
    </div>
  )
}
