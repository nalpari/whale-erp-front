export interface SupportMenuItem {
  id: number
  name: string
  icon?: string
  link: string
  children?: SupportMenuItem[]
}

export const SupportMenu: SupportMenuItem[] = [
  {
    id: 1,
    name: '요금안내/변경',
    icon: 'lnb_menu_icon00.svg',
    link: '#',
  },
  {
    id: 2,
    name: '부가서비스 신청',
    icon: 'lnb_menu_icon00.svg',
    link: '#',
  },
  {
    id: 3,
    name: '공지사항',
    icon: 'lnb_menu_icon00.svg',
    link: '#',
  },
  {
    id: 4,
    name: '문의하기',
    icon: 'lnb_menu_icon00.svg',
    link: '#',
  },
]
