'use client'
import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Tooltip } from 'react-tooltip'
import { useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import {
  WORKTIME_EDIT_STORAGE_KEY,
  loadBonusPreload,
} from '@/lib/session/parttime-edit-session'
import type { DailyWorkHoursSummaryResponse } from '@/lib/api/partTimerPayrollStatement'

interface PartTimeWorkTimeEditProps {
  id: string
  startDate?: string
  endDate?: string
  employeeInfoId?: string
  payrollMonth?: string
  returnToDetail?: boolean
  headOfficeId?: string
  franchiseId?: string
  /** 페이지 레벨에서 미리 조회한 초기 데이터 (key prop 리마운트와 함께 사용) */
  initialPayrollData: DailyWorkHoursSummaryResponse | null
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
  contractWorkHours: number
  weekNumber: number
}

// 편집 가능한 상여금 데이터 타입
export interface EditableBonusItem {
  id: number
  bonusCode?: string
  bonusName: string
  bonusAmount: number
  deductionAmount: number
  isActive: boolean
  itemOrder: number
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
  bonusItems?: EditableBonusItem[]
  bonusTaxRate?: number
}

// 날짜 범위 내 모든 날짜 생성
const generateDateRange = (start: string, end: string): string[] => {
  const dates: string[] = []
  const current = new Date(start)
  const endDate = new Date(end)
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

const DAY_OF_WEEK_KOREAN = ['일', '월', '화', '수', '목', '금', '토']
const DAY_OF_WEEK_ENGLISH = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

const getWeekRange = (dateStr: string): { weekStartDate: string; weekEndDate: string } => {
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()
  const monday = new Date(date)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(date.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const format = (value: Date) => {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    weekStartDate: format(monday),
    weekEndDate: format(sunday),
  }
}

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

// ─── 편집기 초기 상태 계산 (순수 함수, 컴포넌트 마운트 시 1회 실행) ──────────────
// react-hooks/set-state-in-effect 규칙 준수: useEffect 대신 useState lazy initializer 사용
// 부모(page)에서 initialPayrollData + key prop으로 리마운트를 제어함
function computeEditorInitialState(
  employeeInfoId: string,
  startDate: string,
  endDate: string,
  payrollData: DailyWorkHoursSummaryResponse | null,
): {
  dailyRecords: EditableDailyRecord[]
  weeklyHolidayAllowances: EditableWeeklyHolidayAllowance[]
  contractHourlyWageInfo: { weekDayHourlyWage: number; overtimeHourlyWage: number; holidayHourlyWage: number }
  employeeName: string
  previousMonthWorkHours: number
  previousMonthWorkStartDate: string | null
  previousMonthWorkEndDate: string | null
  bonusItems: EditableBonusItem[]
  bonusTaxRate: number
} {
  // localStorage 우선 확인 (편집 중 임시 저장 데이터)
  const savedData = typeof window !== 'undefined' ? localStorage.getItem(WORKTIME_EDIT_STORAGE_KEY) : null

  if (savedData) {
    try {
      const parsed: WorkTimeEditData = JSON.parse(savedData)
      if (
        parsed.employeeInfoId === employeeInfoId &&
        parsed.startDate === startDate &&
        parsed.endDate === endDate
      ) {
        // API contractWorkHours로 localStorage의 0 고정 값 보정
        const apiContractHoursMap = new Map<string, number>()
        if (payrollData?.items) {
          payrollData.items
            .filter(item => item.type === 'DAILY' && item.dailyRecord)
            .forEach(item => {
              apiContractHoursMap.set(item.dailyRecord!.date, item.dailyRecord!.contractWorkHours)
            })
        }
        const records = parsed.editedRecords.map(r => ({
          ...r,
          contractWorkHours: apiContractHoursMap.get(r.date) ?? r.contractWorkHours ?? 0,
        }))

        const contractHourlyWageInfo = payrollData?.contractHourlyWageInfo ?? parsed.contractHourlyWageInfo

        let bonusItems: EditableBonusItem[] = parsed.bonusItems ?? []
        let bonusTaxRate = parsed.bonusTaxRate ?? 0.033
        if (!parsed.bonusItems) {
          const bp = loadBonusPreload(employeeInfoId)
          if (bp) {
            bonusItems = bp.bonusItems
            bonusTaxRate = bp.bonusTaxRate
          }
        }

        return {
          dailyRecords: records,
          weeklyHolidayAllowances: parsed.weeklyHolidayAllowances,
          contractHourlyWageInfo,
          employeeName: payrollData?.memberName ?? '',
          previousMonthWorkHours: payrollData?.previousMonthWorkHours ?? 0,
          previousMonthWorkStartDate: payrollData?.previousMonthWorkStartDate ?? null,
          previousMonthWorkEndDate: payrollData?.previousMonthWorkEndDate ?? null,
          bonusItems,
          bonusTaxRate,
        }
      }
    } catch (e) {
      console.error('localStorage 데이터 파싱 실패:', e)
    }
  }

  // localStorage 없음 → API 데이터로 초기화
  const defaultWage = payrollData?.contractHourlyWageInfo?.weekDayHourlyWage ?? 0

  const apiRecords: EditableDailyRecord[] = (payrollData?.items ?? [])
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
        contractHourlyWage: defaultWage,
        contractWorkHours: record.contractWorkHours,
        weekNumber: getISOWeekNumber(record.date),
      }
    })

  // API가 반환하지 않은 날짜를 기간 내 전체 날짜로 채우기
  const apiDates = new Set(apiRecords.map(r => r.date))
  const allDates = generateDateRange(startDate, endDate)
  const filledRecords: EditableDailyRecord[] = allDates
    .filter(d => !apiDates.has(d))
    .map(date => {
      const dayIdx = new Date(date).getDay()
      return {
        date,
        dayOfWeek: DAY_OF_WEEK_ENGLISH[dayIdx],
        dayOfWeekKorean: DAY_OF_WEEK_KOREAN[dayIdx],
        originalWorkHours: 0,
        workHours: 0,
        originalApplyTimelyAmount: defaultWage,
        applyTimelyAmount: defaultWage,
        paymentAmount: 0,
        deductionAmount: 0,
        totalAmount: 0,
        contractHourlyWage: defaultWage,
        contractWorkHours: 0,
        weekNumber: getISOWeekNumber(date),
      }
    })

  const editableRecords = [...apiRecords, ...filledRecords].sort((a, b) => a.date.localeCompare(b.date))

  const holidayAllowances: EditableWeeklyHolidayAllowance[] = (payrollData?.items ?? [])
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
        isEligible: allowance.isEligible,
      }
    })

  const bp = loadBonusPreload(employeeInfoId)

  return {
    dailyRecords: editableRecords,
    weeklyHolidayAllowances: holidayAllowances,
    contractHourlyWageInfo: payrollData?.contractHourlyWageInfo ?? {
      weekDayHourlyWage: 0,
      overtimeHourlyWage: 0,
      holidayHourlyWage: 0,
    },
    employeeName: payrollData?.memberName ?? '',
    previousMonthWorkHours: payrollData?.previousMonthWorkHours ?? 0,
    previousMonthWorkStartDate: payrollData?.previousMonthWorkStartDate ?? null,
    previousMonthWorkEndDate: payrollData?.previousMonthWorkEndDate ?? null,
    bonusItems: bp?.bonusItems ?? [],
    bonusTaxRate: bp?.bonusTaxRate ?? 0.033,
  }
}

export default function PartTimeWorkTimeEdit({
  id,
  startDate = '',
  endDate = '',
  employeeInfoId = '',
  payrollMonth = '',
  returnToDetail = false,
  initialPayrollData,
}: PartTimeWorkTimeEditProps) {
  const router = useRouter()
  const { alert } = useAlert()

  // 초기 상태를 마운트 시 1회만 계산 (lazy initializer)
  // react-hooks/set-state-in-effect 준수: useEffect + setState 대신 lazy useState 사용
  // 부모 페이지에서 key={`${employeeInfoId}-${startDate}-${endDate}`}로 리마운트 제어
  const [initData] = useState(() =>
    computeEditorInitialState(employeeInfoId, startDate, endDate, initialPayrollData)
  )

  // 사용자가 편집 가능한 상태 (setXxx 포함)
  const [dailyRecords, setDailyRecords] = useState(initData.dailyRecords)
  const [weeklyHolidayAllowances, setWeeklyHolidayAllowances] = useState(initData.weeklyHolidayAllowances)
  const [bonusItems, setBonusItems] = useState(initData.bonusItems)
  // bonusTaxRate는 사용자가 직접 수정하지 않으므로 const로 선언
  const bonusTaxRate = initData.bonusTaxRate

  // 읽기 전용 초기값 (API에서 한 번만 설정, 사용자가 직접 수정하지 않음)
  const employeeName = initData.employeeName
  const contractHourlyWageInfo = initData.contractHourlyWageInfo
  const previousMonthWorkHours = initData.previousMonthWorkHours
  const previousMonthWorkStartDate = initData.previousMonthWorkStartDate
  const previousMonthWorkEndDate = initData.previousMonthWorkEndDate

  const getReturnPath = (withFromParam = false) => {
    const suffix = withFromParam ? '?fromWorkTimeEdit=true' : ''
    if (returnToDetail) return `/employee/payroll/parttime/${id}${suffix}`
    if (id === 'new') return `/employee/payroll/parttime/new${suffix}`
    return `/employee/payroll/parttime/${id}/edit${suffix}`
  }

  const handleGoBack = () => {
    router.push(getReturnPath())
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

  const handleApplyContractTime = async () => {
    const updatedRecords = dailyRecords.map(record => {
      const day = new Date(record.date).getDay()
      const isWeekend = day === 0 || day === 6
      const wage = isWeekend && contractHourlyWageInfo.holidayHourlyWage > 0
        ? contractHourlyWageInfo.holidayHourlyWage
        : contractHourlyWageInfo.weekDayHourlyWage
      const updated = {
        ...record,
        workHours: record.contractWorkHours ?? record.workHours,
        applyTimelyAmount: wage
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

    await alert('계약서 기준 시간과 시급이 적용되었습니다.')
  }

  const handleSaveWorkTime = async () => {
    const eligibleAllowances = weeklyHolidayAllowances.filter(a => a.isEligible)

    const grandTotalWorkHours =
      dailyRecords.reduce((sum, r) => sum + r.workHours, 0) +
      eligibleAllowances.reduce((sum, a) => sum + a.holidayAllowanceHours, 0)
    const grandTotalPaymentAmount =
      dailyRecords.reduce((sum, r) => sum + r.paymentAmount, 0) +
      eligibleAllowances.reduce((sum, a) => sum + a.holidayAllowanceAmount, 0)
    const grandTotalDeductionAmount =
      dailyRecords.reduce((sum, r) => sum + r.deductionAmount, 0) +
      eligibleAllowances.reduce((sum, a) => sum + a.deductionAmount, 0)
    const grandTotalAmount =
      dailyRecords.reduce((sum, r) => sum + r.totalAmount, 0) +
      eligibleAllowances.reduce((sum, a) => sum + a.totalAmount, 0)

    const editData: WorkTimeEditData = {
      employeeInfoId,
      startDate,
      endDate,
      payrollMonth,
      editedRecords: dailyRecords,
      weeklyHolidayAllowances,
      grandTotalWorkHours,
      grandTotalPaymentAmount,
      grandTotalDeductionAmount,
      grandTotalAmount,
      contractHourlyWageInfo,
      previousMonthWorkHours: previousMonthWorkHours || undefined,
      previousMonthWorkStartDate: previousMonthWorkStartDate || undefined,
      previousMonthWorkEndDate: previousMonthWorkEndDate || undefined,
      bonusItems: bonusItems.length > 0 ? bonusItems : undefined,
      bonusTaxRate,
    }

    localStorage.setItem(WORKTIME_EDIT_STORAGE_KEY, JSON.stringify(editData))

    await alert('저장되었습니다.')
    router.push(getReturnPath(true))
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

  const handleToggleBonus = (id: number) => {
    setBonusItems(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b))
  }

  const handleBonusAmountChange = (id: number, amount: number) => {
    setBonusItems(prev => prev.map(b => {
      if (b.id !== id) return b
      const deductionAmount = Math.floor(amount * bonusTaxRate)
      return { ...b, bonusAmount: amount, deductionAmount }
    }))
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

  const hourOptions: SelectOption[] = useMemo(() =>
    Array.from({ length: 49 }, (_, i) => {
      const value = i * 0.5
      return { value: value.toString(), label: value.toString() }
    }), []
  )

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
        <button className="btn-form basic" onClick={handleSaveWorkTime}>저장</button>
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
          {dailyRecords.length === 0 ? (
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
                  const allowanceMap = new Map(
                    weeklyHolidayAllowances.map(allowance => [`${allowance.weekStartDate}_${allowance.weekEndDate}`, allowance])
                  )

                  const weekGroups = Array.from(
                    dailyRecords.reduce((map, record) => {
                      const { weekStartDate, weekEndDate } = getWeekRange(record.date)
                      const key = `${weekStartDate}_${weekEndDate}`
                      const current = map.get(key)

                      if (current) {
                        current.records.push(record)
                      } else {
                        map.set(key, {
                          key,
                          weekStartDate,
                          weekEndDate,
                          records: [record],
                        })
                      }

                      return map
                    }, new Map<string, {
                      key: string
                      weekStartDate: string
                      weekEndDate: string
                      records: EditableDailyRecord[]
                    }>())
                      .values()
                  )
                    .map(group => {
                      const records = group.records.sort((a, b) => a.date.localeCompare(b.date))
                      const allowance = allowanceMap.get(group.key) ?? {
                        weekStartDate: group.weekStartDate,
                        weekEndDate: group.weekEndDate,
                        weekNumber: records[0]?.weekNumber ?? 0,
                        totalWorkHours: records.reduce((sum, record) => sum + record.workHours, 0),
                        holidayAllowanceHours: 0,
                        applyTimelyAmount: records[0]?.applyTimelyAmount ?? contractHourlyWageInfo.weekDayHourlyWage,
                        holidayAllowanceAmount: 0,
                        deductionAmount: 0,
                        totalAmount: 0,
                        isEligible: false,
                      }

                      return { allowance, records }
                    })
                    .sort((a, b) => a.allowance.weekStartDate.localeCompare(b.allowance.weekStartDate))

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
                                    <SearchSelect
                                      options={hourOptions}
                                      value={hourOptions.find(opt => opt.value === record.workHours.toString()) || null}
                                      onChange={(opt) => handleWorkHoursChange(originalIndex, parseFloat(opt?.value || '0'))}
                                      placeholder="시간"
                                    />
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
                      {bonusItems.map((bonus) => (
                        <tr key={bonus.id} className="grand-total" style={{ backgroundColor: '#fffbe6', color: bonus.isActive ? '#333' : '#aaa' }}>
                          <td><strong>{bonus.bonusName}</strong></td>
                          <td className="al-c">
                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                              <input type="checkbox" checked={bonus.isActive} onChange={() => handleToggleBonus(bonus.id)} style={{ display: 'none' }} />
                              <span style={{ width: '40px', height: '22px', backgroundColor: bonus.isActive ? '#4CAF50' : '#ccc', borderRadius: '11px', position: 'relative', display: 'inline-block', transition: 'background-color 0.2s' }}>
                                <span style={{ position: 'absolute', width: '18px', height: '18px', backgroundColor: '#fff', borderRadius: '50%', top: '2px', left: bonus.isActive ? '20px' : '2px', transition: 'left 0.2s' }} />
                              </span>
                            </label>
                          </td>
                          <td className="al-r">-</td>
                          <td className="al-r">
                            {bonus.isActive ? (
                              <div className="filed-flx" style={{ justifyContent: 'flex-end' }}>
                                <input
                                  type="text"
                                  className="input-frame al-r"
                                  value={formatNumber(bonus.bonusAmount)}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, '')
                                    handleBonusAmountChange(bonus.id, parseInt(value) || 0)
                                  }}
                                  style={{ width: '100px' }}
                                />
                                <span style={{ marginLeft: '4px' }}>원</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="al-r"><strong style={{ color: bonus.isActive ? '#333' : '#aaa' }}>{bonus.isActive ? formatNumber(bonus.deductionAmount) : '-'}</strong></td>
                          <td className="al-r"><strong style={{ color: bonus.isActive ? '#333' : '#aaa' }}>{bonus.isActive ? formatNumber(bonus.bonusAmount - bonus.deductionAmount) : '-'}</strong></td>
                        </tr>
                      ))}
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
