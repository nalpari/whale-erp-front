import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StoreSearchFilters } from '@/components/store/manage/StoreSearch'

export const defaultStoreSearchFilters: StoreSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  status: 'ALL',
  from: null,
  to: null,
}

type StoreSearchState = {
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

const STORAGE_KEY = 'store-search-state'

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
