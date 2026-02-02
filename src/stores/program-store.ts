import { create } from 'zustand'

import type { Program, ProgramSearchResult } from '@/lib/schemas/program'

/**
 * 프로그램 UI 상태 관리 (Zustand)
 * - 서버 데이터는 React Query로 관리
 * - UI 상태만 Zustand로 관리 (검색, 트리, 모달, menu_kind 선택)
 */
interface ProgramState {
  // 검색
  inputKeyword: string // 입력창 값 (실시간 입력, 초기화 버튼으로만 초기화)
  searchKeyword: string // 실행된 검색어 (검색 버튼 클릭 시 반영)
  searchResults: ProgramSearchResult[]

  // 트리
  openItems: Set<number>

  // 모달
  isModalOpen: boolean
  modalMode: 'create' | 'edit'
  modalProgram: Program | null

  // 메뉴 구분
  selectedMenuKind: string

  // Actions
  setInputKeyword: (keyword: string) => void
  setSearchKeyword: (keyword: string) => void
  setSearchResults: (results: ProgramSearchResult[]) => void
  clearSearch: () => void
  setOpenItems: (items: Set<number>) => void
  toggleItem: (itemId: number) => void
  openModal: (mode: 'create' | 'edit', program?: Program) => void
  closeModal: () => void
  setSelectedMenuKind: (menuKind: string) => void
}

export const useProgramStore = create<ProgramState>()((set, get) => ({
  // 초기 상태
  inputKeyword: '',
  searchKeyword: '',
  searchResults: [],
  openItems: new Set(),
  isModalOpen: false,
  modalMode: 'create',
  modalProgram: null,
  selectedMenuKind: 'MNKND_001', // 기본값: ERP Platform

  // Actions
  setInputKeyword: (keyword) => set({ inputKeyword: keyword }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setSearchResults: (results) => set({ searchResults: results }),
  clearSearch: () => set({ inputKeyword: '', searchKeyword: '', searchResults: [] }),
  setOpenItems: (items) => set({ openItems: new Set(items) }),
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
  setSelectedMenuKind: (menuKind) => {
    set({ selectedMenuKind: menuKind })
    get().clearSearch()
  },
}))
