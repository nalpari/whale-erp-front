'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import { useMyOrganizationBp } from '@/hooks/queries/use-bp-queries'
import { useProgramList } from '@/hooks/queries/use-program-queries'
import { useAuthStore } from '@/stores/auth-store'
import { toHeaderMenuItems } from '@/util/lnb-adapter'
import type { HeaderMenuItem } from '@/lib/schemas/menu'

// Home 은 시스템 진입점으로 DB programs 와 무관하게 LNB 에 항상 고정 표시한다.
// id=0 은 시퀀스 충돌 방지용 sentinel (DB 시퀀스는 1 부터 시작).
const HOME_ITEM: HeaderMenuItem = {
  id: 0,
  name: 'Home',
  icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon00.svg',
  link: '/logined-main',
}

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
  const { data: myBp } = useMyOrganizationBp()

  const logoUrl = myBp?.lnbLogoExpandFile?.publicUrl ?? null
  const brandName = myBp?.brandName ?? null

  // 메뉴 리스트: programs API 에서 menu_kind 별로 조회 후 어댑터로 변환
  // 권한 화이트리스트: auth-store 의 authority (canRead 트리) 로 필터링 (B-3+)
  // header 모드는 Home 을 항상 맨 앞에 고정 prepend (DB 외부 관리)
  const menuKind = menuType === 'support' ? 'MNKND_002' : 'MNKND_001'
  const { data: programs } = useProgramList(menuKind)
  const authorityPrograms = useAuthStore((s) => s.authority)
  const menuList = useMemo(() => {
    const items = toHeaderMenuItems(programs, authorityPrograms)
    return menuType === 'support' ? items : [HOME_ITEM, ...items]
  }, [programs, authorityPrograms, menuType])

  // pathname 기반 활성 메뉴 파생 (longest prefix wins)
  // - exact match 또는 부속 경로(/master/menu/store/123 → /master/menu/store) 모두 인식
  // - 가장 긴 link 가 매칭되도록 모든 후보 수집 후 max length 선택
  const findActiveFromPathname = (list: typeof menuList) => {
    let best: { menuId: number | null; subMenuId: number | null; subSubMenuId: number | null; len: number } = {
      menuId: null, subMenuId: null, subSubMenuId: null, len: -1,
    }
    const isMatch = (link: string) =>
      link !== '#' && (pathname === link || pathname?.startsWith(link + '/'))

    for (const menu of list) {
      if (isMatch(menu.link) && menu.link.length > best.len) {
        best = { menuId: menu.id, subMenuId: null, subSubMenuId: null, len: menu.link.length }
      }
      if (menu.children) {
        for (const child of menu.children) {
          if (isMatch(child.link) && child.link.length > best.len) {
            best = { menuId: menu.id, subMenuId: child.id, subSubMenuId: null, len: child.link.length }
          }
          if (child.children) {
            for (const subChild of child.children) {
              if (isMatch(subChild.link) && subChild.link.length > best.len) {
                best = { menuId: menu.id, subMenuId: child.id, subSubMenuId: subChild.id, len: subChild.link.length }
              }
            }
          }
        }
      }
    }
    return { menuId: best.menuId, subMenuId: best.subMenuId, subSubMenuId: best.subSubMenuId }
  }

  // pathname 기반 활성 메뉴 — 파생값으로 직접 계산 (setState in render 금지)
  const { menuId: activeMenuId, subMenuId: activeSubMenuId, subSubMenuId: activeSubSubMenuId } = findActiveFromPathname(menuList)

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
      if (expandedMenu !== null && expandedMenu !== id) {
        setExpandedSubMenu(null)
      }
    }
  }

  return (
    <div className={`lnb ${isOpen ? 'sm' : ''}`}>
      <button className="lnb-toggle-btn" onClick={() => setIsOpen(!isOpen)}></button>
      <div className="lnb-header">
        <Link href="/logined-main" className="lnb-logo">
          {logoUrl ? (
            <>
              <Image
                src={logoUrl}
                alt="logo"
                width={54}
                height={54}
                style={{ objectFit: 'contain', borderRadius: 8 }}
              />
              <div className="lnb-logo-text">
                <span className="logo-main">{brandName || 'whale ERP'}</span>
              </div>
            </>
          ) : (
            <>
              <Image src="/assets/images/ui/lnb_logo.svg" alt="logo" width={54} height={54} priority />
              <div className="lnb-logo-text">
                <span className="logo-main">whale ERP</span>
                <span>management System</span>
              </div>
            </>
          )}
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
            <li className={`lnb-item ${expandedMenu === menu.id ? 'act' : ''}`} key={menu.id}>
              <Link
                href={menu.link}
                className={`menu-depth01 ${menu.children ? '' : 'home'}`}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  handleMenuToggle(menu.id, false, menu.link === '#', e)
                }
              >
                {menu.icon && <Image src={menu.icon} alt="menu" fill />}
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
                                <li className={`lnb-depth03-item ${activeSubSubMenuId === subChild.id ? 'act' : ''}`} key={subChild.id}>
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
