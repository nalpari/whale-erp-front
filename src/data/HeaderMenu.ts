// HeaderMenu 타입 정의
import { type HeaderMenuItem } from '@/lib/schemas/menu';

// HeaderMenuItem 타입 재내보내기
export type { HeaderMenuItem };

export const HeaderMenu: HeaderMenuItem[] = [
  {
    id: 'master',
    name: 'Master data 관리',
    icon: 'lnb_menu_icon01.svg',
    link: '#',
    children: [
      {
        id: 'master-01',
        name: 'Business Partner Master',
        link: '/',
      },
      {
        id: 'master-02',
        name: '회원 Master',
        link: '/',
      },
      {
        id: 'master-03',
        name: '재료 Master',
        link: '/',
      },
      {
        id: 'master-04',
        name: '메뉴 Master',
        link: '#',
        children: [
          {
            id: 'master-04-01',
            name: '마스터용 메뉴 관리',
            link: '/',
          },
          {
            id: 'master-04-02',
            name: '점포용 메뉴 관리',
            link: '/',
          },
        ],
      },
      {
        id: 'master-05',
        name: '가격 Master',
        link: '#',
        children: [
          {
            id: 'master-05-01',
            name: '마스터용 가격 관리',
            link: '/',
          },
          {
            id: 'master-05-02',
            name: '점포용 가격 관리',
            link: '/',
          },
          {
            id: 'master-05-03',
            name: '점포용 프로모션 가격 관리',
            link: '/',
          },
        ],
      },
      {
        id: 'master-06',
        name: '카테고리 Master',
        link: '#',
        children: [
          {
            id: 'master-06-01',
            name: '마스터용 카테고리 관리',
            link: '/',
          },
          {
            id: 'master-06-02',
            name: '점포용 카테고리 관리',
            link: '/',
          },
        ],
      },
    ],
  },
  {
    id: 'franchise-store',
    name: '가맹점 밎 점포 관리',
    icon: 'lnb_menu_icon02.svg',
    link: '#',
    children: [
      {
        id: 'franchise-store-01',
        name: '가맹점 밎 점포 관리',
        link: '#',
        children: [
          {
            id: 'franchise-store-01-01',
            name: '계약서 템플릿 관리',
            link: '/',
          },
          {
            id: 'franchise-store-01-02',
            name: '가맹점 계약 관리',
            link: '/',
          },
          {
            id: 'franchise-store-01-03',
            name: '점포 정보 관리',
            link: '/store/info',
          },
        ],
      },
      {
        id: 'franchise-store-02',
        name: '시설물 및 장비 관리',
        link: '#',
        children: [
          {
            id: 'franchise-store-02-01',
            name: '시설물 및 장비 정보 관리',
            link: '/',
          },
          {
            id: 'franchise-store-02-02',
            name: '시설물 및 장비 수리 이력',
            link: '/',
          },
          {
            id: 'franchise-store-02-03',
            name: '시설물 및 장비 환경 설정',
            link: '/',
          },
        ],
      },
      {
        id: 'franchise-store-03',
        name: '점검 관리',
        link: '#',
        children: [
          {
            id: 'franchise-store-03-01',
            name: '점검표 템플릿 관리',
            link: '/',
          },
          {
            id: 'franchise-store-03-02',
            name: '점검 결과 관리',
            link: '/',
          },
        ],
      },
    ],
  },
  {
    id: 'employee',
    name: '직원 관리',
    icon: 'lnb_menu_icon03.svg',
    link: '#',
    children: [
      {
        id: 'employee-01',
        name: '직원 관리',
        link: '#',
        children: [
          {
            id: 'employee-01-01',
            name: '직원 정보 관리',
            link: '/employee/info',
          },
          {
            id: 'employee-01-02',
            name: '근로 계약 관리',
            link: '/employee/contract',
          },
          {
            id: 'employee-01-03',
            name: '직원 정보 환경 설정',
            link: '/employee/employee-settings',
          },
          {
            id: 'employee-01-04',
            name: '근로 계약 환경 설정',
            link: '/employee/employee-contract-settings',
          },
        ],
      },
      {
        id: 'employee-02',
        name: '급여 명세서',
        link: '#',
        children: [
          {
            id: 'employee-02-01',
            name: '정직원 급여명세서',
            link: '/employee/payroll/regular',
          },
          {
            id: 'employee-02-02',
            name: '파트타이머 급여명세서',
            link: '/employee/payroll/parttime',
          },
          {
            id: 'employee-02-03',
            name: '연장근무 수당명세서',
            link: '/employee/payroll/overtime',
          },
          {
            id: 'employee-02-04',
            name: '급여명세서 환경 설정',
            link: '/employee/payroll/settings',
          },
        ],
      },
      {
        id: 'employee-03',
        name: '근무 현황',
        link: '#',
        children: [
          {
            id: 'employee-03-01',
            name: '출퇴근 현황',
            link: '/employee/attendance',
          },
          {
            id: 'employee-03-02',
            name: '매장별 근무 계획표',
            link: '/employee/schedule/view',
          },
          {
            id: 'employee-03-03',
            name: '매장별 근무 계획 수립',
            link: '/employee/schedule/plan',
          },
        ],
      },
    ],
  },
  {
    id: 'finance',
    name: '재무 관리',
    icon: 'lnb_menu_icon04.svg',
    link: '#',
    children: [
      {
        id: 'finance-01',
        name: '재무 현황',
        link: '/',
      },
      {
        id: 'finance-02',
        name: '계정별 현황',
        link: '/',
      },
      {
        id: 'finance-03',
        name: '매출/매입 거래 등록',
        link: '/',
      },
    ],
  },
  {
    id: 'work',
    name: '업무 관리',
    icon: 'lnb_menu_icon05.svg',
    link: '#',
    children: [
      {
        id: 'work-01',
        name: '조직도 관리',
        link: '/',
      },
      {
        id: 'work-02',
        name: '업무 관리',
        link: '/',
      },
      {
        id: 'work-03',
        name: '결재 관리',
        link: '/',
      },
      {
        id: 'work-04',
        name: '보고서 관리',
        link: '/',
      },
      {
        id: 'work-05',
        name: '일정표 관리',
        link: '/',
      },
      {
        id: 'work-06',
        name: '커뮤니티',
        link: '/',
      },
      {
        id: 'work-07',
        name: '공용 폴더',
        link: '/',
      },
    ],
  },
  {
    id: 'system',
    name: '시스템 관리',
    icon: 'lnb_menu_icon06.svg',
    link: '#',
    children: [
      {
        id: 'system-01',
        name: '관리자 관리',
        link: '/',
      },
      {
        id: 'system-02',
        name: '프로그램 관리',
        link: '/system/program',
      },
      {
        id: 'system-03',
        name: '권한 관리',
        link: '/',
      },
      {
        id: 'system-04',
        name: '공통 코드 관리',
        link: '/',
      },
      {
        id: 'system-05',
        name: '휴일 관리',
        link: '/',
      },
    ],
  },
]
