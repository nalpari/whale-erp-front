// 재무관리 > 신용카드 매출 조회 (화면정의서 p15/p16/p17)
// 백엔드 domain/sales 응답 DTO와 1:1 대응. 금액은 number(원), 날짜는 ISO 문자열.

/** 기간 매출 요약 (p15 요약 카드 ⑤⑥⑦) */
export interface SalesSummary {
  cardAmount: number
  nonCardAmount: number
  totalAmount: number
  totalCount: number
  avgAmount: number
}

/** 일자별 매출 한 줄 (p15 목록 / p17 달력 셀) */
export interface DailySaleItem {
  saleDate: string // yyyy-MM-dd
  compNo: string
  compName: string
  cardAmount: number
  nonCardAmount: number
  totalAmount: number
  saleCount: number
  cancelAmount: number
  cancelCount: number
  avgAmount: number
}

/** 일별 매출 조회 응답 (p15) */
export interface DailySalesResponse {
  summary: SalesSummary
  items: DailySaleItem[]
}

/** 매입사별 매출 상세 한 줄 (p16) */
export interface SaleDetailItem {
  cardCompanyCode: string
  cardCompanyName: string
  srcDetail: string
  payMethod: string
  trType: string
  saleAmount: number
  saleCount: number
  cancelAmount: number
  cancelCount: number
}

/** 일별 매출 상세 조회 응답 (p16) */
export interface DailySaleDetailResponse {
  saleDate: string
  totalCount: number
  items: SaleDetailItem[]
}

/** 월별 매출 조회 응답 (p17) */
export interface MonthlySalesResponse {
  year: number
  month: number
  monthTotalAmount: number
  monthTotalCount: number
  days: DailySaleItem[]
}

/** 매출 데이터 연동(가져오기) 결과 */
export interface SalesImportResponse {
  status: string
  totalCount: number
  savedCount: number
  message: string
}

/** 이미 가져온(적재된) 년/월 — 가져오기 모달 데이터 보유 표시용 */
export interface ImportedMonth {
  year: number
  month: number
  count: number
}

/** p16 매입사(카드사) 라디오 옵션 — code는 Bizzle HID, value '' = 전체 */
export const CARD_COMPANY_OPTIONS: { code: string; label: string }[] = [
  { code: '', label: '전체' },
  { code: '0170', label: '국민' },
  { code: '0400', label: '비씨' },
  { code: '0300', label: '신한' },
  { code: '1200', label: '현대' },
  { code: '0505', label: '하나' },
  { code: '1100', label: '롯데' },
  { code: '1300', label: '삼성' },
  { code: '0171', label: 'NH농협' },
  // 관리 8개 카드사 외(현금영수증/간편결제 토스페이/미등록 카드 등) — 백엔드 ETC_FILTER
  { code: 'ETC', label: '기타' },
]
