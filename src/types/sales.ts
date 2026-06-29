// 재무관리 > 신용카드 매출 조회 (화면정의서 p15/p16/p17)
// 타입 정의는 런타임 검증과의 drift 방지를 위해 Zod 스키마(@/lib/schemas/sales)를 단일 출처로 삼아 재노출한다.
export type {
  SalesSummary,
  DailySaleItem,
  DailySalesResponse,
  SaleDetailItem,
  DailySaleDetailResponse,
  MonthlySalesResponse,
  SalesImportResponse,
  SalesImportKey,
  ImportedMonth,
} from '@/lib/schemas/sales'

/** p16 매입사(카드사) 라디오 옵션 — code는 Bizzle HID, value '' = 전체 */
export const CARD_COMPANY_OPTIONS = [
  { code: '', label: '전체' },
  { code: '0170', label: '국민' },
  { code: '0400', label: '비씨' },
  { code: '0300', label: '신한' },
  { code: '1200', label: '현대' },
  { code: '0505', label: '하나' },
  { code: '1100', label: '롯데' },
  { code: '1300', label: '삼성' },
  { code: '0171', label: 'NH농협' },
  // 관리 카드사(위 목록) 외 매입사 미식별 건(현금영수증/간편결제 토스페이/미등록 카드 등) — 백엔드 ETC_FILTER
  { code: 'ETC', label: '기타' },
] as const

/**
 * 매입사(카드사) 필터 코드 — 클라이언트가 보내는 라디오 선택값('' = 전체).
 * 응답의 cardCompanyCode/payMethod는 외부 스크래핑(Bizzle) 데이터라 미지 값이 유입될 수 있고
 * parseSalesData가 prod에서 throw하므로 union으로 좁히지 않는다(z.string() 유지).
 * 좁힘은 값 집합을 클라이언트가 통제하는 이 필터 코드에만 적용한다.
 */
export type CardCompanyCode = (typeof CARD_COMPANY_OPTIONS)[number]['code']

/** 관리(식별) 매입사 코드 집합 — 라디오 옵션 중 '전체'('')·'기타'('ETC') 제외 */
const MANAGED_CARD_COMPANY_CODES = new Set<string>(
  CARD_COMPANY_OPTIONS.filter((o) => o.code && o.code !== 'ETC').map((o) => o.code),
)

/**
 * 응답 row가 '기타' 매입사인지 판정한다.
 * 백엔드는 미식별 매입사(토스페이 등)도 원본 코드(예: '8300')를 유지한 채 cardCompanyName만 '기타'로 내려준다.
 * 따라서 코드를 'ETC'(요청 필터 키)와 직접 비교하면 안 되고, 관리 코드 집합에 없으면 기타로 본다.
 * 표시명(cardCompanyName) 대신 코드 집합으로 판정해 라벨 변경·신규 미식별 코드 유입에 견고하게 한다.
 */
export const isEtcCardCompany = (cardCompanyCode: string) =>
  !MANAGED_CARD_COMPANY_CODES.has(cardCompanyCode)
