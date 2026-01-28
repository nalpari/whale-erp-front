import { create } from 'zustand'

import type { Program, ProgramSearchResult } from '@/lib/schemas/program'

/**
 * 프로그램 UI 상태 관리 (Zustand)
 * - 서버 데이터는 React Query로 관리
 * - UI 상태만 Zustand로 관리 (검색, 트리, 모달)
 */
interface ProgramState {
  // 검색
  searchKeyword: string
  searchResults: ProgramSearchResult[]

  // 트리
  openItems: Set<number>

  // 모달
  isModalOpen: boolean
  modalMode: 'create' | 'edit'
  modalProgram: Program | null

  // Actions
  setSearchKeyword: (keyword: string) => void
  setSearchResults: (results: ProgramSearchResult[]) => void
  clearSearch: () => void
  setOpenItems: (items: Set<number>) => void
  toggleItem: (itemId: number) => void
  openModal: (mode: 'create' | 'edit', program?: Program) => void
  closeModal: () => void
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  // 초기 상태
  searchKeyword: '',
  searchResults: [],
  openItems: new Set(),
  isModalOpen: false,
  modalMode: 'create',
  modalProgram: null,

  // Actions
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setSearchResults: (results) => set({ searchResults: results }),
  clearSearch: () => set({ searchKeyword: '', searchResults: [] }),
  setOpenItems: (items) => set({ openItems: items }),
  toggleItem: (itemId) => {
    const newSet = new Set(get().openItems)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    set({ openItems: newSet })
  },
  openModal: (mode, program) =>
    set({
      isModalOpen: true,
      modalMode: mode,
      modalProgram: program || null,
    }),
  closeModal: () =>
    set({
      isModalOpen: false,
      modalMode: 'create',
      modalProgram: null,
    }),
}))
