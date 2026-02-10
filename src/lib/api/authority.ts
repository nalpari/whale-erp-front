import api, { getWithSchema, postWithSchema, putWithSchema, patchWithSchema } from '@/lib/api'
import type { PageResponse } from '@/lib/schemas/api'
import type {
  AuthoritySearchParams,
  AuthorityListItem,
  AuthorityResponse,
  AuthorityCreateRequest,
  AuthorityUpdateRequest,
  AuthorityDetailUpdateRequest,
} from '@/lib/schemas/authority'
import {
  authorityListResponseSchema,
  authorityDetailResponseSchema,
} from '@/lib/schemas/authority'

/**
 * 권한 목록 조회
 * @param params - 검색 조건
 * @param params.owner_group - 권한 그룹 (PRGRP_001: 플랫폼, PRGRP_002: BP)
 * @param params.head_office_id - 본사 ID (선택)
 * @param params.franchisee_id - 가맹점 ID (선택)
 * @param params.name - 권한명 (선택)
 * @param params.is_used - 운영여부 (선택)
 * @param params.page - 페이지 번호 (기본값: 1)
 * @param params.size - 페이지 크기 (기본값: 50)
 * @param signal - AbortSignal for request cancellation
 * @returns 페이징된 권한 목록
 */
export async function fetchAuthorities(
  params: AuthoritySearchParams & { page?: number; size?: number },
  signal?: AbortSignal
): Promise<PageResponse<AuthorityListItem>> {
  const response = await getWithSchema('/api/system/authorities', authorityListResponseSchema, {
    params: {
      owner_group: params.owner_group,
      head_office_id: params.head_office_id,
      franchisee_id: params.franchisee_id,
      name: params.name,
      is_used: params.is_used,
      page: params.page || 1,
      size: params.size || 50,
    },
    signal,
  })
  return response.data
}

/**
 * 권한 상세 조회
 * @param id - 권한 ID
 * @param signal - AbortSignal for request cancellation
 * @returns 권한 상세 정보 (프로그램 트리 포함)
 */
export async function fetchAuthorityDetail(id: number, signal?: AbortSignal): Promise<AuthorityResponse> {
  const response = await getWithSchema(
    `/api/system/authorities/${id}`,
    authorityDetailResponseSchema,
    { signal }
  )
  return response.data
}

/**
 * 권한 등록
 * @param data - 권한 생성 데이터
 * @param data.owner_code - 권한 소유 코드 (PRGRP_001_001: 플랫폼, PRGRP_002_001: 본사, PRGRP_002_002: 가맹점)
 * @param data.name - 권한명
 * @param data.is_used - 운영여부
 * @param data.description - 권한 설명 (선택)
 * @param data.details - 프로그램별 권한 상세 (선택)
 * @returns 생성된 권한 정보
 */
export async function createAuthority(data: AuthorityCreateRequest): Promise<AuthorityResponse> {
  const response = await postWithSchema('/api/system/authorities', data, authorityDetailResponseSchema)
  return response.data
}

/**
 * 권한 마스터 정보 수정
 * @param id - 권한 ID
 * @param data - 수정할 데이터
 * @param data.name - 권한명
 * @param data.is_used - 운영여부
 * @param data.description - 권한 설명 (선택)
 * @returns 수정된 권한 정보
 */
export async function updateAuthority(
  id: number,
  data: AuthorityUpdateRequest
): Promise<AuthorityResponse> {
  const response = await putWithSchema(
    `/api/system/authorities/${id}`,
    data,
    authorityDetailResponseSchema
  )
  return response.data
}

/**
 * 프로그램별 권한 수정
 * @param id - 권한 ID
 * @param programId - 프로그램 ID
 * @param data - 수정할 권한 데이터
 * @param data.can_read - 읽기 권한
 * @param data.can_create_delete - 생성/삭제 권한
 * @param data.can_update - 수정 권한
 * @returns 수정된 권한 정보
 */
export async function updateProgramAuthority(
  id: number,
  programId: number,
  data: AuthorityDetailUpdateRequest
): Promise<AuthorityResponse> {
  const response = await patchWithSchema(
    `/api/system/authorities/${id}/programs/${programId}`,
    data,
    authorityDetailResponseSchema
  )
  return response.data
}

/**
 * 권한 삭제
 * @param id - 삭제할 권한 ID
 * @returns void
 */
export async function deleteAuthority(id: number): Promise<void> {
  await api.delete(`/api/system/authorities/${id}`)
}
