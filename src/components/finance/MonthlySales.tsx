'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { getErrorMessage } from '@/lib/api'
import { useMonthlySales } from '@/hooks/queries/use-sales-queries'
import type { DailySaleItem } from '@/types/sales'

const won = (n: number) => n.toLocaleString('ko-KR')
const MONTH_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
  value: String(m),
  label: `${m}월`,
}))
/** 최근 6개년 옵션은 마운트 시점 기준 생성 (모듈 로드 시 고정돼 연말 경과 시 stale 되는 것 방지) */
const buildYearOptions = (): SelectOption[] =>
  Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => ({
    value: String(y),
    label: `${y}년`,
  }))
const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

const dateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

/** 요일 색상: 일요일 빨강, 토요일 파랑(하늘색) */
const weekdayColor = (col: number): string | undefined =>
  col === 0 ? '#e53935' : col === 6 ? '#2f80ed' : undefined

/**
 * 월별 매출 조회 (화면정의서 p17).
 * 선택한 년/월의 일별 매출을 달력에 표시. 셀 클릭 시 일별 매출 상세(p16)로 이동.
 */
export default function MonthlySales() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // 연도 옵션을 마운트 시 1회 계산 (모듈 레벨 고정 대신 진입 시점 기준으로 갱신)
  const [yearOptions] = useState<SelectOption[]>(buildYearOptions)

  // URL 쿼리에 년/월이 있으면 복원, 없으면 현재 년월
  const [form, setForm] = useState(() => {
    const d = new Date()
    return {
      year: Number(searchParams.get('year')) || d.getFullYear(),
      month: Number(searchParams.get('month')) || d.getMonth() + 1,
    }
  })
  const [applied, setApplied] = useState(form)

  const { data, isLoading, isError, error, refetch } = useMonthlySales(applied.year, applied.month)

  const handleSearch = () => {
    setApplied(form)
    // 조회 조건을 URL에 반영해 재진입/뒤로가기 시 유지
    router.replace(`/finance/card-sales/monthly?year=${form.year}&month=${form.month}`)
  }

  // 일자별 매출 맵 + 달력 셀 구성
  const cells = useMemo(() => {
    const byDate = new Map<string, DailySaleItem>()
    data?.days.forEach((d) => byDate.set(d.saleDate, d))

    const firstDow = new Date(applied.year, applied.month - 1, 1).getDay()
    const daysInMonth = new Date(applied.year, applied.month, 0).getDate()

    const result: Array<{ day: number | null; item?: DailySaleItem }> = []
    for (let i = 0; i < firstDow; i += 1) result.push({ day: null })
    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push({ day, item: byDate.get(dateKey(applied.year, applied.month, day)) })
    }
    while (result.length % 7 !== 0) result.push({ day: null })
    return result
  }, [data, applied])

  const weeks = useMemo(() => {
    const rows: Array<typeof cells> = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [cells])

  const goDetail = (day: number) => {
    router.push(`/finance/card-sales/daily/detail?date=${dateKey(applied.year, applied.month, day)}`)
  }

  return (
    <div className="data-list-wrap">
      {/* 검색: 년/월 */}
      <div className="search-wrap">
        <div className="search-filed">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>년 / 월</th>
                <td>
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '320px' }}>
                    <div style={{ flex: 1 }}>
                      <SearchSelect
                        options={yearOptions}
                        value={yearOptions.find((o) => o.value === String(form.year)) ?? null}
                        onChange={(opt) => opt && setForm({ ...form, year: Number(opt.value) })}
                        placeholder="년도"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <SearchSelect
                        options={MONTH_OPTIONS}
                        value={MONTH_OPTIONS.find((o) => o.value === String(form.month)) ?? null}
                        onChange={(opt) => opt && setForm({ ...form, month: Number(opt.value) })}
                        placeholder="월"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="btn-filed">
          <button className="btn-form basic" type="button" onClick={handleSearch}>검색</button>
        </div>
      </div>

      {/* 월 합계 */}
      <div
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          background: '#fff',
          padding: '16px 24px',
          margin: '16px 0',
        }}
      >
        <strong style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
          {applied.year}년 {applied.month}월 매출 합계 : {won(data?.monthTotalAmount ?? 0)}원
        </strong>
      </div>

      {/* 달력 */}
      <div className="data-list-bx">
        {isLoading && <div className="empty-data">조회 중...</div>}
        {isError && !isLoading && (
          <div
            className="empty-data"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <span>{getErrorMessage(error, '조회 중 오류가 발생했습니다.')}</span>
            <button className="btn-form gray" type="button" onClick={() => refetch()}>
              다시 시도
            </button>
          </div>
        )}
        {!isLoading && !isError && (
          <table className="default-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                {WEEK_DAYS.map((w, ci) => (
                  <th key={w} style={{ color: weekdayColor(ci) }}>{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((cell, ci) => (
                    <td
                      key={ci}
                      onClick={cell.item ? () => goDetail(cell.day!) : undefined}
                      style={{ height: '90px', verticalAlign: 'top', ...(cell.item ? { cursor: 'pointer' } : {}) }}
                    >
                      {cell.day && (
                        <div style={{ display: 'flex', height: '100%', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: weekdayColor(ci) }}>{cell.day}</span>
                          {cell.item && (
                            <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#2f80ed' }}>
                              {won(cell.item.totalAmount)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
