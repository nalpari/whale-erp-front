/**
 * 기본 조직 ID 상수
 * TODO: 나중에 로그인한 사용자가 선택한 값으로 대체
 */

// 기본 본사 ID
export const DEFAULT_HEAD_OFFICE_ID = 1

// 기본 가맹점 ID
export const DEFAULT_FRANCHISE_ID = 2

// 기본 점포 ID
export const DEFAULT_STORE_ID = 1

// 기본 조직 ID 객체
export const DEFAULT_ORGANIZATION_IDS = {
  headOfficeId: DEFAULT_HEAD_OFFICE_ID,
  franchiseId: DEFAULT_FRANCHISE_ID,
  storeId: DEFAULT_STORE_ID
} as const

// 기본 조직 ID 파라미터 (API 호출용)
export function getDefaultOrganizationParams() {
  return {
    headOfficeId: DEFAULT_HEAD_OFFICE_ID,
    franchiseId: DEFAULT_FRANCHISE_ID,
    storeId: DEFAULT_STORE_ID
  }
}
