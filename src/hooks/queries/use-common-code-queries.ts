import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { commonCodeKeys } from './query-keys'

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

export const useCommonCodeHierarchy = (code: string, enabled = true) => {
  return useQuery({
    queryKey: commonCodeKeys.hierarchy(code),
    queryFn: async () => {
      const response = await api.get<CommonCodeHierarchyResponse>(
        `/api/v1/common-codes/hierarchy/${code}`
      )
      const root = response.data.data

      if (!root.isActive) {
        throw new Error(`${code} 공통코드가 비활성 상태입니다.`)
      }

      return root.children ?? []
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  })
}

export const fetchCommonCodeHierarchy = async (code: string): Promise<CommonCodeNode[]> => {
  const response = await api.get<CommonCodeHierarchyResponse>(
    `/api/v1/common-codes/hierarchy/${code}`
  )
  const root = response.data.data

  if (!root.isActive) {
    throw new Error(`${code} 공통코드가 비활성 상태입니다.`)
  }

  return root.children ?? []
}

export const useCommonCodeCache = () => {
  const queryClient = useQueryClient()

  const getChildren = (code: string): CommonCodeNode[] => {
    return queryClient.getQueryData(commonCodeKeys.hierarchy(code)) ?? []
  }

  const getHierarchyChildren = async (code: string): Promise<CommonCodeNode[]> => {
    const cached = queryClient.getQueryData<CommonCodeNode[]>(commonCodeKeys.hierarchy(code))
    if (cached) return cached

    const data = await fetchCommonCodeHierarchy(code)
    queryClient.setQueryData(commonCodeKeys.hierarchy(code), data)
    return data
  }

  return {
    getChildren,
    getHierarchyChildren,
  }
}

