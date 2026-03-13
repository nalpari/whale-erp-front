import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminKeys, type AdminListParams } from './query-keys'
import {
  fetchAdmins,
  fetchAdminDetail,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  checkAdminLoginId,
  resetAdminPassword,
  fetchAdminSelectOptions,
  fetchAuthorityOptions,
} from '@/lib/api/admin'
import type { AdminCreateRequest, AdminUpdateRequest } from '@/lib/schemas/admin'

/**
 * 관리자 목록 조회
 */
export function useAdminList(params: AdminListParams) {
  return useQuery({
    queryKey: adminKeys.list(params),
    queryFn: ({ signal }) => fetchAdmins(params, signal),
  })
}

/**
 * 관리자 상세 조회
 */
export function useAdminDetail(id: number) {
  return useQuery({
    queryKey: adminKeys.detail(id),
    queryFn: ({ signal }) => fetchAdminDetail(id, signal),
    enabled: !!id,
  })
}

/**
 * 관리자 등록
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AdminCreateRequest) => createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
    },
  })
}

/**
 * 관리자 수정
 */
export function useUpdateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminUpdateRequest }) =>
      updateAdmin(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(variables.id) })
    },
  })
}

/**
 * 관리자 삭제
 */
export function useDeleteAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteAdmin(id),
    onSuccess: (_data, id) => {
      queryClient.cancelQueries({ queryKey: adminKeys.detail(id) })
      queryClient.setQueryData(adminKeys.detail(id), null)
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() })
    },
  })
}

/**
 * 관리자 ID 중복체크
 * 결과: true = 중복(사용불가), false = 사용가능
 */
export function useCheckAdminLoginId() {
  return useMutation({
    mutationFn: (loginId: string) => checkAdminLoginId(loginId),
  })
}

/**
 * 관리자 비밀번호 초기화
 */
export function useResetAdminPassword() {
  return useMutation({
    mutationFn: (id: number) => resetAdminPassword(id),
  })
}

/**
 * 관리자 SelectBox 목록 조회
 * GET /api/system/admins/select-options
 */
export function useAdminSelectOptions() {
  return useQuery({
    queryKey: adminKeys.selectOptions(),
    queryFn: ({ signal }) => fetchAdminSelectOptions(signal),
  })
}

/**
 * 권한 SelectBox 목록 조회
 * GET /api/system/admins/authority-options
 */
export function useAuthorityOptions() {
  return useQuery({
    queryKey: adminKeys.authorityOptions(),
    queryFn: ({ signal }) => fetchAuthorityOptions(signal),
  })
}
