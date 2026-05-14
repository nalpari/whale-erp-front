/**
 * 권한 종류(authority_kind) 공통코드 상수.
 *
 * BE 공통코드 그룹 PRKND 에서 관리되며, 각 권한이 어떤 분류에 속하는지 식별.
 *
 * 운영 의미 (확정):
 * - PRKND_001 = 본사 BP (BP 등록용 / 본사 owner)
 * - PRKND_002 = 가맹점 BP (BP 등록용 / 가맹점 owner)
 * - PRKND_003 = 본사직원 (whaleerp 접근용)
 * - PRKND_004 = 점포관리자 (whaleerp 접근용)
 */
export const AUTHORITY_KIND = {
  /** PRKND_001 — 본사 BP */
  HEAD_OFFICE_BP: 'PRKND_001',
  /** PRKND_002 — 가맹점 BP */
  FRANCHISE_BP: 'PRKND_002',
  /** PRKND_003 — 본사직원 */
  HEAD_OFFICE_EMPLOYEE: 'PRKND_003',
  /** PRKND_004 — 점포관리자 */
  STORE_MANAGER: 'PRKND_004',
} as const

export type AuthorityKind = typeof AUTHORITY_KIND[keyof typeof AUTHORITY_KIND]
