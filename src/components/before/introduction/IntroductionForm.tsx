'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import IntroductionInquiry from './IntroductionInquiry'
import IntroductionSuccess from './IntroductionSuccess'
import PersonalinformationConset from './PersonalinformationConset'

export default function IntroductionForm() {
  const [introductionSuccess, setIntroductionSuccess] = useState(false)
  const [personalinformationConset, setPersonalinformationConset] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [introductionSuccess, personalinformationConset])

  return (
    <div className="sub-wrap">
      {!personalinformationConset ? (
        <div className="sub-wrap-inner">
          <div className="sub-wrap-header">
            <div className="sub-header-icon">
              <Image src="/assets/images/before_main/sub_whale.png" alt="introduction" width={228} height={126} />
            </div>
            <div className="sub-header-s-tit">Your Vision, Our Expertise</div>
            <div className="sub-header-b-tit">
              <span className="bold">매장에 딱 맞는 솔루션</span>
              <span>전문가와 함께 고민하세요.</span>
            </div>
            <div className="sub-header-desc">문의사항을 남겨 주시면 가장 적합한 방법을 안내 드리겠습니다.</div>
          </div>
          {introductionSuccess ? (
            <IntroductionSuccess />
          ) : (
            <IntroductionInquiry
              setIntroductionSuccess={setIntroductionSuccess}
              setPersonalinformationConset={setPersonalinformationConset}
            />
          )}
        </div>
      ) : (
        <PersonalinformationConset setPersonalinformationConset={setPersonalinformationConset} />
      )}
    </div>
  )
}
