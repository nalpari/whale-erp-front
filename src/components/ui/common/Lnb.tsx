'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { HeaderMenu } from '@/data/HeaderMenu'
import AnimateHeight from 'react-animate-height'

export default function Lnb({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null)

  const handleMenuToggle = (id: string, isSubMenu: boolean, link: boolean, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (link) {
      e.preventDefault()
    }

    if (isSubMenu) {
      setActiveSubMenu(activeSubMenu === id ? null : id)
    } else {
      setActiveMenu(activeMenu === id ? null : id)
      if (activeMenu === null) {
        setActiveSubMenu(null)
      }
    }
  }

  return (
    <div className={`lnb ${isOpen ? 'sm' : ''}`}>
      <button className="lnb-toggle-btn" onClick={() => setIsOpen(!isOpen)}></button>

      <div className="lnb-header">
        <Link href="/list" className="lnb-logo">
          <Image src="/assets/images/ui/lnb_logo.svg" alt="logo" width={54} height={54} priority />
          <div className="lnb-logo-text">
            <span className="logo-main">whale ERP</span>
            <span>management System</span>
          </div>
        </Link>
      </div>
      <div className="lnb-menu-info">
        <div className="lnb-menu-icon">
          <Image src="/assets/images/ui/lnb_menu_img01.svg" alt="menu" fill />
        </div>
        <div className="lnb_menu_name">서비스 네이밍</div>
      </div>
      <div className="lnb-body">
        <ul className="lnb-list">
          {HeaderMenu.map((menu) => (
            <li className={`lnb-item ${activeMenu === menu.id ? 'act' : ''}`} key={menu.id}>
              <Link
                href={menu.link}
                className="menu-depth01"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  handleMenuToggle(menu.id, false, menu.link === '#', e)
                }
              >
                <Image src={`/assets/images/ui/${menu.icon}`} alt="menu" fill />
                <span className="lnb-menu-name">{menu.name}</span>
              </Link>
              {menu.children && (
                <AnimateHeight duration={300} height={activeMenu === menu.id ? 'auto' : 0}>
                  <ul className="lnb-list-depth02">
                    <div className="sm-tit">{menu.name}</div>
                    {menu.children.map((child) => (
                      <li className={`lnb-depth02-item ${activeSubMenu === child.id ? 'act' : ''}`} key={child.id}>
                        <Link
                          href={child.link}
                          className="menu-depth02"
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                            handleMenuToggle(child.id, true, child.link === '#', e)
                          }
                        >
                          <span className="lnb-menu-name">{child.name}</span>
                        </Link>
                        {child.children && (
                          <AnimateHeight duration={300} height={activeSubMenu === child.id ? 'auto' : 0}>
                            <ul className="lnb-list-depth03">
                              {child.children.map((subChild) => (
                                <li className="lnb-depth03-item" key={subChild.id}>
                                  <Link href={subChild.link} className="menu-depth03">
                                    <span className="lnb-menu-name">{subChild.name}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </AnimateHeight>
                        )}
                      </li>
                    ))}
                  </ul>
                </AnimateHeight>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
