export interface SupportMenuItem {
  id: string
  name: string
  icon?: string
  link: string
  children?: SupportMenuItem[]
}

export const SupportMenu: SupportMenuItem[] = [
  {
    id: 'support-01',
    name: '요금안내/변경',
    icon: 'lnb_menu_icon00.svg',
    link: '#',
  },
  {
    id: 'support-02',
    name: '부가서비스 신청',
    icon: 'lnb_menu_icon00.svg',
    link: '#',
  },
  {
    id: 'support-03',
    name: '공지사항',
    icon: 'lnb_menu_icon00.svg',
    link: '#',
  },
  {
    id: 'support-04',
    name: '문의하기',
    icon: 'lnb_menu_icon00.svg',
    link: '#',
  },
]
