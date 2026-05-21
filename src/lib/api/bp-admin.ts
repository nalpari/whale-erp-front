import api, {
  getWithSchema,
  postWithSchema,
  putWithSchema,
  patchWithSchema,
} from '@/lib/api'
import {
  bpAdminListResponseSchema,
  bpAdminDetailResponseSchema,
  bpAdminIdCheckResponseSchema,
  bpAdminResetPasswordResponseSchema,
  bpAdminAuthorityCandidateListResponseSchema,
  bpAdminOrganizationOptionListResponseSchema,
} from '@/lib/schemas/bp-admin'
import type {
  BpAdminCreateRequest,
  BpAdminUpdateRequest,
  BpAdminDetail,
  BpAdminAuthorityCandidate,
  BpAdminOrganizationOption,
} from '@/lib/schemas/bp-admin'
import type { BpAdminSearchParams } from '@/types/bp-admin'

const BASE = '/api/v1/system/bp-admins'

export async function fetchBpAdmins(params: BpAdminSearchParams, signal?: AbortSignal) {
  const response = await getWithSchema(BASE, bpAdminListResponseSchema, {
    params: {
      name: params.name,
      login_id: params.login_id,
      user_type: params.user_type,
      organization_type: params.organization_type,
      organization_id: params.organization_id,
      authority_id: params.authority_id,
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

// check-login-id: BE 응답은 boolean. true=중복, false=사용가능.
export async function checkBpAdminLoginId(loginId: string, signal?: AbortSignal): Promise<boolean> {
  const response = await getWithSchema(`${BASE}/check-login-id`, bpAdminIdCheckResponseSchema, {
    params: { login_id: loginId },
    signal,
  })
  return response.data // true=중복
}

// 비밀번호 초기화: PATCH, 평문 password 반환
export async function resetBpAdminPassword(id: number): Promise<string> {
  const response = await patchWithSchema(
    `${BASE}/${id}/reset-password`,
    {},
    bpAdminResetPasswordResponseSchema,
  )
  return response.data.password
}

export async function fetchBpAdminAuthorityCandidates(
  organizationId: number,
  signal?: AbortSignal,
): Promise<BpAdminAuthorityCandidate[]> {
  const response = await getWithSchema(
    `${BASE}/authority-options`,
    bpAdminAuthorityCandidateListResponseSchema,
    { params: { organization_id: organizationId }, signal },
  )
  return response.data
}

export async function fetchBpAdminOrganizationOptions(
  signal?: AbortSignal,
): Promise<BpAdminOrganizationOption[]> {
  const response = await getWithSchema(
    `${BASE}/organization-options`,
    bpAdminOrganizationOptionListResponseSchema,
    { signal },
  )
  return response.data
}
