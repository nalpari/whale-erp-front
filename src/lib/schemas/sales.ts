import { z } from 'zod'

// 재무관리 > 신용카드 매출 조회 (화면정의서 p15/p16/p17)
// 백엔드 domain/sales 응답 DTO와 1:1 대응. 금액은 number(원), 날짜는 ISO 문자열.
// 외부 스크래핑(Bizzle) 기반이라 응답 신뢰도가 낮아 런타임 검증의 단일 출처로 사용한다.
// (코드성 값의 union 좁힘은 후속 작업 — 현재는 구조 검증만 수행)

/** 기간 매출 요약 (p15 요약 카드 ⑤⑥⑦) */
export const salesSummarySchema = z.object({
  cardAmount: z.number(),
  nonCardAmount: z.number(),
  totalAmount: z.number(),
  totalCount: z.number(),
  avgAmount: z.number(),
})

/** 일자별 매출 한 줄 (p15 목록 / p17 달력 셀) */
export const dailySaleItemSchema = z.object({
  saleDate: z.string(), // yyyy-MM-dd
  compNo: z.string(),
  compName: z.string(),
  cardAmount: z.number(),
  nonCardAmount: z.number(),
  totalAmount: z.number(),
  saleCount: z.number(),
  cancelAmount: z.number(),
  cancelCount: z.number(),
  avgAmount: z.number(),
})

/** 일별 매출 조회 응답 (p15) */
export const dailySalesResponseSchema = z.object({
  summary: salesSummarySchema,
  items: z.array(dailySaleItemSchema),
})

/** 매입사별 매출 상세 한 줄 (p16) */
export const saleDetailItemSchema = z.object({
  cardCompanyCode: z.string(),
  cardCompanyName: z.string(),
  srcDetail: z.string(),
  payMethod: z.string(),
  trType: z.string(),
  saleAmount: z.number(),
  saleCount: z.number(),
  cancelAmount: z.number(),
  cancelCount: z.number(),
})

/** 일별 매출 상세 조회 응답 (p16) */
export const dailySaleDetailResponseSchema = z.object({
  saleDate: z.string(),
  totalCount: z.number(),
  items: z.array(saleDetailItemSchema),
})

/** 월별 매출 조회 응답 (p17) */
export const monthlySalesResponseSchema = z.object({
  year: z.number(),
  month: z.number(),
  monthTotalAmount: z.number(),
  monthTotalCount: z.number(),
  days: z.array(dailySaleItemSchema),
})

/** 매출 데이터 연동(가져오기) 결과 */
export const salesImportResponseSchema = z.object({
  status: z.string(),
  totalCount: z.number(),
  savedCount: z.number(),
  message: z.string(),
})

/** 이미 가져온(적재된) 년/월 — 가져오기 모달 데이터 보유 표시용 */
export const importedMonthSchema = z.object({
  year: z.number(),
  month: z.number(),
  count: z.number(),
})

export type SalesSummary = z.infer<typeof salesSummarySchema>
export type DailySaleItem = z.infer<typeof dailySaleItemSchema>
export type DailySalesResponse = z.infer<typeof dailySalesResponseSchema>
export type SaleDetailItem = z.infer<typeof saleDetailItemSchema>
export type DailySaleDetailResponse = z.infer<typeof dailySaleDetailResponseSchema>
export type MonthlySalesResponse = z.infer<typeof monthlySalesResponseSchema>
export type SalesImportResponse = z.infer<typeof salesImportResponseSchema>
export type ImportedMonth = z.infer<typeof importedMonthSchema>
