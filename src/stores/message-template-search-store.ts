import { create } from 'zustand'
import type { SendType } from '@/types/notification'

export interface MessageTemplateSearchFilters {
  sendType: SendType
  categoryCode: string
  templateCode: string
  title: string
}

const INITIAL_FILTERS: MessageTemplateSearchFilters = {
  sendType: 'ALIM_TALK',
  categoryCode: '',
  templateCode: '',
  title: '',
}

interface MessageTemplateSearchState {
  filters: MessageTemplateSearchFilters
  appliedFilters: MessageTemplateSearchFilters
  page: number
  pageSize: number
  searchOpen: boolean
  hasSearched: boolean

  setFilters: (updates: Partial<MessageTemplateSearchFilters>) => void
  applyFilters: () => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearchOpen: (open: boolean) => void
  removeFilter: (key: keyof MessageTemplateSearchFilters) => void
  reset: () => void
}

export const useMessageTemplateSearchStore = create<MessageTemplateSearchState>()(
  (set, get) => ({
    filters: { ...INITIAL_FILTERS },
    appliedFilters: { ...INITIAL_FILTERS },
    page: 0,
    pageSize: 50,
    searchOpen: true,
    hasSearched: false,

    setFilters: (updates) =>
      set((state) => ({ filters: { ...state.filters, ...updates } })),

    applyFilters: () => {
      const { filters } = get()
      set({ appliedFilters: { ...filters }, page: 0, hasSearched: true })
    },

    setPage: (page) => set({ page }),

    setPageSize: (size) => set({ pageSize: size, page: 0 }),

    setSearchOpen: (open) => set({ searchOpen: open }),

    removeFilter: (key) => {
      const { appliedFilters } = get()
      const nextFilters: MessageTemplateSearchFilters = {
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
        hasSearched: false,
      }),
  }),
)
