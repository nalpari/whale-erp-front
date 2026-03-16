'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { SignupFormData } from '@/types/signup'
import { initialSignupFormData } from '@/types/signup'
import SignupStep01 from './SignupStep01'
import SignupStep02 from './SignupStep02'
import SignupStep03 from './SignupStep03'
import SignupStep04 from './SignupStep04'
import SignupStep05 from './SignupStep05'
import SignupStep06 from './SignupStep06'

export default function SignupLayout() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<SignupFormData>(initialSignupFormData)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    wrapRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [step])

  const updateFormData = (data: Partial<SignupFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  return (
    <div className="sub-wrap" ref={wrapRef}>
      <div className="sub-wrap-inner">
        <div className="sub-wrap-header">
          <div className="sub-header-icon">
            <Image src="/assets/images/before_main/sub_whale.png" alt="introduction" width={228} height={126} />
          </div>
          <div className="sub-header-b-tit">
            <span className="bold">Business Partner 가입</span>
            <span>최고의 파트너십, 지금 확인해 보세요.</span>
          </div>
          <div className="sub-header-desc">가입 문의를 남겨 주시면 귀사에 가장 적합한 협력 모델을 제안해 드립니다</div>
        </div>

        {step === 1 && (
          <SignupStep01
            formData={formData}
            updateFormData={updateFormData}
            setStep={setStep}
          />
        )}
        {step === 2 && (
          <SignupStep02
            formData={formData}
            updateFormData={updateFormData}
            setStep={setStep}
          />
        )}
        {step === 3 && (
          <SignupStep03
            formData={formData}
            updateFormData={updateFormData}
            setStep={setStep}
          />
        )}
        {step === 4 && (
          <SignupStep04
            formData={formData}
            updateFormData={updateFormData}
            setStep={setStep}
          />
        )}
        {step === 5 && (
          <SignupStep05
            formData={formData}
            updateFormData={updateFormData}
            setStep={setStep}
          />
        )}
        {step === 6 && <SignupStep06 />}
      </div>
    </div>
  )
}
