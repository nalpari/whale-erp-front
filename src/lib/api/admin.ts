import api, { getWithSchema, postWithSchema, putWithSchema } from '@/lib/api'
import type {
  AdminSearchParams,
  AdminPageResponse,
  AdminDetail,
  AdminCreateRequest,
  AdminUpdateRequest,
} from '@/lib/schemas/admin'
import {
  adminListResponseSchema,
  adminDetailResponseSchema,
  adminIdCheckResponseSchema,
  adminSelectOptionsResponseSchema,
} from '@/lib/schemas/admin'

/**
 * 관리자 목록 조회
 * GET /api/system/admins
 */
export async function fetchAdmins(
  params: AdminSearchParams,
  signal?: AbortSignal
): Promise<AdminPageResponse> {
  const response = await getWithSchema('/api/system/admins', adminListResponseSchema, {
    params: {
      admin_id: params.admin_id,
      user_type: params.user_type,
      authority_id: params.authority_id,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page || 1,
      size: params.size || 50,
    },
    signal,
  })
  return response.data
}

/**
 * 관리자 상세 조회
 * GET /api/system/admins/{id}
 */
export async function fetchAdminDetail(id: number, signal?: AbortSignal): Promise<AdminDetail> {
  const response = await getWithSchema(
    `/api/system/admins/${id}`,
    adminDetailResponseSchema,
    { signal }
  )
  return response.data
}

/**
 * 관리자 등록
 * POST /api/system/admins
 */
export async function createAdmin(data: AdminCreateRequest): Promise<AdminDetail> {
  const response = await postWithSchema('/api/system/admins', data, adminDetailResponseSchema)
  return response.data
}

/**
 * 관리자 수정
 * PUT /api/system/admins/{id}
 */
export async function updateAdmin(id: number, data: AdminUpdateRequest): Promise<AdminDetail> {
  const response = await putWithSchema(`/api/system/admins/${id}`, data, adminDetailResponseSchema)
  return response.data
}

/**
 * 관리자 삭제 (논리 삭제)
 * DELETE /api/system/admins/{id}
 */
export async function deleteAdmin(id: number): Promise<void> {
  await api.delete(`/api/system/admins/${id}`)
}

/**
 * 관리자 ID 중복체크
 * GET /api/system/admins/check-login-id?loginId=xxx
 * data: true(중복, 사용불가) / false(사용가능)
 */
export async function checkAdminLoginId(loginId: string): Promise<boolean> {
  const response = await getWithSchema(
    '/api/system/admins/check-login-id',
    adminIdCheckResponseSchema,
    { params: { login_id: loginId } }
  )
  // API: true = 중복(사용불가), false = 사용가능
  return response.data
}

/**
 * 관리자 비밀번호 초기화
 * PATCH /api/system/admins/{id}/reset-password
 * 초기 비밀번호: hc1234567
 */
export async function resetAdminPassword(id: number): Promise<void> {
  await api.patch(`/api/system/admins/${id}/reset-password`)
}

/**
 * 관리자 SelectBox 목록 조회
 * GET /api/system/admins/select-options
 */
export async function fetchAdminSelectOptions(signal?: AbortSignal): Promise<Array<{ id: number; name: string }>> {
  const response = await getWithSchema(
    '/api/system/admins/select-options',
    adminSelectOptionsResponseSchema,
    { signal }
  )
  return response.data
}

/**
 * 권한 SelectBox 목록 조회
 * GET /api/system/admins/authority-options
 */
export async function fetchAuthorityOptions(signal?: AbortSignal): Promise<Array<{ id: number; name: string }>> {
  const response = await getWithSchema(
    '/api/system/admins/authority-options',
    adminSelectOptionsResponseSchema,
    { signal }
  )
  return response.data
}
