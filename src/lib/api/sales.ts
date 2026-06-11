import api from '@/lib/api'
import type {
  DailySalesResponse,
  DailySaleDetailResponse,
  ImportedMonth,
  MonthlySalesResponse,
  SalesImportResponse,
} from '@/types/sales'

// 이미 가져온(적재된) 년/월 목록 — 가져오기 모달 데이터 보유 표시용
export async function getImportedMonths(): Promise<ImportedMonth[]> {
  const response = await api.get<{ data: ImportedMonth[] }>('/api/v1/sales/imported-months')
  return response.data.data
}

// 매출 데이터 연동(가져오기) — sales-rader에서 해당 월 수집 후 저장.
// sales-rader가 Bizzle 로그인+스크래핑을 실시간 수행해 수 분 소요되므로,
// 전역 axios 타임아웃(10초)을 덮어 백엔드 read-timeout(300초)보다 넉넉히 설정한다.
// loginId/loginPw(Bizzle 자격증명)는 본문으로만 전달하고 저장하지 않는다(보안).
export async function importSales(
  year: number,
  month: number,
  loginId: string,
  loginPw: string,
): Promise<SalesImportResponse> {
  const response = await api.post<{ data: SalesImportResponse }>(
    '/api/v1/sales/import',
    { year, month, loginId, loginPw },
    { timeout: 310000 },
  )
  return response.data.data
}

// 일별 매출 조회 (p15) — 기간(from~to) yyyy-MM-dd
export async function getDailySales(from: string, to: string): Promise<DailySalesResponse> {
  const response = await api.get<{ data: DailySalesResponse }>('/api/v1/sales/daily', {
    params: { from, to },
  })
  return response.data.data
}

// 일별 매출 상세 조회 (p16) — cardCompanyCode 비우면 전체
export async function getDailySaleDetail(
  date: string,
  cardCompanyCode?: string
): Promise<DailySaleDetailResponse> {
  const response = await api.get<{ data: DailySaleDetailResponse }>('/api/v1/sales/daily/detail', {
    params: { date, ...(cardCompanyCode ? { cardCompanyCode } : {}) },
  })
  return response.data.data
}

// 월별 매출 조회 (p17)
export async function getMonthlySales(year: number, month: number): Promise<MonthlySalesResponse> {
  const response = await api.get<{ data: MonthlySalesResponse }>('/api/v1/sales/monthly', {
    params: { year, month },
  })
  return response.data.data
}
