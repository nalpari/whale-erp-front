import { useCallback } from 'react'
import { useCommonCodeStore } from '@/stores/common-code-store'

export const useCommonCode = () => {
  const fetchChildren = useCommonCodeStore((state) => state.fetchChildren)
  const getChildren = useCommonCodeStore((state) => state.getChildren)
  const loadingByCode = useCommonCodeStore((state) => state.loadingByCode)
  const errorByCode = useCommonCodeStore((state) => state.errorByCode)

  const getHierarchyChildren = useCallback(
    async (code: string) => {
      return fetchChildren(code)
    },
    [fetchChildren]
  )

  return {
    getHierarchyChildren,
    getChildren,
    loadingByCode,
    errorByCode,
  }
}
