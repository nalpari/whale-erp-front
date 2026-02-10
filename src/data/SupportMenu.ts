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
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon01.svg',
    link: '#',
  },
  {
    id: 2,
    name: '부가서비스 신청',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon02.svg',
    link: '#',
  },
  {
    id: 3,
    name: '공지사항',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon03.svg',
    link: '/customer/notice',
  },
  {
    id: 4,
    name: '문의하기',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon04.svg',
    link: '/customer/contact',
  },
]
