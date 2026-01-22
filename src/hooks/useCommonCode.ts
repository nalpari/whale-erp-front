import { useShallow } from 'zustand/react/shallow'
import { useCommonCodeStore } from '@/stores/common-code-store'

export const useCommonCode = () => {
  const { fetchChildren, getChildren, loadingByCode, errorByCode } = useCommonCodeStore(
    useShallow((state) => ({
      fetchChildren: state.fetchChildren,
      getChildren: state.getChildren,
      loadingByCode: state.loadingByCode,
      errorByCode: state.errorByCode,
    }))
  )

  return {
    getHierarchyChildren: fetchChildren,
    getChildren,
    loadingByCode,
    errorByCode,
  }
}
