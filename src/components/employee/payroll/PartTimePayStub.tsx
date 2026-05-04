'use client'
import React, { useState, useEffect, useMemo, useRef } from 'react'
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
import {
  createPartTimerPayrollStatement,
  getPartTimerPayrollStatement,
  getPartTimerPayrollStatements
} from '@/lib/api/partTimerPayrollStatement'
import type {
  DailyWorkHoursItem,
  PartTimerPaymentItemResponse,
  WeeklyPaidHolidayAllowanceResponse,
  CreatePartTimerPayrollStatementRequest,
  PartTimerPaymentItemRequest,
  UpdatePartTimerPayrollStatementRequest,
  PartTimerDeductionItemRequest,
} from '@/lib/api/partTimerPayrollStatement'
import { WorkTimeEditData, EditableBonusItem } from './PartTimeWorkTimeEdit'
import { useBpHeadOfficeTree } from '@/hooks/queries'
import { useStoreOptions } from '@/hooks/queries/use-store-queries'
import { useContractsByEmployee, useContractList } from '@/hooks/queries/use-contract-queries'
import { usePayrollStatementSettings } from '@/hooks/queries/use-employee-settings-queries'
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'
import { calculatePayrollPeriod } from '@/lib/utils/payroll'
import {
  WORKTIME_EDIT_STORAGE_KEY,
  NEWFORM_STATE_STORAGE_KEY,
  saveBonusPreload,
  clearBonusPreload,
} from '@/lib/session/parttime-edit-session'

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

interface PartTimePayStubProps {
  id: string
  isEditMode?: boolean
  fromWorkTimeEdit?: boolean
  onSaveSuccess?: () => void
}

interface PartTimePeriodSnapshot {
  payrollMonth: string
  startDate: string
  endDate: string
  paymentDate: string
}

export default function PartTimePayStub({ id, isEditMode = false, fromWorkTimeEdit = false, onSaveSuccess }: PartTimePayStubProps) {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const isNewMode = isEditMode && id === 'new'
  const statementId = isNewMode ? undefined : parseInt(id)

  // TanStack Query: 기존 명세서 데이터를 useState 초기화보다 먼저 조회
  // 부모에서 key prop 변경 시 컴포넌트가 리마운트되고, 캐시에 최신 데이터가 있으면
  // 첫 렌더에서 동기적으로 반환되어 아래 lazy 초기화에서 올바른 값을 읽을 수 있다.
  const { data: existingStatement, isPending: isDetailLoading } = usePartTimePayrollDetail(statementId)

  // State (lazy 초기화: 부모 key prop 리마운트 시 서버 데이터로 올바르게 초기화됨)
  const [payrollMonth, setPayrollMonth] = useState(() => {
    if (!existingStatement?.payrollYearMonth) return ''
    const ym = existingStatement.payrollYearMonth
    return `${ym.substring(0, 4)}-${ym.substring(4, 6)}`
  })
  const [startDate, setStartDate] = useState(() => existingStatement?.settlementStartDate ?? '')
  const [endDate, setEndDate] = useState(() => existingStatement?.settlementEndDate ?? '')
  const [paymentDate, setPaymentDate] = useState(() => {
    if (existingStatement?.paymentDate) return existingStatement.paymentDate
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [employeeInfoId, setEmployeeInfoId] = useState<number | null>(() => existingStatement?.employeeInfoId ?? null)
  const [salaryDay, setSalaryDay] = useState<number>(5)
  const [isLoading, setIsLoading] = useState(false)
  const [editedWorkTimeData, setEditedWorkTimeData] = useState<WorkTimeEditData | null>(null)
  const [isSearchDone, setIsSearchDone] = useState(false)
  // 4대보험 공제 (lazy 초기화)
  const [nationalPension, setNationalPension] = useState(() => {
    const item = existingStatement?.deductionItems?.find(i => i.itemCode === 'NATIONAL_PENSION')
    return item ? (item.amount || 0).toLocaleString() : ''
  })
  const [healthInsurance, setHealthInsurance] = useState(() => {
    const item = existingStatement?.deductionItems?.find(i => i.itemCode === 'HEALTH_INSURANCE')
    return item ? (item.amount || 0).toLocaleString() : ''
  })
  const [employmentInsurance, setEmploymentInsurance] = useState(() => {
    const item = existingStatement?.deductionItems?.find(i => i.itemCode === 'EMPLOYMENT_INSURANCE')
    return item ? (item.amount || 0).toLocaleString() : ''
  })
  const [longTermCareInsurance, setLongTermCareInsurance] = useState(() => {
    const item = existingStatement?.deductionItems?.find(i => i.itemCode === 'LONG_TERM_CARE_INSURANCE')
    return item ? (item.amount || 0).toLocaleString() : ''
  })

  // Organization selection state (lazy 초기화)
  const [selectedHeadquarter, setSelectedHeadquarter] = useState<string>(() =>
    existingStatement?.headOfficeId ? String(existingStatement.headOfficeId) : ''
  )
  const [selectedFranchise, setSelectedFranchise] = useState<string>(() =>
    existingStatement?.franchiseId ? String(existingStatement.franchiseId) : ''
  )
  const [selectedStore, setSelectedStore] = useState<string>('')
  const lastValidPeriodRef = useRef<PartTimePeriodSnapshot>({
    payrollMonth,
    startDate,
    endDate,
    paymentDate,
  })

  useEffect(() => {
    if (!isEditMode && existingStatement) {
      lastValidPeriodRef.current = {
        payrollMonth: `${existingStatement.payrollYearMonth.substring(0, 4)}-${existingStatement.payrollYearMonth.substring(4, 6)}`,
        startDate: existingStatement.settlementStartDate,
        endDate: existingStatement.settlementEndDate,
        paymentDate: existingStatement.paymentDate,
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

  // 자동선택 로직 (렌더 중 setState 패턴 — BpForm/FullTimePayStub와 동일)
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
    { headOfficeId: headOfficeIdNum ?? 0, franchiseId: franchiseIdNum ?? undefined, employeeType: 'PART_TIME' },
    isNewMode && !!headOfficeIdNum,
    true
  )
  const payrollQueryEnabled = !!((employeeInfoId ?? existingStatement?.employeeInfoId) && startDate && endDate)
  const { data: payrollData, isPending: isPayrollPending } = useDailyWorkHours(
    { employeeInfoId: employeeInfoId ?? existingStatement?.employeeInfoId ?? 0, headOfficeId: headOfficeIdNum ?? undefined, franchiseId: franchiseIdNum ?? undefined, startDate, endDate },
    payrollQueryEnabled
  )

  // 근로계약서 상여금 조회
  // - employeeInfoId가 있으면 useContractsByEmployee 사용
  // - 없으면(기존 명세서 상세) headOfficeId + 이름으로 useContractList 폴백
  const contractEmployeeId = employeeInfoId ?? existingStatement?.employeeInfoId ?? 0
  const { data: contractList = [] } = useContractsByEmployee(contractEmployeeId, contractEmployeeId > 0)

  // headOfficeId 파생:
  // 1순위: 선택된 본사 (편집 모드)
  // 2순위: existingStatement.headOfficeId (백엔드 응답)
  // 3순위: bpTree에서 headOfficeName으로 검색
  const headOfficeIdForContract = useMemo(() => {
    if (headOfficeIdNum) return headOfficeIdNum
    if (existingStatement?.headOfficeId) return existingStatement.headOfficeId
    if (!existingStatement?.headOfficeName || bpTree.length === 0) return 0
    const office = bpTree.find(o => o.name === existingStatement.headOfficeName)
    return office?.id ?? 0
  }, [headOfficeIdNum, existingStatement?.headOfficeId, existingStatement?.headOfficeName, bpTree])

  const { data: contractListByHead } = useContractList(
    { headOfficeId: headOfficeIdForContract, size: 200 },
    contractEmployeeId === 0 && headOfficeIdForContract > 0
  )

  // 급여명세서 설정 (파트타이머 세율 조회)
  // franchiseId 파생:
  // 1순위: 선택된 가맹점 (편집 모드)
  // 2순위: existingStatement.franchiseId (백엔드 응답)
  // 3순위: bpTree에서 franchiseName으로 검색 (상세 조회 모드)
  const settingsHeadOfficeId = headOfficeIdForContract || undefined
  const settingsFranchiseId = useMemo(() => {
    if (franchiseIdNum) return franchiseIdNum
    if (existingStatement?.franchiseId) return existingStatement.franchiseId
    if (!existingStatement?.franchiseName || bpTree.length === 0) return undefined
    for (const office of bpTree) {
      const franchise = office.franchises?.find(f => f.name === existingStatement.franchiseName)
      if (franchise) return franchise.id
    }
    return undefined
  }, [franchiseIdNum, existingStatement?.franchiseId, existingStatement?.franchiseName, bpTree])

  const { data: payrollSettings } = usePayrollStatementSettings(
    { headOfficeId: settingsHeadOfficeId, franchiseId: settingsFranchiseId },
    settingsHeadOfficeId != null
  )

  // Mutations
  const updateMutation = useUpdatePartTimePayroll()
  const deleteMutation = useDeletePartTimePayroll()
  const sendEmailMutation = useSendPartTimePayrollEmail()
  const downloadExcelMutation = useDownloadPartTimePayrollExcel()

  // React 19: derived state
  const selectedEmployee = employeeList.find(emp => emp.employeeInfoId === employeeInfoId) ?? null

  // 가장 최근 계약의 상여금 (파생값)
  // employeeInfoId로 조회된 계약 우선, 없으면 headOfficeId + 직원명으로 폴백
  const contractBonuses = useMemo(() => {
    if (contractList.length > 0) {
      const sorted = [...contractList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return sorted[0]?.salaryInfo?.bonuses ?? []
    }
    if (contractListByHead?.content && existingStatement?.memberName) {
      const filtered = contractListByHead.content.filter(c => c.member?.name === existingStatement.memberName)
      if (filtered.length > 0) {
        const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return sorted[0]?.salaryInfo?.bonuses ?? []
      }
    }
    return []
  }, [contractList, contractListByHead, existingStatement?.memberName])

  // 파트타이머 상여금 세율 (근로소득세율 + 지방소득세율)
  const bonusTaxRate = useMemo(() => {
    const income = payrollSettings?.parttimeIncomeTaxRate ?? 3
    const local = payrollSettings?.parttimeLocalTaxRate ?? 0.3
    return (income + local) / 100
  }, [payrollSettings?.parttimeIncomeTaxRate, payrollSettings?.parttimeLocalTaxRate])

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

  // 상세 모드에서 근무시간 수정 후 돌아왔을 때 editedWorkTimeData 로드
  useEffect(() => {
    if (fromWorkTimeEdit && !isEditMode && !editedWorkTimeData) {
      const savedData = localStorage.getItem(WORKTIME_EDIT_STORAGE_KEY)
      if (savedData) {
        try {
          const parsed: WorkTimeEditData = JSON.parse(savedData)
          if (parsed.payrollMonth) setPayrollMonth(parsed.payrollMonth)
          if (parsed.startDate) setStartDate(parsed.startDate)
          if (parsed.endDate) setEndDate(parsed.endDate)
          setEditedWorkTimeData(parsed)
        } catch {
          localStorage.removeItem(WORKTIME_EDIT_STORAGE_KEY)
        }
      }
    }
  }, [fromWorkTimeEdit, isEditMode, editedWorkTimeData])

  useEffect(() => {
    if (fromWorkTimeEdit && isEditMode && !editedWorkTimeData) {
      // 폼 전체 상태 복원
      const savedFormState = localStorage.getItem(NEWFORM_STATE_STORAGE_KEY)
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
            nationalPension: string
            healthInsurance: string
            employmentInsurance: string
            longTermCareInsurance: string
          }
          if (s.selectedHeadquarter) setSelectedHeadquarter(s.selectedHeadquarter)
          if (s.selectedFranchise) setSelectedFranchise(s.selectedFranchise)
          if (s.selectedStore) setSelectedStore(s.selectedStore)
          if (s.employeeInfoId != null) setEmployeeInfoId(s.employeeInfoId)
          if (s.payrollMonth) setPayrollMonth(s.payrollMonth)
          if (s.startDate) setStartDate(s.startDate)
          if (s.endDate) setEndDate(s.endDate)
          if (s.paymentDate) setPaymentDate(s.paymentDate)
          if (s.nationalPension) setNationalPension(s.nationalPension)
          if (s.healthInsurance) setHealthInsurance(s.healthInsurance)
          if (s.employmentInsurance) setEmploymentInsurance(s.employmentInsurance)
          if (s.longTermCareInsurance) setLongTermCareInsurance(s.longTermCareInsurance)
        } catch (e) {
          console.error('폼 상태 복원 실패:', e)
          localStorage.removeItem(NEWFORM_STATE_STORAGE_KEY)
          void alert('이전 편집 데이터를 불러오는 데 실패했습니다. 데이터를 다시 입력해주세요.')
        }
      }

      // 근무시간 수정 데이터 복원
      const savedData = localStorage.getItem(WORKTIME_EDIT_STORAGE_KEY)
      if (savedData) {
        try {
          const parsed: WorkTimeEditData = JSON.parse(savedData)

          setEditedWorkTimeData(parsed)

          if (parsed.payrollMonth) setPayrollMonth(parsed.payrollMonth)

          if (parsed.startDate) setStartDate(parsed.startDate)

          if (parsed.endDate) setEndDate(parsed.endDate)
        } catch (error) {
          console.error('localStorage 데이터 파싱 실패:', error)
          localStorage.removeItem(WORKTIME_EDIT_STORAGE_KEY)
          void alert('이전 편집 데이터를 불러오는 데 실패했습니다. 데이터를 다시 입력해주세요.')
        }
      }
    }
  }, [fromWorkTimeEdit, isEditMode, editedWorkTimeData, alert])

  const handleGoToList = () => {
    router.push('/employee/payroll/parttime')
  }

  const handleDelete = async () => {
    if (!existingStatement?.id) return
    if (!(await confirm('삭제하시겠습니까?'))) return

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

        const itemMap = new Map(existingStatement.paymentItems.map(p => [p.workDay, p]))
        const defaultWage = existingStatement.paymentItems[0]?.contractTimelyAmount ?? 0
        const defaultApply = existingStatement.paymentItems[0]?.applyTimelyAmount ?? 0

        const editedRecords = genDates(startDate, endDate).map(date => {
          const item = itemMap.get(date)
          const di = new Date(date).getDay()
          return item ? {
            date, dayOfWeek: DAY_ENG[di], dayOfWeekKorean: DAY_KOR[di],
            originalWorkHours: item.workHour, workHours: item.workHour,
            originalApplyTimelyAmount: item.applyTimelyAmount, applyTimelyAmount: item.applyTimelyAmount,
            paymentAmount: item.totalAmount, deductionAmount: item.deductionAmount,
            totalAmount: item.totalAmount - item.deductionAmount,
            contractHourlyWage: item.contractTimelyAmount, contractWorkHours: 0,
            weekNumber: isoWeek(date)
          } : {
            date, dayOfWeek: DAY_ENG[di], dayOfWeekKorean: DAY_KOR[di],
            originalWorkHours: 0, workHours: 0,
            originalApplyTimelyAmount: defaultApply, applyTimelyAmount: defaultApply,
            paymentAmount: 0, deductionAmount: 0, totalAmount: 0,
            contractHourlyWage: defaultWage, contractWorkHours: 0,
            weekNumber: isoWeek(date)
          }
        })

        const weeklyHolidayAllowances = (existingStatement.weeklyPaidHolidayAllowances ?? []).map(w => ({
          weekStartDate: w.weekStartDate ?? '',
          weekEndDate: w.weekEndDate ?? '',
          weekNumber: w.workWeek,
          totalWorkHours: w.workTime,
          holidayAllowanceHours: w.applyTimelyAmount > 0 ? w.totalAmount / w.applyTimelyAmount : 0,
          applyTimelyAmount: w.applyTimelyAmount,
          holidayAllowanceAmount: w.totalAmount,
          deductionAmount: w.deductionAmount,
          totalAmount: w.netAmount,
          isEligible: w.totalAmount > 0,
        }))

        // 계약서 상여를 기준으로, 기존 저장된 항목은 현재 상태 유지 / 새로 추가된 항목은 OFF
        const savedBonusItems = existingStatement.bonusItems ?? []
        const preloadBonusItems: EditableBonusItem[] = contractBonuses.length > 0
          ? contractBonuses.map((cb, i) => {
              const saved = savedBonusItems.find(
                b => (cb.bonusCode && b.bonusCode && cb.bonusCode === b.bonusCode) || cb.bonusType === b.bonusName
              )
              if (saved) {
                return {
                  id: saved.id,
                  bonusCode: saved.bonusCode ?? cb.bonusCode,
                  bonusName: saved.bonusName,
                  bonusAmount: saved.bonusAmount,
                  deductionAmount: saved.deductionAmount,
                  isActive: saved.isActive,
                  itemOrder: saved.itemOrder,
                }
              }
              return {
                id: cb.id,
                bonusCode: cb.bonusCode,
                bonusName: cb.bonusType,
                bonusAmount: cb.amount,
                deductionAmount: Math.floor(cb.amount * bonusTaxRate),
                isActive: false, // 새로 추가된 항목은 OFF
                itemOrder: savedBonusItems.length + i + 1,
              }
            })
          : savedBonusItems.map(b => ({
              id: b.id,
              bonusCode: b.bonusCode,
              bonusName: b.bonusName,
              bonusAmount: b.bonusAmount,
              deductionAmount: b.deductionAmount,
              isActive: b.isActive,
              itemOrder: b.itemOrder,
            }))

        const preload: WorkTimeEditData = {
          employeeInfoId: String(existingStatement.employeeInfoId),
          startDate, endDate,
          payrollMonth,
          editedRecords, weeklyHolidayAllowances,
          grandTotalWorkHours: existingStatement.paymentItems.reduce((s, p) => s + p.workHour, 0),
          grandTotalPaymentAmount: existingStatement.paymentItems.reduce((s, p) => s + p.totalAmount, 0),
          grandTotalDeductionAmount: existingStatement.totalDeductionAmount,
          grandTotalAmount: existingStatement.actualPaymentAmount,
          contractHourlyWageInfo: { weekDayHourlyWage: defaultWage, overtimeHourlyWage: 0, holidayHourlyWage: 0 },
          bonusItems: preloadBonusItems.length > 0 ? preloadBonusItems : undefined,
          bonusTaxRate,
        }
        localStorage.setItem(WORKTIME_EDIT_STORAGE_KEY, JSON.stringify(preload))
      }

      const params = new URLSearchParams({
        startDate,
        endDate,
        employeeInfoId: String(existingStatement!.employeeInfoId),
        payrollMonth,
        returnToDetail: 'true',
        ...(existingStatement!.headOfficeId && { headOfficeId: String(existingStatement!.headOfficeId) }),
        ...(existingStatement!.franchiseId && { franchiseId: String(existingStatement!.franchiseId) }),
      })
      router.push(`/employee/payroll/parttime/${id}/worktime?${params.toString()}`)
      return
    }

    // 편집 모드: 기존 로직
    if (!employeeInfoId) {
      await alert('파트타이머를 선택해주세요.')
      return
    }
    if (!startDate || !endDate) {
      await alert('급여지급월을 선택하고 기간을 설정해주세요.')
      return
    }
    // 돌아올 때 복원할 폼 전체 상태 저장
    localStorage.setItem(NEWFORM_STATE_STORAGE_KEY, JSON.stringify({
      selectedHeadquarter,
      selectedFranchise,
      selectedStore,
      employeeInfoId,
      payrollMonth,
      startDate,
      endDate,
      paymentDate,
      nationalPension,
      healthInsurance,
      employmentInsurance,
      longTermCareInsurance,
    }))
    // 보너스 preload 저장 (WorkTimeEdit에서 로드)
    // employeeInfoId 네임스페이스 적용으로 다른 직원 편집 시 cross-employee leak 방지
    if (contractBonuses.length > 0) {
      saveBonusPreload(employeeInfoId, {
        bonusItems: contractBonuses.map((b, i) => ({
          id: b.id,
          bonusCode: b.bonusCode,
          bonusName: b.bonusType,
          bonusAmount: b.amount,
          deductionAmount: Math.floor(b.amount * bonusTaxRate),
          isActive: true,
          itemOrder: i + 1,
        })),
        bonusTaxRate,
      })
    } else {
      clearBonusPreload(employeeInfoId)
    }
    const params = new URLSearchParams({
      startDate,
      endDate,
      employeeInfoId: String(employeeInfoId),
      payrollMonth,
      ...(headOfficeIdNum && { headOfficeId: String(headOfficeIdNum) }),
      ...(franchiseIdNum && { franchiseId: String(franchiseIdNum) }),
    })
    router.push(`/employee/payroll/parttime/${id}/worktime?${params.toString()}`)
  }

  const handlePayrollMonthChange = async (month: string) => {
    // 상세 모드: 기간 자동 설정만 허용 (중복 확인 없이)
    if (!isEditMode) {
      setIsSearchDone(false)
      if (month) {
        setPayrollMonth(month)
        const { startDate, endDate } = calculatePayrollPeriod(month, 'SLRCF_002', salaryDay)
        setStartDate(startDate)
        setEndDate(endDate)
        if (isEditMode) {
          lastValidPeriodRef.current = {
            payrollMonth: month,
            startDate,
            endDate,
            paymentDate,
          }
        }
      } else {
        setPayrollMonth('')
        setStartDate('')
        setEndDate('')
      }
      return
    }

    if (month) {
      if (!employeeInfoId) {
        await alert('먼저 파트타이머를 선택해주세요.')
        return
      }

      if (!headOfficeIdNum) {
        await alert('본사를 먼저 선택해주세요.')
        return
      }

      try {
        const payrollYearMonth = month.replace('-', '')
        const existingPayrolls = await getPartTimerPayrollStatements({
          headOfficeId: headOfficeIdNum,
          franchiseStoreId: franchiseIdNum ?? undefined,
          memberId: employeeInfoId,
          payrollYearMonth
        })

        if (existingPayrolls.content.length > 0) {
          await alert(`해당 직원의 ${month} 급여명세서가 이미 등록되어 있습니다.`)
          return
        }
      } catch (error) {
        console.error('급여명세서 중복 확인 실패:', error)
        await alert('급여명세서 중복 확인 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      setPayrollMonth(month)

      const selectedEmployeeContract = employeeList.find(emp => emp.employeeInfoId === employeeInfoId)
      const salaryMonth = selectedEmployeeContract?.salaryMonth || 'SLRCF_001'
      const salaryDayValue = selectedEmployeeContract?.salaryDay ?? salaryDay
      const { startDate, endDate, paymentDate } = calculatePayrollPeriod(month, salaryMonth, salaryDayValue)

      setSalaryDay(salaryDayValue)
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
      setPayrollMonth('')
      setStartDate('')
      setEndDate('')
      setPaymentDate('')
    }
  }

  const hasDateOverlapConflict = async (excludeId?: number) => {
    const memberId = selectedEmployee?.memberId ?? existingStatement?.memberId
    const headOfficeId = headOfficeIdNum ?? existingStatement?.headOfficeId

    if (!memberId || !headOfficeId || !startDate || !endDate) {
      return false
    }

    const listResult = await getPartTimerPayrollStatements({
      memberId,
      headOfficeId,
      size: 200,
    })

    const candidateIds = listResult.content
      .filter(statement => statement.id !== excludeId)
      .map(statement => statement.id)

    if (candidateIds.length === 0) return false

    const details = await Promise.all(candidateIds.map(id => getPartTimerPayrollStatement(id)))

    return details.some(statement =>
      startDate <= statement.settlementEndDate &&
      endDate >= statement.settlementStartDate
    )
  }

  const handleSearch = async () => {
    if (!payrollMonth || !startDate || !endDate) {
      await alert('급여지급월과 기간을 모두 입력해주세요.')
      return
    }

      const payrollYearMonth = payrollMonth.replace('-', '')
      // 신규/편집 모드: 선택된 폼 값 우선, 상세 모드: existingStatement 사용
      const memberId = selectedEmployee?.memberId ?? existingStatement?.memberId
      const headOfficeId = headOfficeIdNum ?? existingStatement?.headOfficeId

    try {
      // 1) payrollYearMonth 기준 충돌 검사
      const result = await getPartTimerPayrollStatements({
        memberId,
        headOfficeId,
        payrollYearMonth,
        size: 100,
      })

      const conflicting = result.content.filter(s => s.id !== statementId)
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
      await alert('저장할 근무 데이터가 없습니다. 기간을 설정하고 근무시간 수정에서 데이터를 입력해주세요.')
      return
    }

    const totalAmount = editedWorkTimeData
      ? editedWorkTimeData.grandTotalAmount
      : (payrollData?.grandTotalAmount ?? 0)
    if (totalAmount === 0) {
      await alert('총액이 0원입니다. 근무 시간을 입력한 후 저장해주세요.')
      return
    }

    const payrollYearMonth = payrollMonth.replace('-', '')

    if (contractBonuses.length > 0 && !payrollSettings) {
      await alert('세율 설정을 불러오지 못했습니다. 페이지를 새로고침한 후 다시 시도해주세요.')
      return
    }

    const hasDateConflict = await hasDateOverlapConflict()
    if (hasDateConflict) {
      await alert('해당 기간에 급여명세서가 이미 존재합니다.')
      return
    }

    // editedWorkTimeData.bonusItems 우선 사용 (WorkTimeEdit에서 편집된 데이터)
    // 없으면 계약서 기반 fallback (모두 활성)
    const bonusItems = (() => {
      if (editedWorkTimeData?.bonusItems?.length) {
        return editedWorkTimeData.bonusItems.map(b => {
          const contractBonus = contractBonuses.find(cb => cb.bonusType === b.bonusName)
          return {
            bonusCode: b.bonusCode ?? contractBonus?.bonusCode,
            bonusName: b.bonusName,
            bonusAmount: b.bonusAmount,
            deductionAmount: b.deductionAmount,
            isActive: b.isActive,
            itemOrder: b.itemOrder,
          }
        })
      }
      if (contractBonuses.length > 0) {
        return contractBonuses.map((b, i) => ({
          bonusCode: b.bonusCode,
          bonusName: b.bonusType,
          bonusAmount: b.amount,
          deductionAmount: Math.floor(b.amount * bonusTaxRate),
          isActive: true,
          itemOrder: i + 1,
        }))
      }
      return undefined
    })()

    const parseAmount = (val: string) => parseInt(val.replace(/,/g, '')) || 0
    const deductionItems: PartTimerDeductionItemRequest[] = []
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

    const request: CreatePartTimerPayrollStatementRequest = {
      employeeInfoId,
      payrollYearMonth,
      settlementStartDate: startDate,
      settlementEndDate: endDate,
      paymentDate,
      remarks: undefined,
      paymentItems,
      deductionItems: deductionItems, // 빈 배열도 명시적으로 전송 → 서버에서 기존 항목 삭제 처리
      bonusItems,
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

    // 근무시간 수정 데이터가 있으면 우선 사용, 없으면 기존 paymentItems 유지
    const paymentItems: PartTimerPaymentItemRequest[] = editedWorkTimeData && editedWorkTimeData.editedRecords.length > 0
      ? editedWorkTimeData.editedRecords.map(record => ({
          workDay: record.date,
          workHour: record.workHours,
          breakTimeHour: 0,
          contractTimelyAmount: record.contractHourlyWage,
          applyTimelyAmount: record.applyTimelyAmount,
          totalAmount: record.paymentAmount,
          deductionAmount: record.deductionAmount,
          remarks: undefined,
        }))
      : existingStatement.paymentItems.map(item => ({
          workDay: item.workDay,
          workHour: item.workHour,
          breakTimeHour: item.breakTimeHour,
          contractTimelyAmount: item.contractTimelyAmount,
          applyTimelyAmount: item.applyTimelyAmount,
          totalAmount: item.totalAmount,
          deductionAmount: item.deductionAmount,
          remarks: item.remarks,
        }))

    const totalPaymentAmount = paymentItems.reduce((sum, item) => sum + item.totalAmount, 0)
    if (totalPaymentAmount === 0) {
      await alert('총액이 0원입니다. 저장할 수 없습니다.')
      return
    }

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

    const hasBonusItems = (existingStatement.bonusItems?.length ?? 0) > 0 || contractBonuses.length > 0
    if (hasBonusItems && !payrollSettings) {
      await alert('세율 설정을 불러오지 못했습니다. 페이지를 새로고침한 후 다시 시도해주세요.')
      return
    }

    // editedWorkTimeData.bonusItems 우선 사용 (WorkTimeEdit에서 편집된 데이터)
    // 없으면 existingStatement.bonusItems 유지, 그것도 없으면 계약서 기반 fallback
    const bonusItems = (() => {
      if (editedWorkTimeData?.bonusItems?.length) {
        return editedWorkTimeData.bonusItems.map(b => {
          const contractBonus = contractBonuses.find(cb => cb.bonusType === b.bonusName)
          return {
            bonusCode: b.bonusCode ?? contractBonus?.bonusCode,
            bonusName: b.bonusName,
            bonusAmount: b.bonusAmount,
            deductionAmount: b.deductionAmount,
            isActive: b.isActive,
            itemOrder: b.itemOrder,
          }
        })
      }
      if (existingStatement.bonusItems != null && existingStatement.bonusItems.length > 0) {
        return existingStatement.bonusItems.map(b => {
          const contractBonus = contractBonuses.find(cb => cb.bonusType === b.bonusName)
          return {
            bonusCode: b.bonusCode ?? contractBonus?.bonusCode,
            bonusName: b.bonusName,
            bonusAmount: b.bonusAmount,
            // 서버에 0으로 저장된 레코드 편집 시 원천세 불일치 방지:
            // deductionAmount가 0이면 bonusAmount × 세율로 재계산 (fallback)
            deductionAmount: b.deductionAmount > 0
              ? b.deductionAmount
              : Math.floor(b.bonusAmount * bonusTaxRate),
            isActive: b.isActive,
            itemOrder: b.itemOrder,
          }
        })
      }
      if (contractBonuses.length > 0) {
        return contractBonuses.map((b, i) => ({
          bonusCode: b.bonusCode,
          bonusName: b.bonusType,
          bonusAmount: b.amount,
          deductionAmount: Math.floor(b.amount * bonusTaxRate),
          isActive: true,
          itemOrder: i + 1,
        }))
      }
      return undefined
    })()

    const request: UpdatePartTimerPayrollStatementRequest = {
      payrollYearMonth: payrollMonth.replace('-', ''),
      settlementStartDate: startDate,
      settlementEndDate: endDate,
      paymentDate,
      paymentItems,
      deductionItems: deductionItems, // 빈 배열도 명시적으로 전송 → 서버에서 기존 항목 삭제 처리
      bonusItems,
    }

    try {
      const hasDateConflict = await hasDateOverlapConflict(statementId)
      if (hasDateConflict) {
        await alert('해당 기간에 급여명세서가 이미 존재합니다.')
        return
      }

      await updateMutation.mutateAsync({ id: statementId, request })
      localStorage.removeItem(WORKTIME_EDIT_STORAGE_KEY)
      setEditedWorkTimeData(null)
      await alert('수정되었습니다.')
      onSaveSuccess?.()
    } catch (error) {
      console.error('수정 실패:', error)
      await alert('수정 중 오류가 발생했습니다.')
    }
  }

  // ─── 급여명세서 합계 순수 계산 함수 ──────────────────────────────────────────
  // 4개의 IIFE 합산 블록 공통 로직 추출
  const computePayStubSummary = (params: {
    workHours: number
    paymentAmount: number        // 지급액 합계 (일자별 + 주휴수당)
    dailyDeduction: number       // 일자별+주휴수당 공제 합계
    insuranceDeduction: number   // 4대보험 공제 합계
    activeBonusItems: Array<{ bonusAmount: number; deductionAmount: number }>
  }) => {
    const { workHours, paymentAmount, dailyDeduction, insuranceDeduction, activeBonusItems } = params
    const activeBonusTotal = activeBonusItems.reduce((s, b) => s + b.bonusAmount, 0)
    const activeBonusDeductionTotal = activeBonusItems.reduce((s, b) => s + b.deductionAmount, 0)
    const subTotalNet = paymentAmount - dailyDeduction
    const totalDeduction = dailyDeduction + insuranceDeduction + activeBonusDeductionTotal
    const finalTotal = paymentAmount + activeBonusTotal - totalDeduction
    return {
      workHours,
      paymentAmount,
      dailyDeduction,
      subTotalNet,
      activeBonusTotal,
      activeBonusDeductionTotal,
      totalDeduction,
      finalTotal,
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

  const renderEditedWorkTimeWeekly = (data: WorkTimeEditData) => {
    const sortedAllowances = [...data.weeklyHolidayAllowances].sort(
      (a, b) => a.weekStartDate.localeCompare(b.weekStartDate)
    )
    const rows: React.ReactNode[] = []

    sortedAllowances.forEach((allowance, wi) => {
      const records = data.editedRecords
        .filter(r => r.date >= allowance.weekStartDate && r.date <= allowance.weekEndDate)
        .sort((a, b) => a.date.localeCompare(b.date))

      const weekWorkHours = records.reduce((s, r) => s + r.workHours, 0)
      const weekPayment = records.reduce((s, r) => s + r.paymentAmount, 0)
      const weekDeduction = records.reduce((s, r) => s + r.deductionAmount, 0)
      const weekTotal = records.reduce((s, r) => s + r.totalAmount, 0)

      // 일별 행
      records.forEach((record) => {
        const isModified = record.workHours !== record.originalWorkHours || record.applyTimelyAmount !== record.originalApplyTimelyAmount
        rows.push(
          <tr key={`w${wi}-d-${record.date}`} className={record.workHours === 0 ? 'disabled' : ''}>
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
      })

      // 소계
      rows.push(
        <tr key={`w${wi}-sub`} className="gray">
          <td>소계 ({allowance.weekNumber}주차)</td>
          <td className="al-r">{formatNumber(weekWorkHours)}</td>
          <td className="al-r">-</td>
          <td className="al-r">{formatNumber(weekPayment)}</td>
          <td className="al-r">{formatNumber(weekDeduction)}</td>
          <td className="al-r">{formatNumber(weekTotal)}</td>
        </tr>
      )

      // 주휴수당
      rows.push(
        <tr key={`w${wi}-holiday`} className="yellow">
          <td>주휴수당 ({allowance.weekNumber}주차){allowance.isEligible ? '' : ' (미대상)'}</td>
          <td className="al-r">{allowance.isEligible ? allowance.holidayAllowanceHours.toFixed(2) : 0}</td>
          <td className="al-r">{formatNumber(allowance.applyTimelyAmount)}</td>
          <td className="al-r">{formatNumber(allowance.isEligible ? allowance.holidayAllowanceAmount : 0)}</td>
          <td className="al-r">{formatNumber(allowance.isEligible ? allowance.deductionAmount : 0)}</td>
          <td className="al-r">{formatNumber(allowance.isEligible ? allowance.totalAmount : 0)}</td>
        </tr>
      )

      // 주차 합계
      const totalHours = weekWorkHours + (allowance.isEligible ? allowance.holidayAllowanceHours : 0)
      const totalPayment = weekPayment + (allowance.isEligible ? allowance.holidayAllowanceAmount : 0)
      const totalDeduction = weekDeduction + (allowance.isEligible ? allowance.deductionAmount : 0)
      const totalNet = weekTotal + (allowance.isEligible ? allowance.totalAmount : 0)
      rows.push(
        <tr key={`w${wi}-total`} className="blue">
          <td>합계 ({allowance.weekNumber}주차)</td>
          <td className="al-r">{totalHours.toFixed(2)}</td>
          <td className="al-r">{formatNumber(allowance.applyTimelyAmount)}</td>
          <td className="al-r">{formatNumber(totalPayment)}</td>
          <td className="al-r">{formatNumber(totalDeduction)}</td>
          <td className="al-r">{formatNumber(totalNet)}</td>
        </tr>
      )
    })

    return rows
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
            <button className="btn-form outline s" onClick={handleGoToWorkTimeEdit}>근무시간 수정</button>
            <button className="btn-form gray" onClick={handleDelete} disabled={deleteMutation.isPending}>삭제</button>
            <button className="btn-form basic" onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '저장 중...' : '수정'}
            </button>
          </>
        )}
        {isEditMode && (
          <>
            <button className="btn-form outline s" onClick={handleGoToWorkTimeEdit}>근무 시간 수정</button>
            <button className="btn-form gray" onClick={() => router.back()} type="button">취소</button>
            <button
              className="btn-form basic"
              onClick={isNewMode ? handleSave : handleUpdate}
              disabled={isNewMode ? isLoading : updateMutation.isPending}
            >
              {isNewMode
                ? (isLoading ? '저장 중...' : '저장')
                : (updateMutation.isPending ? '저장 중...' : '저장')}
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
                          value={franchiseOptions.find(o => o.value === selectedFranchise) || null}
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
                        value={storeOptions.find(o => o.value === selectedStore) || null}
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
              {isPayrollPending ? (
                <tr>
                  <td colSpan={6} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    데이터를 조회하고 있습니다...
                  </td>
                </tr>
              ) : !isEditMode && editedWorkTimeData && editedWorkTimeData.editedRecords.length > 0 ? (
                <>
                  {editedWorkTimeData.weeklyHolidayAllowances.length > 0
                    ? renderEditedWorkTimeWeekly(editedWorkTimeData)
                    : editedWorkTimeData.editedRecords.map((record, index) => renderEditedWorkTimeRow(record, index))
                  }
                  {(() => {
                    const eligible = editedWorkTimeData.weeklyHolidayAllowances.filter(a => a.isEligible)
                    const parseAmt = (val: string) => parseInt(val.replace(/,/g, '')) || 0
                    const insuranceDeduction = parseAmt(nationalPension) + parseAmt(healthInsurance) + parseAmt(employmentInsurance) + parseAmt(longTermCareInsurance)
                    const activeBonusItems = editedWorkTimeData.bonusItems?.filter(b => b.isActive) ?? []
                    const s = computePayStubSummary({
                      workHours: editedWorkTimeData.editedRecords.reduce((acc, r) => acc + r.workHours, 0)
                        + eligible.reduce((acc, a) => acc + a.holidayAllowanceHours, 0),
                      paymentAmount: editedWorkTimeData.editedRecords.reduce((acc, r) => acc + r.paymentAmount, 0)
                        + eligible.reduce((acc, a) => acc + a.holidayAllowanceAmount, 0),
                      dailyDeduction: editedWorkTimeData.editedRecords.reduce((acc, r) => acc + r.deductionAmount, 0)
                        + eligible.reduce((acc, a) => acc + a.deductionAmount, 0),
                      insuranceDeduction,
                      activeBonusItems,
                    })
                    return (
                      <>
                        <tr className="grand-total">
                          <td><strong>급여소계</strong></td>
                          <td className="al-r"><strong>{s.workHours.toFixed(2)}</strong></td>
                          <td className="al-r"><strong>-</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.paymentAmount)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.dailyDeduction)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.subTotalNet)}</strong></td>
                        </tr>
                        {insuranceDeduction > 0 && (
                          <tr className="grand-total" style={{ backgroundColor: '#f5f5f5', color: '#333' }}>
                            <td><strong>공제액</strong></td>
                            <td className="al-r">-</td>
                            <td className="al-r">-</td>
                            <td className="al-r">-</td>
                            <td className="al-r"><strong>{formatNumber(insuranceDeduction)}</strong></td>
                            <td className="al-r">{insuranceDeduction > 0 ? <strong style={{ color: '#e74c3c' }}>-{formatNumber(insuranceDeduction)}</strong> : <strong>{formatNumber(insuranceDeduction)}</strong>}</td>
                          </tr>
                        )}
                        {activeBonusItems.map((bonus, idx) => (
                          <tr key={idx} className="grand-total" style={{ backgroundColor: '#fffbe6' }}>
                            <td><strong>{bonus.bonusName}</strong></td>
                            <td className="al-r">-</td>
                            <td className="al-r">-</td>
                            <td className="al-r"><strong>{formatNumber(bonus.bonusAmount)}</strong></td>
                            <td className="al-r"><strong>{formatNumber(bonus.deductionAmount)}</strong></td>
                            <td className="al-r"><strong>{formatNumber(bonus.bonusAmount - bonus.deductionAmount)}</strong></td>
                          </tr>
                        ))}
                        <tr className="grand-total" style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                          <td><strong>급여합계</strong></td>
                          <td className="al-r">-</td>
                          <td className="al-r">-</td>
                          <td className="al-r"><strong>{formatNumber(s.paymentAmount + s.activeBonusTotal)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.totalDeduction)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.finalTotal)}</strong></td>
                        </tr>
                      </>
                    )
                  })()}
                </>
              ) : !isEditMode && !isSearchDone && existingStatement && (existingStatement.paymentItems.length > 0 || existingStatement.weeklyPaidHolidayAllowances?.length > 0) ? (
                <>
                  {existingStatement.paymentItems.map((item, index) => renderExistingPaymentItemRow(item, index))}
                  {existingStatement.weeklyPaidHolidayAllowances?.map((item, index) => renderWeeklyPaidHolidayAllowanceRow(item, index))}
                  {(() => {
                    const paymentItemsDeduction = existingStatement.paymentItems.reduce((acc, i) => acc + i.deductionAmount, 0)
                    const holidayDeduction = existingStatement.weeklyPaidHolidayAllowances?.reduce((acc, i) => acc + i.deductionAmount, 0) ?? 0
                    // Block 1·3과 동일하게 상태 변수 사용 → 사용자 입력값을 실시간으로 반영
                    // (existingStatement.deductionItems는 서버 저장 데이터이므로 입력 변경 즉시 반영 안 됨)
                    const parseAmt = (val: string) => parseInt(val.replace(/,/g, '')) || 0
                    const insuranceDeduction = parseAmt(nationalPension) + parseAmt(healthInsurance) + parseAmt(employmentInsurance) + parseAmt(longTermCareInsurance)
                    const activeBonusItems = existingStatement.bonusItems?.filter(b => b.isActive) ?? []
                    const dailyPaymentTotal = existingStatement.paymentItems.reduce((acc, i) => acc + i.totalAmount, 0)
                    const holidayPaymentTotal = existingStatement.weeklyPaidHolidayAllowances?.reduce((acc, i) => acc + i.totalAmount, 0) ?? 0
                    const subTotalWorkHours = existingStatement.paymentItems.reduce((acc, i) => acc + i.workHour, 0)
                    const holidayWorkHours = existingStatement.weeklyPaidHolidayAllowances?.reduce((acc, w) => acc + w.workTime, 0) ?? 0
                    const subTotalWorkHoursAll = subTotalWorkHours + holidayWorkHours
                    const s = computePayStubSummary({
                      workHours: subTotalWorkHoursAll,
                      paymentAmount: dailyPaymentTotal + holidayPaymentTotal,
                      dailyDeduction: paymentItemsDeduction + holidayDeduction,
                      insuranceDeduction,
                      activeBonusItems,
                    })
                    return (
                      <>
                        {/* 급여소계: 일자별 + 주휴수당 */}
                        <tr className="grand-total">
                          <td><strong>급여소계</strong></td>
                          <td className="al-r"><strong>{formatNumber(subTotalWorkHoursAll)}</strong></td>
                          <td className="al-r"><strong>-</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.paymentAmount)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.dailyDeduction)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.subTotalNet)}</strong></td>
                        </tr>
                        {/* 4대보험 공제액: 0원이어도 항상 표시 */}
                        <tr className="grand-total" style={{ backgroundColor: '#f5f5f5', color: '#333' }}>
                          <td><strong>공제액</strong></td>
                          <td className="al-r">-</td>
                          <td className="al-r">-</td>
                          <td className="al-r">-</td>
                          <td className="al-r"><strong>{formatNumber(insuranceDeduction)}</strong></td>
                          <td className="al-r">{insuranceDeduction > 0 ? <strong style={{ color: '#e74c3c' }}>-{formatNumber(insuranceDeduction)}</strong> : <strong>{formatNumber(insuranceDeduction)}</strong>}</td>
                        </tr>
                        {/* 상여금 개별 항목 */}
                        {activeBonusItems.map((bonus, idx) => (
                          <tr key={idx} className="grand-total" style={{ backgroundColor: '#fffbe6' }}>
                            <td><strong>{bonus.bonusName}</strong></td>
                            <td className="al-r">-</td>
                            <td className="al-r">-</td>
                            <td className="al-r"><strong>{formatNumber(bonus.bonusAmount)}</strong></td>
                            <td className="al-r"><strong>{formatNumber(bonus.deductionAmount)}</strong></td>
                            <td className="al-r"><strong>{formatNumber(bonus.bonusAmount - bonus.deductionAmount)}</strong></td>
                          </tr>
                        ))}
                        {/* 급여합계: 일자별 + 주휴수당(totalAmount에 포함) + 상여 전체 */}
                        <tr className="grand-total" style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                          <td><strong>급여합계</strong></td>
                          <td className="al-r"><strong>{formatNumber(subTotalWorkHoursAll)}</strong></td>
                          <td className="al-r">-</td>
                          <td className="al-r"><strong>{formatNumber(existingStatement.totalAmount + s.activeBonusTotal)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.totalDeduction)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.finalTotal)}</strong></td>
                        </tr>
                      </>
                    )
                  })()}
                </>
              ) : isEditMode && editedWorkTimeData && editedWorkTimeData.editedRecords.length > 0 ? (
                <>
                  {editedWorkTimeData.weeklyHolidayAllowances.length > 0
                    ? renderEditedWorkTimeWeekly(editedWorkTimeData)
                    : editedWorkTimeData.editedRecords.map((record, index) => renderEditedWorkTimeRow(record, index))
                  }
                  {(() => {
                    const eligible = editedWorkTimeData.weeklyHolidayAllowances.filter(a => a.isEligible)
                    const parseAmt = (val: string) => parseInt(val.replace(/,/g, '')) || 0
                    const insuranceDeduction = parseAmt(nationalPension) + parseAmt(healthInsurance) + parseAmt(employmentInsurance) + parseAmt(longTermCareInsurance)
                    const activeBonusItems = editedWorkTimeData.bonusItems?.filter(b => b.isActive) ?? []
                    const s = computePayStubSummary({
                      workHours: editedWorkTimeData.editedRecords.reduce((acc, r) => acc + r.workHours, 0)
                        + eligible.reduce((acc, a) => acc + a.holidayAllowanceHours, 0),
                      paymentAmount: editedWorkTimeData.editedRecords.reduce((acc, r) => acc + r.paymentAmount, 0)
                        + eligible.reduce((acc, a) => acc + a.holidayAllowanceAmount, 0),
                      dailyDeduction: editedWorkTimeData.editedRecords.reduce((acc, r) => acc + r.deductionAmount, 0)
                        + eligible.reduce((acc, a) => acc + a.deductionAmount, 0),
                      insuranceDeduction,
                      activeBonusItems,
                    })
                    return (
                      <>
                        {/* 급여소계 */}
                        <tr className="grand-total" style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                          <td><strong>급여소계</strong></td>
                          <td className="al-r"><strong>{s.workHours.toFixed(2)}</strong></td>
                          <td className="al-r"><strong>-</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.paymentAmount)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.dailyDeduction)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.subTotalNet)}</strong></td>
                        </tr>
                        {/* 4대보험 공제액 */}
                        {insuranceDeduction > 0 && (
                          <tr className="grand-total" style={{ backgroundColor: '#f5f5f5', color: '#333' }}>
                            <td><strong>공제액</strong></td>
                            <td className="al-r">-</td>
                            <td className="al-r">-</td>
                            <td className="al-r">-</td>
                            <td className="al-r"><strong>{formatNumber(insuranceDeduction)}</strong></td>
                            <td className="al-r">{insuranceDeduction > 0 ? <strong style={{ color: '#e74c3c' }}>-{formatNumber(insuranceDeduction)}</strong> : <strong>{formatNumber(insuranceDeduction)}</strong>}</td>
                          </tr>
                        )}
                        {/* 상여금 개별 항목 */}
                        {activeBonusItems.map((bonus, idx) => (
                          <tr key={idx} className="grand-total" style={{ backgroundColor: '#fffbe6' }}>
                            <td><strong>{bonus.bonusName}</strong></td>
                            <td className="al-r">-</td>
                            <td className="al-r">-</td>
                            <td className="al-r"><strong>{formatNumber(bonus.bonusAmount)}</strong></td>
                            <td className="al-r"><strong>{formatNumber(bonus.deductionAmount)}</strong></td>
                            <td className="al-r"><strong>{formatNumber(bonus.bonusAmount - bonus.deductionAmount)}</strong></td>
                          </tr>
                        ))}
                        {/* 급여합계 */}
                        <tr className="grand-total" style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                          <td><strong>급여합계</strong></td>
                          <td className="al-r">-</td>
                          <td className="al-r">-</td>
                          <td className="al-r"><strong>{formatNumber(s.paymentAmount + s.activeBonusTotal)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.totalDeduction)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s.finalTotal)}</strong></td>
                        </tr>
                      </>
                    )
                  })()}
                </>
              ) : !payrollData || payrollData.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="al-c" style={{ padding: '40px 0', color: '#999' }}>
                    {!payrollQueryEnabled
                      ? (isEditMode ? '직원을 선택하고 기간을 설정하면 데이터가 자동으로 조회됩니다.' : '등록된 급여 데이터가 없습니다.')
                      : '조회된 데이터가 없습니다.'
                    }
                  </td>
                </tr>
              ) : (
                <>
                  {payrollData.items.map((item, index) => renderTableRow(item, index))}
                  {(() => {
                    const parseAmt = (val: string) => parseInt(val.replace(/,/g, '')) || 0
                    const insuranceDeduction = parseAmt(nationalPension) + parseAmt(healthInsurance) + parseAmt(employmentInsurance) + parseAmt(longTermCareInsurance)
                    // contractBonuses 기반 상여금 합산 (모두 활성으로 취급, WorkTimeEdit에서 세부 편집 가능)
                    const s4 = computePayStubSummary({
                      workHours: payrollData.grandTotalWorkHours,
                      paymentAmount: payrollData.grandTotalPaymentAmount,
                      dailyDeduction: payrollData.grandTotalDeductionAmount,
                      insuranceDeduction,
                      activeBonusItems: contractBonuses.map((b) => ({
                        bonusAmount: b.amount,
                        deductionAmount: Math.floor(b.amount * bonusTaxRate),
                      })),
                    })
                    return (
                      <>
                        {/* 급여소계 */}
                        <tr className="grand-total">
                          <td><strong>급여소계</strong></td>
                          <td className="al-r"><strong>{formatNumber(payrollData.grandTotalWorkHours)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(payrollData.applyTimelyAmount)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(payrollData.grandTotalPaymentAmount)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s4.dailyDeduction)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(payrollData.grandTotalAmount)}</strong></td>
                        </tr>
                        {/* 상여금 개별 항목 */}
                        {contractBonuses.map((bonus, idx) => (
                          <tr key={idx} className="grand-total" style={{ backgroundColor: '#fffbe6' }}>
                            <td><strong>{bonus.bonusType}</strong></td>
                            <td className="al-r">-</td>
                            <td className="al-r">-</td>
                            <td className="al-r"><strong>{formatNumber(bonus.amount)}</strong></td>
                            <td className="al-r"><strong>{formatNumber(Math.floor(bonus.amount * bonusTaxRate))}</strong></td>
                            <td className="al-r"><strong>{formatNumber(bonus.amount - Math.floor(bonus.amount * bonusTaxRate))}</strong></td>
                          </tr>
                        ))}
                        {/* 급여합계 */}
                        <tr className="grand-total" style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                          <td><strong>급여합계</strong></td>
                          <td className="al-r">-</td>
                          <td className="al-r">-</td>
                          <td className="al-r"><strong>{formatNumber(payrollData.grandTotalPaymentAmount + s4.activeBonusTotal)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s4.totalDeduction)}</strong></td>
                          <td className="al-r"><strong>{formatNumber(s4.finalTotal)}</strong></td>
                        </tr>
                      </>
                    )
                  })()}
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
