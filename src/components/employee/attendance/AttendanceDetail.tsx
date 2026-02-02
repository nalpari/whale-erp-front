'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DatePicker from '@/components/ui/common/DatePicker'
import Location from '@/components/ui/Location'
import { useAttendanceRecords } from '@/hooks/queries'
import { useBp } from '@/hooks/useBp'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateYmdOrUndefined } from '@/util/date-util'
import type { AttendanceRecordItem, AttendanceRecordParams } from '@/types/attendance'

const BREADCRUMBS = ['Home', '직원 관리', '근태 기록', '상세']

const formatTime = (time: string | null) => {
  if (!time) return '-'
  // HH:mm:ss → HH:mm
  return time.substring(0, 5)
}

export default function AttendanceDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, affiliationId } = useAuthStore()
  const hydrated = Boolean(accessToken && affiliationId)

  const officeId = Number(searchParams.get('officeId')) || null
  const franchiseId = Number(searchParams.get('franchiseId')) || null
  const storeId = Number(searchParams.get('storeId')) || null
  const employeeId = Number(searchParams.get('employeeId')) || null
  const employeeName = searchParams.get('employeeName') ?? ''
  const storeName = searchParams.get('storeName') ?? ''

  // BP 트리에서 본사/가맹점 이름 조회
  const { data: bpTree } = useBp(hydrated)
  const officeName = useMemo(
    () => bpTree.find((o) => o.id === officeId)?.name ?? '',
    [bpTree, officeId]
  )
  const franchiseName = useMemo(() => {
    if (!officeId) return ''
    const office = bpTree.find((o) => o.id === officeId)
    return office?.franchises.find((f) => f.id === franchiseId)?.name ?? ''
  }, [bpTree, officeId, franchiseId])

  const defaultTo = useMemo(() => new Date(), [])
  const defaultFrom = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d
  }, [])

  const [from, setFrom] = useState<Date | null>(defaultFrom)
  const [to, setTo] = useState<Date | null>(defaultTo)
  const [appliedFrom, setAppliedFrom] = useState<Date | null>(defaultFrom)
  const [appliedTo, setAppliedTo] = useState<Date | null>(defaultTo)
  const [showDateError, setShowDateError] = useState(false)

  const recordParams: AttendanceRecordParams = useMemo(
    () => ({
      officeId: officeId!,
      franchiseId: franchiseId ?? undefined,
      storeId: storeId ?? undefined,
      employeeId: employeeId!,
      from: formatDateYmdOrUndefined(appliedFrom),
      to: formatDateYmdOrUndefined(appliedTo),
    }),
    [officeId, franchiseId, storeId, employeeId, appliedFrom, appliedTo]
  )

  const { data: response, isPending: loading } = useAttendanceRecords(recordParams, hydrated)

  // 같은 날짜의 레코드를 그룹핑
  const groupedRecords = useMemo(() => {
    const rawRecords = response?.record ?? []
    const map = new Map<string, AttendanceRecordItem[]>()
    for (const rec of rawRecords) {
      const existing = map.get(rec.date)
      if (existing) {
        existing.push(rec)
      } else {
        map.set(rec.date, [rec])
      }
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      day: items[0].day,
      isHoliday: items[0].isHoliday,
      hasContract: items.some((r) => !!r.contractStartTime),
      records: items,
    }))
  }, [response?.record])

  const handleSearch = () => {
    const hasDateError = Boolean(from && to && to < from)
    setShowDateError(hasDateError)
    if (hasDateError) return
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  const isAbsent = (rec: AttendanceRecordItem) =>
    !!rec.contractStartTime && !rec.workStartTime && !rec.workEndTime

  const getBoxClass = (group: (typeof groupedRecords)[number]) => {
    if (group.isHoliday) return 'commute-bx gray-bx'
    if (!group.hasContract) return 'commute-bx gray-bx'
    if (group.records.every(isAbsent)) return 'commute-bx red-bx'
    return 'commute-bx'
  }

  return (
    <div className="data-wrap">
      <Location title="근태 기록 상세" list={BREADCRUMBS} />
      <div className="contents-wrap">
        <div className="contents-btn">
          <button
            className="btn-form basic"
            type="button"
            onClick={() => router.push('/employee/attendance')}
          >
            목록
          </button>
        </div>
        <div className="contents-body">
          <div className="content-wrap">
            <table className="default-table">
              <colgroup>
                <col width="160px" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>본사/가맹점</th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-500">
                        <input type="text" className="input-frame" value={officeName} readOnly />
                      </div>
                      <div className="mx-500">
                        <input
                          type="text"
                          className="input-frame"
                          value={franchiseName}
                          readOnly
                        />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>점포</th>
                  <td>
                    <div className="mx-500">
                      <input
                        type="text"
                        className="input-frame"
                        value={storeName}
                        readOnly
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>직원명</th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-500">
                        <input
                          type="text"
                          className="input-frame"
                          value={employeeName}
                          readOnly
                        />
                      </div>
                      {response?.employeeNumber && (
                        <span>{response.employeeNumber}</span>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    기간 설정 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-flx">
                      <div className="date-picker-wrap">
                        <DatePicker
                          value={from}
                          onChange={(date) => {
                            setShowDateError(false)
                            setFrom(date)
                          }}
                        />
                        <span>~</span>
                        <DatePicker
                          value={to}
                          onChange={(date) => {
                            setShowDateError(false)
                            setTo(date)
                          }}
                        />
                      </div>
                      <button className="btn-form outline s" type="button" onClick={handleSearch}>
                        검색
                      </button>
                    </div>
                    {showDateError && (
                      <span className="form-helper error">
                        ※ 종료일은 시작일보다 과거일자로 설정할 수 없습니다.
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="content-wrap">
            {loading ? (
              <div></div>
            ) : groupedRecords.length === 0 ? (
              <div className="empty-wrap">
                <div className="empty-data">출퇴근 기록이 없습니다.</div>
              </div>
            ) : (
              <div className="commute-wrap">
                {groupedRecords.map((group) => (
                  <div className={getBoxClass(group)} key={group.date}>
                    <div className="commute-header">
                      {group.date} ({group.day})
                    </div>
                    <div className="commute-body">
                      <ul className="commute-list">
                        {!group.hasContract ? (
                          <li className="commute-item">
                            <div className="work-time">
                            </div>
                          </li>
                        ) : group.records.every(isAbsent) ? (
                          <li className="commute-item">
                            <div className="commute-time">
                              <div className="commute-time-item">
                                <div className="commute-time-tit">출근시간</div>
                                <div className="commute-time-desc">
                                  {formatTime(group.records[0].contractStartTime)}
                                </div>
                              </div>
                              <div className="commute-time-item">
                                <div className="commute-time-tit">퇴근시간</div>
                                <div className="commute-time-desc">
                                  {formatTime(group.records[0].contractEndTime)}
                                </div>
                              </div>
                            </div>
                            <div className="work-time">
                              <div className="no-work">결근</div>
                            </div>
                          </li>
                        ) : (
                          <>
                            {group.records.map((rec, idx) => (
                              <li className="commute-item" key={idx}>
                                <div className="commute-time">
                                  <div className="commute-time-item">
                                    <div className="commute-time-tit">출근시간</div>
                                    <div className="commute-time-desc">
                                      {formatTime(rec.workStartTime)}
                                    </div>
                                  </div>
                                  <div className="commute-time-item">
                                    <div className="commute-time-tit">퇴근시간</div>
                                    <div className="commute-time-desc">
                                      {formatTime(rec.workEndTime)}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
