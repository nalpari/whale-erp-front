import { describe, expect, it } from 'vitest'
import type { StoreOption } from '@/types/store'
import { filterStoreOptionsByOwner } from './store-options'

/**
 * 타입을 만족하는 정상 점포 옵션을 만든다.
 * 필드 누락(undefined)·양쪽 null 같은 "BE 불변식 위반" 응답은 의도적으로
 * 타입을 우회해야 하므로 makeRawStore를 따로 둔다.
 */
function makeStore(partial: Partial<StoreOption> & { id: number }): StoreOption {
  return {
    storeName: `store-${partial.id}`,
    franchiseId: null,
    headOfficeId: null,
    ...partial,
  }
}

/**
 * 운영 환경에서 Zod 검증이 패스스루될 때 들어올 수 있는, 타입 불변식을 어긴
 * 원본 응답(필드 누락 등)을 재현한다. fail-closed 동작 검증 전용.
 */
function makeRawStore(raw: { id: number; storeName?: string; franchiseId?: number | null; headOfficeId?: number | null }): StoreOption {
  return raw as StoreOption
}

// 직영 점포: franchiseId === null, headOfficeId 값 보유
const headOfficeStore = makeStore({ id: 1, franchiseId: null, headOfficeId: 100 })
// 가맹 산하 점포: franchiseId 값, headOfficeId === null
const franchiseStoreA = makeStore({ id: 2, franchiseId: 10, headOfficeId: null })
const franchiseStoreB = makeStore({ id: 3, franchiseId: 20, headOfficeId: null })

describe('filterStoreOptionsByOwner', () => {
  describe('HEAD_OFFICE 모드', () => {
    it('직영 점포(franchiseId null + headOfficeId 값)만 통과시킨다', () => {
      const list = [headOfficeStore, franchiseStoreA, franchiseStoreB]
      const result = filterStoreOptionsByOwner(list, 'HEAD_OFFICE', null)
      expect(result).toEqual([headOfficeStore])
    })

    it('가맹 산하 점포는 모두 제외한다', () => {
      const list = [franchiseStoreA, franchiseStoreB]
      const result = filterStoreOptionsByOwner(list, 'HEAD_OFFICE', null)
      expect(result).toEqual([])
    })

    it('franchiseId가 선택되어 있어도 HEAD_OFFICE 판정에는 영향이 없다', () => {
      const list = [headOfficeStore, franchiseStoreA]
      const result = filterStoreOptionsByOwner(list, 'HEAD_OFFICE', 10)
      expect(result).toEqual([headOfficeStore])
    })

    // --- fail-closed 회귀 방지: 불변식 위반 응답을 직영으로 오판하면 안 된다 ---

    it('[fail-closed] franchiseId 필드 누락(undefined)은 직영으로 보지 않고 제외한다', () => {
      const broken = makeRawStore({ id: 4, storeName: 'broken', headOfficeId: 100 }) // franchiseId 키 없음
      const result = filterStoreOptionsByOwner([broken], 'HEAD_OFFICE', null)
      expect(result).toEqual([])
    })

    it('[fail-closed] headOfficeId 필드 누락(undefined)은 직영으로 보지 않고 제외한다', () => {
      const broken = makeRawStore({ id: 5, storeName: 'broken', franchiseId: null }) // headOfficeId 키 없음
      const result = filterStoreOptionsByOwner([broken], 'HEAD_OFFICE', null)
      expect(result).toEqual([])
    })

    it('[fail-closed] 양쪽 모두 null인 응답은 제외한다', () => {
      const broken = makeRawStore({ id: 6, storeName: 'broken', franchiseId: null, headOfficeId: null })
      const result = filterStoreOptionsByOwner([broken], 'HEAD_OFFICE', null)
      expect(result).toEqual([])
    })

    it('[fail-closed] 양쪽 모두 값인 응답(불변식 위반)은 가맹으로 간주해 제외한다', () => {
      const broken = makeRawStore({ id: 7, storeName: 'broken', franchiseId: 10, headOfficeId: 100 })
      const result = filterStoreOptionsByOwner([broken], 'HEAD_OFFICE', null)
      expect(result).toEqual([])
    })

    it('정상 직영과 손상된 항목이 섞여 있으면 정상 직영만 남긴다', () => {
      const broken = makeRawStore({ id: 8, storeName: 'broken', headOfficeId: 100 })
      const list = [headOfficeStore, broken, franchiseStoreA]
      const result = filterStoreOptionsByOwner(list, 'HEAD_OFFICE', null)
      expect(result).toEqual([headOfficeStore])
    })
  })

  describe('FRANCHISE 모드', () => {
    it('가맹 미선택(franchiseId null)이면 빈 목록을 반환한다', () => {
      const list = [headOfficeStore, franchiseStoreA, franchiseStoreB]
      const result = filterStoreOptionsByOwner(list, 'FRANCHISE', null)
      expect(result).toEqual([])
    })

    it('선택된 가맹 산하 점포만 통과시킨다', () => {
      const list = [headOfficeStore, franchiseStoreA, franchiseStoreB]
      const result = filterStoreOptionsByOwner(list, 'FRANCHISE', 10)
      expect(result).toEqual([franchiseStoreA])
    })

    it('직영 점포는 FRANCHISE 모드에서 제외한다', () => {
      const list = [headOfficeStore, franchiseStoreA]
      const result = filterStoreOptionsByOwner(list, 'FRANCHISE', 10)
      expect(result).toEqual([franchiseStoreA])
    })

    it('[fail-closed] franchiseId 필드 누락(undefined)은 선택값과 매칭되지 않아 제외한다', () => {
      const broken = makeRawStore({ id: 9, storeName: 'broken', headOfficeId: 100 }) // franchiseId 없음
      const result = filterStoreOptionsByOwner([broken], 'FRANCHISE', 10)
      expect(result).toEqual([])
    })

    it('선택값과 다른 가맹의 점포는 제외한다', () => {
      const list = [franchiseStoreA, franchiseStoreB]
      const result = filterStoreOptionsByOwner(list, 'FRANCHISE', 20)
      expect(result).toEqual([franchiseStoreB])
    })
  })

  describe('공통', () => {
    it('빈 목록은 어떤 모드에서도 빈 배열을 반환한다', () => {
      expect(filterStoreOptionsByOwner([], 'HEAD_OFFICE', null)).toEqual([])
      expect(filterStoreOptionsByOwner([], 'FRANCHISE', 10)).toEqual([])
    })
  })
})
