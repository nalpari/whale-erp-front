import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authorityKeys, type AuthorityListParams } from './query-keys'
import {
  fetchAuthorities,
  fetchAuthorityDetail,
  createAuthority,
  updateAuthority,
  updateProgramAuthority,
  deleteAuthority,
} from '@/lib/api/authority'
import type {
  AuthorityCreateRequest,
  AuthorityUpdateRequest,
  AuthorityDetailUpdateRequest,
} from '@/lib/schemas/authority'

/**
 * 권한 목록 조회
 */
export function useAuthorityList(params: AuthorityListParams) {
  return useQuery({
    queryKey: authorityKeys.list(params),
    queryFn: ({ signal }) => fetchAuthorities(params, signal),
  })
}

/**
 * 권한 상세 조회
 */
export function useAuthorityDetail(id: number) {
  return useQuery({
    queryKey: authorityKeys.detail(id),
    queryFn: ({ signal }) => fetchAuthorityDetail(id, signal),
    enabled: !!id,
  })
}

/**
 * 권한 등록
 */
export function useCreateAuthority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AuthorityCreateRequest) => createAuthority(data),
    onSuccess: () => {
      // 목록 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() })
    },
  })
}

/**
 * 권한 마스터 정보 수정
 */
export function useUpdateAuthority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AuthorityUpdateRequest }) =>
      updateAuthority(id, data),
    onSuccess: (_, variables) => {
      // 목록 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() })
      // 상세 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: authorityKeys.detail(variables.id) })
    },
  })
}

/**
 * 프로그램별 권한 수정
 */
export function useUpdateProgramAuthority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      programId,
      data,
    }: {
      id: number
      programId: number
      data: AuthorityDetailUpdateRequest
    }) => updateProgramAuthority(id, programId, data),
    onSuccess: (_, variables) => {
      // 상세 쿼리 캐시 무효화 (트리 구조가 변경되므로)
      queryClient.invalidateQueries({ queryKey: authorityKeys.detail(variables.id) })
    },
  })
}

/**
 * 권한 삭제
 */
export function useDeleteAuthority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteAuthority(id),
    onSuccess: () => {
      // 목록 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() })
      // 모든 상세 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: authorityKeys.details() })
    },
  })
}
