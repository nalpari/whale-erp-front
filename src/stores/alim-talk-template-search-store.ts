import { create } from 'zustand'
import type { SendType } from '@/types/notification'

export interface AlimTalkTemplateSearchFilters {
  sendType: SendType
  categoryCode: string
  templateCode: string
  title: string
}

const INITIAL_FILTERS: AlimTalkTemplateSearchFilters = {
  sendType: 'ALIM_TALK',
  categoryCode: '',
  templateCode: '',
  title: '',
}

interface AlimTalkTemplateSearchState {
  filters: AlimTalkTemplateSearchFilters
  appliedFilters: AlimTalkTemplateSearchFilters
  page: number
  pageSize: number
  searchOpen: boolean

  setFilters: (updates: Partial<AlimTalkTemplateSearchFilters>) => void
  applyFilters: () => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearchOpen: (open: boolean) => void
  removeFilter: (key: keyof AlimTalkTemplateSearchFilters) => void
  reset: () => void
}

export const useAlimTalkTemplateSearchStore = create<AlimTalkTemplateSearchState>()(
  (set, get) => ({
    filters: { ...INITIAL_FILTERS },
    appliedFilters: { ...INITIAL_FILTERS },
    page: 0,
    pageSize: 50,
    searchOpen: true,

    setFilters: (updates) =>
      set((state) => ({ filters: { ...state.filters, ...updates } })),

    applyFilters: () => {
      const { filters } = get()
      set({ appliedFilters: { ...filters }, page: 0 })
    },

    setPage: (page) => set({ page }),

    setPageSize: (size) => set({ pageSize: size, page: 0 }),

    setSearchOpen: (open) => set({ searchOpen: open }),

    removeFilter: (key) => {
      const { appliedFilters } = get()
      const nextFilters: AlimTalkTemplateSearchFilters = {
        ...appliedFilters,
        [key]: key === 'sendType' ? 'ALIM_TALK' : '',
      }
      set({ filters: nextFilters, appliedFilters: nextFilters, page: 0 })
    },

    reset: () =>
      set({
        filters: { ...INITIAL_FILTERS },
        appliedFilters: { ...INITIAL_FILTERS },
        page: 0,
        searchOpen: true,
      }),
  }),
)
