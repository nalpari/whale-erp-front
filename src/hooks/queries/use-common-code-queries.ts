import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { commonCodeKeys } from './query-keys'

/**
 * 공통코드 노드 타입.
 * - 계층 구조(children)를 포함한다.
 */
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

/**
 * 공통코드 계층 조회 응답 타입.
 */
interface CommonCodeHierarchyResponse {
  success: boolean
  data: CommonCodeNode
  message?: string | null
  timestamp?: string
}

/**
 * 공통코드 계층 조회 훅.
 * - code에 해당하는 루트 노드를 가져온 뒤, children만 반환한다.
 */
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

/**
 * 공통코드 계층을 직접 조회하는 함수.
 * - 훅 바깥에서 재사용할 수 있도록 별도 제공한다.
 */
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

/**
 * 공통코드 캐시 접근 유틸 훅.
 * - 캐시에 있으면 즉시 반환하고, 없으면 API 호출 후 캐시에 저장한다.
 */
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
