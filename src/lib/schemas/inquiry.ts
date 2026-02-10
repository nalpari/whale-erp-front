import { z } from 'zod'
import { apiResponseSchema } from '@/lib/schemas/api'

/**
 * 문의하기 등록 응답 스키마
 */
export const inquiryCreateResponseSchema = apiResponseSchema(
  z.object({
    id: z.number(),
    createdAt: z.string().nullable(),
  })
)

export type InquiryCreateResponse = z.infer<typeof inquiryCreateResponseSchema>['data']

/**
 * 문의하기 등록 요청 타입
 */
export interface InquiryCreateRequest {
  name: string
  phone: string
  email: string
  inquiryType: string
  content: string
}
