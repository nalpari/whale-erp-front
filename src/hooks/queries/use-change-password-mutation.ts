import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

interface ChangePasswordRequest {
  currentPassword?: string
  newPassword: string
}

interface ChangePasswordResponse {
  code: string
  message: string
}

/**
 * 비밀번호 변경 mutation 훅
 */
export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await api.put<{ data: ChangePasswordResponse }>(
        '/api/auth/change-password',
        data,
      )
      return response.data.data
    },
  })
}
