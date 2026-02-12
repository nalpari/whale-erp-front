import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import type { LoginRequest, LoginAuthorityProgram } from '@/lib/schemas/auth'

interface LoginResponse {
  accessToken: string
  refreshToken: string
  authority?: {
    authority_id: number
    programs: LoginAuthorityProgram[]
  }
  companies?: Array<{
    authority_id: number
    company_name: string | null
    brand_name: string | null
  }>
  loginId?: string
  name?: string
  mobilePhone?: string
  subscriptionPlanId?: number
}

/**
 * 로그인 mutation 훅
 * - useMutation을 사용하므로 GlobalMutationSpinner가 자동으로 표시됨
 */
export function useLoginMutation() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<{ data: LoginResponse }>('/api/auth/login', data)
      return response.data.data
    },
  })
}

interface AuthoritySelectRequest {
  authorityId: number
  accessToken: string
}

interface AuthoritySelectResponse {
  authority?: {
    programs: LoginAuthorityProgram[]
  }
}

/**
 * 조직 선택 mutation 훅
 */
export function useAuthoritySelectMutation() {
  return useMutation({
    mutationFn: async ({ authorityId, accessToken }: AuthoritySelectRequest) => {
      const response = await api.post<{ data: AuthoritySelectResponse }>(
        '/api/auth/authority',
        { authority_id: authorityId },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      return response.data.data
    },
  })
}
