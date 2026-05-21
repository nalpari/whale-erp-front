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
  type BpAdminAuthorityCandidateParams,
} from '@/lib/api/bp-admin'
import type { BpAdminCreateRequest, BpAdminUpdateRequest } from '@/lib/schemas/bp-admin'

export function useBpAdminList(params: BpAdminListParams) {
  return useQuery({
    queryKey: bpAdminKeys.list(params),
    queryFn: ({ signal }) => fetchBpAdmins(params, signal),
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
    mutationFn: ({ id, data }: { id: number; data: BpAdminUpdateRequest }) => updateBpAdmin(id, data),
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

export function useCheckBpAdminLoginId() {
  return useMutation({
    mutationFn: (loginId: string) => checkBpAdminLoginId(loginId),
  })
}

export function useResetBpAdminPassword() {
  return useMutation({
    mutationFn: (id: number) => resetBpAdminPassword(id),
  })
}

export function useBpAdminAuthorityCandidates(params: BpAdminAuthorityCandidateParams | null) {
  return useQuery({
    queryKey: bpAdminKeys.authorityCandidates(
      params?.headOfficeOrganizationId ?? 0,
      params?.franchiseOrganizationId,
    ),
    queryFn: ({ signal }) => fetchBpAdminAuthorityCandidates(params!, signal),
    enabled: params != null && Number.isFinite(params.headOfficeOrganizationId) && params.headOfficeOrganizationId > 0,
  })
}
