import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import Image from 'next/image'

export default function MyData() {
  const [myDataOpen, setMyDataOpen] = useState(false)
  return (
    <div className={`my-data ${myDataOpen ? 'act' : ''}`}>
      <div className="my-data-wrap">
        <div className="my-icon">
          <Image src="/assets/images/common/my_icon.png" alt="my-data-icon" fill />
        </div>
        <div className="data-info">
          <div className="data-position">Platform Manager</div>
          <div className="data-name">동대문종합시장 1호점 (홍길동 admin) </div>
        </div>
        <button className="data-arrow" onClick={() => setMyDataOpen(!myDataOpen)}></button>
      </div>
      <AnimateHeight duration={200} height={myDataOpen ? 'auto' : 0} animateOpacity>
        <ul className="my-data-list">
          <li className="my-data-item">
            <button type="button" className="my-data-item-btn">
              내정보 확인/수정
            </button>
          </li>
          <li className="my-data-item">
            <button type="button" className="my-data-item-btn">
              비밀번호 변경
            </button>
          </li>
          <li className="my-data-item">
            <button type="button" className="my-data-item-btn red">
              로그아웃
            </button>
          </li>
        </ul>
      </AnimateHeight>
    </div>
  )
}
