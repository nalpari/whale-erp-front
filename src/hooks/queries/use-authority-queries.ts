import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminKeys, authorityKeys, type AuthorityListParams } from './query-keys'
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
    enabled: !!params.owner_group,
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
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() })
      // 관리자 권한 SelectBox 캐시 무효화
      queryClient.invalidateQueries({ queryKey: adminKeys.authorityOptions() })
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
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() })
      queryClient.invalidateQueries({ queryKey: authorityKeys.detail(variables.id) })
      // 관리자 권한 SelectBox 캐시 무효화
      queryClient.invalidateQueries({ queryKey: adminKeys.authorityOptions() })
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
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() })
      queryClient.invalidateQueries({ queryKey: authorityKeys.details() })
      // 관리자 권한 SelectBox 캐시 무효화
      queryClient.invalidateQueries({ queryKey: adminKeys.authorityOptions() })
    },
  })
}
