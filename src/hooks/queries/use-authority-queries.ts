import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { adminKeys, authKeys, authorityKeys, type AuthorityListParams, type AuthorityOptionsParams } from './query-keys'
import {
  fetchAuthorities,
  fetchAuthorityDetail,
  createAuthority,
  updateAuthority,
  updateProgramAuthority,
  deleteAuthority,
} from '@/lib/api/authority'
import { getAuthoritiesByOrganization } from '@/lib/api/employee'
import type {
  AuthorityCreateRequest,
  AuthorityResponse,
  AuthorityUpdateRequest,
  AuthorityDetailUpdateRequest,
} from '@/lib/schemas/authority'

/**
 * 권한 그룹 키 — 같은 (organization, authority_kind) 그룹 식별용.
 *
 * BE 는 같은 그룹 내에서 is_default=true 가 1개만 유지되도록 자동으로 다른 권한의 is_default 를 false 처리.
 * 따라서 mutation 후 같은 그룹의 detail cache 만 무효화하면 충분 — 다른 그룹은 stale 되지 않음.
 */
interface AuthorityGroupKey {
  owner_code: string
  head_office_id: number | null | undefined
  franchisee_id: number | null | undefined
  authority_kind: string | null | undefined
}

/**
 * 같은 (organization, authority_kind) 그룹의 detail cache 만 제거.
 *
 * PR #97 코드리뷰 #6 — 기존 removeQueries({ queryKey: authorityKeys.details() }) 는 전체 detail 을
 * 무차별 제거하여 다른 그룹 권한 detail 페이지에도 cache miss → 깜빡임/재fetch 폭주 유발.
 * predicate 로 같은 그룹만 좁혀 사이드이펙트 최소화.
 *
 * useAuthorityForm 의 useState lazy 초기값 패턴 때문에 cache hit 시 background refetch 가 form 에
 * 반영 안 되는 근본 원인이 있어 removeQueries 자체는 유지 (invalidateQueries 로는 lazy 초기값 우회 불가).
 */
function removeSameGroupAuthorityDetails(
  queryClient: QueryClient,
  target: AuthorityGroupKey,
): void {
  queryClient.removeQueries({
    predicate: (query) => {
      const key = query.queryKey
      if (
        key.length !== 3 ||
        key[0] !== 'authorities' ||
        key[1] !== 'detail' ||
        typeof key[2] !== 'number'
      ) {
        return false
      }
      const cached = queryClient.getQueryData<AuthorityResponse>(key)
      if (!cached) return false
      return (
        cached.owner_code === target.owner_code &&
        (cached.head_office_id ?? null) === (target.head_office_id ?? null) &&
        (cached.franchisee_id ?? null) === (target.franchisee_id ?? null) &&
        (cached.authority_kind ?? null) === (target.authority_kind ?? null)
      )
    },
  })
}

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
 * 권한 selectbox 옵션 조회.
 *
 * - 본사 단위(PRGRP_002)로만 조회. headOfficeId 없으면 disabled.
 * - authorityKinds: 직원 초대(EMPLOYEE_INVITE_KINDS), BP 수정(undefined=전체).
 * - isUsed: 기본 true. 운영 중인 권한만 노출.
 */
export function useAuthorityOptions(params: AuthorityOptionsParams) {
  const { headOfficeId, authorityKinds, isUsed = true } = params
  return useQuery({
    queryKey: authorityKeys.options({ headOfficeId, authorityKinds, isUsed }),
    queryFn: ({ signal }) =>
      getAuthoritiesByOrganization('PRGRP_002', headOfficeId ?? undefined, undefined, {
        authority_kind: authorityKinds,
        is_used: isUsed,
        signal,
      }),
    enabled: headOfficeId != null,
    staleTime: 5 * 60 * 1000,
  })
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() })
      // PR #97 코드리뷰 #6 — 신규 등록이 같은 (organization, authority_kind) 그룹의 다른 권한 is_default 에만
      // 영향을 미치므로 해당 그룹 detail cache 만 좁혀서 제거. 다른 그룹은 stale 되지 않음.
      removeSameGroupAuthorityDetails(queryClient, {
        owner_code: variables.owner_code,
        head_office_id: variables.head_office_id,
        franchisee_id: variables.franchisee_id,
        authority_kind: variables.authority_kind,
      })
      // 관리자 권한 SelectBox 캐시 무효화
      queryClient.invalidateQueries({ queryKey: adminKeys.authorityOptions() })
      queryClient.invalidateQueries({ queryKey: authorityKeys.optionsAll() })
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
    // owner_code / head_office_id / franchisee_id 는 update payload 에 없으므로 cache 에서 미리 읽어 둠.
    // mutation 후 cache 가 변경/제거되어도 안전하게 그룹 식별이 가능하도록 onMutate 단계에서 snapshot 보관.
    onMutate: ({ id }) => {
      const previousDetail = queryClient.getQueryData<AuthorityResponse>(authorityKeys.detail(id))
      return previousDetail ? { previousDetail } : undefined
    },
    onSuccess: (_, variables, context) => {
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() })
      // PR #97 코드리뷰 #6 — 같은 그룹 detail cache 만 좁혀서 제거.
      if (context?.previousDetail) {
        const prev = context.previousDetail
        removeSameGroupAuthorityDetails(queryClient, {
          owner_code: prev.owner_code,
          head_office_id: prev.head_office_id,
          franchisee_id: prev.franchisee_id,
          authority_kind: prev.authority_kind,
        })
        // authority_kind 가 변경된 경우 새 그룹의 default 도 영향받을 수 있으므로 추가 무효화.
        const newKind = variables.data.authority_kind
        if (newKind && newKind !== prev.authority_kind) {
          removeSameGroupAuthorityDetails(queryClient, {
            owner_code: prev.owner_code,
            head_office_id: prev.head_office_id,
            franchisee_id: prev.franchisee_id,
            authority_kind: newKind,
          })
        }
      } else {
        // snapshot 이 없는 예외 케이스 — 자기 detail 만 안전하게 무효화 (stale lazy 초기값 위험은 감수)
        queryClient.invalidateQueries({ queryKey: authorityKeys.detail(variables.id) })
      }
      // 관리자 권한 SelectBox 캐시 무효화
      queryClient.invalidateQueries({ queryKey: adminKeys.authorityOptions() })
      queryClient.invalidateQueries({ queryKey: authorityKeys.optionsAll() })
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
    // 삭제 후에는 detail cache 가 사라지므로 onMutate 에서 snapshot 보관.
    onMutate: (id) => {
      const previousDetail = queryClient.getQueryData<AuthorityResponse>(authorityKeys.detail(id))
      return previousDetail ? { previousDetail } : undefined
    },
    onSuccess: (_, id, context) => {
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() })
      // PR #97 코드리뷰 #6 — 같은 그룹 detail cache 만 좁혀서 제거.
      if (context?.previousDetail) {
        const prev = context.previousDetail
        removeSameGroupAuthorityDetails(queryClient, {
          owner_code: prev.owner_code,
          head_office_id: prev.head_office_id,
          franchisee_id: prev.franchisee_id,
          authority_kind: prev.authority_kind,
        })
      } else {
        // snapshot 이 없는 예외 케이스 — 삭제된 id 자기 detail 만 제거
        queryClient.removeQueries({ queryKey: authorityKeys.detail(id) })
      }
      // 관리자 권한 SelectBox 캐시 무효화
      queryClient.invalidateQueries({ queryKey: adminKeys.authorityOptions() })
      queryClient.invalidateQueries({ queryKey: authorityKeys.optionsAll() })
      // 본인 권한이 삭제되었을 수도 있으므로 my-authority 재조회
      queryClient.invalidateQueries({ queryKey: authKeys.myAuthority() })
    },
  })
}
