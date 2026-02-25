'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { HeaderMenu } from '@/data/HeaderMenu'
import AnimateHeight from 'react-animate-height'
import { SupportMenu } from '@/data/SupportMenu'

export default function Lnb({
  isOpen,
  setIsOpen,
  menuType = 'header',
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  menuType?: 'header' | 'support';
}) {
  const pathname = usePathname()

  // 메뉴 리스트 설정
  const menuList = menuType === 'support' ? SupportMenu : HeaderMenu

  // pathname 기반 활성 메뉴 파생
  const findActiveFromPathname = (list: typeof menuList) => {
    for (const menu of list) {
      if (menu.link !== '#' && pathname === menu.link) {
        return { menuId: menu.id, subMenuId: null as number | null }
      }
      if (menu.children) {
        for (const child of menu.children) {
          if (child.link !== '#' && pathname === child.link) {
            return { menuId: menu.id, subMenuId: child.id }
          }
          if (child.children) {
            for (const subChild of child.children) {
              if (subChild.link !== '#' && pathname === subChild.link) {
                return { menuId: menu.id, subMenuId: child.id }
              }
            }
          }
        }
      }
    }
    return { menuId: null, subMenuId: null }
  }

  // pathname 기반 활성 메뉴 — 파생값으로 직접 계산 (setState in render 금지)
  const { menuId: activeMenuId, subMenuId: activeSubMenuId } = findActiveFromPathname(menuList)

  // 아코디언 확장 상태 — key prop으로 리마운트 시 초기화됨
  const [expandedMenu, setExpandedMenu] = useState<number | null>(activeMenuId)
  const [expandedSubMenu, setExpandedSubMenu] = useState<number | null>(activeSubMenuId)

  const handleMenuToggle = (id: number, isSubMenu: boolean, link: boolean, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (link) {
      e.preventDefault()
    }

    if (isSubMenu) {
      setExpandedSubMenu(expandedSubMenu === id ? null : id)
    } else {
      setExpandedMenu(expandedMenu === id ? null : id)
      if (expandedMenu === null) {
        setExpandedSubMenu(null)
      }
    }
  }

  return (
    <div className={`lnb ${isOpen ? 'sm' : ''}`}>
      <button className="lnb-toggle-btn" onClick={() => setIsOpen(!isOpen)}></button>
      <div className="lnb-header">
        <Link href="/logined-main" className="lnb-logo">
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
        <div className="lnb_menu_name">{menuType === 'support' ? '고객지원' : '파트너 오피스'}</div>
        {menuType !== 'support' && (
          <div className="lnb-meu-grade">Standard</div>
        )}
      </div>
      <div className="lnb-body">
        <ul className="lnb-list">
          {menuList.map((menu) => (
            <li className={`lnb-item ${activeMenuId === menu.id ? 'act' : ''}`} key={menu.id}>
              <Link
                href={menu.link}
                className={`menu-depth01 ${menu.children ? '' : 'home'}`}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  handleMenuToggle(menu.id, false, menu.link === '#', e)
                }
              >
                <Image src={`${menu.icon}`} alt="menu" fill />
                <span className="lnb-menu-name">{menu.name}</span>
              </Link>
              {menu.children && (
                <AnimateHeight duration={300} height={expandedMenu === menu.id ? 'auto' : 0}>
                  <ul className="lnb-list-depth02">
                    <div className="sm-tit">{menu.name}</div>
                    {menu.children.map((child) => (
                      <li className={`lnb-depth02-item ${activeSubMenuId === child.id ? 'act' : ''}`} key={child.id}>
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
                          <AnimateHeight duration={300} height={expandedSubMenu === child.id ? 'auto' : 0}>
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
