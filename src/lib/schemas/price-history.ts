import { z } from 'zod'
import { apiResponseSchema } from './api'

export const priceHistoryListItemSchema = z.object({
  id: z.number(),
  menuId: z.number(),
  menuName: z.string(),
  menuClassificationCode: z.string().nullable(),
  operationStatus: z.string(),
  salePrice: z.number().nullable(),
  previousSalePrice: z.number().nullable(),
  discountPrice: z.number().nullable(),
  previousDiscountPrice: z.number().nullable(),
  priceAppliedAt: z.string().nullable(),
  changeType: z.string(),
  updatedByName: z.string().nullable(),
})

// Price History API도 커스텀 페이징 응답 사용 (Price Master와 동일)
export const priceHistoryListResponseSchema = z.object({
  content: z.array(priceHistoryListItemSchema),
  pageNumber: z.number(),
  pageSize: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
  isFirst: z.boolean(),
  isLast: z.boolean(),
  hasNext: z.boolean(),
})

export const priceHistoryPagedResponseSchema = apiResponseSchema(priceHistoryListResponseSchema)
