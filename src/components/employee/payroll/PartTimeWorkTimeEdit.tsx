'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tooltip } from 'react-tooltip'
import { useDailyWorkHours } from '@/hooks/queries/use-payroll-queries'

interface PartTimeWorkTimeEditProps {
  id: string
  startDate?: string
  endDate?: string
  employeeInfoId?: string
  payrollMonth?: string
}

// 편집 가능한 일별 근무 데이터 타입
export interface EditableDailyRecord {
  date: string
  dayOfWeek: string
  dayOfWeekKorean: string
  originalWorkHours: number
  workHours: number
  originalApplyTimelyAmount: number
  applyTimelyAmount: number
  paymentAmount: number
  deductionAmount: number
  totalAmount: number
  contractHourlyWage: number
  weekNumber: number
}

// 주휴수당 데이터 타입
export interface EditableWeeklyHolidayAllowance {
  weekStartDate: string
  weekEndDate: string
  weekNumber: number
  totalWorkHours: number
  holidayAllowanceHours: number
  applyTimelyAmount: number
  holidayAllowanceAmount: number
  deductionAmount: number
  totalAmount: number
  isEligible: boolean
}

// 저장용 수정 데이터 (localStorage에 저장)
export interface WorkTimeEditData {
  employeeInfoId: string
  startDate: string
  endDate: string
  payrollMonth: string
  editedRecords: EditableDailyRecord[]
  weeklyHolidayAllowances: EditableWeeklyHolidayAllowance[]
  grandTotalWorkHours: number
  grandTotalPaymentAmount: number
  grandTotalDeductionAmount: number
  grandTotalAmount: number
  contractHourlyWageInfo: {
    weekDayHourlyWage: number
    overtimeHourlyWage: number
    holidayHourlyWage: number
  }
  previousMonthWorkHours?: number
  previousMonthWorkStartDate?: string
  previousMonthWorkEndDate?: string
}

// localStorage 키
const WORKTIME_EDIT_STORAGE_KEY = 'parttime_worktime_edit_data'

// ISO 주차 번호 계산 함수
const getISOWeekNumber = (dateStr: string): number => {
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()
  const thursday = new Date(date)
  thursday.setDate(date.getDate() - ((dayOfWeek + 6) % 7) + 3)
  const firstThursday = new Date(thursday.getFullYear(), 0, 4)
  const weekNumber = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
  return weekNumber
}

export default function PartTimeWorkTimeEdit({
  id,
  startDate = '',
  endDate = '',
  employeeInfoId = '',
  payrollMonth = ''
}: PartTimeWorkTimeEditProps) {
  const router = useRouter()
  const [dailyRecords, setDailyRecords] = useState<EditableDailyRecord[]>([])
  const [weeklyHolidayAllowances, setWeeklyHolidayAllowances] = useState<EditableWeeklyHolidayAllowance[]>([])
  const [employeeName, setEmployeeName] = useState('')
  const [contractHourlyWageInfo, setContractHourlyWageInfo] = useState({
    weekDayHourlyWage: 0,
    overtimeHourlyWage: 0,
    holidayHourlyWage: 0
  })
  const [previousMonthWorkHours, setPreviousMonthWorkHours] = useState(0)
  const [previousMonthWorkStartDate, setPreviousMonthWorkStartDate] = useState<string | null>(null)
  const [previousMonthWorkEndDate, setPreviousMonthWorkEndDate] = useState<string | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // TanStack Query hook
  const { data: payrollData, isPending: isLoading } = useDailyWorkHours(
    { employeeInfoId: parseInt(employeeInfoId) || 0, startDate, endDate },
    !!startDate && !!endDate && !!employeeInfoId
  )

  // React 19 패턴: 렌더 단계에서 데이터 로드 처리
  if (payrollData && !isDataLoaded && startDate && endDate && employeeInfoId) {
    // localStorage 확인
    const savedData = localStorage.getItem(WORKTIME_EDIT_STORAGE_KEY)
    let loadedFromStorage = false

    if (savedData) {
      try {
        const parsed: WorkTimeEditData = JSON.parse(savedData)
        if (parsed.employeeInfoId === employeeInfoId &&
            parsed.startDate === startDate &&
            parsed.endDate === endDate) {
          setDailyRecords(parsed.editedRecords)
          setWeeklyHolidayAllowances(parsed.weeklyHolidayAllowances)
          setContractHourlyWageInfo(parsed.contractHourlyWageInfo)
          loadedFromStorage = true
        }
      } catch (e) {
        console.error('localStorage 데이터 파싱 실패:', e)
      }
    }

    if (!loadedFromStorage) {
      // API 데이터 변환
      setEmployeeName(payrollData.memberName || '')
      setContractHourlyWageInfo(payrollData.contractHourlyWageInfo)
      setPreviousMonthWorkHours(payrollData.previousMonthWorkHours || 0)
      setPreviousMonthWorkStartDate(payrollData.previousMonthWorkStartDate || null)
      setPreviousMonthWorkEndDate(payrollData.previousMonthWorkEndDate || null)

      const editableRecords: EditableDailyRecord[] = payrollData.items
        .filter(item => item.type === 'DAILY' && item.dailyRecord)
        .map(item => {
          const record = item.dailyRecord!
          return {
            date: record.date,
            dayOfWeek: record.dayOfWeek,
            dayOfWeekKorean: record.dayOfWeekKorean,
            originalWorkHours: record.workHours,
            workHours: record.workHours,
            originalApplyTimelyAmount: record.applyTimelyAmount,
            applyTimelyAmount: record.applyTimelyAmount,
            paymentAmount: record.paymentAmount,
            deductionAmount: record.deductionAmount,
            totalAmount: record.totalAmount,
            contractHourlyWage: payrollData.contractHourlyWageInfo.weekDayHourlyWage,
            weekNumber: getISOWeekNumber(record.date)
          }
        })

      const holidayAllowances: EditableWeeklyHolidayAllowance[] = payrollData.items
        .filter(item => item.type === 'WEEKLY_HOLIDAY_ALLOWANCE' && item.weeklyHolidayAllowance)
        .map(item => {
          const allowance = item.weeklyHolidayAllowance!
          return {
            weekStartDate: allowance.weekStartDate,
            weekEndDate: allowance.weekEndDate,
            weekNumber: allowance.weekNumber,
            totalWorkHours: allowance.totalWorkHours,
            holidayAllowanceHours: allowance.holidayAllowanceHours,
            applyTimelyAmount: allowance.applyTimelyAmount,
            holidayAllowanceAmount: allowance.holidayAllowanceAmount,
            deductionAmount: allowance.deductionAmount,
            totalAmount: allowance.totalAmount,
            isEligible: allowance.isEligible
          }
        })

      setDailyRecords(editableRecords)
      setWeeklyHolidayAllowances(holidayAllowances)
    }

    setIsDataLoaded(true)
  }

  const handleGoBack = () => {
    router.push(`/employee/payroll/parttime/${id}`)
  }

  const recalculateRecord = (record: EditableDailyRecord): EditableDailyRecord => {
    const paymentAmount = record.workHours * record.applyTimelyAmount
    const deductionAmount = Math.round(paymentAmount * 0.033)
    const totalAmount = paymentAmount - deductionAmount
    return {
      ...record,
      paymentAmount,
      deductionAmount,
      totalAmount
    }
  }

  const recalculateWeeklyHolidayAllowances = (
    records: EditableDailyRecord[],
    hourlyWage: number,
    prevMonthHours: number = 0
  ): EditableWeeklyHolidayAllowance[] => {
    const weeklyWorkHours: { [weekNumber: number]: { startDate: string; endDate: string; totalHours: number; isFirstWeek: boolean } } = {}
    let firstWeekNumber: number | null = null

    records.forEach(record => {
      const date = new Date(record.date)
      const dayOfWeek = date.getDay()
      const monday = new Date(date)
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      monday.setDate(date.getDate() + diffToMonday)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const weekNumber = Math.ceil((date.getDate() + (new Date(date.getFullYear(), date.getMonth(), 1).getDay() || 7) - 1) / 7)

      if (firstWeekNumber === null) {
        firstWeekNumber = weekNumber
      }

      if (!weeklyWorkHours[weekNumber]) {
        weeklyWorkHours[weekNumber] = {
          startDate: monday.toISOString().split('T')[0],
          endDate: sunday.toISOString().split('T')[0],
          totalHours: 0,
          isFirstWeek: weekNumber === firstWeekNumber
        }
      }
      weeklyWorkHours[weekNumber].totalHours += record.workHours
    })

    return Object.entries(weeklyWorkHours).map(([weekNum, data]) => {
      const weekNumber = parseInt(weekNum)
      const currentMonthHours = data.totalHours
      const totalWorkHoursForWeek = data.isFirstWeek && prevMonthHours > 0
        ? currentMonthHours + prevMonthHours
        : currentMonthHours
      const isEligible = totalWorkHoursForWeek >= 15
      const holidayAllowanceHours = isEligible ? Math.round((totalWorkHoursForWeek / 5) * 100) / 100 : 0
      const holidayAllowanceAmount = Math.round(holidayAllowanceHours * hourlyWage)
      const deductionAmount = Math.round(holidayAllowanceAmount * 0.033)
      const totalAmount = holidayAllowanceAmount - deductionAmount

      return {
        weekStartDate: data.startDate,
        weekEndDate: data.endDate,
        weekNumber,
        totalWorkHours: totalWorkHoursForWeek,
        holidayAllowanceHours,
        applyTimelyAmount: hourlyWage,
        holidayAllowanceAmount,
        deductionAmount,
        totalAmount,
        isEligible
      }
    }).sort((a, b) => a.weekNumber - b.weekNumber)
  }

  const handleApplyContractTime = () => {
    const updatedRecords = dailyRecords.map(record => {
      const updated = {
        ...record,
        applyTimelyAmount: contractHourlyWageInfo.weekDayHourlyWage
      }
      return recalculateRecord(updated)
    })

    const updatedAllowances = recalculateWeeklyHolidayAllowances(
      updatedRecords,
      contractHourlyWageInfo.weekDayHourlyWage,
      previousMonthWorkHours
    )

    setDailyRecords(updatedRecords)
    setWeeklyHolidayAllowances(updatedAllowances)

    const grandTotalWorkHours = updatedRecords.reduce((sum, r) => sum + r.workHours, 0)
    const grandTotalPaymentAmount = updatedRecords.reduce((sum, r) => sum + r.paymentAmount, 0)
    const grandTotalDeductionAmount = updatedRecords.reduce((sum, r) => sum + r.deductionAmount, 0)
    const grandTotalAmount = updatedRecords.reduce((sum, r) => sum + r.totalAmount, 0)

    const editData: WorkTimeEditData = {
      employeeInfoId,
      startDate,
      endDate,
      payrollMonth,
      editedRecords: updatedRecords,
      weeklyHolidayAllowances: updatedAllowances,
      grandTotalWorkHours,
      grandTotalPaymentAmount,
      grandTotalDeductionAmount,
      grandTotalAmount,
      contractHourlyWageInfo,
      previousMonthWorkHours: previousMonthWorkHours || undefined,
      previousMonthWorkStartDate: previousMonthWorkStartDate || undefined,
      previousMonthWorkEndDate: previousMonthWorkEndDate || undefined
    }

    localStorage.setItem(WORKTIME_EDIT_STORAGE_KEY, JSON.stringify(editData))

    alert('계약 시급이 적용되었습니다.')
    const targetPath = id === 'new' ? '/employee/payroll/parttime/new?fromWorkTime=true' : `/employee/payroll/parttime/${id}`
    router.push(targetPath)
  }

  const handleWorkHoursChange = (index: number, hours: number) => {
    setDailyRecords(prev => {
      const newRecords = [...prev]
      const updated = { ...newRecords[index], workHours: hours }
      newRecords[index] = recalculateRecord(updated)

      const avgHourlyWage = newRecords.length > 0
        ? newRecords.reduce((sum, r) => sum + r.applyTimelyAmount, 0) / newRecords.length
        : contractHourlyWageInfo.weekDayHourlyWage
      const updatedAllowances = recalculateWeeklyHolidayAllowances(newRecords, avgHourlyWage, previousMonthWorkHours)
      setWeeklyHolidayAllowances(updatedAllowances)

      return newRecords
    })
  }

  const handleApplyTimelyAmountChange = (index: number, amount: number) => {
    setDailyRecords(prev => {
      const newRecords = [...prev]
      const updated = { ...newRecords[index], applyTimelyAmount: amount }
      newRecords[index] = recalculateRecord(updated)

      const avgHourlyWage = newRecords.length > 0
        ? newRecords.reduce((sum, r) => sum + r.applyTimelyAmount, 0) / newRecords.length
        : contractHourlyWageInfo.weekDayHourlyWage
      const updatedAllowances = recalculateWeeklyHolidayAllowances(newRecords, avgHourlyWage, previousMonthWorkHours)
      setWeeklyHolidayAllowances(updatedAllowances)

      return newRecords
    })
  }

  const formatNumber = (num: number) => num.toLocaleString()

  const getDayOfWeekKorean = (dateStr: string) => {
    const dayOfWeekMap: { [key: number]: string } = {
      0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토'
    }
    const date = new Date(dateStr)
    return dayOfWeekMap[date.getDay()]
  }

  const hourOptions = Array.from({ length: 49 }, (_, i) => i * 0.5)

  // 합계 계산
  const dailyTotalWorkHours = dailyRecords.reduce((sum, r) => sum + r.workHours, 0)
  const dailyTotalPaymentAmount = dailyRecords.reduce((sum, r) => sum + r.paymentAmount, 0)
  const dailyTotalDeductionAmount = dailyRecords.reduce((sum, r) => sum + r.deductionAmount, 0)
  const dailyTotalAmount = dailyRecords.reduce((sum, r) => sum + r.totalAmount, 0)

  const holidayTotalHours = weeklyHolidayAllowances
    .filter(a => a.isEligible)
    .reduce((sum, a) => sum + a.holidayAllowanceHours, 0)
  const holidayTotalPaymentAmount = weeklyHolidayAllowances
    .filter(a => a.isEligible)
    .reduce((sum, a) => sum + a.holidayAllowanceAmount, 0)
  const holidayTotalDeductionAmount = weeklyHolidayAllowances
    .filter(a => a.isEligible)
    .reduce((sum, a) => sum + a.deductionAmount, 0)
  const holidayTotalAmount = weeklyHolidayAllowances
    .filter(a => a.isEligible)
    .reduce((sum, a) => sum + a.totalAmount, 0)

  const grandTotalWorkHours = dailyTotalWorkHours + holidayTotalHours
  const grandTotalPaymentAmount = dailyTotalPaymentAmount + holidayTotalPaymentAmount
  const grandTotalDeductionAmount = dailyTotalDeductionAmount + holidayTotalDeductionAmount
  const grandTotalAmount = dailyTotalAmount + holidayTotalAmount

  return (
    <div className="contents-wrap">
      <div className="contents-btn">
        <button className="btn-form basic" onClick={handleGoBack}>뒤로가기</button>
        <button className="btn-form primary" onClick={handleApplyContractTime} style={{ backgroundColor: '#3498db', color: '#fff', border: 'none' }}>계약 시간 적용</button>
      </div>

      {payrollMonth && (
        <div className="contents-info" style={{ marginBottom: '16px', padding: '12px 16px', background: '#f5f5f5', borderRadius: '4px' }}>
          <span style={{ marginRight: '24px' }}><strong>급여지급월:</strong> {payrollMonth}</span>
          <span style={{ marginRight: '24px' }}><strong>정산기간:</strong> {startDate} ~ {endDate}</span>
          {employeeName && <span><strong>직원명:</strong> {employeeName}</span>}
        </div>
      )}

      <div className="contents-body">
        <div className="content-wrap">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              데이터를 불러오는 중...
            </div>
          ) : dailyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              {!startDate || !endDate || !employeeInfoId
                ? '급여명세서 페이지에서 기간을 설정한 후 이동해주세요.'
                : '해당 기간의 근무 기록이 없습니다.'}
            </div>
          ) : (
            <table className="part-paystub-table">
              <colgroup>
                <col width="150px" />
                <col width="120px" />
                <col width="150px" />
                <col width="150px" />
                <col width="120px" />
                <col width="120px" />
              </colgroup>
              <thead>
                <tr>
                  <th>날짜/요일</th>
                  <th>
                    <div className="filed-flx center">
                      <span>근무시간</span>
                      <button className="tooltip-btn black">
                        <span className="tooltip-icon" id="worktime-tooltip-btn-anchor"></span>
                        <Tooltip className="tooltip-txt" anchorSelect="#worktime-tooltip-btn-anchor">
                          <div>근무 시간을 수정하면 지급액이 자동 계산됩니다.</div>
                          <div>공제액은 지급액의 3.3%로 자동 계산됩니다.</div>
                        </Tooltip>
                      </button>
                    </div>
                  </th>
                  <th>시급 (계약: {formatNumber(contractHourlyWageInfo.weekDayHourlyWage)}원)</th>
                  <th>지급액계</th>
                  <th>공제액</th>
                  <th>차인금액</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const sortedAllowances = [...weeklyHolidayAllowances].sort(
                    (a, b) => a.weekStartDate.localeCompare(b.weekStartDate)
                  )

                  const weekGroups = sortedAllowances.map(allowance => {
                    const records = dailyRecords.filter(record => {
                      return record.date >= allowance.weekStartDate && record.date <= allowance.weekEndDate
                    }).sort((a, b) => a.date.localeCompare(b.date))
                    return { allowance, records }
                  })

                  const hasPreviousMonthWorkHours = previousMonthWorkHours > 0

                  return (
                    <>
                      {hasPreviousMonthWorkHours && (
                        <tr className="previous-week-row" style={{ backgroundColor: '#f0f7ff' }}>
                          <td>
                            <strong>전 주 근무 내역</strong>
                            {previousMonthWorkStartDate && previousMonthWorkEndDate && (
                              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                                ({getDayOfWeekKorean(previousMonthWorkStartDate)}~{getDayOfWeekKorean(previousMonthWorkEndDate)})
                              </span>
                            )}
                          </td>
                          <td className="al-r"><strong>{previousMonthWorkHours}</strong></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      )}
                      {weekGroups.map(({ allowance, records }, weekIndex) => {
                        const weekNum = allowance.weekNumber
                        const weekWorkHours = records.reduce((sum, r) => sum + r.workHours, 0)
                        const weekPaymentAmount = records.reduce((sum, r) => sum + r.paymentAmount, 0)
                        const weekDeductionAmount = records.reduce((sum, r) => sum + r.deductionAmount, 0)
                        const weekTotalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0)

                        const weekTotalWorkHours = weekWorkHours + (allowance.isEligible ? allowance.holidayAllowanceHours : 0)
                        const weekTotalPayment = weekPaymentAmount + (allowance.isEligible ? allowance.holidayAllowanceAmount : 0)
                        const weekTotalDeduction = weekDeductionAmount + (allowance.isEligible ? allowance.deductionAmount : 0)
                        const weekTotalNet = weekTotalAmount + (allowance.isEligible ? allowance.totalAmount : 0)

                        const getOriginalIndex = (record: EditableDailyRecord) => {
                          return dailyRecords.findIndex(r => r.date === record.date)
                        }

                        return (
                          <React.Fragment key={`week-${weekNum}-${weekIndex}`}>
                            {records.map((record) => {
                              const originalIndex = getOriginalIndex(record)
                              return (
                                <tr key={record.date} className={record.workHours === 0 ? 'disabled' : ''}>
                                  <td>{record.date} ({record.dayOfWeekKorean})</td>
                                  <td>
                                    <select
                                      className="select-form"
                                      value={record.workHours}
                                      onChange={(e) => handleWorkHoursChange(originalIndex, parseFloat(e.target.value))}
                                      style={{ width: '100%' }}
                                    >
                                      {hourOptions.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <div className="filed-flx">
                                      <input
                                        type="text"
                                        className="input-frame al-r"
                                        value={formatNumber(record.applyTimelyAmount)}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/,/g, '')
                                          const numValue = parseInt(value) || 0
                                          handleApplyTimelyAmountChange(originalIndex, numValue)
                                        }}
                                        style={{ width: '100px' }}
                                      />
                                      <span style={{ marginLeft: '4px' }}>원</span>
                                    </div>
                                  </td>
                                  <td className="al-r">{formatNumber(record.paymentAmount)}</td>
                                  <td className="al-r">{formatNumber(record.deductionAmount)}</td>
                                  <td className="al-r">{formatNumber(record.totalAmount)}</td>
                                </tr>
                              )
                            })}
                            <tr className="weekly-subtotal">
                              <td style={{ backgroundColor: '#e8f4fc' }}><strong>소계 ({weekNum}주차)</strong></td>
                              <td className="al-r" style={{ backgroundColor: '#e8f4fc' }}><strong>{weekWorkHours}</strong></td>
                              <td className="al-r" style={{ backgroundColor: '#e8f4fc' }}>-</td>
                              <td className="al-r" style={{ backgroundColor: '#e8f4fc' }}><strong>{formatNumber(weekPaymentAmount)}</strong></td>
                              <td className="al-r" style={{ backgroundColor: '#e8f4fc' }}><strong>{formatNumber(weekDeductionAmount)}</strong></td>
                              <td className="al-r" style={{ backgroundColor: '#e8f4fc' }}><strong>{formatNumber(weekTotalAmount)}</strong></td>
                            </tr>
                            <tr className="weekly-holiday">
                              <td style={{ backgroundColor: '#e8f5e9' }}>
                                <strong>주휴수당 ({weekNum}주차)</strong>
                                {!allowance.isEligible && <span style={{ color: '#999', marginLeft: '4px' }}>(미대상)</span>}
                              </td>
                              <td className="al-r" style={{ backgroundColor: '#e8f5e9' }}>{allowance.isEligible ? allowance.holidayAllowanceHours.toFixed(2) : 0}</td>
                              <td className="al-r" style={{ backgroundColor: '#e8f5e9' }}>{formatNumber(allowance.applyTimelyAmount)}</td>
                              <td className="al-r" style={{ backgroundColor: '#e8f5e9' }}>{formatNumber(allowance.isEligible ? allowance.holidayAllowanceAmount : 0)}</td>
                              <td className="al-r" style={{ backgroundColor: '#e8f5e9' }}>{formatNumber(allowance.isEligible ? allowance.deductionAmount : 0)}</td>
                              <td className="al-r" style={{ backgroundColor: '#e8f5e9' }}>{formatNumber(allowance.isEligible ? allowance.totalAmount : 0)}</td>
                            </tr>
                            <tr className="weekly-total">
                              <td style={{ backgroundColor: '#fff8e1' }}><strong>합계 ({weekNum}주차)</strong></td>
                              <td className="al-r" style={{ backgroundColor: '#fff8e1' }}><strong>{weekTotalWorkHours.toFixed(2)}</strong></td>
                              <td className="al-r" style={{ backgroundColor: '#fff8e1' }}>{formatNumber(records[0]?.applyTimelyAmount || allowance.applyTimelyAmount)}</td>
                              <td className="al-r" style={{ backgroundColor: '#fff8e1' }}><strong>{formatNumber(weekTotalPayment)}</strong></td>
                              <td className="al-r" style={{ backgroundColor: '#fff8e1' }}><strong>{formatNumber(weekTotalDeduction)}</strong></td>
                              <td className="al-r" style={{ backgroundColor: '#fff8e1' }}><strong>{formatNumber(weekTotalNet)}</strong></td>
                            </tr>
                          </React.Fragment>
                        )
                      })}
                      <tr className="grand-total" style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                        <td><strong>총 합계</strong></td>
                        <td className="al-r"><strong>{grandTotalWorkHours.toFixed(2)}</strong></td>
                        <td className="al-r">-</td>
                        <td className="al-r"><strong>{formatNumber(grandTotalPaymentAmount)}</strong></td>
                        <td className="al-r"><strong>{formatNumber(grandTotalDeductionAmount)}</strong></td>
                        <td className="al-r"><strong>{formatNumber(grandTotalAmount)}</strong></td>
                      </tr>
                    </>
                  )
                })()}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
