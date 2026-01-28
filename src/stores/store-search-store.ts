import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StoreSearchFilters } from '@/components/store/manage/StoreSearch'

/**
 * 점포 관리 > 점포 목록 검색 조건 기본값.
 * - status는 전체(ALL)로 시작
 * - 기간은 null로 초기화하여 미선택 상태를 표현
 */
export const defaultStoreSearchFilters: StoreSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  status: 'ALL',
  from: null,
  to: null,
}

/**
 * 점포 목록 화면 전용 상태 저장소.
 * - filters: 입력 중인 값
 * - appliedFilters: 실제 조회에 적용된 값
 * - page/pageSize: 페이징 상태
 * - hydrated: persist 복원 완료 여부
 */
export type StoreSearchState = {
  filters: StoreSearchFilters
  appliedFilters: StoreSearchFilters
  page: number
  pageSize: number
  hydrated: boolean
  setFilters: (filters: StoreSearchFilters) => void
  setAppliedFilters: (filters: StoreSearchFilters) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setHydrated: (state: boolean) => void
  resetFilters: () => void
}

/**
 * 세션 스토리지 저장 키.
 * - 새로고침 후에도 마지막 조회 조건/페이지를 유지한다.
 */
const STORAGE_KEY = 'store-search-state'

/**
 * 점포 목록 화면 전용 zustand store.
 * - appliedFilters/page/pageSize만 저장하여 상태 저장 범위를 최소화
 * - 복원 시 filters를 appliedFilters로 동기화하여 입력값과 적용값을 일치시킨다.
 */
export const useStoreSearchStore = create<StoreSearchState>()(
  persist(
    (set) => ({
      filters: defaultStoreSearchFilters,
      appliedFilters: defaultStoreSearchFilters,
      page: 0,
      pageSize: 50,
      hydrated: false,
      setFilters: (filters) => set({ filters }),
      setAppliedFilters: (filters) => set({ appliedFilters: filters }),
      setPage: (page) => set({ page }),
      setPageSize: (pageSize) => set({ pageSize }),
      setHydrated: (state) => set({ hydrated: state }),
      resetFilters: () => set({ filters: defaultStoreSearchFilters }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        appliedFilters: state.appliedFilters,
        page: state.page,
        pageSize: state.pageSize,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.setFilters(state.appliedFilters)
        state.setHydrated(true)
      },
    }
  )
)
