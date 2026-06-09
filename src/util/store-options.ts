import type { StoreOption } from '@/types/store'

/** 점포 소유자 모드(본사 직영 / 가맹 산하) */
export type StoreOwnerType = 'HEAD_OFFICE' | 'FRANCHISE'

/**
 * 라디오(소유자 모드) + 선택된 가맹 id 기준으로 노출할 점포만 추린다.
 *
 * - `HEAD_OFFICE`: 직영 점포만 (`franchiseId == null`)
 * - `FRANCHISE` + 가맹 미선택(`franchiseId == null`): 빈 목록
 * - `FRANCHISE` + 가맹 선택: 해당 가맹 산하 점포만 (`franchiseId === 선택값`)
 *
 * `franchiseId`/`headOfficeId`는 응답에서 상호 배타적이다(한쪽은 항상 null).
 * 직영 점포는 `franchiseId == null`, 가맹 산하 점포는 `franchiseId != null`.
 *
 * ⚠️ 이 필터는 UX 가드다. 제출값의 소유자↔점포 정합성은 BE가 재검증해야 한다.
 *
 * @param list `useStoreOptions` 응답 원본 목록
 * @param ownerType 정규화된 소유자 모드
 * @param franchiseId 선택된 가맹 id (없으면 null)
 */
export function filterStoreOptionsByOwner(
  list: StoreOption[],
  ownerType: StoreOwnerType,
  franchiseId: number | null,
): StoreOption[] {
  if (ownerType === 'HEAD_OFFICE') {
    return list.filter((store) => store.franchiseId == null)
  }
  if (franchiseId == null) return []
  return list.filter((store) => store.franchiseId === franchiseId)
}
