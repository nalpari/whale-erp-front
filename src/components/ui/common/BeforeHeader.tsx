'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BeforeHeader() {
  const pathname = usePathname()
  const [isScrollDown, setIsScrollDown] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const isMain = pathname === '/' || pathname === '/main'
  const subMenu = !isMain

  useEffect(() => {
    if (subMenu) return

    // 스크롤 위치 체크 (act 클래스용)
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > 0) {
        setHasScrolled(true)
      } else {
        setHasScrolled(false)
        // 스크롤이 0에 도착하면 off 클래스도 제거
        setIsScrollDown(false)
      }
    }

    // 휠 방향 체크 (off 클래스용)
    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY > 0) {
        // 휠을 아래로 - off 클래스 추가
        setIsScrollDown(true)
      } else if (event.deltaY < 0) {
        // 휠을 위로 - off 클래스 제거
        setIsScrollDown(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleWheel)
      setIsScrollDown(false)
      setHasScrolled(false)
    }
  }, [subMenu])

  return (
    <div className={`before-header ${subMenu ? 'sub' : ''} ${hasScrolled ? 'act' : ''} ${isScrollDown ? 'off' : ''}`}>
      <div className="before-header-wrap">
        <div className="before-logo">
          <Link href="/main"></Link>
        </div>
        <ul className={`before-menu-list${pathname === '/introduction' || pathname === '/before-notice' || pathname === '/signup' ? ' act' : ''}`}>
          <li className={`before-menu-item${pathname === '/store-operation' ? ' act' : ''}`}>
            <Link href="/store-operation">매장운영</Link>
          </li>
          <li className={`before-menu-item${pathname === '/financial' ? ' act' : ''}`}>
            <Link href="/financial">재무관리</Link>
          </li>
          <li className={`before-menu-item${pathname === '/franchise' ? ' act' : ''}`}>
            <Link href="/franchise">프랜차이즈</Link>
          </li>
          <li className={`before-menu-item${pathname === '/pricing-info' ? ' act' : ''}`}>
            <Link href="/pricing-info">요금안내</Link>
          </li>
        </ul>
        <div className="before-sub-menu">
          <ul className="before-sub-menu-list">
            <li className="before-sub-menu-item">
              <Link className="login" href="/login">
                <i className="icon-login"></i>LOGIN
              </Link>
            </li>
            <li className="before-sub-menu-item">
              <Link href="/introduction">도입문의</Link>
            </li>
            <li className="before-sub-menu-item">
              <Link href="/before-notice">공지사항</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
