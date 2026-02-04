'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '../../ui/common/DatePicker'
import {
  useOvertimePayrollDetail,
  useDailyOvertimeHours,
  useDeleteOvertimePayroll,
  useSendOvertimePayrollEmail,
  useDownloadOvertimePayrollExcel,
} from '@/hooks/queries/use-payroll-queries'
import { useEmployeeListByType } from '@/hooks/queries/use-employee-queries'
import { createOvertimeAllowanceStatement } from '@/lib/api/overtimeAllowanceStatement'
import type {
  DailyOvertimeHoursItem,
  OvertimeAllowanceItemDto,
  PostOvertimeAllowanceStatementRequest,
} from '@/lib/api/overtimeAllowanceStatement'
import { OvertimeWorkTimeEditData, EditableOvertimeRecord, EditableWeeklySubtotal } from './OvertimeWorkTimeEdit'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID } from '@/lib/constants/organization'

// 날짜 변환 유틸
const parseStringToDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? null : parsed
}

const formatDateToString = (date: Date | null): string => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// localStorage 키
const OVERTIME_WORKTIME_EDIT_STORAGE_KEY = 'overtime_worktime_edit_data'

interface OvertimePayStubProps {
  id: string
  isEditMode?: boolean
  fromWorkTimeEdit?: boolean
}

export default function OvertimePayStub({ id, isEditMode = false, fromWorkTimeEdit = false }: OvertimePayStubProps) {
  const router = useRouter()
  const isNewMode = isEditMode && id === 'new'
  const statementId = isNewMode ? undefined : parseInt(id)

  // State
  const [payrollMonth, setPayrollMonth] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [employeeInfoId, setEmployeeInfoId] = useState<number | null>(null)
  const [remarks, setRemarks] = useState('')
  const [isSearched, setIsSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedWorkTimeData, setEditedWorkTimeData] = useState<OvertimeWorkTimeEditData | null>(null)

  // TanStack Query hooks
  const { data: existingStatement } = useOvertimePayrollDetail(statementId)
  const { data: employeeList = [] } = useEmployeeListByType(
    { headOfficeId: DEFAULT_HEAD_OFFICE_ID, franchiseId: DEFAULT_FRANCHISE_ID, employeeType: 'FULL_TIME' },
    isNewMode
  )
  const { data: overtimeData, refetch: refetchOvertimeData } = useDailyOvertimeHours(
    { employeeInfoId: employeeInfoId ?? 0, startDate, endDate },
    false
  )

  // Mutations
  const deleteMutation = useDeleteOvertimePayroll()
  const sendEmailMutation = useSendOvertimePayrollEmail()
  const downloadExcelMutation = useDownloadOvertimePayrollExcel()

  // React 19: derived state
  const selectedEmployee = employeeList.find(emp => emp.employeeInfoId === employeeInfoId) ?? null

  // 기존 데이터 로드 처리
  useEffect(() => {
    if (existingStatement && !isNewMode && !payrollMonth) {
      if (existingStatement.allowanceYearMonth) {
        const ym = existingStatement.allowanceYearMonth
        const yearMonth = `${ym.substring(0, 4)}-${ym.substring(4, 6)}`
         
        setPayrollMonth(yearMonth)
      }
       
      if (existingStatement.calculationStartDate) setStartDate(existingStatement.calculationStartDate)
       
      if (existingStatement.calculationEndDate) setEndDate(existingStatement.calculationEndDate)
       
      if (existingStatement.paymentDate) setPaymentDate(existingStatement.paymentDate)
       
      if (existingStatement.remarks) setRemarks(existingStatement.remarks)
       
      if (existingStatement.details?.length > 0) setIsSearched(true)
    }
  }, [existingStatement, isNewMode, payrollMonth])

  // localStorage에서 수정 데이터 로드
  useEffect(() => {
    if (fromWorkTimeEdit && isNewMode && !editedWorkTimeData) {
      const savedData = localStorage.getItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)
      if (savedData) {
        try {
          const parsed: OvertimeWorkTimeEditData = JSON.parse(savedData)
           
          setEditedWorkTimeData(parsed)
           
          if (parsed.payrollMonth) setPayrollMonth(parsed.payrollMonth)
           
          if (parsed.startDate) setStartDate(parsed.startDate)
           
          if (parsed.endDate) setEndDate(parsed.endDate)
          if (parsed.employeeInfoId) {
            const empId = parseInt(parsed.employeeInfoId)
             
            setEmployeeInfoId(empId)
          }
           
          setIsSearched(true)

          // 로드 후 localStorage에서 제거하여 stale reads 방지
          localStorage.removeItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)
        } catch (error) {
          console.error('localStorage 데이터 파싱 실패:', error)
        }
      }
    }
  }, [fromWorkTimeEdit, isNewMode, editedWorkTimeData])

  const handleGoToList = () => {
    router.push('/employee/payroll/overtime')
  }

  const handleDelete = async () => {
    if (!existingStatement?.id) return
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await deleteMutation.mutateAsync(existingStatement.id)
      alert('삭제되었습니다.')
      router.push('/employee/payroll/overtime')
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSendEmail = async () => {
    if (!existingStatement?.id) return

    try {
      await sendEmailMutation.mutateAsync(existingStatement.id)
      alert('이메일 전송이 요청되었습니다.')
    } catch (error) {
      console.error('이메일 전송 실패:', error)
      alert('이메일 전송 중 오류가 발생했습니다.')
    }
  }

  const handleDownloadExcel = async () => {
    if (!existingStatement?.id) return

    try {
      const blob = await downloadExcelMutation.mutateAsync(existingStatement.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `연장근무수당명세서_${existingStatement.id}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error)
      alert('엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }

  // 직원 선택 핸들러
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value)
    if (isNaN(selectedId)) {
      setEmployeeInfoId(null)
      setPayrollMonth('')
      setStartDate('')
      setEndDate('')
      setPaymentDate('')
      return
    }
    setEmployeeInfoId(selectedId)
    const employee = employeeList.find(emp => emp.employeeInfoId === selectedId)

    // 급여 지급 월/일에 따라 자동 기간 설정
    if (employee?.salaryMonth && employee?.salaryDay) {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      const isNextMonth = employee.salaryMonth === 'SLRCF_002'
      const payrollYear = currentYear
      const payrollMonthNum = currentMonth

      const payrollMonthStr = `${payrollYear}-${String(payrollMonthNum).padStart(2, '0')}`
      setPayrollMonth(payrollMonthStr)

      let periodYear: number
      let periodMonth: number

      if (isNextMonth) {
        periodMonth = currentMonth === 1 ? 12 : currentMonth - 1
        periodYear = currentMonth === 1 ? currentYear - 1 : currentYear
      } else {
        periodMonth = currentMonth
        periodYear = currentYear
      }

      const lastDay = new Date(periodYear, periodMonth, 0).getDate()
      setStartDate(`${periodYear}-${String(periodMonth).padStart(2, '0')}-01`)
      setEndDate(`${periodYear}-${String(periodMonth).padStart(2, '0')}-${lastDay}`)
      setPaymentDate(`${payrollYear}-${String(payrollMonthNum).padStart(2, '0')}-${String(employee.salaryDay).padStart(2, '0')}`)
    }
  }

  const handleGoToWorkTimeEdit = () => {
    if (!employeeInfoId) {
      alert('직원을 선택해주세요.')
      return
    }
    if (!startDate || !endDate) {
      alert('지급 월을 선택하고 기간을 설정해주세요.')
      return
    }
    const params = new URLSearchParams({
      startDate,
      endDate,
      employeeInfoId: String(employeeInfoId),
      payrollMonth
    })
    router.push(`/employee/payroll/overtime/${id}/worktime?${params.toString()}`)
  }

  const handlePayrollMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isEditMode) return

    const month = e.target.value
    setPayrollMonth(month)

    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const prevMonth = monthNum === 1 ? 12 : monthNum - 1
      const prevYear = monthNum === 1 ? year - 1 : year
      const lastDay = new Date(prevYear, prevMonth, 0).getDate()

      setStartDate(`${prevYear}-${String(prevMonth).padStart(2, '0')}-01`)
      setEndDate(`${prevYear}-${String(prevMonth).padStart(2, '0')}-${lastDay}`)
      setPaymentDate(`${year}-${String(monthNum).padStart(2, '0')}-05`)
    } else {
      setStartDate('')
      setEndDate('')
      setPaymentDate('')
    }
  }

  // React 19 Compiler가 자동 최적화
  const handleSearch = async () => {
    if (!isEditMode) return

    if (!employeeInfoId) {
      alert('직원을 선택해주세요.')
      return
    }

    if (!payrollMonth || !startDate || !endDate) {
      alert('지급 월과 기간을 설정해주세요.')
      return
    }

    setIsLoading(true)
    try {
      await refetchOvertimeData()
      setIsSearched(true)
    } catch (error) {
      console.error('일별 연장근무 시간 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 저장
  const handleSave = async () => {
    if (!employeeInfoId || !selectedEmployee) {
      alert('직원을 선택해주세요.')
      return
    }

    if (!payrollMonth || !startDate || !endDate) {
      alert('지급 월과 기간을 설정해주세요.')
      return
    }

    if (!overtimeData && !existingStatement && !editedWorkTimeData) {
      alert('먼저 연장근무 시간을 조회해주세요.')
      return
    }

    setIsSaving(true)
    try {
      let details: OvertimeAllowanceItemDto[] = []

      if (editedWorkTimeData) {
        details = editedWorkTimeData.editedRecords.map(record => ({
          workDay: record.date,
          workHour: record.overtimeHours,
          breakTimeHour: 0,
          contractTimelyAmount: record.contractHourlyWage,
          applyTimelyAmount: record.applyTimelyAmount,
          actualOvertimeHours: record.overtimeHours,
          overtimeStartTime: record.overtimeStartTime,
          overtimeEndTime: record.overtimeEndTime,
          deductionAmount: record.deductionAmount,
          actualPaymentAmount: record.paymentAmount
        }))
      } else if (overtimeData) {
        details = overtimeData.items
          .filter(item => item.type === 'DAILY' && item.dailyRecord)
          .map(item => {
            const record = item.dailyRecord!
            return {
              workDay: record.date,
              workHour: record.overtimeHours,
              breakTimeHour: 0,
              contractTimelyAmount: Math.round(record.applyTimelyAmount / 1.5),
              applyTimelyAmount: record.applyTimelyAmount,
              actualOvertimeHours: record.overtimeHours,
              overtimeStartTime: record.overtimeStartTime,
              overtimeEndTime: record.overtimeEndTime,
              deductionAmount: record.deductionAmount,
              actualPaymentAmount: record.paymentAmount
            }
          })
      } else if (existingStatement) {
        details = existingStatement.details
      }

      const allowanceYearMonth = payrollMonth.replace('-', '')

      const request: PostOvertimeAllowanceStatementRequest = {
        employeeInfoId,
        allowanceYearMonth,
        calculationStartDate: startDate,
        calculationEndDate: endDate,
        paymentDate: paymentDate || undefined,
        remarks: remarks || undefined,
        details
      }

      await createOvertimeAllowanceStatement(request)

      // 저장 성공 시 localStorage cleanup
      localStorage.removeItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)

      alert('연장근무 수당명세서가 생성되었습니다.')
      router.push('/employee/payroll/overtime')
    } catch (error) {
      console.error('연장근무 수당명세서 저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return ''
    return num.toLocaleString()
  }

  const getDayOfWeekKorean = (dateStr: string) => {
    const dayOfWeekMap: { [key: number]: string } = {
      0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토'
    }
    const date = new Date(dateStr)
    return dayOfWeekMap[date.getDay()]
  }

  const renderTableRow = (item: DailyOvertimeHoursItem, index: number) => {
    switch (item.type) {
      case 'DAILY': {
        if (!item.dailyRecord) return null
        const record = item.dailyRecord
        return (
          <tr key={index}>
            <td>{record.date} ({record.dayOfWeekKorean})</td>
            <td className="al-r">{formatNumber(record.overtimeHours)}</td>
            <td className="al-r">{formatNumber(record.applyTimelyAmount)}</td>
            <td className="al-r">{formatNumber(record.paymentAmount)}</td>
            <td className="al-r">{formatNumber(record.deductionAmount)}</td>
            <td className="al-r">{formatNumber(record.totalAmount)}</td>
          </tr>
        )
      }
      case 'WEEKLY_SUBTOTAL': {
        if (!item.weeklySubtotal) return null
        const subtotal = item.weeklySubtotal
        return (
          <tr key={index} className="gray">
            <td>소계 ({subtotal.weekNumber}주차)</td>
            <td className="al-r">{formatNumber(subtotal.totalOvertimeHours)}</td>
            <td className="al-r">-</td>
            <td className="al-r">{formatNumber(subtotal.totalPaymentAmount)}</td>
            <td className="al-r">{formatNumber(subtotal.totalDeductionAmount)}</td>
            <td className="al-r">{formatNumber(subtotal.totalAmount)}</td>
          </tr>
        )
      }
      default:
        return null
    }
  }

  const renderExistingDetailRow = (item: OvertimeAllowanceItemDto, index: number) => {
    return (
      <tr key={`detail-${index}`}>
        <td>{item.workDay} ({getDayOfWeekKorean(item.workDay)})</td>
        <td className="al-r">{formatNumber(item.actualOvertimeHours)}</td>
        <td className="al-r">{formatNumber(item.applyTimelyAmount)}</td>
        <td className="al-r">{formatNumber(item.actualPaymentAmount)}</td>
        <td className="al-r">{formatNumber(item.deductionAmount)}</td>
        <td className="al-r">{formatNumber(item.actualPaymentAmount - item.deductionAmount)}</td>
      </tr>
    )
  }

  const renderEditedWorkTimeRow = (record: EditableOvertimeRecord, index: number) => {
    return (
      <tr key={`edited-${index}`}>
        <td>{record.date} ({record.dayOfWeekKorean})</td>
        <td className="al-r">{formatNumber(record.overtimeHours)}</td>
        <td className="al-r">{formatNumber(record.applyTimelyAmount)}</td>
        <td className="al-r">{formatNumber(record.paymentAmount)}</td>
        <td className="al-r">{formatNumber(record.deductionAmount)}</td>
        <td className="al-r">{formatNumber(record.totalAmount)}</td>
      </tr>
    )
  }

  const renderEditedWeeklySubtotalRow = (subtotal: EditableWeeklySubtotal, index: number) => {
    return (
      <tr key={`edited-subtotal-${index}`} className="gray">
        <td>소계 ({subtotal.weekNumber}주차)</td>
        <td className="al-r">{formatNumber(subtotal.totalOvertimeHours)}</td>
        <td className="al-r">-</td>
        <td className="al-r">{formatNumber(subtotal.totalPaymentAmount)}</td>
        <td className="al-r">{formatNumber(subtotal.totalDeductionAmount)}</td>
        <td className="al-r">{formatNumber(subtotal.totalAmount)}</td>
      </tr>
    )
  }

  const renderEditedWorkTimeTable = () => {
    if (!editedWorkTimeData) return null

    const rows: React.ReactNode[] = []
    let currentWeek = 0

    editedWorkTimeData.editedRecords.forEach((record, index) => {
      if (record.weekNumber !== currentWeek && currentWeek !== 0) {
        const subtotal = editedWorkTimeData.weeklySubtotals.find(s => s.weekNumber === currentWeek)
        if (subtotal) {
          rows.push(renderEditedWeeklySubtotalRow(subtotal, currentWeek))
        }
      }
      currentWeek = record.weekNumber
      rows.push(renderEditedWorkTimeRow(record, index))
    })

    if (currentWeek !== 0) {
      const subtotal = editedWorkTimeData.weeklySubtotals.find(s => s.weekNumber === currentWeek)
      if (subtotal) {
        rows.push(renderEditedWeeklySubtotalRow(subtotal, currentWeek))
      }
    }

    return rows
  }

  const generateMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      options.push({ value, label: value })
    }
    return options
  }

  return (
    <div className="contents-wrap">
      <div className="contents-btn">
        <button className="btn-form basic" onClick={handleGoToList}>목록</button>
        {!isEditMode && id !== 'new' && (
          <>
            <button className="btn-form outline s" onClick={handleSendEmail}>이메일 전송</button>
            <button className="btn-form outline s" onClick={handleDownloadExcel}>다운로드</button>
            <button className="btn-form gray" onClick={handleDelete}>삭제</button>
          </>
        )}
        {isEditMode && (
          <>
            <button className="btn-form outline s" onClick={handleGoToWorkTimeEdit}>근무 시간 수정</button>
            {id !== 'new' && (
              <button className="btn-form gray" onClick={handleDelete}>삭제</button>
            )}
            <button className="btn-form basic" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장중...' : '저장'}
            </button>
          </>
        )}
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
                <th>직원 소속</th>
                <td>
                  <div className="filed-flx">
                    <div className="radio-group">
                      <label className="radio-label">
                        <input type="radio" name="affiliation" value="headquarter" defaultChecked disabled={!isEditMode} />
                        <span>본사</span>
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="affiliation" value="franchise" disabled={!isEditMode} />
                        <span>가맹점</span>
                      </label>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th>본사/가맹점 선택</th>
                <td>
                  <div className="filed-flx">
                    <div className="block">
                      <select className="select-form" disabled={!isEditMode}>
                        <option value="">따름인</option>
                      </select>
                    </div>
                    <div className="block">
                      <select className="select-form" disabled={!isEditMode}>
                        <option value="">을지로3가점</option>
                      </select>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th>점포 선택</th>
                <td>
                  <div className="block">
                    <select className="select-form" disabled={!isEditMode}>
                      <option value="">힘이나는커피생활 을지로3가점</option>
                    </select>
                  </div>
                </td>
              </tr>
              <tr>
                <th>
                  직원명 <span className="red">*</span>
                </th>
                <td>
                  <div className="filed-flx">
                    <div className="block" style={{ maxWidth: '250px' }}>
                      {id === 'new' ? (
                        <select
                          className="select-form"
                          value={employeeInfoId || ''}
                          onChange={handleEmployeeChange}
                          disabled={!isEditMode}
                        >
                          <option value="">직원을 선택하세요</option>
                          {employeeList.map(emp => (
                            <option key={emp.employeeInfoId} value={emp.employeeInfoId}>
                              {emp.employeeName} ({emp.contractClassificationName || '정직원'})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select className="select-form" disabled>
                          <option value="">{existingStatement?.memberName || '-'}</option>
                        </select>
                      )}
                    </div>
                    <span className="info-text">{selectedEmployee?.employeeNumber || existingStatement?.memberId || '-'}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <th>
                  지급 월 <span className="red">*</span>
                </th>
                <td>
                  <div className="filed-flx">
                    <div className="block" style={{ maxWidth: '150px' }}>
                      <select
                        className="select-form"
                        value={payrollMonth}
                        onChange={handlePayrollMonthChange}
                        disabled={!isEditMode}
                      >
                        <option value="">선택</option>
                        {generateMonthOptions().map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {paymentDate && <span className="info-text">지급일 : {paymentDate}</span>}
                  </div>
                </td>
              </tr>
              <tr>
                <th>
                  연장근무 기간 <span className="red">*</span>
                </th>
                <td>
                  <div className="filed-flx">
                    <div className="date-picker-wrap">
                      <DatePicker
                        value={parseStringToDate(startDate)}
                        onChange={(date) => isEditMode && setStartDate(formatDateToString(date))}
                      />
                      <span>~</span>
                      <DatePicker
                        value={parseStringToDate(endDate)}
                        onChange={(date) => isEditMode && setEndDate(formatDateToString(date))}
                      />
                    </div>
                    {isEditMode && (
                      <button className="btn-form outline s" onClick={handleSearch} disabled={isLoading}>
                        {isLoading ? '조회중...' : '검색'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <th>비고</th>
                <td>
                  <div className="block">
                    <input
                      type="text"
                      className="input-frame"
                      value={remarks}
                      onChange={(e) => isEditMode && setRemarks(e.target.value)}
                      placeholder="비고를 입력하세요"
                      readOnly={!isEditMode}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="content-wrap">
          <table className="part-paystub-table">
            <thead>
              <tr>
                <th>날짜/요일</th>
                <th>연장근무 시간</th>
                <th>시급</th>
                <th>지급액계</th>
                <th>공제액</th>
                <th>차인금액</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    데이터를 조회하고 있습니다...
                  </td>
                </tr>
              ) : !isEditMode && existingStatement && existingStatement.details.length > 0 ? (
                <>
                  {existingStatement.details.map((item, index) => renderExistingDetailRow(item, index))}
                  <tr className="grand-total">
                    <td><strong>최종합</strong></td>
                    <td className="al-r"><strong>{formatNumber(existingStatement.totalOvertimeHours)}</strong></td>
                    <td className="al-r"><strong>-</strong></td>
                    <td className="al-r"><strong>{formatNumber(existingStatement.grossOvertimeAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(existingStatement.totalDeductionAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(existingStatement.actualOvertimeAmount)}</strong></td>
                  </tr>
                </>
              ) : editedWorkTimeData && editedWorkTimeData.editedRecords.length > 0 ? (
                <>
                  {renderEditedWorkTimeTable()}
                  <tr className="grand-total">
                    <td><strong>최종합</strong></td>
                    <td className="al-r"><strong>{formatNumber(editedWorkTimeData.grandTotalOvertimeHours)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(editedWorkTimeData.applyTimelyAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(editedWorkTimeData.grandTotalPaymentAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(editedWorkTimeData.grandTotalDeductionAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(editedWorkTimeData.grandTotalAmount)}</strong></td>
                  </tr>
                </>
              ) : !isSearched ? (
                <tr>
                  <td colSpan={6} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    {isEditMode
                      ? '지급 월을 선택하고 기간 설정 후 검색 버튼을 클릭해주세요.'
                      : '등록된 연장근무 수당 데이터가 없습니다.'
                    }
                  </td>
                </tr>
              ) : !overtimeData || overtimeData.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                <>
                  {overtimeData.items.map((item, index) => renderTableRow(item, index))}
                  <tr className="grand-total">
                    <td><strong>최종합</strong></td>
                    <td className="al-r"><strong>{formatNumber(overtimeData.grandTotalOvertimeHours)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(overtimeData.applyTimelyAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(overtimeData.grandTotalPaymentAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(overtimeData.grandTotalDeductionAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(overtimeData.grandTotalAmount)}</strong></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {!(isEditMode && id === 'new') && (
        <div className="content-wrap">
          <div className="slidebox-wrap">
            <div className="slidebox-header">
              <h2>등록 및 수정 이력</h2>
            </div>
            <div className="slidebox-body">
              <div className="detail-data-wrap">
                <table className="detail-data-table">
                  <colgroup>
                    <col width="200px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>등록자/등록일</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{existingStatement?.createdByName || '-'}</span>
                          </li>
                          <li className="detail-data-item">
                            <span className="detail-data-text">{existingStatement?.createdAt?.split('T')[0] || '-'}</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <th>최근수정자/최근수정일</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{existingStatement?.updatedByName || '-'}</span>
                          </li>
                          <li className="detail-data-item">
                            <span className="detail-data-text">{existingStatement?.updatedAt?.split('T')[0] || '-'}</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
