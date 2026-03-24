import { create } from 'zustand'

export interface PlansSearchFilters {
  planType: string
  updater: string
}

const INITIAL_FILTERS: PlansSearchFilters = {
  planType: '',
  updater: '',
}

interface PlansSearchState {
  filters: PlansSearchFilters
  appliedFilters: PlansSearchFilters
  page: number
  pageSize: number
  searchEnabled: boolean
  searchOpen: boolean

  setFilters: (updates: Partial<PlansSearchFilters>) => void
  applyFilters: () => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearchOpen: (open: boolean) => void
  removeFilter: (key: string) => void
  reset: () => void
}

export const usePlansSearchStore = create<PlansSearchState>()((set, get) => ({
  filters: { ...INITIAL_FILTERS },
  appliedFilters: { ...INITIAL_FILTERS },
  page: 0,
  pageSize: 50,
  searchEnabled: true,
  searchOpen: false,

  setFilters: (updates) =>
    set((state) => ({ filters: { ...state.filters, ...updates } })),

  applyFilters: () => {
    const { filters } = get()
    set({ appliedFilters: { ...filters }, page: 0, searchEnabled: true })
  },

  setPage: (page) => set({ page }),

  setPageSize: (size) => set({ pageSize: size, page: 0 }),

  setSearchOpen: (open) => set({ searchOpen: open }),

  removeFilter: (key) => {
    const resetMap: Record<string, Partial<PlansSearchFilters>> = {
      planType: { planType: '' },
      updater: { updater: '' },
    }
    const resetValue = resetMap[key]
    if (resetValue) {
      const { appliedFilters } = get()
      const nextFilters = { ...appliedFilters, ...resetValue }
      set({ filters: nextFilters, appliedFilters: nextFilters, page: 0 })
    }
  },

  reset: () =>
    set({
      filters: { ...INITIAL_FILTERS },
      appliedFilters: { ...INITIAL_FILTERS },
      page: 0,
      searchEnabled: true,
      searchOpen: true,
    }),
}))
