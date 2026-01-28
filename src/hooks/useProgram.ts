import type { Program, ProgramSearchResult, ProgramFormData } from '@/lib/schemas/program'
import { useProgramStore } from '@/stores/program-store'
import { useProgramList, useCreateProgram, useUpdateProgram } from '@/hooks/queries'

/**
 * 재귀로 모든 프로그램 ID 수집 (트리 전체 열기용)
 */
const collectIds = (items: Program[]): number[] => {
  const ids: number[] = []
  for (const item of items) {
    if (item.id !== null) ids.push(item.id)
    if (item.children?.length) ids.push(...collectIds(item.children))
  }
  return ids
}

/**
 * 프로그램 트리 재귀 검색
 */
const searchPrograms = (items: Program[], keyword: string, parentPath: string[] = []): ProgramSearchResult[] => {
  const results: ProgramSearchResult[] = []
  const lowerKeyword = keyword.toLowerCase()

  for (const item of items) {
    const currentPath = [...parentPath, item.name]
    if (item.name.toLowerCase().includes(lowerKeyword) && item.id !== null) {
      results.push({ path: currentPath, programId: item.id })
    }
    if (item.children?.length) {
      results.push(...searchPrograms(item.children, keyword, currentPath))
    }
  }
  return results
}

/**
 * 프로그램 관리 훅 (래퍼 훅)
 * - React Query로 서버 상태 관리 (use-program-queries)
 * - Zustand로 UI 상태 관리 (program-store)
 * - 기존 컴포넌트와의 호환성을 위한 래퍼 레이어
 */
export function useProgram() {
  // React Query: 서버 데이터
  const {
    data: programs = [],
    isPending: isLoading,
    error,
    refetch,
  } = useProgramList()

  // Zustand: UI 상태
  const searchKeyword = useProgramStore((state) => state.searchKeyword)
  const searchResults = useProgramStore((state) => state.searchResults)
  const openItems = useProgramStore((state) => state.openItems)
  const isModalOpen = useProgramStore((state) => state.isModalOpen)
  const modalMode = useProgramStore((state) => state.modalMode)
  const modalProgram = useProgramStore((state) => state.modalProgram)
  const {
    setSearchKeyword,
    setSearchResults,
    clearSearch,
    setOpenItems,
    toggleItem,
    openModal,
    closeModal,
  } = useProgramStore()

  // Mutation 훅들
  const createMutation = useCreateProgram()
  const updateMutation = useUpdateProgram()

  // 검색 핸들러
  const handleSearch = (keyword: string) => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      clearSearch()
      return
    }
    setSearchKeyword(trimmed)
    setSearchResults(searchPrograms(programs, trimmed))
  }

  // 트리 전체 열기 (초기 로드시)
  const expandAll = () => {
    if (programs.length > 0) {
      setOpenItems(new Set(collectIds(programs)))
    }
  }

  // 프로그램 제출 핸들러
  const handleSubmit = async (data: ProgramFormData) => {
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync({
          ...data,
          parent_id: modalProgram?.id || null,
        })
        alert('등록되었습니다.')
      } else if (modalProgram?.id) {
        await updateMutation.mutateAsync({
          id: modalProgram.id,
          data,
        })
        alert('수정되었습니다.')
      }
      closeModal()
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message =
        axiosError.response?.data?.message ??
        (modalMode === 'create' ? '등록에 실패하였습니다.' : '수정에 실패하였습니다.')
      alert(message)
      throw error // 모달 유지를 위해 에러 재throw
    }
  }

  return {
    // 서버 상태 (React Query)
    programs,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,

    // UI 상태 (Zustand)
    searchKeyword,
    searchResults,
    openItems,
    isModalOpen,
    modalMode,
    modalProgram,

    // 액션
    handleSearch,
    clearSearch,
    toggleItem,
    setOpenItems,
    expandAll,
    openModal,
    closeModal,
    handleSubmit,
  }
}
