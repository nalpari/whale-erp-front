import { postWithSchema } from '@/lib/api'
import {
  inquiryCreateResponseSchema,
  type InquiryCreateRequest,
  type InquiryCreateResponse,
} from '@/lib/schemas/inquiry'

/**
 * 문의하기 등록
 */
export async function createInquiry(payload: InquiryCreateRequest): Promise<InquiryCreateResponse> {
  const response = await postWithSchema('/api/v1/customer/inquiries', payload, inquiryCreateResponseSchema)
  return response.data
}
