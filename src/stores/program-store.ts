import { create } from 'zustand'

import type { Program, ProgramSearchResult } from '@/lib/schemas/program'

interface ProgramState {
  // 프로그램 목록
  programs: Program[]
  loading: boolean
  error: string | null

  // 검색
  searchKeyword: string
  searchResults: ProgramSearchResult[]

  // 트리
  openItems: Set<number>

  // 모달
  isModalOpen: boolean
  modalMode: 'create' | 'edit'
  modalProgram: Program | null

  // Actions - 복잡한 로직이 필요한 것만
  openModal: (mode: 'create' | 'edit', program?: Program) => void
  closeModal: () => void
}

export const useProgramStore = create<ProgramState>((set) => ({
  // 초기 상태
  programs: [],
  loading: false,
  error: null,
  searchKeyword: '',
  searchResults: [],
  openItems: new Set(),
  isModalOpen: false,
  modalMode: 'create',
  modalProgram: null,

  // Actions
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
