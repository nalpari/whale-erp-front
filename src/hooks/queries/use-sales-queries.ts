import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  getDailySales,
  getDailySaleDetail,
  getImportedMonths,
  getMonthlySales,
  importSales,
} from '@/lib/api/sales'
import { useAuthStore } from '@/stores/auth-store'
import type { CardCompanyCode } from '@/types/sales'

/**
 * 재무관리 매출조회 쿼리 키 (sales 도메인 self-contained).
 * 매출은 조직(affiliation) 단위 재무 데이터이므로 모든 키에 affiliationId를 포함해 캐시를 조직별로 격리한다.
 * 동일 회원이 여러 조직 권한을 가지고 조직을 전환해도 다른 조직의 매출 캐시가 노출되지 않게 한다.
 * (서버 요청에는 axios 인터셉터가 affiliationId 헤더를 주입하지만, 클라이언트 캐시는 키로만 분리됨)
 */
export const salesKeys = {
  all: ['sales'] as const,
  scope: (affiliationId: string | null) => [...salesKeys.all, affiliationId ?? 'none'] as const,
  daily: (affiliationId: string | null, from: string, to: string) =>
    [...salesKeys.scope(affiliationId), 'daily', from, to] as const,
  dailyDetail: (affiliationId: string | null, date: string, cardCompanyCode: CardCompanyCode) =>
    [...salesKeys.scope(affiliationId), 'daily-detail', date, cardCompanyCode] as const,
  monthly: (affiliationId: string | null, year: number, month: number) =>
    [...salesKeys.scope(affiliationId), 'monthly', year, month] as const,
  importedMonths: (affiliationId: string | null) =>
    [...salesKeys.scope(affiliationId), 'imported-months'] as const,
}

/** 이미 가져온(적재된) 년/월 목록 (p15 가져오기 모달 데이터 보유 표시용) */
export const useImportedMonths = () => {
  const affiliationId = useAuthStore((s) => s.affiliationId)
  return useQuery({
    queryKey: salesKeys.importedMonths(affiliationId),
    queryFn: getImportedMonths,
  })
}

/** 일별 매출 조회 (p15) — 기간(from~to) yyyy-MM-dd */
export const useDailySales = (from: string, to: string, enabled = true) => {
  const affiliationId = useAuthStore((s) => s.affiliationId)
  return useQuery({
    queryKey: salesKeys.daily(affiliationId, from, to),
    queryFn: () => getDailySales(from, to),
    enabled: enabled && !!from && !!to,
  })
}

/** 일별 매출 상세 조회 (p16). date가 없으면 비활성화. */
export const useDailySaleDetail = (date: string | null, cardCompanyCode: CardCompanyCode) => {
  const affiliationId = useAuthStore((s) => s.affiliationId)
  return useQuery({
    queryKey: salesKeys.dailyDetail(affiliationId, date ?? '', cardCompanyCode),
    queryFn: () => getDailySaleDetail(date!, cardCompanyCode || undefined),
    enabled: !!date,
  })
}

/** 월별 매출 조회 (p17) */
export const useMonthlySales = (year: number, month: number, enabled = true) => {
  const affiliationId = useAuthStore((s) => s.affiliationId)
  return useQuery({
    queryKey: salesKeys.monthly(affiliationId, year, month),
    queryFn: () => getMonthlySales(year, month),
    enabled,
  })
}

/** 매출 데이터 연동(가져오기) — 성공 시 현재 조직(affiliation)의 sales 조회 캐시 무효화. */
export const useImportSales = () => {
  const queryClient = useQueryClient()
  const affiliationId = useAuthStore((s) => s.affiliationId)
  return useMutation({
    mutationFn: ({
      year,
      month,
      loginId,
      loginPw,
    }: {
      year: number
      month: number
      loginId: string
      loginPw: string
    }) => importSales(year, month, loginId, loginPw),
    onError: (error, variables) => {
      // 호출부에서 처리를 누락하더라도 최소한의 진단 로그는 남긴다(다분 소요 작업이라 사후 추적 필요).
      // err 통째 기록 시 axios config.data(=loginPw 평문)가 노출되므로 안전 필드만 기록한다.
      console.error('[useImportSales] 매출 연동 실패', {
        year: variables.year,
        month: variables.month,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        code: axios.isAxiosError(error) ? error.code : undefined,
        message: error instanceof Error ? error.message : String(error),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.scope(affiliationId) })
    },
  })
}
