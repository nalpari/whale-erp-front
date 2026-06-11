import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDailySales,
  getDailySaleDetail,
  getImportedMonths,
  getMonthlySales,
  importSales,
} from '@/lib/api/sales'

/** 재무관리 매출조회 쿼리 키 (sales 도메인 self-contained) */
export const salesKeys = {
  all: ['sales'] as const,
  daily: (from: string, to: string) => [...salesKeys.all, 'daily', from, to] as const,
  dailyDetail: (date: string, cardCompanyCode: string) =>
    [...salesKeys.all, 'daily-detail', date, cardCompanyCode] as const,
  monthly: (year: number, month: number) => [...salesKeys.all, 'monthly', year, month] as const,
  importedMonths: () => [...salesKeys.all, 'imported-months'] as const,
}

/** 이미 가져온(적재된) 년/월 목록 (p15 가져오기 모달 데이터 보유 표시용) */
export const useImportedMonths = () => {
  return useQuery({
    queryKey: salesKeys.importedMonths(),
    queryFn: getImportedMonths,
  })
}

/** 일별 매출 조회 (p15) — 기간(from~to) yyyy-MM-dd */
export const useDailySales = (from: string, to: string, enabled = true) => {
  return useQuery({
    queryKey: salesKeys.daily(from, to),
    queryFn: () => getDailySales(from, to),
    enabled: enabled && !!from && !!to,
  })
}

/** 일별 매출 상세 조회 (p16). date가 없으면 비활성화. */
export const useDailySaleDetail = (date: string | null, cardCompanyCode: string) => {
  return useQuery({
    queryKey: salesKeys.dailyDetail(date ?? '', cardCompanyCode),
    queryFn: () => getDailySaleDetail(date!, cardCompanyCode || undefined),
    enabled: !!date,
  })
}

/** 월별 매출 조회 (p17) */
export const useMonthlySales = (year: number, month: number, enabled = true) => {
  return useQuery({
    queryKey: salesKeys.monthly(year, month),
    queryFn: () => getMonthlySales(year, month),
    enabled,
  })
}

/** 매출 데이터 연동(가져오기) — 성공 시 모든 sales 조회 캐시 무효화. */
export const useImportSales = () => {
  const queryClient = useQueryClient()
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all })
    },
  })
}
