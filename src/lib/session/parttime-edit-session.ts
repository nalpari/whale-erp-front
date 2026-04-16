/**
 * 파트타이머 급여 편집 세션 관리 모듈
 *
 * localStorage를 직접 사용하는 대신 이 모듈을 통해 접근함으로써:
 * - employeeInfoId 네임스페이스로 직원 간 데이터 leak 방지
 * - 단일 파일에서 키 관리 (중복 선언 제거)
 * - 화면 이탈 시 일괄 정리 API 제공
 */

import type { EditableBonusItem } from '@/components/employee/payroll/PartTimeWorkTimeEdit'

// ─── Storage 키 상수 ──────────────────────────────────────────────────────────
export const WORKTIME_EDIT_STORAGE_KEY = 'parttime_worktime_edit_data'
export const NEWFORM_STATE_STORAGE_KEY = 'parttime_newform_state'

/** BONUS_PRELOAD 키는 employeeInfoId를 포함해 직원별로 분리 */
const BONUS_PRELOAD_PREFIX = 'parttime_bonus_preload_data'

// ─── 타입 ─────────────────────────────────────────────────────────────────────
export interface BonusPreloadData {
  bonusItems: EditableBonusItem[]
  bonusTaxRate: number
}

// ─── 키 생성 ─────────────────────────────────────────────────────────────────
/** `parttime_bonus_preload_data_{employeeInfoId}` */
export const getBonusPreloadKey = (employeeInfoId: number | string): string =>
  `${BONUS_PRELOAD_PREFIX}_${employeeInfoId}`

// ─── BONUS PRELOAD API ────────────────────────────────────────────────────────

/** 보너스 preload 데이터 저장 (employeeInfoId 네임스페이스 적용) */
export const saveBonusPreload = (
  employeeInfoId: number | string,
  data: BonusPreloadData,
): void => {
  localStorage.setItem(getBonusPreloadKey(employeeInfoId), JSON.stringify(data))
}

/** 보너스 preload 데이터 로드. 없거나 파싱 실패 시 null 반환 */
export const loadBonusPreload = (
  employeeInfoId: number | string,
): BonusPreloadData | null => {
  try {
    const raw = localStorage.getItem(getBonusPreloadKey(employeeInfoId))
    if (!raw) return null
    return JSON.parse(raw) as BonusPreloadData
  } catch {
    return null
  }
}

/** 특정 직원의 보너스 preload 데이터 제거 */
export const clearBonusPreload = (employeeInfoId: number | string): void => {
  localStorage.removeItem(getBonusPreloadKey(employeeInfoId))
}

// ─── 세션 전체 정리 ───────────────────────────────────────────────────────────
/**
 * 파트타이머 편집 세션 전체 정리 (화면 이탈 시 호출)
 *
 * - WORKTIME_EDIT_STORAGE_KEY
 * - NEWFORM_STATE_STORAGE_KEY
 * - 모든 `parttime_bonus_preload_data_*` 네임스페이스 키
 */
export const clearParttimeEditSession = (): void => {
  localStorage.removeItem(WORKTIME_EDIT_STORAGE_KEY)
  localStorage.removeItem(NEWFORM_STATE_STORAGE_KEY)

  // prefix로 시작하는 모든 키 수집 후 일괄 제거
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(BONUS_PRELOAD_PREFIX)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}
