'use client'
import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import Image from 'next/image'

export default function ServiceTab({
  onToggleMenuType,
}: {
  onToggleMenuType?: () => void
}) {
  const [tabOpen, setTabOpen] = useState(false)
  return (
    <div className={`service-tab ${tabOpen ? 'act' : ''}`}>
      <div className="service-menu">
        <div className="service-guide">서비스 바로가기</div>
        <div className="service-menu-list">
          <button className="service-item icon01" onClick={onToggleMenuType}>
            <Image src="/assets/images/common/service_icon01.svg" alt="service-icon01" fill />
          </button>
          <button className="service-item icon02">
            <Image src="/assets/images/common/service_icon02.svg" alt="service-icon02" fill />
          </button>
          <button className="service-item service-tab" onClick={() => setTabOpen(!tabOpen)}></button>
        </div>
      </div>
      <AnimateHeight duration={200} height={tabOpen ? 'auto' : 0} animateOpacity>
        <div className="service-menu-list-wrap">
          {Array.from({ length: 8 }).map((_, index) => (
            <button className="service-menu-list-item" key={index}>
              <div className="service-item-icon">
                <Image src="/assets/images/common/service_icon01.svg" alt="" fill />
              </div>
              <div className="service-item-name">서비스명</div>
            </button>
          ))}
        </div>
      </AnimateHeight>
    </div>
  )
}
