import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { commonCodeKeys, payrollKeys } from './query-keys'
import { getBonusTypes, type BonusTypeInfo } from '@/lib/api/commonCode'
import { reorderCommonCodes, type CommonCodeReorderRequest } from '@/lib/api/commonCode'
import { createCommonCode, updateCommonCode, deleteCommonCode, type CommonCodeCreateRequest } from '@/lib/api/commonCode'

/**
 * 공통코드 노드 타입.
 * - 계층 구조(children)를 포함한다.
 */
export interface CommonCodeNode {
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

/**
 * 공통코드 트리 조회 응답 타입.
 */
interface CommonCodeTreeResponse {
  success: boolean
  data: CommonCodeNode[]
  message?: string | null
  timestamp?: string
}

/**
 * 공통코드 트리 조회 훅.
 * - codeGroup과 maxDepth를 파라미터로 트리 구조를 가져온다.
 */
export const useCommonCodeTree = (
  codeGroup: string,
  maxDepth = 3,
  headOffice?: string,
  franchise?: string,
  isActive?: boolean,
  headerCode?: string,
  headerId?: string,
  headerName?: string,
  headerDescription?: string
) => {
  return useQuery({
    queryKey: commonCodeKeys.tree(codeGroup, maxDepth, headOffice, franchise, isActive, headerCode, headerId, headerName, headerDescription),
    queryFn: async () => {
      const response = await api.get<CommonCodeTreeResponse>(
        '/api/v1/common-codes/tree',
        { params: { codeGroup, maxDepth, headOffice, franchise, isActive, headerCode, headerId, headerName, headerDescription } }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 상여금 종류 조회 훅.
 * - 급여명세서 공통코드에서 bonusInfo를 조회한다.
 */
export const useBonusTypes = (
  params?: { headOfficeId?: number; franchiseId?: number },
  enabled = true
) => {
  return useQuery<BonusTypeInfo[]>({
    queryKey: payrollKeys.bonusTypes(params),
    queryFn: () => getBonusTypes(params?.headOfficeId, params?.franchiseId),
    enabled,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 공통코드 생성 훅.
 */
export const useCreateCommonCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CommonCodeCreateRequest) => createCommonCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commonCodeKeys.all })
    },
  })
}

/**
 * 공통코드 수정 훅.
 */
export const useUpdateCommonCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CommonCodeCreateRequest }) => updateCommonCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commonCodeKeys.all })
    },
  })
}

/**
 * 공통코드 삭제 훅.
 */
export const useDeleteCommonCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteCommonCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commonCodeKeys.all })
    },
  })
}

/**
 * 트리 내에서 특정 부모의 자식들 순서를 변경하는 헬퍼.
 * - parentId가 null이면 루트 레벨의 순서를 변경한다.
 */
function reorderTreeNodes(
  tree: CommonCodeNode[],
  parentId: number | null,
  orders: Array<{ id: number; sortOrder: number }>,
): CommonCodeNode[] {
  if (parentId === null) {
    const orderMap = new Map(orders.map((o) => [o.id, o.sortOrder]))
    return [...tree].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
  }

  return tree.map((node) => {
    if (node.id === parentId && node.children) {
      const orderMap = new Map(orders.map((o) => [o.id, o.sortOrder]))
      return {
        ...node,
        children: [...node.children].sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        ),
      }
    }
    if (node.children?.length) {
      return { ...node, children: reorderTreeNodes(node.children, parentId, orders) }
    }
    return node
  })
}

/**
 * 공통코드 순서 변경 훅.
 * - 낙관적 업데이트로 즉시 UI를 반영하고, 실패 시 롤백한다.
 */
export const useReorderCommonCodes = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CommonCodeReorderRequest) => reorderCommonCodes(data),
    onMutate: async (data) => {
      // 진행 중인 refetch를 취소하여 낙관적 업데이트를 덮어쓰지 않도록 한다
      await queryClient.cancelQueries({ queryKey: commonCodeKeys.all })

      // 현재 tree 쿼리 캐시들의 스냅샷을 저장한다
      const previousTreeQueries = queryClient.getQueriesData<CommonCodeNode[]>({
        queryKey: [...commonCodeKeys.all, 'tree'],
      })

      // 모든 tree 쿼리 캐시에 낙관적 업데이트를 적용한다
      queryClient.setQueriesData<CommonCodeNode[]>(
        { queryKey: [...commonCodeKeys.all, 'tree'] },
        (old) => {
          if (!old) return old
          return reorderTreeNodes(old, data.parentId, data.orders)
        },
      )

      return { previousTreeQueries }
    },
    onError: (_error, _data, context) => {
      // 실패 시 이전 캐시로 롤백한다
      if (context?.previousTreeQueries) {
        for (const [queryKey, data] of context.previousTreeQueries) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },
    onSettled: () => {
      // 성공/실패와 무관하게 서버 상태와 동기화한다
      queryClient.invalidateQueries({ queryKey: commonCodeKeys.all })
    },
  })
}
