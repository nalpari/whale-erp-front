import { useMutation } from '@tanstack/react-query'
import { createInquiry } from '@/lib/api/inquiry'
import type { InquiryCreateRequest } from '@/lib/schemas/inquiry'

/**
 * 문의하기 등록 mutation 훅.
 */
export const useCreateInquiry = () => {
  return useMutation({
    mutationFn: (payload: InquiryCreateRequest) => createInquiry(payload),
  })
}
