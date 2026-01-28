/**
 * @deprecated
 * This store has been migrated to TanStack Query.
 * Use `useCommonCodeHierarchy` from '@/hooks/queries' instead.
 * See: src/hooks/queries/use-common-code-queries.ts
 */

import { create } from 'zustand'
import api from '@/lib/api'

interface CommonCodeNode {
  id: number
  code: string
  name: string
  description?: string | null
  depth: number
  sortOrder?: number
  isActive: boolean
  codeMemo?: string | null
  children?: CommonCodeNode[]
}

interface CommonCodeHierarchyResponse {
  success: boolean
  data: CommonCodeNode
  message?: string | null
  timestamp?: string
}

interface CommonCodeState {
  childrenByCode: Record<string, CommonCodeNode[]>
  loadingByCode: Record<string, boolean>
  errorByCode: Record<string, string | null>
  fetchChildren: (code: string) => Promise<CommonCodeNode[]>
  getChildren: (code: string) => CommonCodeNode[]
}

export const useCommonCodeStore = create<CommonCodeState>((set, get) => ({
  childrenByCode: {},
  loadingByCode: {},
  errorByCode: {},
  fetchChildren: async (code: string) => {
    const state = get()
    if (state.loadingByCode[code]) {
      return state.childrenByCode[code] ?? []
    }
    if (state.childrenByCode[code]) {
      return state.childrenByCode[code]
    }

    set((state) => ({
      loadingByCode: { ...state.loadingByCode, [code]: true },
      errorByCode: { ...state.errorByCode, [code]: null },
    }))

    try {
      const response = await api.get<CommonCodeHierarchyResponse>(`/api/v1/common-codes/hierarchy/${code}`)
      const root = response.data.data

      if (!root.isActive) {
        const message = `${code} 공통코드가 비활성 상태입니다.`
        set((state) => ({
          loadingByCode: { ...state.loadingByCode, [code]: false },
          errorByCode: { ...state.errorByCode, [code]: message },
        }))
        throw new Error(message)
      }

      const children = root.children ?? []
      set((state) => ({
        childrenByCode: { ...state.childrenByCode, [code]: children },
        loadingByCode: { ...state.loadingByCode, [code]: false },
        errorByCode: { ...state.errorByCode, [code]: null },
      }))
      return children
    } catch (error) {
      const message = error instanceof Error ? error.message : `${code} 공통코드를 불러오지 못했습니다.`
      set((state) => ({
        loadingByCode: { ...state.loadingByCode, [code]: false },
        errorByCode: { ...state.errorByCode, [code]: message },
      }))
      throw error
    }
  },
  getChildren: (code: string) => get().childrenByCode[code] ?? [],
}))
