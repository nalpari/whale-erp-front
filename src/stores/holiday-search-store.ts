import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { HolidaySearchFilters } from '@/components/system/holiday/HolidaySearch'

const currentYear = new Date().getFullYear()

export const defaultHolidaySearchFilters: HolidaySearchFilters = {
  year: currentYear as number | null,
  officeId: null,
  franchiseId: null,
  storeId: null,
}

export type HolidaySearchState = {
  filters: HolidaySearchFilters
  appliedFilters: HolidaySearchFilters
  page: number
  pageSize: number
  hydrated: boolean
  setFilters: (filters: HolidaySearchFilters) => void
  setAppliedFilters: (filters: HolidaySearchFilters) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setHydrated: (state: boolean) => void
  resetFilters: () => void
}

const STORAGE_KEY = 'holiday-search-state'

export const useHolidaySearchStore = create<HolidaySearchState>()(
  persist(
    (set) => ({
      filters: defaultHolidaySearchFilters,
      appliedFilters: defaultHolidaySearchFilters,
      page: 0,
      pageSize: 50,
      hydrated: false,
      setFilters: (filters) => set({ filters }),
      setAppliedFilters: (filters) => set({ appliedFilters: filters }),
      setPage: (page) => set({ page }),
      setPageSize: (pageSize) => set({ pageSize }),
      setHydrated: (state) => set({ hydrated: state }),
      resetFilters: () => set({ filters: defaultHolidaySearchFilters }),
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
        state.setFilters({ ...state.appliedFilters })
        state.setHydrated(true)
      },
    }
  )
)
