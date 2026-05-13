/**
 * 권한 종류(authority_kind) 공통코드 상수.
 *
 * BE 공통코드 그룹 PRKND 에서 관리되며, 각 권한이 어떤 분류에 속하는지 식별.
 *
 * 운영 의미 (사용자 합의):
 * - PRKND_001 = 본사 BP (BP 등록용)        ← 단, BE 명세상 PLATFORM 전용 가능성 있어 확인 필요
 * - PRKND_002 = 가맹점 BP (BP 등록용)
 * - PRKND_003 = 본사직원 (whaleerp 접근용)
 * - PRKND_004 = 점포관리자 (whaleerp 접근용)
 *
 * EMPLOYEE_INVITE_KINDS 는 직원 초대 selectbox 의 authority_kind 필터에 사용.
 */
export const AUTHORITY_KIND = {
  /** PRKND_001 — 본사 BP (BE 확인 후 PLATFORM 전용일 경우 의미 변경) */
  HEAD_OFFICE_BP: 'PRKND_001',
  /** PRKND_002 — 가맹점 BP */
  FRANCHISE_BP: 'PRKND_002',
  /** PRKND_003 — 본사직원 */
  HEAD_OFFICE_EMPLOYEE: 'PRKND_003',
  /** PRKND_004 — 점포관리자 */
  STORE_MANAGER: 'PRKND_004',
  /** 기존 호환용 alias — 일부 코드가 PLATFORM key 를 참조 중 */
  PLATFORM: 'PRKND_001',
} as const

/**
 * 직원 초대 selectbox 에 노출되는 authority_kind 목록.
 * - 본사직원 / 점포관리자 만 노출 (BP 등록용 kind 는 제외).
 */
export const EMPLOYEE_INVITE_KINDS = [
  AUTHORITY_KIND.HEAD_OFFICE_EMPLOYEE,
  AUTHORITY_KIND.STORE_MANAGER,
] as const

export type AuthorityKind = typeof AUTHORITY_KIND[keyof typeof AUTHORITY_KIND]
export type EmployeeInviteKind = typeof EMPLOYEE_INVITE_KINDS[number]
