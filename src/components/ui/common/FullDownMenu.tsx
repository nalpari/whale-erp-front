'use client'
import { useState } from 'react'
import AnimateHeight from 'react-animate-height'

export default function FullDownMenu() {
  const [fulldownOpen, setFulldownOpen] = useState(false)

  return (
    <div className={`fulldown-menu ${fulldownOpen ? 'act' : ''}`}>
      <button type="button" className="fulldown-menu-tit" onClick={() => setFulldownOpen(!fulldownOpen)}>
        (상담중) 동해에서잡아온- BIM1234(상담중) 동해에서잡아온- BIM1234(상담중) 동해에서잡아온- BIM1234(상담중)
        동해에서잡아온- BIM1234
      </button>
      <AnimateHeight duration={300} height={fulldownOpen ? 'auto' : 0}>
        <div className="fulldown-menu-wrap">
          <ul className="fulldown-menu-list">
            <li className="fulldown-menu-item">
              <button type="button" className="fulldown-menu-item-btn">
                (상담중) 동해에서잡아온- BIM1234(상담중) 동해에서잡아온- BIM1234(상담중) 동해에서잡아온- BIM1234(상담중)
                동해에서잡아온- BIM1234
              </button>
            </li>
            <li className="fulldown-menu-item">
              <button type="button" className="fulldown-menu-item-btn">
                (운영) 동해물과 – BIM1111
              </button>
            </li>
            {Array.from({ length: 10 }).map((_, index) => (
              <li className="fulldown-menu-item" key={index}>
                <button type="button" className="fulldown-menu-item-btn">
                  (종료) 동해횟집 – BIM0012
                </button>
              </li>
            ))}
          </ul>
        </div>
      </AnimateHeight>
    </div>
  )
}
