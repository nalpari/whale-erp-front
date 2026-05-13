/**
 * 권한 종류(authority_kind) 공통코드 상수.
 *
 * BE 공통코드 그룹 PRKND 에서 관리되며, 각 권한이 어떤 분류에 속하는지 식별.
 * PLATFORM 전용 종류(PRKND_001)는 본사·가맹점 폼의 옵션에서 제외 + schema 가드 대상.
 */
export const AUTHORITY_KIND = {
  /** PRKND_001 — 플랫폼 전용 권한 종류 */
  PLATFORM: 'PRKND_001',
} as const

export type PlatformAuthorityKind = typeof AUTHORITY_KIND.PLATFORM
