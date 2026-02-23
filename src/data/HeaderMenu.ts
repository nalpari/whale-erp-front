// HeaderMenu 타입 정의

export interface HeaderMenuItem {
  id: number
  name: string
  icon?: string
  link: string
  children?: HeaderMenuItem[]
}

export const HeaderMenu: HeaderMenuItem[] = [
  {
    id: 1,
    name: 'Home',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon00.svg',
    link: '/logined-main',
  },
  {
    id: 2,
    name: 'Master data 관리',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon01.svg',
    link: '#',
    children: [
      {
        id: 10,
        name: '파트너 정보 관리',
        link: '#',
      },
      {
        id: 11,
        name: '메뉴 정보 관리',
        link: '#',
        children: [
          {
            id: 35,
            name: '마스터용 메뉴 Master',
            link: '/master/menu',
          },
          {
            id: 36,
            name: '점포용 메뉴 Master',
            link: '#',
          },
        ],
      },
      {
        id: 12,
        name: '가격 Master',
        link: '#',
        children: [
          {
            id: 37,
            name: '마스터용 가격 관리',
            link: '#',
          },
          {
            id: 38,
            name: '점포용 프로모션 가격 관리',
            link: '#',
          },
        ],
      },
      {
        id: 13,
        name: '카테고리 Master',
        link: '#',
        children: [
          {
            id: 39,
            name: '마스터용 카테고리 관리',
            link: '/master/category/master',
          },
        ],
      },
    ],
  },
  {
    id: 3,
    name: '가맹점 및 점포 관리',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon02.svg',
    link: '#',
    children: [
      {
        id: 14,
        name: '가맹점 및 점포 관리',
        link: '#',
        children: [
          {
            id: 40,
            name: '점포 정보 관리',
            link: '/store/info',
          },
        ],
      },
    ],
  },
  {
    id: 4,
    name: '직원 관리',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon03.svg',
    link: '#',
    children: [
      {
        id: 15,
        name: '직원 관리',
        link: '#',
        children: [
          {
            id: 41,
            name: '직원 정보 관리',
            link: '/employee/info',
          },
          {
            id: 42,
            name: '근로 계약 관리',
            link: '/employee/contract',
          },
        ],
      },
      {
        id: 16,
        name: '급여 명세서',
        link: '#',
        children: [
          {
            id: 43,
            name: '정직원 급여명세서',
            link: '/employee/payroll/regular',
          },
          {
            id: 44,
            name: '파트타이머 급여명세서',
            link: '/employee/payroll/parttime',
          },
          {
            id: 45,
            name: '연장근무 수당명세서',
            link: '/employee/payroll/overtime',
          },
        ],
      },
      {
        id: 17,
        name: '근무 현황',
        link: '#',
        children: [
          {
            id: 46,
            name: '출퇴근 현황',
            link: '/employee/attendance',
          },
          {
            id: 47,
            name: '매장별 근무 계획표',
            link: '/employee/schedule/view',
          },
          {
            id: 48,
            name: '매장별 근무 계획 수립',
            link: '/employee/schedule/plan',
          },
        ],
      },
      {
        id: 18,
        name: '직원별 TO-DO 관리',
        link: '#',
        children: [
          {
            id: 49,
            name: 'TO-DO 관리',
            link: '#',
          },
        ],
      },
    ],
  },
  {
    id: 5,
    name: '신용카드 매출조회',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon04.svg',
    link: '',
    children: [
      {
        id: 19,
        name: '일별 승인집계 조회',
        link: '#',
      },
      {
        id: 20,
        name: '기간별 승인집계 조회',
        link: '#',
      },
      {
        id: 21,
        name: '월별 승인집계 조회',
        link: '#',
      },
    ],
  },
  {
    id: 6,
    name: '환경 설정',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon05.svg',
    link: '#',
    children: [
      {
        id: 22,
        name: '권한 관리',
        link: '/system/authority',
      },
      {
        id: 23,
        name: '공통코드 관리',
        link: '/system/common-codes',
      },
      {
        id: 24,
        name: '휴일 관리',
        link: '/system/holiday',
      },
      {
        id: 52,
        name: '법정공휴일 관리',
        link: '/system/holiday/legal',
      },
    ],
  },
  {
    id: 7,
    name: '시스템 관리',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon06.svg',
    link: '#',
    children: [
      {
        id: 25,
        name: '관리자 관리',
        link: '#',
      },
      {
        id: 26,
        name: '프로그램 관리',
        link: '/system/program',
      },
      {
        id: 27,
        name: '권한 관리',
        link: '/system/authority',
      },
      {
        id: 28,
        name: '공통코드 관리',
        link: '#',
        children: [
          {
            id: 50,
            name: '공통코드 관리',
            link: '/system/common-codes',
          },
          {
            id: 51,
            name: '공통 데이터 관리',
            link: '#',
          },
        ],
      },
      {
        id: 29,
        name: '휴일 관리',
        link: '/system/holiday',
      },
      {
        id: 30,
        name: '이메일 템플릿 관리',
        link: '#',
      },
    ],
  },
  {
    id: 8,
    name: '과금 관리',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon07.svg',
    link: '#',
    children: [
      {
        id: 31,
        name: 'ERP 요금제 관리',
        link: '/subscription',
      },
      {
        id: 32,
        name: '부가서비스 요금제관리',
        link: '#',
      },
      {
        id: 33,
        name: '결제현황',
        link: '#',
      },
    ],
  },
  {
    id: 9,
    name: '서비스 관리',
    icon: 'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon08.svg',
    link: '#',
    children: [
      {
        id: 34,
        name: '부가서비스 셋팅',
        link: '#',
      },
    ],
  },
]
