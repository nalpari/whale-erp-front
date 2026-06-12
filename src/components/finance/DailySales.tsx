'use client'

import { useMemo, useState } from 'react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useAlert } from '@/components/common/ui'
import { getErrorMessage } from '@/lib/api'
import { useDailySales, useImportSales, useImportedMonths } from '@/hooks/queries/use-sales-queries'

const won = (n: number) => n.toLocaleString('ko-KR')
const MS_PER_DAY = 1000 * 60 * 60 * 24
/** 조회 기간 최대 일수 (화면정의서 p15: 일주일 이상 설정 불가) */
const MAX_PERIOD_DAYS = 7
const IMPORT_MONTH_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
  value: String(m),
  label: `${m}월`,
}))
/** 오늘 날짜/최근 6개년 옵션은 마운트 시점 기준으로 생성 (모듈 로드 시 고정돼 자정·연말 경과 시 stale 되는 것 방지) */
const buildToday = () => format(new Date(), 'yyyy-MM-dd')
const buildYearOptions = (): SelectOption[] =>
  Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => ({
    value: String(y),
    label: `${y}년`,
  }))

const isValidDateStr = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime())

/**
 * URL 쿼리(from/to)는 사용자가 임의로 조작할 수 있으므로 그대로 신뢰하지 않는다.
 * 형식 오류·역순·최대 기간(7일) 초과 등 검색 버튼 검증을 우회한 값은 기본값(오늘)으로 교정해
 * 백엔드의 제한 없는 장기 집계 쿼리 실행을 막는다.
 */
const sanitizeRange = (rawFrom: string | null, rawTo: string | null, fallback: string) => {
  const from = rawFrom ?? ''
  const to = rawTo ?? ''
  if (!isValidDateStr(from) || !isValidDateStr(to)) return { from: fallback, to: fallback }
  const diffDays = Math.floor((new Date(to).getTime() - new Date(from).getTime()) / MS_PER_DAY)
  if (diffDays < 0 || diffDays + 1 > MAX_PERIOD_DAYS) return { from: fallback, to: fallback }
  return { from, to }
}

/**
 * 일별 매출 조회 (화면정의서 p15).
 * 조회 조건은 기간(from~to). 기간 내 일자별 매출과 요약(총 매출/거래건수/건당평균)을 보여준다.
 * 조회 조건은 URL 쿼리(from/to)에 반영되어 상세 화면 왕복/재진입 시에도 유지된다.
 * 행 클릭 시 일별 매출 상세(p16)로 이동.
 */
export default function DailySales() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { alert, confirm } = useAlert()

  // 오늘 날짜/연도 옵션을 마운트 시 1회 계산 (모듈 레벨 고정 대신 진입 시점 기준으로 갱신)
  const [today] = useState(buildToday)
  const [importYearOptions] = useState<SelectOption[]>(buildYearOptions)

  // URL 쿼리에 조회 조건이 있으면 검증 후 복원, 형식 오류·기간 초과 등 비정상 값은 오늘로 교정
  const [form, setForm] = useState(() =>
    sanitizeRange(searchParams.get('from'), searchParams.get('to'), today),
  )
  const [applied, setApplied] = useState(form)

  // 데이터 가져오기(연동) 모달 상태
  const importMutation = useImportSales()
  const { data: importedMonths, isError: importedMonthsError } = useImportedMonths()
  const [importOpen, setImportOpen] = useState(false)
  const [importYm, setImportYm] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
  // Bizzle 로그인 자격증명 — 가져오기 시 매번 입력, 저장하지 않음(보안). 모달 닫을 때 비번 비움.
  const [importCred, setImportCred] = useState({ loginId: '', loginPw: '' })

  const { data, isLoading, isError, error, refetch } = useDailySales(applied.from, applied.to)
  const items = useMemo(() => data?.items ?? [], [data])

  // 이미 가져온(적재된) 년월 집합 + 선택 월 보유 여부
  const importedSet = useMemo(
    () => new Set((importedMonths ?? []).map((m) => `${m.year}-${m.month}`)),
    [importedMonths],
  )
  const selectedHasData = importedSet.has(`${importYm.year}-${importYm.month}`)
  const monthOptions = useMemo(
    () =>
      IMPORT_MONTH_OPTIONS.map((o) =>
        importedSet.has(`${importYm.year}-${o.value}`) ? { ...o, label: `${o.label} ✓` } : o,
      ),
    [importedSet, importYm.year],
  )
  const closeImport = () => {
    setImportOpen(false)
    // 보안: 비밀번호는 모달 닫을 때 메모리에서 비운다
    setImportCred((c) => ({ ...c, loginPw: '' }))
  }

  const handleImport = async () => {
    if (!importCred.loginId.trim() || !importCred.loginPw) {
      await alert('Bizzle 로그인 ID와 비밀번호를 입력해주세요.')
      return
    }
    // 기존 데이터가 있는(또는 보유 여부 확인 불가한) 월은 재수집 시 upstream이 일시적으로 빈 결과를 주면
    // 기존 매출이 0건으로 덮어쓰여 사라질 수 있어 명시적 확인을 받는다.
    if (selectedHasData || importedMonthsError) {
      const ok = await confirm(
        selectedHasData
          ? `${importYm.year}년 ${importYm.month}월은 이미 데이터가 있습니다. 다시 가져오면 기존 데이터를 덮어씁니다. 수집 결과가 비어 있으면 기존 데이터가 사라질 수 있습니다. 진행할까요?`
          : `${importYm.year}년 ${importYm.month}월의 데이터 보유 여부를 확인할 수 없습니다. 기존 데이터가 있으면 덮어쓸 수 있습니다. 진행할까요?`,
        { confirmText: '가져오기', cancelText: '취소' },
      )
      if (!ok) return
    }
    try {
      const result = await importMutation.mutateAsync({
        ...importYm,
        loginId: importCred.loginId.trim(),
        loginPw: importCred.loginPw,
      })
      closeImport()
      // 부분 수집을 성공으로 오인하지 않도록 분기.
      // 백엔드는 실패 시 예외(4xx/5xx)를 던지므로 여기 도달하면 status는 항상 'SUCCESS'(상수) → 판별에 쓰지 않는다.
      // 실제 부분 저장 신호는 수집 건수(totalCount) 대비 저장 건수(savedCount) 차이뿐이다
      // (요청 월 범위 밖 row는 백엔드 mapNotNull에서 정상 스킵되어 savedCount < totalCount 가 됨).
      const isPartial =
        typeof result.savedCount === 'number' &&
        typeof result.totalCount === 'number' &&
        result.savedCount < result.totalCount
      if (isPartial) {
        await alert(
          `일부 데이터만 수집되었습니다 (${result.savedCount ?? 0}/${result.totalCount ?? 0}건).` +
            `${result.message ? ` ${result.message}` : ''} 다시 시도하면 누락분을 보완할 수 있습니다.`,
        )
      } else {
        await alert(result.message || '데이터 연동이 완료되었습니다.')
      }
    } catch (err) {
      // 실패 원인을 한 메시지로 뭉개지 않고 분기 + 진단 로그 (수 분 걸리는 스크래핑이라 사후 추적 필요).
      // 주의: err를 통째로 찍으면 axios config.data(=loginPw 평문)가 노출되므로 안전 필드만 기록한다.
      console.error('[DailySales] Bizzle 매출 연동 실패', {
        year: importYm.year,
        month: importYm.month,
        status: axios.isAxiosError(err) ? err.response?.status : undefined,
        code: axios.isAxiosError(err) ? err.code : undefined,
        message: err instanceof Error ? err.message : String(err),
      })
      // 타임아웃 계열(코드/메시지)은 서버 수집이 계속 진행 중일 수 있어 재시도 전 새로고침 안내
      const isTimeout =
        axios.isAxiosError(err) &&
        (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || /timeout/i.test(err.message))
      let message: string
      if (isTimeout) {
        message =
          '수집이 제한 시간을 초과했습니다. 백그라운드에서 계속 진행될 수 있으니, 잠시 후 목록을 새로고침해 적재 여부를 확인하고 데이터가 없으면 다시 시도해주세요.'
      } else {
        // 그 외(자격증명 오류·서버 오류 등)는 백엔드가 내려준 메시지를 그대로 노출
        message = getErrorMessage(err, '데이터 연동에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
      await alert(message)
    } finally {
      // 보안: 성공·실패와 무관하게 평문 비밀번호를 즉시 비우고, mutation variables(비밀번호 포함)에
      // 자격증명이 장기 잔존(MutationCache·Devtools 노출)하지 않도록 mutation 상태를 reset한다.
      setImportCred((c) => ({ ...c, loginPw: '' }))
      importMutation.reset()
    }
  }

  const handleSearch = async () => {
    if (!form.from || !form.to) {
      await alert('조회 기간을 선택해주세요.')
      return
    }
    const diffDays = Math.floor((new Date(form.to).getTime() - new Date(form.from).getTime()) / MS_PER_DAY)
    if (Number.isNaN(diffDays)) {
      await alert('조회 기간이 올바르지 않습니다. 날짜를 다시 선택해주세요.')
      return
    }
    if (diffDays < 0) {
      await alert('시작일이 종료일보다 늦을 수 없습니다.')
      return
    }
    if (diffDays + 1 > MAX_PERIOD_DAYS) {
      await alert(`조회 기간은 최대 ${MAX_PERIOD_DAYS}일까지 설정할 수 있습니다.`)
      return
    }
    setApplied(form)
    // 조회 조건을 URL에 반영해 재진입/뒤로가기 시 유지
    router.replace(`/finance/card-sales/daily?from=${form.from}&to=${form.to}`)
  }

  const handleReset = () => {
    setForm({ from: today, to: today })
  }

  const summaryCards = [
    { label: '총 매출', value: `${won(data?.summary.totalAmount ?? 0)}원` },
    { label: '거래건수', value: `${won(data?.summary.totalCount ?? 0)}건` },
    { label: '건당 평균', value: `${won(data?.summary.avgAmount ?? 0)}원` },
  ]

  const goDetail = (date: string) => {
    router.push(`/finance/card-sales/daily/detail?date=${date}`)
  }

  return (
    <div className="data-list-wrap">
      {/* 상단: 데이터 가져오기(연동) 버튼 */}
      <div className="data-list-header">
        <div className="data-header-left"></div>
        <div className="data-header-right">
          <button className="btn-form basic" type="button" onClick={() => setImportOpen(true)}>
            데이터 가져오기
          </button>
        </div>
      </div>

      {/* 검색 영역: 기간 */}
      <div className="search-wrap">
        <div className="search-filed">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>기간</th>
                <td>
                  <RangeDatePicker
                    startDate={form.from ? new Date(form.from) : null}
                    endDate={form.to ? new Date(form.to) : null}
                    onChange={(range: DateRange) =>
                      setForm({
                        from: range.startDate ? format(range.startDate, 'yyyy-MM-dd') : '',
                        to: range.endDate ? format(range.endDate, 'yyyy-MM-dd') : '',
                      })
                    }
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="btn-filed">
          <button className="btn-form gray" type="button" onClick={handleReset}>
            초기화
          </button>
          <button className="btn-form basic" type="button" onClick={handleSearch}>
            검색
          </button>
        </div>
      </div>

      {/* 요약: 총 매출 / 거래건수 / 건당 평균 */}
      <div
        style={{
          display: 'flex',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          background: '#fff',
          margin: '16px 0',
        }}
      >
        {summaryCards.map((card, idx) => (
          <div
            key={card.label}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderLeft: idx > 0 ? '1px solid #d1d5db' : 'none',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>{card.label}</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* 일자별 목록 */}
      <div className="data-list-bx">
        <table className="default-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>회사번호</th>
              <th>직영점명</th>
              <th>매출액</th>
              <th>거래건수</th>
              <th>취소액</th>
              <th>취소건수</th>
              <th>건당 평균</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8}><div className="empty-data">조회 중...</div></td></tr>
            )}
            {isError && !isLoading && (
              <tr>
                <td colSpan={8}>
                  <div
                    className="empty-data"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                  >
                    <span>{getErrorMessage(error, '조회 중 오류가 발생했습니다.')}</span>
                    <button className="btn-form gray" type="button" onClick={() => refetch()}>
                      다시 시도
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && items.length === 0 && (
              <tr><td colSpan={8}><div className="empty-data">검색 결과가 없습니다.</div></td></tr>
            )}
            {items.map((item) => (
              <tr key={`${item.saleDate}-${item.compNo}`} onClick={() => goDetail(item.saleDate)} style={{ cursor: 'pointer' }}>
                <td>{item.saleDate}</td>
                <td>{item.compNo}</td>
                <td>{item.compName}</td>
                <td>{won(item.totalAmount)}</td>
                <td>{won(item.saleCount)}</td>
                <td>{won(item.cancelAmount)}</td>
                <td>{won(item.cancelCount)}</td>
                <td>{won(item.avgAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 데이터 가져오기 모달 */}
      {importOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => !importMutation.isPending && closeImport()}
        >
          <div
            style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '460px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <strong style={{ display: 'block', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              데이터 가져오기
            </strong>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              선택한 월의 매출 데이터를 연동합니다. 수집에 수 분이 걸릴 수 있습니다.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SearchSelect
                  options={importYearOptions}
                  value={importYearOptions.find((o) => o.value === String(importYm.year)) ?? null}
                  onChange={(opt) => opt && setImportYm({ ...importYm, year: Number(opt.value) })}
                  placeholder="년도"
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SearchSelect
                  options={monthOptions}
                  value={monthOptions.find((o) => o.value === String(importYm.month)) ?? null}
                  onChange={(opt) => opt && setImportYm({ ...importYm, month: Number(opt.value) })}
                  placeholder="월"
                />
              </div>
            </div>

            {/* 선택한 년/월의 데이터 보유 상태 안내 (드롭다운의 ✓ 표시와 연동) */}
            {importedMonthsError ? (
              // 보유 월 조회 실패 시 '데이터 없음'으로 위장되지 않도록 경고 (덮어쓰기 가능성 안내)
              <p style={{ fontSize: '12px', color: '#d97706', marginBottom: '16px' }}>
                ⚠️ 데이터 보유 여부를 확인할 수 없습니다. 기존 데이터가 있는 월이면 가져오기 시 덮어쓸 수 있습니다.
              </p>
            ) : selectedHasData ? (
              <p style={{ fontSize: '12px', color: '#d97706', marginBottom: '16px' }}>
                ⚠️ 이미 데이터가 있는 월입니다. 가져오면 기존 데이터를 덮어씁니다(업데이트).
              </p>
            ) : (
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                선택한 월은 아직 가져온 데이터가 없습니다. 가져오기 진행하면 데이터 수집합니다.
              </p>
            )}

            {/* Bizzle 로그인 자격증명 (매번 입력, 저장 안 함) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={importCred.loginId}
                onChange={(e) => setImportCred({ ...importCred, loginId: e.target.value })}
                placeholder="Bizzle 로그인 ID (사업자번호)"
                autoComplete="off"
                disabled={importMutation.isPending}
                style={{
                  width: '100%', height: '38px', padding: '0 12px',
                  border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
                }}
              />
              <input
                type="password"
                value={importCred.loginPw}
                onChange={(e) => setImportCred({ ...importCred, loginPw: e.target.value })}
                placeholder="Bizzle 비밀번호"
                autoComplete="new-password"
                disabled={importMutation.isPending}
                style={{
                  width: '100%', height: '38px', padding: '0 12px',
                  border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                입력한 자격증명은 수집에만 사용하며 저장하지 않습니다.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="btn-form gray"
                type="button"
                onClick={closeImport}
                disabled={importMutation.isPending}
              >
                취소
              </button>
              <button
                className="btn-form basic"
                type="button"
                onClick={handleImport}
                disabled={importMutation.isPending || !importCred.loginId.trim() || !importCred.loginPw}
              >
                {importMutation.isPending ? '가져오는 중...' : selectedHasData ? '다시 가져오기' : '가져오기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
