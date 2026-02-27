import { z } from 'zod'
import { apiResponseSchema } from './api'

export const priceMasterListItemSchema = z.object({
  id: z.number(),
  bpId: z.number(),
  companyName: z.string().nullable(),
  menuName: z.string(),
  menuClassificationCode: z.string().nullable(),
  operationStatus: z.string(),
  salePrice: z.number().nullable(),
  discountPrice: z.number().nullable(),
  priceAppliedAt: z.string().nullable(),
  scheduledAt: z.string().nullable(),
})

// 표준 pageResponseSchema(number, size, first, last, empty)와 필드명이 다름
// Price Master API는 커스텀 페이징 응답(pageNumber, pageSize, isFirst, isLast, hasNext)을 사용
export const priceMasterListResponseSchema = z.object({
  content: z.array(priceMasterListItemSchema),
  pageNumber: z.number(),
  pageSize: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
  isFirst: z.boolean(),
  isLast: z.boolean(),
  hasNext: z.boolean(),
})

export const priceMasterPagedResponseSchema = apiResponseSchema(priceMasterListResponseSchema)

export const priceScheduleSaveResponseSchema = z.object({
  id: z.number().nullable(),
  menuId: z.number().nullable(),
  bpId: z.number().nullable(),
  scheduledSalePrice: z.number().nullable(),
  scheduledDiscountPrice: z.number().nullable(),
  status: z.string(),
  scheduledAt: z.string(),
})

export const priceScheduleSaveListResponseSchema = apiResponseSchema(z.array(priceScheduleSaveResponseSchema))
