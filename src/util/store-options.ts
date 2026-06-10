import type { StoreOption } from '@/types/store'

/** 점포 소유자 모드(본사 직영 / 가맹 산하) */
export type StoreOwnerType = 'HEAD_OFFICE' | 'FRANCHISE'

/**
 * 라디오(소유자 모드) + 선택된 가맹 id 기준으로 노출할 점포만 추린다.
 *
 * - `HEAD_OFFICE`: 직영 점포만 (`franchiseId === null && headOfficeId != null`)
 * - `FRANCHISE` + 가맹 미선택(`franchiseId == null`): 빈 목록
 * - `FRANCHISE` + 가맹 선택: 해당 가맹 산하 점포만 (`franchiseId === 선택값`)
 *
 * `franchiseId`/`headOfficeId`는 응답에서 상호 배타적이다(정확히 한쪽만 non-null).
 * 직영 점포는 `franchiseId === null && headOfficeId != null`,
 * 가맹 산하 점포는 `franchiseId != null && headOfficeId === null`.
 *
 * ⚠️ fail-closed 정책: 운영 환경에서는 Zod 스키마가 패스스루되므로(개발 모드만 검증),
 * 버전 스큐·필드 누락(키 오타·NamingStrategy 변경)으로 `franchiseId`/`headOfficeId`가
 * `undefined`거나 양쪽 모두 null인 불변식 위반 응답이 들어올 수 있다. 이때 느슨한
 * `franchiseId == null` 판정은 가맹 점포를 직영 목록에 노출(fail-open)시킨다.
 * 따라서 직영은 `franchiseId === null`(엄격) AND `headOfficeId != null`을 모두 만족할 때만
 * 인정하고, 불확실한 항목은 노출하지 않는다(fail-closed).
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
    // fail-closed: 직영임이 명시적으로 확인된 점포만(franchiseId 누락/null-null 응답은 제외).
    return list.filter(
      (store) => store.franchiseId === null && store.headOfficeId != null,
    )
  }
  if (franchiseId == null) return []
  // franchiseId는 선택된 number이므로 엄격 비교가 곧 non-null 확정 → 누락/null 항목은 자동 제외.
  return list.filter((store) => store.franchiseId === franchiseId)
}
