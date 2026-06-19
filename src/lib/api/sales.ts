import { z } from 'zod'
import api from '@/lib/api'
import {
  dailySalesResponseSchema,
  dailySaleDetailResponseSchema,
  monthlySalesResponseSchema,
  importedMonthSchema,
} from '@/lib/schemas/sales'
import type {
  CardCompanyCode,
  DailySalesResponse,
  DailySaleDetailResponse,
  ImportedMonth,
  MonthlySalesResponse,
  SalesImportResponse,
} from '@/types/sales'

/**
 * 매출 조회 응답을 검증해 반환한다.
 * 외부 스크래핑(Bizzle) 기반이라 응답 신뢰도가 낮으므로, dev에서만 검증하는 getWithSchema/validateApiResponse와 달리
 * prod에서도 형식 불일치 시 throw한다. 이렇게 해야 잘못된 응답(필드 누락·null body·스키마 변경)이
 * '0원/결과 없음'으로 silent 위장돼 재무 데이터를 오판하게 만드는 것을 막을 수 있다.
 */
function parseSalesData<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[sales] ${label} 응답 스키마 불일치:`, result.error.issues)
    }
    throw new Error(`${label} 응답 형식이 올바르지 않습니다.`)
  }
  return result.data
}

// 이미 가져온(적재된) 년/월 목록 — 가져오기 모달 데이터 보유 표시용
export async function getImportedMonths(): Promise<ImportedMonth[]> {
  const response = await api.get<{ data: unknown }>('/api/v1/sales/imported-months')
  return parseSalesData(z.array(importedMonthSchema), response.data?.data, '가져온 월 목록')
}

// 매출 데이터 연동(가져오기) — sales-rader에서 해당 월 수집 후 저장.
// sales-rader가 Bizzle 로그인+스크래핑을 실시간 수행해 수 분 소요되므로,
// 전역 axios 타임아웃(10초)을 덮어 백엔드 read-timeout(300초)보다 넉넉히 설정한다.
// loginId/loginPw(Bizzle 자격증명)는 본문으로만 전달하고 저장하지 않는다(보안).
//
// 변조방지 가드: import 직전에 1회용 key를 발급받아(import-key) 곧바로 헤더(X-Sales-Import-Key)에 실어 보낸다.
// sales-rader가 key를 검증(존재·미만료·해당 월 일치)·소멸시켜, 모달 UI를 거치지 않은 맨손 직접 호출(Postman 등)을 차단한다.
// [발급→import]를 한 메서드에서 연속 호출하는 이 구조가 가드의 핵심이다(api가 key를 대행하면 무력화됨).
// 설계: docs/plans/sales/2026-06-12-bizzle-import-tamper-guard.md
export async function importSales(
  year: number,
  month: number,
  loginId: string,
  loginPw: string,
): Promise<SalesImportResponse> {
  // issue-key 단계 실패(네트워크 등)는 "잘못된 방식"이 아니라 일반 오류로 처리된다.
  // (key 거부 419는 issue-key가 아니라 아래 import 단계에서만 발생)
  const { key } = (
    await api.post<{ data: { key: string } }>('/api/v1/sales/import-key', { year, month })
  ).data.data
  const response = await api.post<{ data: SalesImportResponse }>(
    '/api/v1/sales/import',
    { year, month, loginId, loginPw },
    { timeout: 310000, headers: { 'X-Sales-Import-Key': key } },
  )
  return response.data.data
}

// 일별 매출 조회 (p15) — 기간(from~to) yyyy-MM-dd
export async function getDailySales(from: string, to: string): Promise<DailySalesResponse> {
  const response = await api.get<{ data: unknown }>('/api/v1/sales/daily', {
    params: { from, to },
  })
  return parseSalesData(dailySalesResponseSchema, response.data?.data, '일별 매출')
}

// 일별 매출 상세 조회 (p16) — cardCompanyCode 비우면 전체
export async function getDailySaleDetail(
  date: string,
  cardCompanyCode?: CardCompanyCode
): Promise<DailySaleDetailResponse> {
  const response = await api.get<{ data: unknown }>('/api/v1/sales/daily/detail', {
    params: { date, ...(cardCompanyCode ? { cardCompanyCode } : {}) },
  })
  return parseSalesData(dailySaleDetailResponseSchema, response.data?.data, '일별 매출 상세')
}

// 월별 매출 조회 (p17)
export async function getMonthlySales(year: number, month: number): Promise<MonthlySalesResponse> {
  const response = await api.get<{ data: unknown }>('/api/v1/sales/monthly', {
    params: { year, month },
  })
  return parseSalesData(monthlySalesResponseSchema, response.data?.data, '월별 매출')
}
