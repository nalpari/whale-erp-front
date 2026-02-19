'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/common/ui'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import Location from '@/components/ui/Location'
import { useAttendanceRecords } from '@/hooks/queries'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateYmdOrUndefined } from '@/util/date-util'
import CubeLoader from '@/components/common/ui/CubeLoader'
import type { AttendanceRecordItem, AttendanceRecordParams } from '@/types/attendance'

const BREADCRUMBS = ['Home', '직원 관리', '근태 기록', '상세']

const parseNumberParam = (value: string | null): number | null => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

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

  const officeId = parseNumberParam(searchParams.get('officeId'))
  const franchiseId = parseNumberParam(searchParams.get('franchiseId'))
  const storeId = parseNumberParam(searchParams.get('storeId'))
  const employeeId = parseNumberParam(searchParams.get('employeeId'))

  const defaultTo = new Date()
  const defaultFrom = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d
  })()

  const [from, setFrom] = useState<Date | null>(defaultFrom)
  const [to, setTo] = useState<Date | null>(defaultTo)
  const [appliedFrom, setAppliedFrom] = useState<Date | null>(defaultFrom)
  const [appliedTo, setAppliedTo] = useState<Date | null>(defaultTo)
  const [showDateError, setShowDateError] = useState(false)

  const recordParams: AttendanceRecordParams | null = officeId && employeeId ? {
    officeId,
    franchiseId: franchiseId ?? undefined,
    storeId: storeId ?? undefined,
    employeeId,
    from: formatDateYmdOrUndefined(appliedFrom),
    to: formatDateYmdOrUndefined(appliedTo),
  } : null

  const { data: response, isPending: loading, error } = useAttendanceRecords(
    recordParams || { officeId: 0, employeeId: 0 },
    hydrated && Boolean(officeId && employeeId)
  )

  // 같은 날짜의 레코드를 그룹핑
  const groupedRecords = useMemo(() => {
    const rawRecords = response?.record ?? []
    const groupMap = new Map<string, AttendanceRecordItem[]>()
    for (const rec of rawRecords) {
      const existing = groupMap.get(rec.date)
      if (existing) {
        existing.push(rec)
      } else {
        groupMap.set(rec.date, [rec])
      }
    }
    return Array.from(groupMap.entries()).map(([date, items]) => ({
      date,
      day: items[0].day,
      isHoliday: items[0].isHoliday,
      hasContract: items.some((r) => !!r.contractStartTime),
      hasWork: items.some((r) => !!r.workStartTime || !!r.workEndTime),
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

  const getBoxClass = (group: (typeof groupedRecords)[number]) => {
    if (group.isHoliday) return 'commute-bx gray-bx'
    if (!group.hasContract && !group.hasWork) return 'commute-bx gray-bx'
    if (group.hasContract && !group.hasWork) return 'commute-bx red-bx'
    return 'commute-bx'
  }

  const handleBackToList = () => {
    router.push('/employee/attendance')
  }

  if (!officeId || !employeeId) {
    return (
      <div className="data-wrap">
        <Location title="근태 기록 상세" list={BREADCRUMBS} />
        <div className="contents-wrap">
          <div className="warning-txt">필수 파라미터가 없습니다.</div>
          <button className="btn-form basic" onClick={handleBackToList}>
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="data-wrap">
      <Location title="근태 기록 상세" list={BREADCRUMBS} />
      <div className="contents-wrap">
        <div className="contents-btn">
          <button
            className="btn-form basic"
            type="button"
            onClick={handleBackToList}
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
                      <Input
                        value={response?.officeName ?? ''}
                        readOnly
                        containerClassName="mx-500"
                      />
                      {(response?.franchiseId != null || response?.franchiseName) && (
                        <Input
                          value={response?.franchiseName ?? ''}
                          readOnly
                          containerClassName="mx-500"
                        />
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>점포</th>
                  <td>
                    <Input
                      value={response?.storeName ?? ''}
                      readOnly
                      containerClassName="mx-500"
                    />
                  </td>
                </tr>
                <tr>
                  <th>직원명</th>
                  <td>
                    <div className="filed-flx">
                      <Input
                        value={response?.employeeName ?? ''}
                        readOnly
                        containerClassName="mx-500"
                      />
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
                      <RangeDatePicker
                        startDate={from}
                        endDate={to}
                        onChange={(range: DateRange) => {
                          setShowDateError(false)
                          setFrom(range.startDate)
                          setTo(range.endDate)
                        }}
                        startDatePlaceholder="시작일"
                        endDatePlaceholder="종료일"
                      />
                      <button className="btn-form outline s" type="button" onClick={handleSearch}>
                        검색
                      </button>
                    </div>
                    {showDateError && (
                      <span className="warning-txt">
                        ※ 종료일은 시작일보다 과거일자로 설정할 수 없습니다.
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="content-wrap">
            {error && (
              <div className="warning-txt">
                데이터를 불러오는 중 오류가 발생했습니다: {error.message}
              </div>
            )}
            {loading ? (
              <div className="cube-loader-overlay"><CubeLoader /></div>
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
                        {!group.hasContract && !group.hasWork ? (
                          <li className="commute-item">
                            <div className="work-time">
                            </div>
                          </li>
                        ) : group.hasContract && !group.hasWork ? (
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
