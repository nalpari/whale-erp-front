import { create } from 'zustand'
import type { BpSearchFilters } from '@/types/bp'

const INITIAL_FILTERS: BpSearchFilters = {
  officeId: null,
  franchiseId: null,
  representativeName: '',
  bpoprType: '',
  subscriptionPlanType: '',
  createdAtFrom: null,
  createdAtTo: null,
}

interface BpSearchState {
  // 검색 폼 데이터 (입력 중인 값)
  filters: BpSearchFilters
  // 실행된 검색 필터 (검색 버튼 클릭 시 반영)
  appliedFilters: BpSearchFilters
  // 페이징
  page: number
  pageSize: number
  // 검색 실행 여부
  searchEnabled: boolean

  // Actions
  setFilters: (updates: Partial<BpSearchFilters>) => void
  applyFilters: () => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  removeFilter: (key: string) => void
  reset: () => void
}

export const useBpSearchStore = create<BpSearchState>()((set, get) => ({
  filters: { ...INITIAL_FILTERS },
  appliedFilters: { ...INITIAL_FILTERS },
  page: 0,
  pageSize: 50,
  searchEnabled: true,

  setFilters: (updates) =>
    set((state) => ({ filters: { ...state.filters, ...updates } })),

  applyFilters: () => {
    const { filters } = get()
    set({ appliedFilters: { ...filters }, page: 0, searchEnabled: true })
  },

  setPage: (page) => set({ page }),

  setPageSize: (size) => set({ pageSize: size, page: 0 }),

  removeFilter: (key) => {
    const resetMap: Record<string, Partial<BpSearchFilters>> = {
      office: { officeId: null, franchiseId: null },
      bpoprType: { bpoprType: '' },
      subscriptionPlanType: { subscriptionPlanType: '' },
      representativeName: { representativeName: '' },
      createdAt: { createdAtFrom: null, createdAtTo: null },
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
      searchEnabled: false,
    }),
}))
