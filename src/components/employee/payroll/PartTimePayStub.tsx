'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '../../ui/common/DatePicker'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useAlert } from '@/components/common/ui'
import {
  usePartTimePayrollDetail,
  useDailyWorkHours,
  useUpdatePartTimePayroll,
  useDeletePartTimePayroll,
  useSendPartTimePayrollEmail,
  useDownloadPartTimePayrollExcel,
} from '@/hooks/queries/use-payroll-queries'
import { useEmployeeListByType } from '@/hooks/queries/use-employee-queries'
import { createPartTimerPayrollStatement, getPartTimerPayrollStatements } from '@/lib/api/partTimerPayrollStatement'
import type {
  DailyWorkHoursItem,
  PartTimerPaymentItemResponse,
  WeeklyPaidHolidayAllowanceResponse,
  CreatePartTimerPayrollStatementRequest,
  PartTimerPaymentItemRequest,
  UpdatePartTimerPayrollStatementRequest,
  PartTimerDeductionItemRequest,
} from '@/lib/api/partTimerPayrollStatement'
import { WorkTimeEditData } from './PartTimeWorkTimeEdit'
import { useBpHeadOfficeTree } from '@/hooks/queries'
import { useStoreOptions } from '@/hooks/queries/use-store-queries'
import { useAuthStore } from '@/stores/auth-store'

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
const WORKTIME_EDIT_STORAGE_KEY = 'parttime_worktime_edit_data'

interface PartTimePayStubProps {
  id: string
  isEditMode?: boolean
  fromWorkTimeEdit?: boolean
}

export default function PartTimePayStub({ id, isEditMode = false, fromWorkTimeEdit = false }: PartTimePayStubProps) {
  const router = useRouter()
  const { alert, confirm } = useAlert()
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
  const [salaryDay, setSalaryDay] = useState<number>(5)
  const [isSearched, setIsSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editedWorkTimeData, setEditedWorkTimeData] = useState<WorkTimeEditData | null>(null)

  // 4대보험 공제
  const [nationalPension, setNationalPension] = useState('')
  const [healthInsurance, setHealthInsurance] = useState('')
  const [employmentInsurance, setEmploymentInsurance] = useState('')
  const [longTermCareInsurance, setLongTermCareInsurance] = useState('')

  // Organization selection state
  const [selectedHeadquarter, setSelectedHeadquarter] = useState<string>('')
  const [selectedFranchise, setSelectedFranchise] = useState<string>('')
  const [selectedStore, setSelectedStore] = useState<string>('')

  // BP 트리 데이터
  const { accessToken, affiliationId } = useAuthStore()
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree = [] } = useBpHeadOfficeTree(isReady)

  // 점포 옵션 조회
  const headOfficeIdNum = selectedHeadquarter ? parseInt(selectedHeadquarter) : null
  const franchiseIdNum = selectedFranchise ? parseInt(selectedFranchise) : null
  const { data: storeOptionList = [] } = useStoreOptions(headOfficeIdNum, franchiseIdNum)

  // TanStack Query hooks
  const { data: existingStatement, isPending: isDetailLoading } = usePartTimePayrollDetail(statementId)
  const { data: employeeList = [] } = useEmployeeListByType(
    { headOfficeId: headOfficeIdNum ?? 0, franchiseId: franchiseIdNum ?? undefined, employeeType: 'PART_TIME' },
    isNewMode && !!headOfficeIdNum
  )
  const { data: payrollData, refetch: refetchPayrollData } = useDailyWorkHours(
    { employeeInfoId: employeeInfoId ?? 0, startDate, endDate },
    false
  )

  // Mutations
  const updateMutation = useUpdatePartTimePayroll()
  const deleteMutation = useDeletePartTimePayroll()
  const sendEmailMutation = useSendPartTimePayrollEmail()
  const downloadExcelMutation = useDownloadPartTimePayrollExcel()

  // React 19: derived state
  const selectedEmployee = employeeList.find(emp => emp.employeeInfoId === employeeInfoId) ?? null

  // Select options
  const headquarterOptions: SelectOption[] = useMemo(() =>
    bpTree.map((office) => ({ value: String(office.id), label: office.name }))
  , [bpTree])

  const franchiseOptions: SelectOption[] = useMemo(() => {
    if (!headOfficeIdNum) return []
    const office = bpTree.find((o) => o.id === headOfficeIdNum)
    return office?.franchises.map((f) => ({ value: String(f.id), label: f.name })) ?? []
  }, [bpTree, headOfficeIdNum])

  const storeOptions: SelectOption[] = useMemo(() =>
    storeOptionList.map(store => ({ value: String(store.id), label: store.storeName }))
  , [storeOptionList])

  const employeeOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '파트타이머를 선택하세요' },
    ...employeeList.map(emp => ({
      value: String(emp.employeeInfoId),
      label: `${emp.employeeName} (${emp.contractClassificationName || '파트타이머'})`
    }))
  ], [employeeList])

  const monthOptions: SelectOption[] = useMemo(() => {
    const options = [{ value: '', label: '선택' }]
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      options.push({ value, label: value })
    }
    return options
  }, [])

  // 기존 데이터 로드 처리
  useEffect(() => {
    if (existingStatement && !isNewMode && !payrollMonth) {
      if (existingStatement.payrollYearMonth) {
        const yearMonth = existingStatement.payrollYearMonth.substring(0, 4) + '-' + existingStatement.payrollYearMonth.substring(4, 6)

        setPayrollMonth(yearMonth)
      }

      if (existingStatement.settlementStartDate) setStartDate(existingStatement.settlementStartDate)

      if (existingStatement.settlementEndDate) setEndDate(existingStatement.settlementEndDate)

      if (existingStatement.paymentDate) setPaymentDate(existingStatement.paymentDate)

      if (existingStatement.paymentItems?.length > 0) setIsSearched(true)

      // 공제 항목에서 4대보험 값 로드 (콤마 포맷팅)
      // 먼저 초기화하여 이전 명세서의 잔여값 방지
      setNationalPension('')
      setHealthInsurance('')
      setEmploymentInsurance('')
      setLongTermCareInsurance('')
      if (existingStatement.deductionItems?.length > 0) {
        existingStatement.deductionItems.forEach(item => {
          const val = (item.amount || 0).toLocaleString()
          switch (item.itemCode) {
            case 'NATIONAL_PENSION': setNationalPension(val); break
            case 'HEALTH_INSURANCE': setHealthInsurance(val); break
            case 'EMPLOYMENT_INSURANCE': setEmploymentInsurance(val); break
            case 'LONG_TERM_CARE_INSURANCE': setLongTermCareInsurance(val); break
          }
        })
      }
    }
  }, [existingStatement, isNewMode, payrollMonth])

  // localStorage에서 수정 데이터 로드
  useEffect(() => {
    if (fromWorkTimeEdit && isNewMode && !editedWorkTimeData) {
      const savedData = localStorage.getItem(WORKTIME_EDIT_STORAGE_KEY)
      if (savedData) {
        try {
          const parsed: WorkTimeEditData = JSON.parse(savedData)
           
          setEditedWorkTimeData(parsed)
           
          if (parsed.payrollMonth) setPayrollMonth(parsed.payrollMonth)
           
          if (parsed.startDate) setStartDate(parsed.startDate)
           
          if (parsed.endDate) setEndDate(parsed.endDate)
           
          setIsSearched(true)
        } catch (error) {
          console.error('localStorage 데이터 파싱 실패:', error)
        }
      }
    }
  }, [fromWorkTimeEdit, isNewMode, editedWorkTimeData])

  const handleGoToList = () => {
    router.push('/employee/payroll/parttime')
  }

  const handleDelete = async () => {
    if (!existingStatement?.id) return
    if (!(await confirm('정말 삭제하시겠습니까?'))) return

    try {
      await deleteMutation.mutateAsync(existingStatement.id)
      await alert('삭제되었습니다.')
      router.push('/employee/payroll/parttime')
    } catch (error) {
      console.error('삭제 실패:', error)
      await alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSendEmail = async () => {
    if (!existingStatement?.id) return

    try {
      await sendEmailMutation.mutateAsync(existingStatement.id)
      await alert('이메일 전송이 요청되었습니다.')
    } catch (error) {
      console.error('이메일 전송 실패:', error)
      await alert('이메일 전송 중 오류가 발생했습니다.')
    }
  }

  const handleDownloadExcel = async () => {
    if (!existingStatement?.id) return

    try {
      const blob = await downloadExcelMutation.mutateAsync(existingStatement.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `part-timer-payroll-statement-${existingStatement.id}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error)
      await alert('엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }

  const handleEmployeeChange = (value: string) => {
    const selectedId = parseInt(value)
    if (isNaN(selectedId) || !value) {
      setEmployeeInfoId(null)
      setPayrollMonth('')
      setStartDate('')
      setEndDate('')
      setPaymentDate('')
      return
    }
    setEmployeeInfoId(selectedId)
    const employee = employeeList.find(emp => emp.employeeInfoId === selectedId)

    if (employee?.salaryMonth && employee?.salaryDay) {
      setSalaryDay(employee.salaryDay)
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

  const handleGoToWorkTimeEdit = async () => {
    if (!employeeInfoId) {
      await alert('파트타이머를 선택해주세요.')
      return
    }
    if (!startDate || !endDate) {
      await alert('급여지급월을 선택하고 기간을 설정해주세요.')
      return
    }
    const params = new URLSearchParams({
      startDate,
      endDate,
      employeeInfoId: String(employeeInfoId),
      payrollMonth
    })
    router.push(`/employee/payroll/parttime/${id}/worktime?${params.toString()}`)
  }

  const handlePayrollMonthChange = async (month: string) => {
    if (!isEditMode) return

    if (month) {
      if (!employeeInfoId) {
        await alert('먼저 파트타이머를 선택해주세요.')
        return
      }

      try {
        const payrollYearMonth = month.replace('-', '')
        const existingPayrolls = await getPartTimerPayrollStatements({
          memberId: employeeInfoId,
          payrollYearMonth
        })

        if (existingPayrolls.content.length > 0) {
          await alert(`해당 직원의 ${month} 급여명세서가 이미 등록되어 있습니다.`)
          return
        }
      } catch (error) {
        console.error('급여명세서 중복 확인 실패:', error)
      }

      setPayrollMonth(month)

      const [year, monthNum] = month.split('-').map(Number)
      const prevMonth = monthNum === 1 ? 12 : monthNum - 1
      const prevYear = monthNum === 1 ? year - 1 : year

      setStartDate(`${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(salaryDay).padStart(2, '0')}`)

      const currentPaymentDate = new Date(year, monthNum - 1, salaryDay)
      const endDateObj = new Date(currentPaymentDate)
      endDateObj.setDate(endDateObj.getDate() - 1)
      setEndDate(`${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`)
      setPaymentDate(`${year}-${String(monthNum).padStart(2, '0')}-${String(salaryDay).padStart(2, '0')}`)
    } else {
      setPayrollMonth('')
      setStartDate('')
      setEndDate('')
      setPaymentDate('')
    }
  }

  // React 19 Compiler가 자동 최적화
  const handleSearch = async () => {
    if (!isEditMode) return

    if (!employeeInfoId) {
      await alert('파트타이머를 선택해주세요.')
      return
    }

    if (!payrollMonth || !startDate || !endDate) {
      await alert('급여지급월과 기간을 설정해주세요.')
      return
    }

    localStorage.removeItem(WORKTIME_EDIT_STORAGE_KEY)
    setEditedWorkTimeData(null)

    setIsLoading(true)
    try {
      await refetchPayrollData()
      setIsSearched(true)
    } catch (error) {
      console.error('일별 근무 시간 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!employeeInfoId) {
      await alert('파트타이머를 선택해주세요.')
      return
    }
    if (!selectedEmployee?.employmentContractId) {
      await alert('선택한 직원의 근로계약 정보가 없습니다.')
      return
    }
    if (!payrollMonth || !startDate || !endDate || !paymentDate) {
      await alert('급여지급월과 기간을 설정해주세요.')
      return
    }

    let paymentItems: PartTimerPaymentItemRequest[] = []

    if (editedWorkTimeData && editedWorkTimeData.editedRecords.length > 0) {
      paymentItems = editedWorkTimeData.editedRecords.map((record) => ({
        workDay: record.date,
        workHour: record.workHours,
        breakTimeHour: 0,
        contractTimelyAmount: record.contractHourlyWage,
        applyTimelyAmount: record.applyTimelyAmount,
        totalAmount: record.paymentAmount,
        deductionAmount: record.deductionAmount,
        remarks: undefined
      }))
    } else if (payrollData && payrollData.items.length > 0) {
      paymentItems = payrollData.items
        .filter((item) => item.type === 'DAILY' && item.dailyRecord)
        .map((item) => {
          const record = item.dailyRecord!
          return {
            workDay: record.date,
            workHour: record.workHours,
            breakTimeHour: 0,
            contractTimelyAmount: payrollData.applyTimelyAmount,
            applyTimelyAmount: record.applyTimelyAmount,
            totalAmount: record.paymentAmount,
            deductionAmount: record.deductionAmount,
            remarks: undefined
          }
        })
    }

    if (paymentItems.length === 0) {
      await alert('저장할 근무 데이터가 없습니다. 기간을 설정하고 검색 버튼을 클릭해주세요.')
      return
    }

    const payrollYearMonth = payrollMonth.replace('-', '')

    const request: CreatePartTimerPayrollStatementRequest = {
      employeeInfoId,
      payrollYearMonth,
      settlementStartDate: startDate,
      settlementEndDate: endDate,
      paymentDate,
      remarks: undefined,
      paymentItems
    }

    setIsLoading(true)
    try {
      await createPartTimerPayrollStatement(request)
      await alert('급여명세서가 저장되었습니다.')
      localStorage.removeItem(WORKTIME_EDIT_STORAGE_KEY)
      router.push('/employee/payroll/parttime')
    } catch (error) {
      console.error('급여명세서 저장 실패:', error)
      await alert('급여명세서 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 상세 모드에서 수정 핸들러
  const handleUpdate = async () => {
    if (!statementId || !existingStatement) return

    if (!payrollMonth || !startDate || !endDate) {
      await alert('급여지급월과 기간을 설정해주세요.')
      return
    }

    // 기존 paymentItems 유지
    const paymentItems: PartTimerPaymentItemRequest[] = existingStatement.paymentItems.map(item => ({
      workDay: item.workDay,
      workHour: item.workHour,
      breakTimeHour: item.breakTimeHour,
      contractTimelyAmount: item.contractTimelyAmount,
      applyTimelyAmount: item.applyTimelyAmount,
      totalAmount: item.totalAmount,
      deductionAmount: item.deductionAmount,
      remarks: item.remarks,
    }))

    // 4대보험 공제 항목 구성
    const deductionItems: PartTimerDeductionItemRequest[] = []
    const parseAmount = (val: string) => parseInt(val.replace(/,/g, '')) || 0
    let order = 1

    if (parseAmount(nationalPension) > 0) {
      deductionItems.push({ itemCode: 'NATIONAL_PENSION', itemOrder: order++, amount: parseAmount(nationalPension), remarks: '국민연금' })
    }
    if (parseAmount(healthInsurance) > 0) {
      deductionItems.push({ itemCode: 'HEALTH_INSURANCE', itemOrder: order++, amount: parseAmount(healthInsurance), remarks: '건강보험' })
    }
    if (parseAmount(employmentInsurance) > 0) {
      deductionItems.push({ itemCode: 'EMPLOYMENT_INSURANCE', itemOrder: order++, amount: parseAmount(employmentInsurance), remarks: '고용보험' })
    }
    if (parseAmount(longTermCareInsurance) > 0) {
      deductionItems.push({ itemCode: 'LONG_TERM_CARE_INSURANCE', itemOrder: order++, amount: parseAmount(longTermCareInsurance), remarks: '장기요양보험' })
    }

    const request: UpdatePartTimerPayrollStatementRequest = {
      payrollYearMonth: payrollMonth.replace('-', ''),
      settlementStartDate: startDate,
      settlementEndDate: endDate,
      paymentDate,
      paymentItems,
      deductionItems: deductionItems.length > 0 ? deductionItems : undefined,
    }

    try {
      await updateMutation.mutateAsync({ id: statementId, request })
      await alert('수정되었습니다.')
    } catch (error) {
      console.error('수정 실패:', error)
      await alert('수정 중 오류가 발생했습니다.')
    }
  }

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return ''
    return num.toLocaleString()
  }

  // 보험료 입력: 숫자만 허용 + 콤마 포맷팅
  const handleInsuranceChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setter(raw ? parseInt(raw).toLocaleString() : '0')
  }

  const getDayOfWeekKorean = (dateStr: string) => {
    const dayOfWeekMap: { [key: number]: string } = {
      0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토'
    }
    const date = new Date(dateStr)
    return dayOfWeekMap[date.getDay()]
  }

  const renderTableRow = (item: DailyWorkHoursItem, index: number) => {
    switch (item.type) {
      case 'DAILY': {
        if (!item.dailyRecord) return null
        const record = item.dailyRecord
        return (
          <tr key={index}>
            <td>{record.date} ({record.dayOfWeekKorean})</td>
            <td className="al-r">{formatNumber(record.workHours)}</td>
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
            <td className="al-r">{formatNumber(subtotal.totalWorkHours)}</td>
            <td className="al-r">-</td>
            <td className="al-r">{formatNumber(subtotal.totalPaymentAmount)}</td>
            <td className="al-r">{formatNumber(subtotal.totalDeductionAmount)}</td>
            <td className="al-r">{formatNumber(subtotal.totalAmount)}</td>
          </tr>
        )
      }
      case 'WEEKLY_HOLIDAY_ALLOWANCE': {
        if (!item.weeklyHolidayAllowance) return null
        const allowance = item.weeklyHolidayAllowance
        return (
          <tr key={index} className="yellow">
            <td>주휴수당 ({allowance.weekNumber}주차){allowance.isEligible ? '' : ' (미대상)'}</td>
            <td className="al-r">{formatNumber(allowance.holidayAllowanceHours)}</td>
            <td className="al-r">{formatNumber(allowance.applyTimelyAmount)}</td>
            <td className="al-r">{formatNumber(allowance.holidayAllowanceAmount)}</td>
            <td className="al-r">{formatNumber(allowance.deductionAmount)}</td>
            <td className="al-r">{formatNumber(allowance.totalAmount)}</td>
          </tr>
        )
      }
      case 'WEEKLY_TOTAL': {
        if (!item.weeklyTotal) return null
        const total = item.weeklyTotal
        return (
          <tr key={index} className="blue">
            <td>합계 ({total.weekNumber}주차)</td>
            <td className="al-r">{formatNumber(total.totalWorkHours)}</td>
            <td className="al-r">{formatNumber(total.applyTimelyAmount)}</td>
            <td className="al-r">{formatNumber(total.totalPaymentAmount)}</td>
            <td className="al-r">{formatNumber(total.totalDeductionAmount)}</td>
            <td className="al-r">{formatNumber(total.totalAmount)}</td>
          </tr>
        )
      }
      default:
        return null
    }
  }

  const renderExistingPaymentItemRow = (item: PartTimerPaymentItemResponse, index: number) => {
    return (
      <tr key={`payment-${index}`}>
        <td>{item.workDay} ({getDayOfWeekKorean(item.workDay)})</td>
        <td className="al-r">{formatNumber(item.workHour)}</td>
        <td className="al-r">{formatNumber(item.applyTimelyAmount)}</td>
        <td className="al-r">{formatNumber(item.totalAmount)}</td>
        <td className="al-r">{formatNumber(item.deductionAmount)}</td>
        <td className="al-r">{formatNumber(item.totalAmount - item.deductionAmount)}</td>
      </tr>
    )
  }

  const renderWeeklyPaidHolidayAllowanceRow = (item: WeeklyPaidHolidayAllowanceResponse, index: number) => {
    return (
      <tr key={`allowance-${index}`} className="yellow">
        <td>주휴수당 ({item.workWeek}주차){item.isCrossMonth ? ' (월경계)' : ''}</td>
        <td className="al-r">{formatNumber(item.workTime)}</td>
        <td className="al-r">{formatNumber(item.applyTimelyAmount)}</td>
        <td className="al-r">{formatNumber(item.totalAmount)}</td>
        <td className="al-r">{formatNumber(item.deductionAmount)}</td>
        <td className="al-r">{formatNumber(item.netAmount)}</td>
      </tr>
    )
  }

  const renderEditedWorkTimeRow = (record: WorkTimeEditData['editedRecords'][0], index: number) => {
    const isModified = record.workHours !== record.originalWorkHours || record.applyTimelyAmount !== record.originalApplyTimelyAmount
    return (
      <tr key={`edited-${index}`} className={record.workHours === 0 ? 'disabled' : ''}>
        <td>
          {record.date} ({record.dayOfWeekKorean})
          {isModified && <span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>}
        </td>
        <td className="al-r">{formatNumber(record.workHours)}</td>
        <td className="al-r">{formatNumber(record.applyTimelyAmount)}</td>
        <td className="al-r">{formatNumber(record.paymentAmount)}</td>
        <td className="al-r">{formatNumber(record.deductionAmount)}</td>
        <td className="al-r">{formatNumber(record.totalAmount)}</td>
      </tr>
    )
  }

  if (isDetailLoading && !isNewMode) {
    return (
      <div className="contents-wrap">
        <div style={{ padding: '40px', textAlign: 'center' }}>데이터를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="contents-wrap">
      <div className="contents-btn">
        <button className="btn-form basic" onClick={handleGoToList}>목록</button>
        {!isEditMode && !isNewMode && (
          <>
            <button className="btn-form outline s" onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>이메일 전송</button>
            <button className="btn-form outline s" onClick={handleDownloadExcel} disabled={downloadExcelMutation.isPending}>다운로드</button>
            <button className="btn-form gray" onClick={handleDelete} disabled={deleteMutation.isPending}>삭제</button>
            <button className="btn-form basic" onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '수정 중...' : '수정'}
            </button>
          </>
        )}
        {isEditMode && (
          <>
            <button className="btn-form outline s" onClick={handleGoToWorkTimeEdit}>근무 시간 수정</button>
            <button className="btn-form basic" onClick={handleSave} disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장'}
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
                <th>파트타이머 소속</th>
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
                      {isEditMode ? (
                        <SearchSelect
                          options={headquarterOptions}
                          value={headquarterOptions.find(o => o.value === selectedHeadquarter) || null}
                          onChange={(opt) => {
                            setSelectedHeadquarter(opt?.value || '')
                            setSelectedFranchise('')
                            setSelectedStore('')
                            setEmployeeInfoId(null)
                            setPayrollMonth('')
                            setStartDate('')
                            setEndDate('')
                            setPaymentDate('')
                            setIsSearched(false)
                          }}
                          placeholder="본사 선택"
                        />
                      ) : (
                        <input type="text" className="input-frame" value={existingStatement?.headOfficeName || ''} readOnly />
                      )}
                    </div>
                    <div className="block">
                      {isEditMode ? (
                        <SearchSelect
                          options={franchiseOptions}
                          value={franchiseOptions.find(o => o.value === selectedFranchise) || null}
                          onChange={(opt) => {
                            setSelectedFranchise(opt?.value || '')
                            setSelectedStore('')
                            setEmployeeInfoId(null)
                            setPayrollMonth('')
                            setStartDate('')
                            setEndDate('')
                            setPaymentDate('')
                            setIsSearched(false)
                          }}
                          placeholder="가맹점 선택"
                        />
                      ) : (
                        <input type="text" className="input-frame" value={existingStatement?.franchiseName || ''} readOnly />
                      )}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th>점포 선택</th>
                <td>
                  <div className="block">
                    {isEditMode ? (
                      <SearchSelect
                        options={storeOptions}
                        value={storeOptions.find(o => o.value === selectedStore) || null}
                        onChange={(opt) => {
                          setSelectedStore(opt?.value || '')
                          setEmployeeInfoId(null)
                          setPayrollMonth('')
                          setStartDate('')
                          setEndDate('')
                          setPaymentDate('')
                          setIsSearched(false)
                        }}
                        placeholder="점포 선택"
                      />
                    ) : (
                      <input type="text" className="input-frame" value={existingStatement?.storeName || ''} readOnly />
                    )}
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
                      {isNewMode ? (
                        <SearchSelect
                          options={employeeOptions}
                          value={employeeOptions.find(o => o.value === String(employeeInfoId || ''))}
                          onChange={(opt) => handleEmployeeChange(opt?.value || '')}
                          placeholder="파트타이머 선택"
                          isDisabled={!isEditMode}
                        />
                      ) : (
                        <SearchSelect
                          options={[{ value: '', label: existingStatement?.memberName || '-' }]}
                          value={{ value: '', label: existingStatement?.memberName || '-' }}
                          onChange={() => {}}
                          placeholder="직원명"
                          isDisabled
                        />
                      )}
                    </div>
                    {selectedEmployee?.employeeNumber && <span className="info-text">{selectedEmployee.employeeNumber}</span>}
                  </div>
                </td>
              </tr>
              <tr>
                <th>
                  급여지급월 <span className="red">*</span>
                </th>
                <td>
                  <div className="filed-flx">
                    <div className="block" style={{ width: '150px', flexShrink: 0 }}>
                      <SearchSelect
                        options={monthOptions}
                        value={monthOptions.find(o => o.value === payrollMonth)}
                        onChange={(opt) => handlePayrollMonthChange(opt?.value || '')}
                        placeholder="선택"
                      />
                    </div>
                    {paymentDate && <span className="info-text" style={{ marginLeft: '50px', whiteSpace: 'nowrap' }}>급여 지급일 : {paymentDate}</span>}
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
                        value={parseStringToDate(startDate)}
                        onChange={(date) => setStartDate(formatDateToString(date))}
                      />
                      <span>~</span>
                      <DatePicker
                        value={parseStringToDate(endDate)}
                        onChange={(date) => setEndDate(formatDateToString(date))}
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
                <th>4대보험 공제</th>
                <td>
                  <div className="filed-flx">
                    <span className="label-text" style={{ width: '70px' }}>국민연금</span>
                    <span className="won-icon">₩</span>
                    <div className="block" style={{ width: '200px' }}>
                      <input
                        type="text"
                        className="input-frame al-r"
                        value={nationalPension || '0'}
                        onChange={handleInsuranceChange(setNationalPension)}
                      />
                    </div>
                    <span className="label-text" style={{ width: '90px', marginLeft: '20px' }}>건강보험</span>
                    <span className="won-icon">₩</span>
                    <div className="block" style={{ width: '200px' }}>
                      <input
                        type="text"
                        className="input-frame al-r"
                        value={healthInsurance || '0'}
                        onChange={handleInsuranceChange(setHealthInsurance)}
                      />
                    </div>
                  </div>
                  <div className="filed-flx" style={{ marginTop: '8px' }}>
                    <span className="label-text" style={{ width: '70px' }}>고용보험</span>
                    <span className="won-icon">₩</span>
                    <div className="block" style={{ width: '200px' }}>
                      <input
                        type="text"
                        className="input-frame al-r"
                        value={employmentInsurance || '0'}
                        onChange={handleInsuranceChange(setEmploymentInsurance)}
                      />
                    </div>
                    <span className="label-text" style={{ width: '90px', marginLeft: '20px' }}>장기요양보험</span>
                    <span className="won-icon">₩</span>
                    <div className="block" style={{ width: '200px' }}>
                      <input
                        type="text"
                        className="input-frame al-r"
                        value={longTermCareInsurance || '0'}
                        onChange={handleInsuranceChange(setLongTermCareInsurance)}
                      />
                    </div>
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
                <th>근무시간</th>
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
              ) : !isEditMode && existingStatement && (existingStatement.paymentItems.length > 0 || existingStatement.weeklyPaidHolidayAllowances?.length > 0) ? (
                <>
                  {existingStatement.paymentItems.map((item, index) => renderExistingPaymentItemRow(item, index))}
                  {existingStatement.weeklyPaidHolidayAllowances?.map((item, index) => renderWeeklyPaidHolidayAllowanceRow(item, index))}
                  <tr className="grand-total">
                    <td><strong>최종합</strong></td>
                    <td className="al-r"><strong>{formatNumber(existingStatement.paymentItems.reduce((sum, item) => sum + item.workHour, 0))}</strong></td>
                    <td className="al-r"><strong>-</strong></td>
                    <td className="al-r"><strong>{formatNumber(existingStatement.totalAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(existingStatement.totalDeductionAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(existingStatement.actualPaymentAmount)}</strong></td>
                  </tr>
                </>
              ) : isEditMode && editedWorkTimeData && editedWorkTimeData.editedRecords.length > 0 ? (
                <>
                  {editedWorkTimeData.editedRecords.map((record, index) => renderEditedWorkTimeRow(record, index))}
                  <tr className="grand-total" style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                    <td><strong>총 합계</strong></td>
                    <td className="al-r"><strong>{editedWorkTimeData.grandTotalWorkHours.toFixed(2)}</strong></td>
                    <td className="al-r"><strong>-</strong></td>
                    <td className="al-r"><strong>{formatNumber(editedWorkTimeData.grandTotalPaymentAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(editedWorkTimeData.grandTotalDeductionAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(editedWorkTimeData.grandTotalAmount)}</strong></td>
                  </tr>
                </>
              ) : !isSearched ? (
                <tr>
                  <td colSpan={6} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    {isEditMode
                      ? '급여지급월을 선택하고 기간 설정 후 검색 버튼을 클릭해주세요.'
                      : '등록된 급여 데이터가 없습니다.'
                    }
                  </td>
                </tr>
              ) : !payrollData || payrollData.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                <>
                  {payrollData.items.map((item, index) => renderTableRow(item, index))}
                  <tr className="grand-total">
                    <td><strong>최종합</strong></td>
                    <td className="al-r"><strong>{formatNumber(payrollData.grandTotalWorkHours)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(payrollData.applyTimelyAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(payrollData.grandTotalPaymentAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(payrollData.grandTotalDeductionAmount)}</strong></td>
                    <td className="al-r"><strong>{formatNumber(payrollData.grandTotalAmount)}</strong></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {!isNewMode && (
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
