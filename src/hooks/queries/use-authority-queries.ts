import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminKeys, authKeys, authorityKeys, type AuthorityListParams } from './query-keys'
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
 * trailing-edge debounce.
 * 마지막 호출 후 ms 동안 추가 호출이 없으면 1회만 실행.
 */
function debounce<F extends (...args: never[]) => void>(fn: F, ms: number): F {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<F>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as F
}

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
      // 본인 권한이 영향받았을 수도 있으므로 my-authority 도 재조회
      queryClient.invalidateQueries({ queryKey: authKeys.myAuthority() })
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
      // 본인 권한이 영향받았을 수도 있으므로 my-authority 도 재조회
      queryClient.invalidateQueries({ queryKey: authKeys.myAuthority() })
    },
  })
}

/**
 * 프로그램별 권한 수정
 */
export function useUpdateProgramAuthority() {
  const queryClient = useQueryClient()

  // 권한 상세 페이지에서 R/C/D/U 체크박스 토글이 다수 프로그램 × 3종으로 연쇄 발생 가능.
  // 매 onSuccess 마다 my-authority invalidate 시 staleTime 30s 가 무시되고 즉시 refetch → 트래픽 폭주.
  // 마지막 변경 후 500ms 동안 추가 호출이 없을 때만 1회 invalidate 하여 폭주 방지.
  const debouncedInvalidateMyAuthority = useMemo(
    () =>
      debounce(() => {
        queryClient.invalidateQueries({ queryKey: authKeys.myAuthority() })
      }, 500),
    [queryClient],
  )

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
      // R/C/D/U 변경이 본인 권한에도 영향을 미칠 수 있으므로 my-authority 재조회 (디바운스)
      debouncedInvalidateMyAuthority()
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
      // 본인 권한이 삭제되었을 수도 있으므로 my-authority 재조회
      queryClient.invalidateQueries({ queryKey: authKeys.myAuthority() })
    },
  })
}
