import type { z } from 'zod'
import type {
  priceMasterListItemSchema,
  priceMasterListResponseSchema,
  priceScheduleSaveResponseSchema,
} from '@/lib/schemas/price-master'

// 응답 타입 — Zod 스키마에서 추론
export type PriceMasterListItem = z.infer<typeof priceMasterListItemSchema>
export type PriceMasterListResponse = z.infer<typeof priceMasterListResponseSchema>
export type PriceScheduleSaveResponse = z.infer<typeof priceScheduleSaveResponseSchema>

// 요청 타입 — 스키마 검증 대상이 아니므로 수동 정의
export interface PriceMasterListParams {
  bpId: number
  operationStatus?: string
  menuClassificationCode?: string
  menuName?: string
  priceAppliedAtFrom?: string
  priceAppliedAtTo?: string
  salePriceFrom?: number
  salePriceTo?: number
  discountPriceFrom?: number
  discountPriceTo?: number
  page?: number
  size?: number
}

export interface PriceScheduleSaveRequest {
  id: number
  bpId: number
  scheduledSalePrice: number | null
  scheduledDiscountPrice: number | null
  scheduledAt: string
}
