'use client'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import DatePicker from '../../ui/common/DatePicker'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useAlert } from '@/components/common/ui'
import {
  useOvertimePayrollDetail,
  useDailyOvertimeHours,
  useDeleteOvertimePayroll,
  useSendOvertimePayrollEmail,
  useDownloadOvertimePayrollExcel,
} from '@/hooks/queries/use-payroll-queries'
import { payrollKeys } from '@/hooks/queries/query-keys'
import { useEmployeeListByType } from '@/hooks/queries/use-employee-queries'
import {
  createOvertimeAllowanceStatement,
  getOvertimeAllowanceStatement,
  getOvertimeAllowanceStatements,
  updateOvertimeAllowanceStatement
} from '@/lib/api/overtimeAllowanceStatement'
import type {
  DailyOvertimeHoursItem,
  OvertimeAllowanceItemDto,
  PostOvertimeAllowanceStatementRequest,
  PutOvertimeAllowanceStatementRequest,
} from '@/lib/api/overtimeAllowanceStatement'
import { OvertimeWorkTimeEditData, EditableOvertimeRecord, EditableWeeklySubtotal } from './OvertimeWorkTimeEdit'
import { useBpHeadOfficeTree } from '@/hooks/queries'
import { useStoreOptions } from '@/hooks/queries/use-store-queries'
import { useAuthStore } from '@/stores/auth-store'
import { calculatePayrollPeriod } from '@/lib/utils/payroll'
import { OWNER_CODE } from '@/constants/owner-code'

// 연장근무 수당 배율 (통상임금의 1.5배 — 근로기준법 제56조)
const OVERTIME_RATE_MULTIPLIER = 1.5

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
const OVERTIME_FORM_STATE_STORAGE_KEY = 'overtime_form_state'

interface OvertimePayStubProps {
  id: string
  isEditMode?: boolean
  fromWorkTimeEdit?: boolean
  onSaveSuccess?: () => void
}

interface OvertimePeriodSnapshot {
  payrollMonth: string
  startDate: string
  endDate: string
  paymentDate: string
}

export default function OvertimePayStub({ id, isEditMode = false, fromWorkTimeEdit = false, onSaveSuccess }: OvertimePayStubProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { alert, confirm } = useAlert()
  const isNewMode = isEditMode && id === 'new'
  const statementId = isNewMode ? undefined : parseInt(id)

  // TanStack Query: 기존 명세서 데이터를 useState 초기화보다 먼저 조회
  const { data: existingStatement } = useOvertimePayrollDetail(statementId)

  // State (lazy 초기화: 부모 key prop 리마운트 시 서버 데이터로 올바르게 초기화됨)
  const [payrollMonth, setPayrollMonth] = useState(() => {
    if (!existingStatement?.allowanceYearMonth) return ''
    const ym = existingStatement.allowanceYearMonth
    return `${ym.substring(0, 4)}-${ym.substring(4, 6)}`
  })
  const [startDate, setStartDate] = useState(() => existingStatement?.calculationStartDate ?? '')
  const [endDate, setEndDate] = useState(() => existingStatement?.calculationEndDate ?? '')
  const [paymentDate, setPaymentDate] = useState(() => {
    if (existingStatement?.paymentDate) return existingStatement.paymentDate
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [employeeInfoId, setEmployeeInfoId] = useState<number | null>(() => existingStatement?.employeeInfoId ?? null)
  const [remarks, setRemarks] = useState(() => existingStatement?.remarks ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [editedWorkTimeData, setEditedWorkTimeData] = useState<OvertimeWorkTimeEditData | null>(null)
  const [isSearchDone, setIsSearchDone] = useState(false)

  // Organization selection state
  // NOTE: lazy 초기화는 OvertimeAllowanceStatementDetailResponse에 headOfficeId/franchiseId 필드가 추가된 후 가능.
  // 현재 응답에는 *Name만 있고 ID가 없어 PartTimePayStub와 같은 패턴 적용 불가.
  // 후속 작업: 백엔드 응답에 ID 필드 추가 후 PartTime 패턴 적용 (HIGH #1 잔여)
  const [selectedHeadquarter, setSelectedHeadquarter] = useState<string>('')
  const [selectedFranchise, setSelectedFranchise] = useState<string>('')
  const [selectedStore, setSelectedStore] = useState<string>('')
  const lastValidPeriodRef = useRef<OvertimePeriodSnapshot>({
    payrollMonth,
    startDate,
    endDate,
    paymentDate,
  })

  useEffect(() => {
    if (!isEditMode && existingStatement) {
      lastValidPeriodRef.current = {
        payrollMonth: `${existingStatement.allowanceYearMonth.substring(0, 4)}-${existingStatement.allowanceYearMonth.substring(4, 6)}`,
        startDate: existingStatement.calculationStartDate,
        endDate: existingStatement.calculationEndDate,
        paymentDate: existingStatement.paymentDate || '',
      }
    }
  }, [isEditMode, existingStatement])

  // BP 트리 데이터
  const { accessToken, affiliationId, ownerCode, defaultHeadOfficeId } = useAuthStore()
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree = [] } = useBpHeadOfficeTree(isReady)

  // 권한 기반 표준 정책 변수
  const isPlatformAdmin = ownerCode === OWNER_CODE.PLATFORM
  const platformHasDefault = isPlatformAdmin
    && defaultHeadOfficeId != null
    && bpTree.some((office) => office.id === defaultHeadOfficeId)
  const shouldAutoSelectOffice =
    ownerCode === OWNER_CODE.HEAD_OFFICE
    || ownerCode === OWNER_CODE.FRANCHISE
    || bpTree.length === 1
    || platformHasDefault
  const isOfficeFixed = shouldAutoSelectOffice
  const isFranchiseFixed = ownerCode === OWNER_CODE.FRANCHISE

  // 자동선택 로직 (렌더 중 setState 패턴 — PartTimePayStub와 동일)
  const [bpAutoApplied, setBpAutoApplied] = useState(false)
  if (
    !bpAutoApplied
    && isNewMode
    && !fromWorkTimeEdit
    && bpTree.length > 0
    && shouldAutoSelectOffice
  ) {
    setBpAutoApplied(true)
    const targetOffice = platformHasDefault
      ? bpTree.find((o) => o.id === defaultHeadOfficeId) ?? bpTree[0]
      : bpTree[0]

    const autoFranchiseId = isFranchiseFixed && targetOffice.franchises.length === 1
      ? targetOffice.franchises[0].id
      : null

    setSelectedHeadquarter(String(targetOffice.id))
    if (autoFranchiseId !== null) {
      setSelectedFranchise(String(autoFranchiseId))
    }
  }

  // 점포 옵션 조회
  const headOfficeIdNum = selectedHeadquarter ? parseInt(selectedHeadquarter) : null
  const franchiseIdNum = selectedFranchise ? parseInt(selectedFranchise) : null
  const { data: storeOptionList = [] } = useStoreOptions(headOfficeIdNum, franchiseIdNum)

  const { data: employeeList = [] } = useEmployeeListByType(
    headOfficeIdNum ? { headOfficeId: headOfficeIdNum, franchiseId: franchiseIdNum ?? undefined, employeeType: 'FULL_TIME' } : { headOfficeId: 0, employeeType: 'FULL_TIME' },
    isNewMode && !!headOfficeIdNum,
    true
  )
  const storeIdNum = selectedStore ? parseInt(selectedStore) : null

  const hasExistingDetails = !!(existingStatement?.details && existingStatement.details.length > 0)
  const overtimeQueryEnabled = !!(
    (employeeInfoId ?? existingStatement?.employeeInfoId) &&
    startDate &&
    endDate &&
    // 저장된 상세 데이터가 있고 편집 중이 아니면 자동 조회 비활성화
    // (신규 작성, 근무시간 수정 후 복귀, 상세 없는 기존 명세서, 검색 완료 후 새 날짜 범위 조회는 허용)
    (isNewMode || editedWorkTimeData !== null || !hasExistingDetails || isSearchDone)
  )
  const { data: overtimeData, isPending: isOvertimePending } = useDailyOvertimeHours(
    {
      employeeInfoId: employeeInfoId ?? existingStatement?.employeeInfoId ?? 0,
      startDate,
      endDate,
      headOfficeId: headOfficeIdNum ?? undefined,
      franchiseId: franchiseIdNum ?? undefined,
      storeId: storeIdNum ?? undefined,
    },
    overtimeQueryEnabled
  )

  // Mutations
  const deleteMutation = useDeleteOvertimePayroll()
  const sendEmailMutation = useSendOvertimePayrollEmail()
  const downloadExcelMutation = useDownloadOvertimePayrollExcel()

  // React 19: derived state
  const selectedEmployee = employeeList.find(emp => emp.employeeInfoId === employeeInfoId) ?? null

  // 상세 모드에서 근무시간 수정 후 돌아왔을 때 editedWorkTimeData 로드
  useEffect(() => {
    if (fromWorkTimeEdit && !isEditMode && !editedWorkTimeData) {
      const savedData = localStorage.getItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)
      if (savedData) {
        try {
          const parsed: OvertimeWorkTimeEditData = JSON.parse(savedData)
          setEditedWorkTimeData(parsed)
        } catch {
          localStorage.removeItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)
        }
      }
    }
  }, [fromWorkTimeEdit, isEditMode, editedWorkTimeData])

  // localStorage에서 수정 데이터 로드 (신규/기존 수정 모드 모두 지원)
  useEffect(() => {
    if (fromWorkTimeEdit && isEditMode && !editedWorkTimeData) {
      // 폼 상태 복원 (신규/기존 수정 모드 모두)
      const savedFormState = localStorage.getItem(OVERTIME_FORM_STATE_STORAGE_KEY)
      if (savedFormState) {
        try {
          const s = JSON.parse(savedFormState) as {
            selectedHeadquarter: string
            selectedFranchise: string
            selectedStore: string
            employeeInfoId: number | null
            payrollMonth: string
            startDate: string
            endDate: string
            paymentDate: string
            remarks: string
          }
          if (s.selectedHeadquarter) setSelectedHeadquarter(s.selectedHeadquarter)
          if (s.selectedFranchise) setSelectedFranchise(s.selectedFranchise)
          if (s.selectedStore) setSelectedStore(s.selectedStore)
          if (s.employeeInfoId != null) setEmployeeInfoId(s.employeeInfoId)
          if (s.payrollMonth) setPayrollMonth(s.payrollMonth)
          if (s.startDate) setStartDate(s.startDate)
          if (s.endDate) setEndDate(s.endDate)
          if (s.paymentDate) setPaymentDate(s.paymentDate)
          if (s.remarks) setRemarks(s.remarks)
          localStorage.removeItem(OVERTIME_FORM_STATE_STORAGE_KEY)
        } catch (e) {
          console.error('폼 상태 복원 실패:', e)
          localStorage.removeItem(OVERTIME_FORM_STATE_STORAGE_KEY)
          void alert('이전 편집 데이터를 불러오는 데 실패했습니다. 데이터를 다시 입력해주세요.')
        }
      }

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

          // 로드 후 localStorage에서 제거하여 stale reads 방지
          localStorage.removeItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)
        } catch (error) {
          console.error('localStorage 데이터 파싱 실패:', error)
          localStorage.removeItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)
          void alert('이전 편집 데이터를 불러오는 데 실패했습니다. 데이터를 다시 입력해주세요.')
        }
      }
    }
  }, [fromWorkTimeEdit, isEditMode, editedWorkTimeData, alert])

  const handleGoToList = () => {
    router.push('/employee/payroll/overtime')
  }

  const handleDelete = async () => {
    if (!existingStatement?.id) return
    if (!(await confirm('삭제하시겠습니까?'))) return

    try {
      await deleteMutation.mutateAsync(existingStatement.id)
      await alert('삭제되었습니다.')
      router.push('/employee/payroll/overtime')
    } catch (error) {
      console.error('삭제 실패:', error)
      await alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSendEmail = async () => {
    if (!existingStatement?.id) return

    if (!(await confirm('이메일을 전송하시겠습니까?'))) return

    try {
      await sendEmailMutation.mutateAsync(existingStatement.id)
      await alert('이메일 전송이 완료되었습니다.')
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
      a.download = `연장근무수당명세서_${existingStatement.id}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error)
      await alert('엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }

  // 직원 선택 핸들러
  const handleEmployeeChange = (selectedValue: string) => {
    const selectedId = parseInt(selectedValue)
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
      const payrollYear = currentYear
      const payrollMonthNum = currentMonth

      const payrollMonthStr = `${payrollYear}-${String(payrollMonthNum).padStart(2, '0')}`
      const { startDate, endDate, paymentDate } = calculatePayrollPeriod(
        payrollMonthStr,
        employee.salaryMonth,
        employee.salaryDay
      )

      setPayrollMonth(payrollMonthStr)
      setStartDate(startDate)
      setEndDate(endDate)
      setPaymentDate(paymentDate)
      if (isEditMode) {
        lastValidPeriodRef.current = {
          payrollMonth: payrollMonthStr,
          startDate,
          endDate,
          paymentDate,
        }
      }
    }
  }

  const handleGoToWorkTimeEdit = async () => {
    // 상세 모드: 바로 이동
    if (!isEditMode) {
      if (!isSearchDone) {
        await alert('검색을 먼저 진행해주세요.')
        return
      }
      if (!startDate || !endDate) {
        await alert('기간을 설정해주세요.')
        return
      }

      // 기존 명세서 데이터를 localStorage에 미리 저장 (worktime edit에서 기존 등록값을 보여주기 위함)
      if (existingStatement) {
        const DAY_KOR = ['일', '월', '화', '수', '목', '금', '토']
        const DAY_ENG = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        const isoWeek = (dateStr: string) => {
          const d = new Date(dateStr)
          const day = d.getDay()
          const thu = new Date(d)
          thu.setDate(d.getDate() - ((day + 6) % 7) + 3)
          const firstThu = new Date(thu.getFullYear(), 0, 4)
          return 1 + Math.round(((thu.getTime() - firstThu.getTime()) / 86400000 - 3 + ((firstThu.getDay() + 6) % 7)) / 7)
        }
        const genDates = (s: string, e: string) => {
          const dates: string[] = []
          const cur = new Date(s)
          const end = new Date(e)
          while (cur <= end) { dates.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1) }
          return dates
        }

        const detailMap = new Map(existingStatement.details.map(d => [d.workDay, d]))
        const defaultApply = existingStatement.details[0]?.applyTimelyAmount ?? 0
        const defaultContract = existingStatement.details[0]?.contractTimelyAmount ?? 0
        const editedRecords: EditableOvertimeRecord[] = genDates(startDate, endDate).map(date => {
          const det = detailMap.get(date)
          const di = new Date(date).getDay()
          return det ? {
            id: det.id,
            date, dayOfWeek: DAY_ENG[di], dayOfWeekKorean: DAY_KOR[di],
            originalOvertimeHours: det.actualOvertimeHours, overtimeHours: det.actualOvertimeHours,
            overtimeStartTime: det.overtimeStartTime, overtimeEndTime: det.overtimeEndTime,
            originalApplyTimelyAmount: det.applyTimelyAmount, applyTimelyAmount: det.applyTimelyAmount,
            paymentAmount: det.actualPaymentAmount, deductionAmount: det.deductionAmount,
            totalAmount: det.actualPaymentAmount - det.deductionAmount,
            contractHourlyWage: det.contractTimelyAmount, weekNumber: isoWeek(date)
          } : {
            date, dayOfWeek: DAY_ENG[di], dayOfWeekKorean: DAY_KOR[di],
            originalOvertimeHours: 0, overtimeHours: 0,
            overtimeStartTime: undefined, overtimeEndTime: undefined,
            originalApplyTimelyAmount: defaultApply, applyTimelyAmount: defaultApply,
            paymentAmount: 0, deductionAmount: 0, totalAmount: 0,
            contractHourlyWage: defaultContract, weekNumber: isoWeek(date)
          }
        })

        const preload: OvertimeWorkTimeEditData = {
          employeeInfoId: String(existingStatement.employeeInfoId),
          startDate, endDate,
          payrollMonth: `${existingStatement.allowanceYearMonth.substring(0, 4)}-${existingStatement.allowanceYearMonth.substring(4, 6)}`,
          editedRecords, weeklySubtotals: [],
          grandTotalOvertimeHours: existingStatement.totalOvertimeHours,
          grandTotalPaymentAmount: existingStatement.grossOvertimeAmount,
          grandTotalDeductionAmount: existingStatement.totalDeductionAmount,
          grandTotalAmount: existingStatement.actualOvertimeAmount,
          applyTimelyAmount: defaultApply,
        }
        localStorage.setItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY, JSON.stringify(preload))
      }

      const params = new URLSearchParams({
        startDate,
        endDate,
        employeeInfoId: String(existingStatement!.employeeInfoId),
        payrollMonth: `${existingStatement!.allowanceYearMonth.substring(0, 4)}-${existingStatement!.allowanceYearMonth.substring(4, 6)}`,
        returnToDetail: 'true',
      })
      router.push(`/employee/payroll/overtime/${id}/worktime?${params.toString()}`)
      return
    }

    // 편집 모드: 기존 로직
    if (!employeeInfoId) {
      await alert('직원을 선택해주세요.')
      return
    }
    if (!startDate || !endDate) {
      await alert('지급 월을 선택하고 기간을 설정해주세요.')
      return
    }
    // 돌아올 때 복원할 폼 상태 저장 (신규/기존 수정 모드 모두)
    localStorage.setItem(OVERTIME_FORM_STATE_STORAGE_KEY, JSON.stringify({
      selectedHeadquarter,
      selectedFranchise,
      selectedStore,
      employeeInfoId,
      payrollMonth,
      startDate,
      endDate,
      paymentDate,
      remarks,
    }))
    const params = new URLSearchParams({
      startDate,
      endDate,
      employeeInfoId: String(employeeInfoId),
      payrollMonth,
      ...(headOfficeIdNum ? { headOfficeId: String(headOfficeIdNum) } : {}),
      ...(franchiseIdNum ? { franchiseId: String(franchiseIdNum) } : {}),
      ...(storeIdNum ? { storeId: String(storeIdNum) } : {}),
    })
    router.push(`/employee/payroll/overtime/${id}/worktime?${params.toString()}`)
  }

  const handlePayrollMonthChange = (month: string) => {
    // 상세 모드: 기간 자동 설정만 허용
    if (!isEditMode) {
      setIsSearchDone(false)
      setPayrollMonth(month)
      if (month) {
        const [year, monthNum] = month.split('-').map(Number)
        const prevMonth = monthNum === 1 ? 12 : monthNum - 1
        const prevYear = monthNum === 1 ? year - 1 : year
        const lastDay = new Date(prevYear, prevMonth, 0).getDate()
        setStartDate(`${prevYear}-${String(prevMonth).padStart(2, '0')}-01`)
        setEndDate(`${prevYear}-${String(prevMonth).padStart(2, '0')}-${lastDay}`)
        if (isEditMode) {
          lastValidPeriodRef.current = {
            payrollMonth: month,
            startDate: `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`,
            endDate: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${lastDay}`,
            paymentDate,
          }
        }
      } else {
        setStartDate('')
        setEndDate('')
      }
      return
    }

    setPayrollMonth(month)

    if (month) {
      const selectedEmployeeContract = employeeList.find(emp => emp.employeeInfoId === employeeInfoId)
      const salaryMonth = selectedEmployeeContract?.salaryMonth || 'SLRCF_001'
      const salaryDay = selectedEmployeeContract?.salaryDay ?? 5
      const { startDate, endDate, paymentDate } = calculatePayrollPeriod(month, salaryMonth, salaryDay)

      setStartDate(startDate)
      setEndDate(endDate)
      setPaymentDate(paymentDate)
      if (isEditMode) {
        lastValidPeriodRef.current = {
          payrollMonth: month,
          startDate,
          endDate,
          paymentDate,
        }
      }
    } else {
      setStartDate('')
      setEndDate('')
      setPaymentDate('')
    }
  }

  const hasDateOverlapConflict = async (excludeId?: number) => {
    const memberId = selectedEmployee?.memberId ?? existingStatement?.memberId
    const headOfficeId = headOfficeIdNum ?? bpTree.find(o => o.name === existingStatement?.headOfficeName)?.id ?? undefined

    if (!memberId || !headOfficeId || !startDate || !endDate) {
      return false
    }

    const listResult = await getOvertimeAllowanceStatements({
      headOfficeId,
      size: 200,
    })

    const candidateIds = listResult.content
      .filter(statement => statement.id !== excludeId && statement.memberId === memberId)
      .map(statement => statement.id)

    if (candidateIds.length === 0) return false

    const details = await Promise.all(candidateIds.map(id => getOvertimeAllowanceStatement(id)))

    return details.some(statement =>
      startDate <= statement.calculationEndDate &&
      endDate >= statement.calculationStartDate
    )
  }

  const handleSearch = async () => {
    if (!payrollMonth || !startDate || !endDate) {
      await alert('지급 월과 기간을 모두 입력해주세요.')
      return
    }

    const allowanceYearMonth = payrollMonth.replace('-', '')
    // 신규/편집 모드: 선택된 폼 값 우선, 상세 모드: existingStatement 사용
    const memberId = selectedEmployee?.memberId ?? existingStatement?.memberId
    const headOfficeId = headOfficeIdNum ?? bpTree.find(o => o.name === existingStatement?.headOfficeName)?.id ?? undefined

    try {
      // 1) allowanceYearMonth 기준 충돌 검사 (client-side memberId 필터)
      const result = await getOvertimeAllowanceStatements({
        headOfficeId,
        allowanceYearMonth,
        size: 100,
      })

      const conflicting = result.content.filter(s => s.id !== statementId && s.memberId === memberId)
      if (conflicting.length > 0) {
        await alert('해당 기간에 급여명세서가 이미 존재합니다.')
        const snapshot = lastValidPeriodRef.current
        setPayrollMonth(snapshot.payrollMonth)
        setStartDate(snapshot.startDate)
        setEndDate(snapshot.endDate)
        setPaymentDate(snapshot.paymentDate)
        return
      }

      const hasDateConflict = await hasDateOverlapConflict(statementId)
      if (hasDateConflict) {
        await alert('해당 기간에 급여명세서가 이미 존재합니다.')
        const snapshot = lastValidPeriodRef.current
        setPayrollMonth(snapshot.payrollMonth)
        setStartDate(snapshot.startDate)
        setEndDate(snapshot.endDate)
        setPaymentDate(snapshot.paymentDate)
        return
      }

      lastValidPeriodRef.current = {
        payrollMonth,
        startDate,
        endDate,
        paymentDate,
      }
      setIsSearchDone(true)
    } catch {
      await alert('검색 중 오류가 발생했습니다.')
    }
  }

  // 저장
  const handleSave = async () => {
    if (!employeeInfoId || !selectedEmployee) {
      await alert('직원을 선택해주세요.')
      return
    }

    if (!payrollMonth || !startDate || !endDate) {
      await alert('지급 월과 기간을 설정해주세요.')
      return
    }

    if (!overtimeData && !existingStatement && !editedWorkTimeData) {
      await alert('먼저 연장근무 시간을 조회해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const hasDateConflict = await hasDateOverlapConflict()
      if (hasDateConflict) {
        await alert('해당 기간에 급여명세서가 이미 존재합니다.')
        return
      }

      let details: OvertimeAllowanceItemDto[] = []

      if (editedWorkTimeData) {
        details = editedWorkTimeData.editedRecords
          // id 없고 연장근무 시간도 0인 레코드는 기존에 없던 빈 날짜 → 제외
          .filter(record => record.id !== undefined || record.overtimeHours > 0)
          .map(record => ({
            ...(record.id !== undefined ? { id: record.id } : {}),
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
              contractTimelyAmount: Math.round(record.applyTimelyAmount / OVERTIME_RATE_MULTIPLIER),
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

      // 저장 성공 시 목록 캐시 무효화 및 localStorage cleanup
      queryClient.invalidateQueries({ queryKey: payrollKeys.overtime.lists() })
      localStorage.removeItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)

      await alert('연장근무 수당명세서가 생성되었습니다.')
      router.push('/employee/payroll/overtime')
    } catch (error) {
      console.error('연장근무 수당명세서 저장 실패:', error)
      await alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 기존 명세서 수정 핸들러
  const handleUpdate = async () => {
    if (!statementId || !existingStatement) return

    if (!payrollMonth || !startDate || !endDate) {
      await alert('지급 월과 기간을 설정해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const hasDateConflict = await hasDateOverlapConflict(statementId)
      if (hasDateConflict) {
        await alert('해당 기간에 급여명세서가 이미 존재합니다.')
        return
      }

      let details: OvertimeAllowanceItemDto[] = []

      if (editedWorkTimeData) {
        details = editedWorkTimeData.editedRecords
          // id 없고 연장근무 시간도 0인 레코드는 기존에 없던 빈 날짜 → 제외
          .filter(record => record.id !== undefined || record.overtimeHours > 0)
          .map(record => ({
            ...(record.id !== undefined ? { id: record.id } : {}),
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
              contractTimelyAmount: Math.round(record.applyTimelyAmount / OVERTIME_RATE_MULTIPLIER),
              applyTimelyAmount: record.applyTimelyAmount,
              actualOvertimeHours: record.overtimeHours,
              overtimeStartTime: record.overtimeStartTime,
              overtimeEndTime: record.overtimeEndTime,
              deductionAmount: record.deductionAmount,
              actualPaymentAmount: record.paymentAmount
            }
          })
      } else {
        details = existingStatement.details
      }

      const request: PutOvertimeAllowanceStatementRequest = {
        allowanceYearMonth: payrollMonth.replace('-', ''),
        calculationStartDate: startDate,
        calculationEndDate: endDate,
        paymentDate: paymentDate || undefined,
        remarks: remarks || undefined,
        details
      }

      await updateOvertimeAllowanceStatement(statementId, request)

      // 수정 성공 시 캐시 무효화
      // overtime.all() 범위로 invalidate → detail + lists + dailyOvertimeHours 모두 무효화
      // dailyOvertimeHours도 함께 무효화해야 저장 전 stale data가 테이블에 표시되는 문제를 막을 수 있음
      await queryClient.invalidateQueries({ queryKey: payrollKeys.overtime.all() })
      localStorage.removeItem(OVERTIME_WORKTIME_EDIT_STORAGE_KEY)
      setEditedWorkTimeData(null)

      await alert('수정되었습니다.')
      onSaveSuccess?.()
      if (isEditMode) {
        router.push(`/employee/payroll/overtime/${statementId}`)
      }
    } catch (error) {
      console.error('연장근무 수당명세서 수정 실패:', error)
      await alert('수정 중 오류가 발생했습니다.')
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

  const renderExistingDetailTable = () => {
    if (!existingStatement) return null

    const rangeStartDate = startDate || existingStatement.calculationStartDate
    const rangeEndDate = endDate || existingStatement.calculationEndDate
    const detailMap = new Map(existingStatement.details.map(detail => [detail.workDay, detail]))
    const rows: React.ReactNode[] = []
    const current = new Date(rangeStartDate)
    const endValue = new Date(rangeEndDate)

    while (current <= endValue) {
      const year = current.getFullYear()
      const month = String(current.getMonth() + 1).padStart(2, '0')
      const day = String(current.getDate()).padStart(2, '0')
      const date = `${year}-${month}-${day}`
      const detail = detailMap.get(date)

      if (detail) {
        rows.push(renderExistingDetailRow(detail, rows.length))
      } else {
        rows.push(
          <tr key={`detail-empty-${date}`}>
            <td>{date} ({getDayOfWeekKorean(date)})</td>
            <td className="al-r">0</td>
            <td className="al-r">0</td>
            <td className="al-r">0</td>
            <td className="al-r">0</td>
            <td className="al-r">0</td>
          </tr>
        )
      }

      current.setDate(current.getDate() + 1)
    }

    return rows
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

  // SearchSelect용 옵션 생성
  const _monthOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [{ value: '', label: '선택' }]
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      options.push({ value, label: value })
    }
    return options
  }, [])

  const _employeeOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [{ value: '', label: '직원을 선택하세요' }]
    employeeList.forEach(emp => {
      options.push({
        value: String(emp.employeeInfoId),
        label: `${emp.employeeName} (${emp.contractClassificationName || '정직원'})`
      })
    })
    return options
  }, [employeeList])

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

  return (
    <div className="contents-wrap">
      <div className="contents-btn">
        <button className="btn-form basic" onClick={handleGoToList}>목록</button>
        {!isEditMode && id !== 'new' && (
          <>
            <button className="btn-form outline s" onClick={handleSendEmail}>이메일 전송</button>
            <button className="btn-form outline s" onClick={handleDownloadExcel}>다운로드</button>
            <button className="btn-form outline s" onClick={handleGoToWorkTimeEdit}>근무시간 수정</button>
            <button className="btn-form gray" onClick={handleDelete}>삭제</button>
            <button className="btn-form basic" onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? '저장 중...' : '수정'}
            </button>
          </>
        )}
        {isEditMode && (
          <>
            <button className="btn-form outline s" onClick={handleGoToWorkTimeEdit}>근무 시간 수정</button>
            {id !== 'new' && (
              <button className="btn-form gray" onClick={handleDelete}>삭제</button>
            )}
            <button className="btn-form gray" onClick={() => router.back()} type="button">취소</button>
            <button
              className="btn-form basic"
              onClick={isNewMode ? handleSave : handleUpdate}
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
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
                      {isEditMode ? (
                        <SearchSelect
                          options={headquarterOptions}
                          value={headquarterOptions.find(opt => opt.value === selectedHeadquarter) || null}
                          onChange={(opt) => {
                            setSelectedHeadquarter(opt?.value || '')
                            setSelectedFranchise('')
                            setSelectedStore('')
                            setEmployeeInfoId(null)
                            setPayrollMonth('')
                            setStartDate('')
                            setEndDate('')
                            setPaymentDate('')
                          }}
                          placeholder="본사 선택"
                          isDisabled={isOfficeFixed}
                          isSearchable={!isOfficeFixed}
                          isClearable={!isOfficeFixed}
                        />
                      ) : (
                        <input type="text" className="input-frame" value={existingStatement?.headOfficeName || ''} readOnly />
                      )}
                    </div>
                    <div className="block">
                      {isEditMode ? (
                        <SearchSelect
                          options={franchiseOptions}
                          value={franchiseOptions.find(opt => opt.value === selectedFranchise) || null}
                          onChange={(opt) => {
                            setSelectedFranchise(opt?.value || '')
                            setSelectedStore('')
                            setEmployeeInfoId(null)
                            setPayrollMonth('')
                            setStartDate('')
                            setEndDate('')
                            setPaymentDate('')
                          }}
                          placeholder="가맹점 선택"
                          isDisabled={isFranchiseFixed && selectedFranchise !== ''}
                          isSearchable={!isFranchiseFixed}
                          isClearable={!isFranchiseFixed}
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
                        value={storeOptions.find(opt => opt.value === selectedStore) || null}
                        onChange={(opt) => {
                          setSelectedStore(opt?.value || '')
                          setEmployeeInfoId(null)
                          setPayrollMonth('')
                          setStartDate('')
                          setEndDate('')
                          setPaymentDate('')
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
                      {id === 'new' ? (
                        <SearchSelect
                          options={_employeeOptions}
                          value={_employeeOptions.find(opt => opt.value === String(employeeInfoId || '')) || null}
                          onChange={(opt) => handleEmployeeChange(opt?.value || '')}
                          placeholder="직원을 선택하세요"
                          isDisabled={!isEditMode}
                        />
                      ) : (
                        <SearchSelect
                          options={[{ value: '', label: existingStatement?.memberName || '-' }]}
                          value={{ value: '', label: existingStatement?.memberName || '-' }}
                          onChange={() => {}}
                          placeholder=""
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
                  지급 월 <span className="red">*</span>
                </th>
                <td>
                  <div className="filed-flx">
                    <div className="block" style={{ width: '150px', flexShrink: 0 }}>
                      <SearchSelect
                        options={_monthOptions}
                        value={_monthOptions.find(opt => opt.value === payrollMonth) || null}
                        onChange={(opt) => handlePayrollMonthChange(opt?.value || '')}
                        placeholder="선택"
                      />
                    </div>
                    {paymentDate && <span className="info-text" style={{ marginLeft: '50px', whiteSpace: 'nowrap' }}>지급일 : {paymentDate}</span>}
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
                        onChange={(date) => { setStartDate(formatDateToString(date)); setIsSearchDone(false) }}
                      />
                      <span>~</span>
                      <DatePicker
                        value={parseStringToDate(endDate)}
                        onChange={(date) => { setEndDate(formatDateToString(date)); setIsSearchDone(false) }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-form outline s act"
                      onClick={handleSearch}
                      style={{ marginLeft: '10px', whiteSpace: 'nowrap' }}
                    >
                      검색
                    </button>
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
              {isOvertimePending && overtimeQueryEnabled ? (
                <tr>
                  <td colSpan={6} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    데이터를 조회하고 있습니다...
                  </td>
                </tr>
              ) : existingStatement && existingStatement.details.length > 0 && !editedWorkTimeData && !overtimeData ? (
                <>
                  {renderExistingDetailTable()}
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
              ) : !overtimeData || overtimeData.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    {!overtimeQueryEnabled
                      ? (isEditMode ? '직원을 선택하고 기간을 설정하면 데이터가 자동으로 조회됩니다.' : '등록된 연장근무 수당 데이터가 없습니다.')
                      : '조회된 데이터가 없습니다.'
                    }
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
