import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { InvitationVerifyResponse, SignupRequest } from '@/types/signup'

interface SignupResponse {
  memberId: number
  loginId: string
  message: string
}

/** 초대 코드 검증 mutation */
export const useVerifyInvitation = () => {
  return useMutation({
    mutationFn: async (bpCode: string): Promise<InvitationVerifyResponse> => {
      const response = await api.get('/api/signup/verify-invitation', {
        params: { bpCode },
      })
      return response.data.data
    },
  })
}

/** 영업분류(BPTYP) 코드 조회 (비인증, 백엔드 public API 직접 호출) */
export const useBpTypCodes = () => {
  return useQuery<{ code: string; name: string }[]>({
    queryKey: ['public-bptyp-codes'],
    queryFn: async () => {
      const response = await api.get('/api/signup/bptyp-codes')
      return response.data.data ?? []
    },
    staleTime: 10 * 60 * 1000,
  })
}

/** 회원가입 완료 mutation */
export const useSignup = () => {
  return useMutation({
    mutationFn: async (request: SignupRequest): Promise<SignupResponse> => {
      const response = await api.post('/api/signup', request)
      return response.data.data
    },
  })
}
