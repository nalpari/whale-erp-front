import api, { getWithSchema, postWithSchema, putWithSchema } from '@/lib/api'
import {
  bpAdminListResponseSchema,
  bpAdminDetailResponseSchema,
  bpAdminIdCheckResponseSchema,
  bpAdminAuthorityCandidateListResponseSchema,
} from '@/lib/schemas/bp-admin'
import type {
  BpAdminCreateRequest,
  BpAdminUpdateRequest,
  BpAdminDetail,
  BpAdminAuthorityCandidate,
} from '@/lib/schemas/bp-admin'
import type { BpAdminSearchParams } from '@/types/bp-admin'

const BASE = '/api/v1/setting/bp-admins'

export async function fetchBpAdmins(params: BpAdminSearchParams, signal?: AbortSignal) {
  const response = await getWithSchema(BASE, bpAdminListResponseSchema, {
    params: {
      admin_id: params.admin_id,
      admin_type: params.admin_type,
      head_office_organization_id: params.head_office_organization_id,
      franchise_organization_id: params.franchise_organization_id,
      authority_id: params.authority_id,
      user_type: params.user_type,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      size: params.size ?? 50,
    },
    signal,
  })
  return response.data
}

export async function fetchBpAdminDetail(id: number, signal?: AbortSignal): Promise<BpAdminDetail> {
  const response = await getWithSchema(`${BASE}/${id}`, bpAdminDetailResponseSchema, { signal })
  return response.data
}

export async function createBpAdmin(data: BpAdminCreateRequest): Promise<BpAdminDetail> {
  const response = await postWithSchema(BASE, data, bpAdminDetailResponseSchema)
  return response.data
}

export async function updateBpAdmin(id: number, data: BpAdminUpdateRequest): Promise<BpAdminDetail> {
  const response = await putWithSchema(`${BASE}/${id}`, data, bpAdminDetailResponseSchema)
  return response.data
}

export async function deleteBpAdmin(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}

export async function checkBpAdminLoginId(loginId: string, signal?: AbortSignal): Promise<boolean> {
  const response = await getWithSchema(`${BASE}/login-id-check`, bpAdminIdCheckResponseSchema, {
    params: { loginId },
    signal,
  })
  return response.data.available
}

export async function resetBpAdminPassword(id: number): Promise<void> {
  await api.post(`${BASE}/${id}/reset-password`)
}

export interface BpAdminAuthorityCandidateParams {
  headOfficeOrganizationId: number
  franchiseOrganizationId?: number | null
}

export async function fetchBpAdminAuthorityCandidates(
  params: BpAdminAuthorityCandidateParams,
  signal?: AbortSignal,
): Promise<BpAdminAuthorityCandidate[]> {
  const response = await getWithSchema(
    `${BASE}/authorities`,
    bpAdminAuthorityCandidateListResponseSchema,
    {
      params: {
        headOfficeId: params.headOfficeOrganizationId,
        franchiseId: params.franchiseOrganizationId ?? undefined,
      },
      signal,
    },
  )
  return response.data
}
