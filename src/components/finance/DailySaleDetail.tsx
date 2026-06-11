'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDailySaleDetail } from '@/hooks/queries/use-sales-queries'
import { CARD_COMPANY_OPTIONS } from '@/types/sales'

const won = (n: number) => n.toLocaleString('ko-KR')

/** 결제수단 코드 → 한글 표기 */
const PAY_METHOD_LABEL: Record<string, string> = {
  CREDIT: '신용카드',
  CASH: '현금',
  CASH_RECEIPT: '현금영수증',
}

/**
 * 일별 매출 상세 조회 (화면정의서 p16).
 * 쿼리 파라미터 date 의 매입사별 매출 집계를 보여준다. (개별 승인내역은 수집 데이터에 없음)
 * 매입사(카드사) 라디오로 필터.
 */
export default function DailySaleDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const date = searchParams.get('date')

  const [cardCompanyCode, setCardCompanyCode] = useState('')
  const { data, isLoading, isError } = useDailySaleDetail(date, cardCompanyCode)
  const items = data?.items ?? []

  // 현재 필터(전체/선택 카드사) 기준 매출액 합계 — items가 이미 필터 반영됨
  const selectedLabel = CARD_COMPANY_OPTIONS.find((o) => o.code === cardCompanyCode)?.label ?? '전체'
  const totalSaleAmount = items.reduce((sum, it) => sum + it.saleAmount, 0)

  // 매입사가 '기타'(관리 외 카드사)인 행은 맨 아래로. 그 외는 백엔드 정렬 순서 유지(JS sort는 안정적)
  const sortedItems = [...items].sort(
    (a, b) => (a.cardCompanyName === '기타' ? 1 : 0) - (b.cardCompanyName === '기타' ? 1 : 0),
  )

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{date ?? '-'}</strong>
          <span style={{ fontSize: '14px', color: '#4b5563' }}>
            총 <b style={{ color: '#2f80ed' }}>{won(data?.totalCount ?? 0)}</b>건
          </span>
        </div>
        <div className="data-header-right">
          <button
            className="btn-form gray"
            type="button"
            onClick={() => {
              // 이전 화면(조회조건이 URL에 유지된 일별/월별)으로 복귀. 직접 진입 등 히스토리가 없으면 일별로.
              if (window.history.length > 1) router.back()
              else router.push('/finance/card-sales/daily')
            }}
          >
            목록
          </button>
        </div>
      </div>

      {/* 매입사(카드사) 라디오 필터 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '16px 0' }}>
        {CARD_COMPANY_OPTIONS.map((opt) => (
          <button
            key={opt.code || 'ALL'}
            type="button"
            className={`btn-form ${cardCompanyCode === opt.code ? 'basic' : 'gray'}`}
            onClick={() => setCardCompanyCode(opt.code)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 현재 필터 기준 매출액 합계 (목록 상단 오른쪽) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', margin: '0 0 8px' }}>
        <span style={{ fontSize: '14px', color: '#4b5563' }}>{selectedLabel} 매출액</span>
        <strong style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{won(totalSaleAmount)}원</strong>
      </div>

      <div className="data-list-bx">
        <table className="default-table">
          <thead>
            <tr>
              <th>매입사</th>
              <th>결제수단</th>
              <th>거래유형</th>
              <th>매출액</th>
              <th>매출건수</th>
              <th>취소액</th>
              <th>취소건수</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}><div className="empty-data">조회 중...</div></td></tr>
            )}
            {isError && !isLoading && (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}><div className="empty-data">조회 중 오류가 발생했습니다.</div></td></tr>
            )}
            {!isLoading && !isError && items.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}><div className="empty-data">검색 결과가 없습니다.</div></td></tr>
            )}
            {sortedItems.map((item, idx) => (
              <tr key={`${item.cardCompanyCode}-${item.payMethod}-${item.trType}-${idx}`}>
                <td>{item.cardCompanyName}</td>
                <td>{PAY_METHOD_LABEL[item.payMethod] ?? (item.srcDetail || item.payMethod)}</td>
                <td>{item.trType || '-'}</td>
                <td>{won(item.saleAmount)}</td>
                <td>{won(item.saleCount)}</td>
                <td>{won(item.cancelAmount)}</td>
                <td>{won(item.cancelCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
