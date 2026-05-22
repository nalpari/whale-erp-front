import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bpAdminKeys, type BpAdminListParams } from './query-keys'
import {
  fetchBpAdmins,
  fetchBpAdminDetail,
  createBpAdmin,
  updateBpAdmin,
  deleteBpAdmin,
  checkBpAdminLoginId,
  resetBpAdminPassword,
  fetchBpAdminAuthorityCandidates,
  fetchBpAdminOrganizationOptions,
} from '@/lib/api/bp-admin'
import type { BpAdminCreateRequest, BpAdminUpdateRequest } from '@/lib/schemas/bp-admin'
import { useAuthStore } from '@/stores/auth-store'

export function useBpAdminList(params: BpAdminListParams, options?: { enabled?: boolean }) {
  // affiliation 헤더가 BE 응답을 결정하므로 queryKey 에도 포함 — PLATFORM 위장 본사 전환 시
  // staleTime 내 이전 본사 캐시 hit 으로 인한 데이터 누출 차단 (Boston M5)
  const affiliationId = useAuthStore((s) => s.affiliationId)
  return useQuery({
    queryKey: [...bpAdminKeys.list(params), { affiliationId }],
    queryFn: ({ signal }) => fetchBpAdmins(params, signal),
    enabled: options?.enabled ?? true,
  })
}

export function useBpAdminDetail(id: number) {
  return useQuery({
    queryKey: bpAdminKeys.detail(id),
    queryFn: ({ signal }) => fetchBpAdminDetail(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useCreateBpAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BpAdminCreateRequest) => createBpAdmin(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bpAdminKeys.lists() })
    },
  })
}

export function useUpdateBpAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BpAdminUpdateRequest }) =>
      updateBpAdmin(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: bpAdminKeys.lists() })
      qc.invalidateQueries({ queryKey: bpAdminKeys.detail(vars.id) })
    },
  })
}

export function useDeleteBpAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteBpAdmin(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: bpAdminKeys.lists() })
      qc.removeQueries({ queryKey: bpAdminKeys.detail(id) })
    },
  })
}

// check-login-id: BE는 true=중복. 청사진 AdminForm 시맨틱과 동일.
export function useCheckBpAdminLoginId() {
  return useMutation({
    mutationFn: (loginId: string) => checkBpAdminLoginId(loginId),
  })
}

// reset-password: 평문 password 반환
export function useResetBpAdminPassword() {
  return useMutation({
    mutationFn: (id: number) => resetBpAdminPassword(id),
  })
}

export function useBpAdminOrganizationOptions() {
  return useQuery({
    queryKey: bpAdminKeys.organizationOptions(),
    queryFn: ({ signal }) => fetchBpAdminOrganizationOptions(signal),
  })
}

export function useBpAdminAuthorityCandidates(
  organizationId: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: bpAdminKeys.authorityOptions(organizationId ?? 0),
    queryFn: ({ signal }) => fetchBpAdminAuthorityCandidates(organizationId, signal),
    enabled:
      options?.enabled ??
      (organizationId != null && Number.isFinite(organizationId) && organizationId > 0),
  })
}
