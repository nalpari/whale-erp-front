'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tooltip } from 'react-tooltip'
import { useDailyOvertimeHours } from '@/hooks/queries/use-payroll-queries'

interface OvertimeWorkTimeEditProps {
  id: string
  startDate?: string
  endDate?: string
  employeeInfoId?: string
  payrollMonth?: string
}

// 편집 가능한 일별 연장근무 데이터 타입
export interface EditableOvertimeRecord {
  date: string
  dayOfWeek: string
  dayOfWeekKorean: string
  originalOvertimeHours: number
  overtimeHours: number
  overtimeStartTime?: string
  overtimeEndTime?: string
  originalApplyTimelyAmount: number
  applyTimelyAmount: number
  paymentAmount: number
  deductionAmount: number
  totalAmount: number
  contractHourlyWage: number
  weekNumber: number
}

// 주간 소계 데이터 타입
export interface EditableWeeklySubtotal {
  weekStartDate: string
  weekEndDate: string
  weekNumber: number
  totalOvertimeHours: number
  totalPaymentAmount: number
  totalDeductionAmount: number
  totalAmount: number
}

// 저장용 수정 데이터 (localStorage에 저장)
export interface OvertimeWorkTimeEditData {
  employeeInfoId: string
  startDate: string
  endDate: string
  payrollMonth: string
  editedRecords: EditableOvertimeRecord[]
  weeklySubtotals: EditableWeeklySubtotal[]
  grandTotalOvertimeHours: number
  grandTotalPaymentAmount: number
  grandTotalDeductionAmount: number
  grandTotalAmount: number
  applyTimelyAmount: number
}

// localStorage 키
const OVERTIME_WORKTIME_EDIT_STORAGE_KEY = 'overtime_worktime_edit_data'

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

export default function OvertimeWorkTimeEdit({
  id,
  startDate = '',
  endDate = '',
  employeeInfoId = '',
  payrollMonth = ''
}: OvertimeWorkTimeEditProps) {
  const router = useRouter()
  const [dailyRecords, setDailyRecords] = useState<EditableOvertimeRecord[]>([])
  const [_weeklySubtotals, setWeeklySubtotals] = useState<EditableWeeklySubtotal[]>([])
  const [applyTimelyAmount, setApplyTimelyAmount] = useState(0)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // TanStack Query: 일별 연장근무 시간 조회
  const { data: overtimeData, isPending: isLoading } = useDailyOvertimeHours(
    { employeeInfoId: parseInt(employeeInfoId) || 0, startDate, endDate },
    !!startDate && !!endDate && !!employeeInfoId
  )

  // 데이터 로드 처리
  if (overtimeData && !isDataLoaded) {
    // 1. localStorage에 저장된 수정 데이터가 있는지 확인
    const savedData = localStorage.getItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)
    if (savedData) {
      try {
        const parsed: OvertimeWorkTimeEditData = JSON.parse(savedData)
        if (parsed.employeeInfoId === employeeInfoId &&
            parsed.startDate === startDate &&
            parsed.endDate === endDate) {
          setDailyRecords(parsed.editedRecords)
          setWeeklySubtotals(parsed.weeklySubtotals)
          setApplyTimelyAmount(parsed.applyTimelyAmount)
          setIsDataLoaded(true)
          return
        }
      } catch (e) {
        console.error('localStorage 데이터 파싱 실패:', e)
      }
    }

    // 2. 저장된 데이터가 없으면 API 데이터 사용
    setApplyTimelyAmount(overtimeData.applyTimelyAmount || 0)

    const editableRecords: EditableOvertimeRecord[] = overtimeData.items
      .filter(item => item.type === 'DAILY' && item.dailyRecord)
      .map(item => {
        const record = item.dailyRecord!
        return {
          date: record.date,
          dayOfWeek: record.dayOfWeek,
          dayOfWeekKorean: record.dayOfWeekKorean,
          originalOvertimeHours: record.overtimeHours,
          overtimeHours: record.overtimeHours,
          overtimeStartTime: record.overtimeStartTime,
          overtimeEndTime: record.overtimeEndTime,
          originalApplyTimelyAmount: record.applyTimelyAmount,
          applyTimelyAmount: record.applyTimelyAmount,
          paymentAmount: record.paymentAmount,
          deductionAmount: record.deductionAmount,
          totalAmount: record.totalAmount,
          contractHourlyWage: Math.round(record.applyTimelyAmount / 1.5),
          weekNumber: getISOWeekNumber(record.date)
        }
      })

    const subtotals: EditableWeeklySubtotal[] = overtimeData.items
      .filter(item => item.type === 'WEEKLY_SUBTOTAL' && item.weeklySubtotal)
      .map(item => {
        const subtotal = item.weeklySubtotal!
        return {
          weekStartDate: subtotal.weekStartDate,
          weekEndDate: subtotal.weekEndDate,
          weekNumber: subtotal.weekNumber,
          totalOvertimeHours: subtotal.totalOvertimeHours,
          totalPaymentAmount: subtotal.totalPaymentAmount,
          totalDeductionAmount: subtotal.totalDeductionAmount,
          totalAmount: subtotal.totalAmount
        }
      })

    setDailyRecords(editableRecords)
    setWeeklySubtotals(subtotals)
    setIsDataLoaded(true)
  }

  const handleGoBack = () => {
    const targetPath = id === 'new' ? '/employee/payroll/overtime/new' : `/employee/payroll/overtime/${id}`
    router.push(targetPath)
  }

  // 계산 로직
  const recalculateRecord = (record: EditableOvertimeRecord): EditableOvertimeRecord => {
    const paymentAmount = Math.round(record.overtimeHours * record.applyTimelyAmount)
    const deductionAmount = Math.round(paymentAmount * 0.033)
    const totalAmount = paymentAmount - deductionAmount
    return {
      ...record,
      paymentAmount,
      deductionAmount,
      totalAmount
    }
  }

  // 주간 소계 재계산
  const recalculateWeeklySubtotals = (records: EditableOvertimeRecord[]): EditableWeeklySubtotal[] => {
    const weeklyData: { [weekNumber: number]: { startDate: string; endDate: string; hours: number; payment: number; deduction: number; total: number } } = {}

    records.forEach(record => {
      const date = new Date(record.date)
      const dayOfWeek = date.getDay()

      const monday = new Date(date)
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      monday.setDate(date.getDate() + diffToMonday)

      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      const weekNumber = record.weekNumber

      if (!weeklyData[weekNumber]) {
        weeklyData[weekNumber] = {
          startDate: monday.toISOString().split('T')[0],
          endDate: sunday.toISOString().split('T')[0],
          hours: 0,
          payment: 0,
          deduction: 0,
          total: 0
        }
      }
      weeklyData[weekNumber].hours += record.overtimeHours
      weeklyData[weekNumber].payment += record.paymentAmount
      weeklyData[weekNumber].deduction += record.deductionAmount
      weeklyData[weekNumber].total += record.totalAmount
    })

    return Object.entries(weeklyData).map(([weekNum, data]) => ({
      weekStartDate: data.startDate,
      weekEndDate: data.endDate,
      weekNumber: parseInt(weekNum),
      totalOvertimeHours: data.hours,
      totalPaymentAmount: data.payment,
      totalDeductionAmount: data.deduction,
      totalAmount: data.total
    })).sort((a, b) => a.weekNumber - b.weekNumber)
  }

  const handleSave = () => {
    const grandTotalOvertimeHours = dailyRecords.reduce((sum, r) => sum + r.overtimeHours, 0)
    const grandTotalPaymentAmount = dailyRecords.reduce((sum, r) => sum + r.paymentAmount, 0)
    const grandTotalDeductionAmount = dailyRecords.reduce((sum, r) => sum + r.deductionAmount, 0)
    const grandTotalAmount = dailyRecords.reduce((sum, r) => sum + r.totalAmount, 0)

    const updatedSubtotals = recalculateWeeklySubtotals(dailyRecords)

    const editData: OvertimeWorkTimeEditData = {
      employeeInfoId,
      startDate,
      endDate,
      payrollMonth,
      editedRecords: dailyRecords,
      weeklySubtotals: updatedSubtotals,
      grandTotalOvertimeHours,
      grandTotalPaymentAmount,
      grandTotalDeductionAmount,
      grandTotalAmount,
      applyTimelyAmount
    }

    localStorage.setItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY, JSON.stringify(editData))

    alert('저장되었습니다.')
    const targetPath = id === 'new' ? '/employee/payroll/overtime/new?fromWorkTimeEdit=true' : `/employee/payroll/overtime/${id}?fromWorkTimeEdit=true`
    router.push(targetPath)
  }

  const handleApplyContractTime = () => {
    const updatedRecords = dailyRecords.map(record => {
      const updated = {
        ...record,
        applyTimelyAmount: Math.round(record.contractHourlyWage * 1.5)
      }
      return recalculateRecord(updated)
    })

    const updatedSubtotals = recalculateWeeklySubtotals(updatedRecords)
    setDailyRecords(updatedRecords)
    setWeeklySubtotals(updatedSubtotals)

    const grandTotalOvertimeHours = updatedRecords.reduce((sum, r) => sum + r.overtimeHours, 0)
    const grandTotalPaymentAmount = updatedRecords.reduce((sum, r) => sum + r.paymentAmount, 0)
    const grandTotalDeductionAmount = updatedRecords.reduce((sum, r) => sum + r.deductionAmount, 0)
    const grandTotalAmount = updatedRecords.reduce((sum, r) => sum + r.totalAmount, 0)

    const editData: OvertimeWorkTimeEditData = {
      employeeInfoId,
      startDate,
      endDate,
      payrollMonth,
      editedRecords: updatedRecords,
      weeklySubtotals: updatedSubtotals,
      grandTotalOvertimeHours,
      grandTotalPaymentAmount,
      grandTotalDeductionAmount,
      grandTotalAmount,
      applyTimelyAmount
    }

    localStorage.setItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY, JSON.stringify(editData))

    alert('계약 시급이 적용되었습니다.')
    const targetPath = id === 'new' ? '/employee/payroll/overtime/new?fromWorkTimeEdit=true' : `/employee/payroll/overtime/${id}?fromWorkTimeEdit=true`
    router.push(targetPath)
  }

  const handleOvertimeHoursChange = (index: number, hours: number) => {
    setDailyRecords(prev => {
      const newRecords = [...prev]
      const current = newRecords[index]
      const minutes = (current.overtimeHours % 1) * 60
      const updated = { ...current, overtimeHours: hours + minutes / 60 }
      newRecords[index] = recalculateRecord(updated)
      setWeeklySubtotals(recalculateWeeklySubtotals(newRecords))
      return newRecords
    })
  }

  const handleOvertimeMinutesChange = (index: number, minutes: number) => {
    setDailyRecords(prev => {
      const newRecords = [...prev]
      const current = newRecords[index]
      const hours = Math.floor(current.overtimeHours)
      const updated = { ...current, overtimeHours: hours + minutes / 60 }
      newRecords[index] = recalculateRecord(updated)
      setWeeklySubtotals(recalculateWeeklySubtotals(newRecords))
      return newRecords
    })
  }

  const handleApplyTimelyAmountChange = (index: number, amount: number) => {
    setDailyRecords(prev => {
      const newRecords = [...prev]
      const updated = { ...newRecords[index], applyTimelyAmount: amount }
      newRecords[index] = recalculateRecord(updated)
      setWeeklySubtotals(recalculateWeeklySubtotals(newRecords))
      return newRecords
    })
  }

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return ''
    return num.toLocaleString()
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => i)
  const minuteOptions = [0, 30]

  if (isLoading) {
    return (
      <div className="contents-wrap">
        <div className="contents-body">
          <div className="content-wrap" style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
            데이터를 불러오고 있습니다...
          </div>
        </div>
      </div>
    )
  }

  if (!startDate || !endDate || !employeeInfoId) {
    return (
      <div className="contents-wrap">
        <div className="contents-body">
          <div className="content-wrap" style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
            연장근무 기간 정보가 없습니다. 먼저 직원을 선택하고 기간을 설정해주세요.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="contents-wrap">
      <div className="contents-btn">
        <button className="btn-form basic" onClick={handleGoBack}>뒤로가기</button>
        <button className="btn-form outline s" onClick={handleApplyContractTime}>계약 시간 적용</button>
        <button className="btn-form primary" onClick={handleSave}>저장</button>
      </div>
      <div className="contents-body">
        <div className="content-wrap">
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <strong>기간:</strong> {startDate} ~ {endDate} | <strong>적용 시급:</strong> {formatNumber(applyTimelyAmount)}원
          </div>
          <table className="part-time-table">
            <colgroup>
              <col width="200px" />
              <col width="240px" />
              <col />
              <col width="200px" />
              <col width="300px" />
            </colgroup>
            <thead>
              <tr>
                <th>날짜/요일</th>
                <th>연장근무 시간</th>
                <th>
                  <div className="filed-flx center">
                    <span>근무 시간 수정</span>
                    <button className="tooltip-btn black">
                      <span className="tooltip-icon" id="overtime-worktime-tooltip-btn-anchor"></span>
                      <Tooltip className="tooltip-txt" anchorSelect="#overtime-worktime-tooltip-btn-anchor">
                        <div>근무 시간을 입력하지 않을 경우 해당 날짜는 연장근무가 없는 날짜로 인식합니다.</div>
                        <div>연장근무시간은 정규 근무시간 이후의 시간만 입력하세요.</div>
                      </Tooltip>
                    </button>
                  </div>
                </th>
                <th>계약 시급</th>
                <th>적용 시급</th>
              </tr>
            </thead>
            <tbody>
              {dailyRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    조회된 연장근무 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                dailyRecords.map((record, index) => {
                  const hours = Math.floor(record.overtimeHours)
                  const minutes = Math.round((record.overtimeHours % 1) * 60)
                  const isNoWork = record.overtimeHours === 0

                  return (
                    <tr key={record.date} className={isNoWork ? 'disabled' : ''}>
                      <td>{record.date} ({record.dayOfWeekKorean})</td>
                      <td>
                        {record.overtimeStartTime && record.overtimeEndTime
                          ? `${record.overtimeHours}시간 (${record.overtimeStartTime} ~ ${record.overtimeEndTime})`
                          : record.overtimeHours > 0 ? `${record.overtimeHours}시간` : '-'
                        }
                      </td>
                      <td>
                        <div className="filed-flx">
                          <div className="filed-flx g8">
                            <div className="mx-100">
                              <select
                                className="select-form"
                                value={hours}
                                onChange={(e) => handleOvertimeHoursChange(index, parseInt(e.target.value))}
                              >
                                {hourOptions.map(h => (
                                  <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                                ))}
                              </select>
                            </div>
                            <span className="won">시간</span>
                            <div className="mx-100">
                              <select
                                className="select-form"
                                value={minutes}
                                onChange={(e) => handleOvertimeMinutesChange(index, parseInt(e.target.value))}
                              >
                                {minuteOptions.map(m => (
                                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                ))}
                              </select>
                            </div>
                            <span className="won">분</span>
                          </div>
                        </div>
                      </td>
                      <td className="al-r">{formatNumber(record.contractHourlyWage)}</td>
                      <td>
                        <div className="filed-flx">
                          <div className="block">
                            <input
                              type="text"
                              className="input-frame al-r"
                              value={formatNumber(record.applyTimelyAmount)}
                              onChange={(e) => {
                                const value = parseInt(e.target.value.replace(/,/g, '')) || 0
                                handleApplyTimelyAmountChange(index, value)
                              }}
                            />
                          </div>
                          <span className="won">원</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
              {dailyRecords.length > 0 && (
                <tr className="grand-total" style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                  <td><strong>총 합계</strong></td>
                  <td className="al-r">
                    <strong>{dailyRecords.reduce((sum, r) => sum + r.overtimeHours, 0).toFixed(1)}시간</strong>
                  </td>
                  <td className="al-r">
                    <strong>지급액: {formatNumber(dailyRecords.reduce((sum, r) => sum + r.paymentAmount, 0))}원</strong>
                  </td>
                  <td className="al-r">
                    <strong>공제액: {formatNumber(dailyRecords.reduce((sum, r) => sum + r.deductionAmount, 0))}원</strong>
                  </td>
                  <td className="al-r">
                    <strong>실수령액: {formatNumber(dailyRecords.reduce((sum, r) => sum + r.totalAmount, 0))}원</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
