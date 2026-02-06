import type { Program, ProgramSearchResult, ProgramFormData } from '@/lib/schemas/program'
import { useProgramStore } from '@/stores/program-store'
import {
  useProgramList,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
  useReorderPrograms,
} from '@/hooks/queries'

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
  // Zustand: UI 상태
  const selectedMenuKind = useProgramStore((state) => state.selectedMenuKind)
  const setSelectedMenuKind = useProgramStore((state) => state.setSelectedMenuKind)
  const inputKeyword = useProgramStore((state) => state.inputKeyword)
  const searchKeyword = useProgramStore((state) => state.searchKeyword)
  const searchResults = useProgramStore((state) => state.searchResults)
  const openItems = useProgramStore((state) => state.openItems)
  const isModalOpen = useProgramStore((state) => state.isModalOpen)
  const modalMode = useProgramStore((state) => state.modalMode)
  const modalProgram = useProgramStore((state) => state.modalProgram)
  const { setInputKeyword, setSearchKeyword, setSearchResults, clearSearch, setOpenItems, toggleItem, openModal, closeModal } =
    useProgramStore()

  // React Query: 서버 데이터 (menuKind로 필터링)
  const { data: programs = [], isPending: isLoading, error, refetch } = useProgramList(selectedMenuKind)

  // Mutation 훅들
  const createMutation = useCreateProgram()
  const updateMutation = useUpdateProgram()
  const deleteMutation = useDeleteProgram()
  const reorderMutation = useReorderPrograms()

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
        const parentId = modalProgram?.id || null
        await createMutation.mutateAsync({
          ...data,
          parent_id: parentId,
        })

        // 하위 프로그램 추가인 경우 부모 토글 열기
        if (parentId !== null) {
          const newOpenItems = new Set(openItems)
          newOpenItems.add(parentId)
          setOpenItems(newOpenItems)
        }

        alert('등록되었습니다.')
      } else if (modalMode === 'edit') {
        if (!modalProgram?.id) {
          alert('수정할 대상을 찾을 수 없습니다.')
          closeModal()
          return
        }
        const { menu_kind: _menu_kind, ...updateData } = data
        await updateMutation.mutateAsync({
          id: modalProgram.id,
          data: updateData,
        })
        alert('수정되었습니다.')
      } else {
        // 예상하지 못한 모드
        alert('잘못된 요청입니다.')
        closeModal()
        return
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

  // 프로그램 삭제 핸들러
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 프로그램을 삭제하시겠습니까?`)) return

    try {
      await deleteMutation.mutateAsync(id)
      alert('삭제되었습니다.')
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message = axiosError.response?.data?.message ?? '삭제에 실패하였습니다.'
      alert(message)
    }
  }

  // 프로그램의 부모 이름 찾기 (모달에서 표시용)
  const findProgramParents = (targetId: number | null): { level1Name?: string; level2Name?: string } => {
    if (targetId === null) return {}

    const findInTree = (items: Program[], parents: Program[] = []): { level1Name?: string; level2Name?: string } => {
      for (const program of items) {
        if (program.id === targetId) {
          if (parents.length === 0) return {}
          if (parents.length === 1) return { level1Name: parents[0].name }
          return { level1Name: parents[0].name, level2Name: parents[1].name }
        }

        if (program.children?.length) {
          parents.push(program)
          const result = findInTree(program.children, parents)
          if (Object.keys(result).length > 0) return result
          parents.pop()
        }
      }
      return {}
    }

    return findInTree(programs)
  }

  // 프로그램 순서 변경 핸들러
  const handleReorder = async (parentId: number | null, items: Program[]) => {
    // 검증 1: null ID 필터링 및 타입 좁히기
    const validItems = items.filter((item): item is Program & { id: number } => item.id !== null)

    if (validItems.length !== items.length) {
      alert('일시적인 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.')
      return
    }

    // 검증 2: ID 중복 체크
    const ids = validItems.map((item) => item.id)
    if (new Set(ids).size !== ids.length) {
      alert('일시적인 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.')
      return
    }

    try {
      await reorderMutation.mutateAsync({
        parent_id: parentId,
        orders: validItems.map((item, index) => ({
          id: item.id,
          order_index: index + 1,
        })),
      })
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message = axiosError.response?.data?.message ?? '순서 변경에 실패하였습니다.'
      alert(message)
    }
  }

  return {
    // 서버 상태 (React Query)
    programs,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,

    // UI 상태 (Zustand)
    selectedMenuKind,
    setSelectedMenuKind,
    inputKeyword,
    searchKeyword,
    searchResults,
    openItems,
    isModalOpen,
    modalMode,
    modalProgram,

    // 액션
    setInputKeyword,
    handleSearch,
    clearSearch,
    toggleItem,
    setOpenItems,
    expandAll,
    openModal,
    closeModal,
    handleSubmit,
    handleDelete,
    handleReorder,

    // 유틸리티
    findProgramParents,
  }
}
