import { create } from 'zustand'

export interface MenuSearchFormData {
  headOfficeOrganizationId?: number | null
  menuName?: string
  operationStatus?: string
  menuType?: string
  menuClassificationCode?: string
  categoryId?: string
  franchiseAvailableId?: string
  registeredDateFrom?: string
  registeredDateTo?: string
}

const INITIAL_FORM_DATA = {
  headOfficeOrganizationId: null as number | null,
  menuName: '',
  operationStatus: '',
  menuType: '',
  menuClassificationCode: '',
  categoryId: '',
  franchiseAvailableId: '',
  registeredDateFrom: '',
  registeredDateTo: '',
}

interface MenuSearchState {
  // 검색 폼 데이터 (입력 중인 값)
  formData: typeof INITIAL_FORM_DATA
  // 실행된 검색 필터 (검색 버튼 클릭 시 반영)
  filters: MenuSearchFormData
  // 페이징
  page: number
  pageSize: number
  // 검색 패널 열림 여부
  searchOpen: boolean

  // Actions
  setFormData: (updates: Partial<typeof INITIAL_FORM_DATA>) => void
  setFilters: (filters: MenuSearchFormData) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearchOpen: (open: boolean) => void
  reset: () => void
}

export const useMenuSearchStore = create<MenuSearchState>()((set) => ({
  formData: { ...INITIAL_FORM_DATA },
  filters: {},
  page: 0,
  pageSize: 20,
  searchOpen: true,

  setFormData: (updates) =>
    set((state) => ({ formData: { ...state.formData, ...updates } })),
  setFilters: (filters) => set({ filters }),
  setPage: (page) => set({ page }),
  setPageSize: (size) => set({ pageSize: size }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  reset: () =>
    set({
      formData: { ...INITIAL_FORM_DATA },
      filters: {},
      page: 0,
    }),
}))
