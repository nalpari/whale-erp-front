import type { z } from 'zod'
import type {
  priceHistoryListItemSchema,
  priceHistoryListResponseSchema,
} from '@/lib/schemas/price-history'

// 응답 타입 — Zod 스키마에서 추론
export type PriceHistoryListItem = z.infer<typeof priceHistoryListItemSchema>
export type PriceHistoryListResponse = z.infer<typeof priceHistoryListResponseSchema>

// 요청 타입 — 스키마 검증 대상이 아니므로 수동 정의
export interface PriceHistoryListParams {
  bpId: number
  operationStatus?: string
  menuClassificationCode?: string
  menuName?: string
  priceAppliedAtFrom?: string
  priceAppliedAtTo?: string
  page?: number
  size?: number
}
