import { useEffect } from 'react'

import api, { type ApiError, getErrorMessage } from '@/lib/api'
import type { Program, ProgramSearchResult } from '@/lib/schemas/program'
import { useProgramStore } from '@/stores/program-store'

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
 * 프로그램 관리 훅
 * - 프로그램 목록 조회 및 트리 상태 관리
 * - 검색 및 모달 제어
 */
export function useProgram() {
  const programs = useProgramStore((state) => state.programs)
  const loading = useProgramStore((state) => state.loading)
  const error = useProgramStore((state) => state.error)
  const searchKeyword = useProgramStore((state) => state.searchKeyword)
  const searchResults = useProgramStore((state) => state.searchResults)
  const openItems = useProgramStore((state) => state.openItems)
  const isModalOpen = useProgramStore((state) => state.isModalOpen)
  const modalMode = useProgramStore((state) => state.modalMode)
  const modalProgram = useProgramStore((state) => state.modalProgram)
  const { openModal, closeModal } = useProgramStore()

  const fetchPrograms = async (signal?: AbortSignal) => {
    try {
      useProgramStore.setState({ loading: true, error: null })
      const response = await api.get('/api/system/programs', { signal })
      const data = response.data.data as Program[]
      useProgramStore.setState({
        programs: data,
        openItems: new Set(collectIds(data)),
      })
    } catch (err: unknown) {
      if ((err as ApiError).name === 'AbortError' || (err as ApiError).name === 'CanceledError') {
        return
      }
      useProgramStore.setState({
        error: getErrorMessage(err, '프로그램 목록을 불러오는데 실패했습니다.'),
      })
    } finally {
      useProgramStore.setState({ loading: false })
    }
  }

  const handleSearch = (keyword: string) => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      useProgramStore.setState({ searchKeyword: '', searchResults: [] })
      return
    }
    useProgramStore.setState({
      searchKeyword: trimmed,
      searchResults: searchPrograms(programs, trimmed),
    })
  }

  const clearSearch = () => {
    useProgramStore.setState({ searchKeyword: '', searchResults: [] })
  }

  const toggleItem = (itemId: number) => {
    const newSet = new Set(openItems)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    useProgramStore.setState({ openItems: newSet })
  }

  const setOpenItems = (items: Set<number>) => {
    useProgramStore.setState({ openItems: items })
  }

  useEffect(() => {
    const abortController = new AbortController()
    fetchPrograms(abortController.signal)
    return () => {
      abortController.abort()
      clearSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    // 상태
    programs,
    loading,
    error,
    searchKeyword,
    searchResults,
    openItems,
    isModalOpen,
    modalMode,
    modalProgram,
    // 액션
    fetchPrograms,
    handleSearch,
    clearSearch,
    toggleItem,
    setOpenItems,
    openModal,
    closeModal,
  }
}
