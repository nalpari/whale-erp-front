import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DayType, StoreScheduleQuery } from '@/types/work-schedule'

type StoreScheduleFilters = {
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  employeeName?: string
  dayType?: DayType | ''
  from?: string
  to?: string
}

export const defaultStoreScheduleFilters: StoreScheduleFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  employeeName: '',
  dayType: '',
  from: undefined,
  to: undefined,
}

type StoreScheduleViewState = {
  lastQuery: StoreScheduleQuery | null
  filters: StoreScheduleFilters
  isUploadOpen: boolean
  hydrated: boolean
  setLastQuery: (query: StoreScheduleQuery | null) => void
  setFilters: (filters: StoreScheduleFilters) => void
  setUploadOpen: (open: boolean) => void
  setHydrated: (state: boolean) => void
  resetFilters: () => void
  reset: () => void
}

const STORAGE_KEY = 'store-schedule-search'

export const useStoreScheduleViewStore = create<StoreScheduleViewState>()(
  persist(
    (set) => ({
      lastQuery: null,
      filters: defaultStoreScheduleFilters,
      isUploadOpen: false,
      hydrated: false,
      setLastQuery: (query) => set({ lastQuery: query }),
      setFilters: (filters) => set({ filters }),
      setUploadOpen: (open) => set({ isUploadOpen: open }),
      setHydrated: (state) => set({ hydrated: state }),
      resetFilters: () => set({ filters: defaultStoreScheduleFilters }),
      reset: () => set({ lastQuery: null, filters: defaultStoreScheduleFilters, isUploadOpen: false }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ lastQuery: state.lastQuery }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.setFilters(state.lastQuery ?? defaultStoreScheduleFilters)
        state.setHydrated(true)
      },
    }
  )
)
