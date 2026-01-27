import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import Image from 'next/image'
import { useAuthStore } from '@/stores/auth-store'

export default function MyData() {
  const [myDataOpen, setMyDataOpen] = useState(false)
  const router = useRouter()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }
  return (
    <div className={`my-data ${myDataOpen ? 'act' : ''}`}>
      <div className="my-data-wrap">
        <div className="my-icon">
          <Image src="/assets/images/common/my_icon.png" alt="my-data-icon" fill />
        </div>
        <div className="data-info">
          <div className="data-name">김지영 <span>(HC-1234567)</span></div>
        </div>
        <button className="data-arrow" onClick={() => setMyDataOpen(!myDataOpen)}></button>
      </div>
      <AnimateHeight duration={200} height={myDataOpen ? 'auto' : 0} animateOpacity>
        <div className='my-data-list-wrap'>
          <div className='my-data-list-tit'>MY PAGE</div>
          <ul className="my-data-list">
            <li className="my-data-item">
              <button type="button" className="my-data-item-btn">
                사업자정보 확인/수정
              </button>
            </li>
            <li className="my-data-item">
              <button type="button" className="my-data-item-btn">
                서비스 구독 현황 확인
              </button>
            </li>
            <li className="my-data-item">
              <button type="button" className="my-data-item-btn">
                구독료 청구 및 납부 현황
              </button>
            </li>
            <li className="my-data-item">
              <button type="button" className="my-data-item-btn">
                정산 현황
              </button>
            </li>
            <li className="my-data-item">
              <button type="button" className="my-data-item-btn">
                결제수단 관리
              </button>
            </li>
            <li className="my-data-item">
              <button type="button" className="my-data-item-btn">
                비밀번호 변경
              </button>
            </li>
            <li className="my-data-item">
              <button type="button" className="my-data-item-btn red" onClick={handleLogout}>
              로그아웃
              </button>
            </li>
          </ul>
        </div>
      </AnimateHeight>
    </div>
  )
}
