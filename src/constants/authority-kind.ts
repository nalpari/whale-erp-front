/**
 * 권한 종류(authority_kind) 공통코드 상수.
 *
 * BE 공통코드 그룹 PRKND 에서 관리되며, 각 권한이 어떤 분류에 속하는지 식별.
 *
 * 운영 의미 (확정):
 * - PRKND_001 = 본사 BP — PLATFORM owner 가 직접 선택하는 경로만 사용
 *   (본사/가맹점 owner 자동 매핑 경로 및 settings 폼 옵션 풀에서는 제외)
 * - PRKND_002 = 가맹점 BP — 본사·가맹점 owner 자동 매핑 시 모두 PRKND_002 로 통일 저장
 * - PRKND_003 = 본사직원 (whaleerp 접근용)
 * - PRKND_004 = 점포관리자 (whaleerp 접근용)
 */
export const AUTHORITY_KIND = {
  /** PRKND_001 — 본사 BP (PLATFORM owner 직접 선택 전용) */
  HEAD_OFFICE_BP: 'PRKND_001',
  /** PRKND_002 — 가맹점 BP (본사/가맹점 owner 자동 매핑) */
  FRANCHISE_BP: 'PRKND_002',
  /** PRKND_003 — 본사직원 */
  HEAD_OFFICE_EMPLOYEE: 'PRKND_003',
  /** PRKND_004 — 점포관리자 */
  STORE_MANAGER: 'PRKND_004',
} as const

export type AuthorityKind = typeof AUTHORITY_KIND[keyof typeof AUTHORITY_KIND]
