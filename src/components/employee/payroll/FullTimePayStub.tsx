'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCommonCodeCache } from '@/hooks/queries'
import { useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import {
  useFullTimePayrollDetail,
  useLatestFullTimePayroll,
  useCreateFullTimePayroll,
  useUpdateFullTimePayroll,
  useDeleteFullTimePayroll,
  useSendFullTimePayrollEmail,
  useDownloadFullTimePayrollExcel,
} from '@/hooks/queries/use-payroll-queries'
import { usePayrollStatementSettings } from '@/hooks/queries/use-employee-settings-queries'
import { useEmployeeListByType } from '@/hooks/queries/use-employee-queries'
import { useContractsByEmployee } from '@/hooks/queries/use-contract-queries'
import { useFileInfo, useFileDownloadUrl } from '@/hooks/queries/use-file-queries'
import { getOvertimeAllowanceStatements, getOvertimeAllowanceStatement } from '@/lib/api/overtimeAllowanceStatement'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID } from '@/lib/constants/organization'
import type {
  PayrollStatementResponse,
  PaymentItemDto,
  DeductionItemDto,
  CreatePayrollStatementRequest,
  UpdatePayrollStatementRequest,
} from '@/lib/api/payrollStatement'
import type { BonusCategory } from '@/lib/api/payrollStatementSettings'

// 에러 메시지 추출 헬퍼 함수
const getErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') return ''

  if ('response' in error) {
    const axiosError = error as { response?: { data?: { message?: string; error?: string; detail?: string } } }
    const data = axiosError.response?.data
    if (data) {
      return data.message || data.error || data.detail || JSON.stringify(data)
    }
  }

  if ('message' in error) {
    return (error as { message: string }).message
  }

  return String(error)
}

interface FullTimePayStubProps {
  id: string
  isEditMode?: boolean
}

// 기본 지급 항목 코드 매핑
const PAYMENT_ITEM_LABELS: Record<string, string> = {
  'BASIC': '기본급',
  'BONUS': '상여',
  'MEAL': '식대',
  'VEHICLE': '자가운전보조금',
  'CHILD_CARE': '육아수당',
  'OVERTIME': '연장수당',
  'NIGHT': '야간수당',
  'MONTHLY_HOLIDAY': '월간 휴일근무 수당',
  'ANNUAL_LEAVE': '연차수당',
  'ADD': '추가근무수당',
}

// 공제 항목 코드 매핑
const DEDUCTION_ITEM_LABELS: Record<string, string> = {
  'NATIONAL_PENSION': '국민연금',
  'HEALTH_INSURANCE': '건강보험',
  'EMPLOYMENT_INSURANCE': '고용보험',
  'LONG_TERM_CARE_INSURANCE': '장기요양보험',
  'INCOME_TAX': '소득세',
  'LOCAL_INCOME_TAX': '지방소득세',
  'YEAR_END_MID_TERM_SETTLEMENT': '연말(중도)정산',
  'YEAR_END_MID_TERM_SETTLEMENT_INCOME_TAX': '연말(중도)정산소득세',
  'YEAR_END_MID_TERM_SETTLEMENT_CITIZENSHIP_TAX': '연말중도정산주민세',
  'HEALTH_INSURANCE_DEDUCTION': '건강보험정산',
  'LONG_TERM_CARE_INSURANCE_DEDUCTION': '장기요양보험정산',
  'NATIONAL_PENSION_DEDUCTION': '국민연금정산',
  'EMPLOYMENT_INSURANCE_DEDUCTION': '고용보험정산',
  'LONG_TERM_CARE_INSURANCE_CALCULATION': '장기요양보험산정',
  'RESERVE_MONEY_FOR_RETIRED_EMPLOYEES': '퇴사자유보금',
  'STOCK_OPTION': '스톡옵션',
}

// 지급/공제 항목 행 인터페이스
interface PayrollItemRow {
  paymentItem: PaymentItemDto | null
  deductionItem: DeductionItemDto | null
}

// 공통코드 노드 타입
interface CommonCodeNode {
  id: number
  code: string
  name: string
  description?: string | null
  depth: number
  sortOrder?: number
  isActive: boolean
}

// 월 옵션 생성 (최근 12개월)
const getPayrollMonthOptions = (): { value: string; label: string }[] => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const formatMonth = (year: number, month: number) => ({
    value: `${year}${month.toString().padStart(2, '0')}`,
    label: `${year}년 ${month}월`
  })

  const options: { value: string; label: string }[] = []

  // 최근 12개월 생성 (현재 월부터 11개월 전까지)
  for (let i = 0; i < 12; i++) {
    let targetMonth = currentMonth - i
    let targetYear = currentYear

    while (targetMonth <= 0) {
      targetMonth += 12
      targetYear -= 1
    }

    options.push(formatMonth(targetYear, targetMonth))
  }

  return options
}

// 정산 기간 계산
const calculateSettlementPeriod = (
  payrollYearMonth: string,
  salaryMonth: string
): { startDate: string; endDate: string } => {
  if (!payrollYearMonth || payrollYearMonth.length !== 6) {
    return { startDate: '', endDate: '' }
  }

  const year = parseInt(payrollYearMonth.substring(0, 4))
  const month = parseInt(payrollYearMonth.substring(4, 6))

  let settlementYear = year
  let settlementMonth = month

  if (salaryMonth === 'SLRCF_002') {
    settlementMonth = month === 1 ? 12 : month - 1
    settlementYear = month === 1 ? year - 1 : year
  }

  const lastDay = new Date(settlementYear, settlementMonth, 0).getDate()

  const startDate = `${settlementYear}-${settlementMonth.toString().padStart(2, '0')}-01`
  const endDate = `${settlementYear}-${settlementMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`

  return { startDate, endDate }
}

export default function FullTimePayStub({ id, isEditMode = false }: FullTimePayStubProps) {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const { getHierarchyChildren } = useCommonCodeCache()
  const isNewMode = isEditMode && id === 'new'
  const statementId = isNewMode ? undefined : parseInt(id)

  // Local state - 조직 선택 (hooks보다 먼저 선언)
  // TODO: 나중에 로그인한 사용자가 선택한 조직으로 대체
  const [selectedHeadOfficeId] = useState<number>(DEFAULT_HEAD_OFFICE_ID)
  const [selectedFranchiseStoreId] = useState<number>(DEFAULT_FRANCHISE_ID)

  // TanStack Query hooks
  const { data: existingPayrollData, isPending: isDetailLoading } = useFullTimePayrollDetail(statementId)
  const { data: payrollSettings } = usePayrollStatementSettings({ headOfficeId: selectedHeadOfficeId, franchiseId: selectedFranchiseStoreId })
  const { data: employeeList = [] } = useEmployeeListByType(
    { headOfficeId: selectedHeadOfficeId, franchiseId: selectedFranchiseStoreId, employeeType: 'FULL_TIME' },
    isNewMode
  )

  // Mutations
  const createMutation = useCreateFullTimePayroll()
  const updateMutation = useUpdateFullTimePayroll()
  const deleteMutation = useDeleteFullTimePayroll()
  const sendEmailMutation = useSendFullTimePayrollEmail()
  const downloadExcelMutation = useDownloadFullTimePayrollExcel()

  // Local state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [payrollData, setPayrollData] = useState<PayrollStatementResponse | null>(null)
  const [isLoadingOvertime, setIsLoadingOvertime] = useState(false)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [showDeductionModal, setShowDeductionModal] = useState(false)

  // 공통코드 상태
  const [paymentCommonCodes, setPaymentCommonCodes] = useState<CommonCodeNode[]>([])
  const [deductionCommonCodes, setDeductionCommonCodes] = useState<CommonCodeNode[]>([])
  const [additionalDeductionCodes, setAdditionalDeductionCodes] = useState<CommonCodeNode[]>([])

  // 직원 계약 정보 조회
  const { data: employeeContracts = [] } = useContractsByEmployee(selectedEmployeeId ?? 0, !!selectedEmployeeId)
  const employeeContract = employeeContracts[0] ?? null

  // 이전 employeeContract ID 추적 (salaryInfo 맵핑 중복 실행 방지)
  const prevEmployeeContractIdRef = useRef<number | null | undefined>(null)

  // 첨부파일 정보 조회
  const attachmentFileId = payrollData?.attachmentFileId ?? existingPayrollData?.attachmentFileId
  const { data: attachmentFileInfo } = useFileInfo(attachmentFileId ?? 0, !!attachmentFileId)
  const { data: fileDownloadUrlData } = useFileDownloadUrl(attachmentFileId ?? 0, !!attachmentFileId)

  // 이전 급여 정보 조회
  const { data: _latestPayrollData, refetch: refetchLatestPayroll } = useLatestFullTimePayroll(
    selectedEmployeeId ?? 0,
    false
  )

  // React 19: derived state
  const payrollMonthOptions = getPayrollMonthOptions()
  const bonusCategories = payrollSettings?.bonusCategories || []

  // SearchSelect options
  const employeeSelectOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '선택' },
    ...employeeList.map(emp => ({
      value: String(emp.employeeInfoId),
      label: `${emp.employeeName} (${emp.employeeNumber})`
    }))
  ], [employeeList])

  const payrollMonthSelectOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '선택' },
    ...payrollMonthOptions.map(opt => ({
      value: opt.value,
      label: opt.label
    }))
  ], [payrollMonthOptions])

  // Empty options for organization selects (not yet implemented)
  const emptySelectOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '선택' }
  ], [])

  // 오늘 날짜
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [formData, setFormData] = useState(() => ({
    headOffice: '',
    franchise: '',
    store: '',
    memberName: '',
    payrollYearMonth: payrollMonthOptions[0]?.value || '',
    paymentDate: todayStr,
    settlementStartDate: '',
    settlementEndDate: '',
    baseSalary: 0,
    mealAllowance: 0,
    vehicleAllowance: 0,
    childcareAllowance: 0,
    overtimeAllowance: 0,
    nightAllowance: 0,
    holidayAllowance: 0,
    extraWorkAllowance: 0,
    positionBonus: 0,
    incentive: 0,
    nationalPension: 0,
    healthInsurance: 0,
    employmentInsurance: 0,
    longTermCare: 0,
    incomeTax: 0,
    localIncomeTax: 0,
    totalPaymentAmount: 0,
    totalDeductionAmount: 0,
    actualPaymentAmount: 0,
  }))

  // 공통코드 로드 (마운트 시 한 번만)
  useEffect(() => {
    const loadCommonCodes = async () => {
      try {
        const dptbsCodes = await getHierarchyChildren('DPTBS')
        setPaymentCommonCodes(dptbsCodes.filter((c: CommonCodeNode) => c.isActive))

        const ddtbsCodes = await getHierarchyChildren('DDTBS')
        setDeductionCommonCodes(ddtbsCodes.filter((c: CommonCodeNode) => c.isActive))

        const ddtadCodes = await getHierarchyChildren('DDTAD')
        setAdditionalDeductionCodes(ddtadCodes.filter((c: CommonCodeNode) => c.isActive))
      } catch (error) {
        console.error('공통코드 로딩 실패:', error)
      }
    }
    loadCommonCodes()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 공통코드는 마운트 시 한 번만 로드
  }, [])

  // 기존 데이터가 로드되면 폼에 반영
  useEffect(() => {
    if (existingPayrollData && !isNewMode && !payrollData) {
       
      setPayrollData(existingPayrollData)

      const paymentMap: Record<string, number> = {}
      existingPayrollData.paymentItems?.forEach(item => {
        paymentMap[item.itemCode] = item.amount
      })

      const deductionMap: Record<string, number> = {}
      existingPayrollData.deductionItems?.forEach(item => {
        deductionMap[item.itemCode] = item.amount
      })

       
      setFormData({
        headOffice: existingPayrollData.headOfficeName || '',
        franchise: existingPayrollData.franchiseName || '',
        store: existingPayrollData.storeName || '',
        memberName: existingPayrollData.memberName || '',
        payrollYearMonth: existingPayrollData.payrollYearMonth || '',
        paymentDate: existingPayrollData.paymentDate || '',
        settlementStartDate: existingPayrollData.settlementStartDate || '',
        settlementEndDate: existingPayrollData.settlementEndDate || '',
        baseSalary: paymentMap['BASIC'] || paymentMap['DPTBS_001'] || 0,
        mealAllowance: paymentMap['MEAL'] || paymentMap['DPTBS_002'] || 0,
        vehicleAllowance: paymentMap['VEHICLE'] || paymentMap['DPTBS_003'] || 0,
        childcareAllowance: paymentMap['CHILD_CARE'] || paymentMap['DPTBS_004'] || 0,
        overtimeAllowance: paymentMap['OVERTIME'] || paymentMap['DPTBS_005'] || 0,
        nightAllowance: paymentMap['NIGHT'] || paymentMap['DPTBS_006'] || 0,
        holidayAllowance: paymentMap['MONTHLY_HOLIDAY'] || paymentMap['DPTBS_007'] || 0,
        extraWorkAllowance: paymentMap['ADD'] || paymentMap['DPTBS_008'] || 0,
        positionBonus: 0,
        incentive: 0,
        nationalPension: deductionMap['NATIONAL_PENSION'] || deductionMap['DDTBS_001'] || 0,
        healthInsurance: deductionMap['HEALTH_INSURANCE'] || deductionMap['DDTBS_002'] || 0,
        employmentInsurance: deductionMap['EMPLOYMENT_INSURANCE'] || deductionMap['DDTBS_003'] || 0,
        longTermCare: deductionMap['LONG_TERM_CARE_INSURANCE'] || deductionMap['DDTBS_004'] || 0,
        incomeTax: deductionMap['INCOME_TAX'] || deductionMap['DDTBS_005'] || 0,
        localIncomeTax: deductionMap['LOCAL_INCOME_TAX'] || deductionMap['DDTBS_006'] || 0,
        totalPaymentAmount: existingPayrollData.totalPaymentAmount || 0,
        totalDeductionAmount: existingPayrollData.totalDeductionAmount || 0,
        actualPaymentAmount: existingPayrollData.actualPaymentAmount || 0,
      })
    }
  }, [existingPayrollData, isNewMode, payrollData])

  // 신규 모드에서 기본 항목 설정
  useEffect(() => {
    if (isNewMode && !payrollData && paymentCommonCodes.length > 0 && deductionCommonCodes.length > 0) {
      const defaultPaymentItems: PaymentItemDto[] = paymentCommonCodes.map((code, index) => ({
        itemCode: code.code,
        itemOrder: index + 1,
        amount: 0,
        remarks: code.name
      }))

      const defaultDeductionItems: DeductionItemDto[] = deductionCommonCodes.map((code, index) => ({
        itemCode: code.code,
        itemOrder: index + 1,
        amount: 0,
        remarks: code.name
      }))

      const salaryMonth = employeeContract?.employmentContractHeader?.salaryMonth || 'SLRCF_001'
      const { startDate, endDate } = calculateSettlementPeriod(formData.payrollYearMonth, salaryMonth)

       
      setPayrollData({
        id: 0,
        memberId: 0,
        memberName: '',
        headOfficeName: '',
        franchiseName: undefined,
        storeName: undefined,
        payrollYearMonth: formData.payrollYearMonth,
        paymentDate: formData.paymentDate,
        settlementStartDate: startDate,
        settlementEndDate: endDate,
        paymentItems: defaultPaymentItems,
        deductionItems: defaultDeductionItems,
        bonuses: [],
        totalPaymentAmount: 0,
        totalDeductionAmount: 0,
        actualPaymentAmount: 0,
        remarks: undefined,
        attachmentFileId: undefined,
        isEmailSend: false,
        createdAt: '',
        updatedAt: '',
      })

       
      setFormData(prev => ({
        ...prev,
        settlementStartDate: startDate,
        settlementEndDate: endDate
      }))
    }
  }, [isNewMode, payrollData, paymentCommonCodes, deductionCommonCodes, employeeContract, formData.payrollYearMonth, formData.paymentDate])

  // 직원 계약 정보가 변경되면 정산 기간 및 급여 정보 업데이트 (신규 모드에서만)
  useEffect(() => {
    if (!isNewMode || !employeeContract || !selectedEmployeeId || !payrollData) return

    // 이미 처리한 계약이면 스킵 (무한 루프 방지)
    const currentContractId = employeeContract.employmentContractHeader?.id
    if (prevEmployeeContractIdRef.current === currentContractId) return
    prevEmployeeContractIdRef.current = currentContractId

    const salaryMonth = employeeContract?.employmentContractHeader?.salaryMonth || 'SLRCF_001'
    const { startDate, endDate } = calculateSettlementPeriod(formData.payrollYearMonth, salaryMonth)
    const salaryInfo = employeeContract?.salaryInfo
    const contractHeader = employeeContract?.employmentContractHeader

    // 근로 계약의 salaryInfo를 지급 항목에 맵핑
    if (salaryInfo) {
      const basePaymentItems = payrollData.paymentItems.map(item => {
        let amount = item.amount
        switch (item.itemCode) {
          case 'DPTBS_001':  // 기본급
          case 'BASIC':
            amount = salaryInfo.monthlyBaseSalary || 0
            break
          case 'DPTBS_002':  // 식대
          case 'MEAL':
            amount = salaryInfo.mealAllowance || 0
            break
          case 'DPTBS_003':  // 자가운전보조금
          case 'VEHICLE':
            amount = salaryInfo.vehicleAllowance || 0
            break
          case 'DPTBS_004':  // 육아수당
          case 'CHILD_CARE':
            amount = salaryInfo.childcareAllowance || 0
            break
          case 'DPTBS_005':  // 연장수당
          case 'OVERTIME':
            amount = salaryInfo.monthlyOvertimeAllowance || 0
            break
          case 'DPTBS_006':  // 야간수당
          case 'NIGHT':
            amount = salaryInfo.monthlyNightAllowance || 0
            break
          case 'DPTBS_007':  // 월간 휴일근무 수당
          case 'MONTHLY_HOLIDAY':
            amount = salaryInfo.monthlyHolidayAllowance || 0
            break
          case 'DPTBS_008':  // 추가근무수당
          case 'ADD':
            amount = salaryInfo.monthlyAddHolidayAllowance || 0
            break
        }
        return { ...item, amount }
      })

      // salaryInfo에 값이 있는데 paymentItems에 없는 수당 항목 자동 추가
      const existingCodes = basePaymentItems.map(item => item.itemCode)
      const additionalAllowanceItems: PaymentItemDto[] = []

      // 연장수당
      if (salaryInfo.monthlyOvertimeAllowance && salaryInfo.monthlyOvertimeAllowance > 0) {
        if (!existingCodes.includes('DPTBS_005') && !existingCodes.includes('OVERTIME')) {
          additionalAllowanceItems.push({
            itemCode: 'DPTBS_005',
            itemOrder: basePaymentItems.length + additionalAllowanceItems.length + 1,
            amount: salaryInfo.monthlyOvertimeAllowance,
            remarks: '연장수당'
          })
        }
      }

      // 야간수당
      if (salaryInfo.monthlyNightAllowance && salaryInfo.monthlyNightAllowance > 0) {
        if (!existingCodes.includes('DPTBS_006') && !existingCodes.includes('NIGHT')) {
          additionalAllowanceItems.push({
            itemCode: 'DPTBS_006',
            itemOrder: basePaymentItems.length + additionalAllowanceItems.length + 1,
            amount: salaryInfo.monthlyNightAllowance,
            remarks: '야간수당'
          })
        }
      }

      // 휴일근무수당
      if (salaryInfo.monthlyHolidayAllowance && salaryInfo.monthlyHolidayAllowance > 0) {
        if (!existingCodes.includes('DPTBS_007') && !existingCodes.includes('MONTHLY_HOLIDAY')) {
          additionalAllowanceItems.push({
            itemCode: 'DPTBS_007',
            itemOrder: basePaymentItems.length + additionalAllowanceItems.length + 1,
            amount: salaryInfo.monthlyHolidayAllowance,
            remarks: '휴일근무수당'
          })
        }
      }

      // 추가근무수당
      if (salaryInfo.monthlyAddHolidayAllowance && salaryInfo.monthlyAddHolidayAllowance > 0) {
        if (!existingCodes.includes('DPTBS_008') && !existingCodes.includes('ADD')) {
          additionalAllowanceItems.push({
            itemCode: 'DPTBS_008',
            itemOrder: basePaymentItems.length + additionalAllowanceItems.length + 1,
            amount: salaryInfo.monthlyAddHolidayAllowance,
            remarks: '추가근무수당'
          })
        }
      }

      const updatedPaymentItems = [...basePaymentItems, ...additionalAllowanceItems]

      // 상여금 매핑 (salaryInfo.bonuses -> payrollData.bonuses)
      // bonusCode가 코드, bonusType은 이름 - handleAddBonusItem과 동일하게 매핑
      const mappedBonuses = salaryInfo.bonuses?.map(bonus => ({
        bonusType: bonus.bonusCode || bonus.bonusType,  // 코드가 없으면 이름을 fallback으로 사용
        amount: bonus.amount,
        memo: bonus.bonusType  // 화면 표시용으로 bonusType(이름)을 저장
      })) || []

      // 지급액 합계 (지급항목 + 상여금)
      const paymentTotal = updatedPaymentItems.reduce((sum, item) => sum + item.amount, 0)
      const bonusTotal = mappedBonuses.reduce((sum, bonus) => sum + bonus.amount, 0)
      const totalPaymentAmount = paymentTotal + bonusTotal

      // 공제 항목 자동 계산 (4대보험 가입 여부에 따라)
      // 비과세 항목 제외한 과세 급여 계산
      const nonTaxableAmount = (salaryInfo.mealAllowance || 0) + (salaryInfo.vehicleAllowance || 0) + (salaryInfo.childcareAllowance || 0)
      const taxableAmount = totalPaymentAmount - nonTaxableAmount

      // 4대보험료율 (2024년 기준)
      const NATIONAL_PENSION_RATE = 0.045        // 국민연금 4.5%
      const HEALTH_INSURANCE_RATE = 0.03545      // 건강보험 3.545%
      const LONG_TERM_CARE_RATE = 0.1281         // 장기요양보험 (건강보험의 12.81%)
      const EMPLOYMENT_INSURANCE_RATE = 0.009    // 고용보험 0.9%

      // 공제 항목 계산
      const nationalPension = contractHeader?.nationalPensionEnrolled
        ? Math.round(taxableAmount * NATIONAL_PENSION_RATE)
        : 0
      const healthInsurance = contractHeader?.healthInsuranceEnrolled
        ? Math.round(taxableAmount * HEALTH_INSURANCE_RATE)
        : 0
      const longTermCare = contractHeader?.healthInsuranceEnrolled
        ? Math.round(healthInsurance * LONG_TERM_CARE_RATE)
        : 0
      const employmentInsurance = contractHeader?.employmentInsuranceEnrolled
        ? Math.round(taxableAmount * EMPLOYMENT_INSURANCE_RATE)
        : 0

      // 소득세 간이세액표 적용 (간략화된 버전)
      const calculateIncomeTax = (monthly: number): number => {
        // 간이세액표 기반 대략적 계산 (부양가족 1인 기준)
        if (monthly <= 1060000) return 0
        if (monthly <= 1500000) return Math.round((monthly - 1060000) * 0.06)
        if (monthly <= 3000000) return Math.round(26400 + (monthly - 1500000) * 0.15)
        if (monthly <= 4500000) return Math.round(251400 + (monthly - 3000000) * 0.24)
        if (monthly <= 8700000) return Math.round(611400 + (monthly - 4500000) * 0.35)
        return Math.round(2081400 + (monthly - 8700000) * 0.38)
      }

      const incomeTax = calculateIncomeTax(taxableAmount)
      const localIncomeTax = Math.round(incomeTax * 0.1)  // 지방소득세 = 소득세의 10%

      // 공제 항목 업데이트
      const updatedDeductionItems = payrollData.deductionItems.map(item => {
        let amount = item.amount
        switch (item.itemCode) {
          case 'DDTBS_001':  // 국민연금
          case 'NATIONAL_PENSION':
            amount = nationalPension
            break
          case 'DDTBS_002':  // 건강보험
          case 'HEALTH_INSURANCE':
            amount = healthInsurance
            break
          case 'DDTBS_003':  // 고용보험
          case 'EMPLOYMENT_INSURANCE':
            amount = employmentInsurance
            break
          case 'DDTBS_004':  // 장기요양보험
          case 'LONG_TERM_CARE_INSURANCE':
            amount = longTermCare
            break
          case 'DDTBS_005':  // 소득세
          case 'INCOME_TAX':
            amount = incomeTax
            break
          case 'DDTBS_006':  // 지방소득세
          case 'LOCAL_INCOME_TAX':
            amount = localIncomeTax
            break
        }
        return { ...item, amount }
      })

      const totalDeductionAmount = updatedDeductionItems.reduce((sum, item) => sum + item.amount, 0)

      setPayrollData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          settlementStartDate: startDate,
          settlementEndDate: endDate,
          paymentItems: updatedPaymentItems,
          deductionItems: updatedDeductionItems,
          bonuses: mappedBonuses,
          totalPaymentAmount,
          totalDeductionAmount,
          actualPaymentAmount: totalPaymentAmount - totalDeductionAmount
        }
      })

      // formData도 업데이트
      setFormData(prev => ({
        ...prev,
        settlementStartDate: startDate,
        settlementEndDate: endDate,
        baseSalary: salaryInfo.monthlyBaseSalary || 0,
        mealAllowance: salaryInfo.mealAllowance || 0,
        vehicleAllowance: salaryInfo.vehicleAllowance || 0,
        childcareAllowance: salaryInfo.childcareAllowance || 0,
        overtimeAllowance: salaryInfo.monthlyOvertimeAllowance || 0,
        nightAllowance: salaryInfo.monthlyNightAllowance || 0,
        holidayAllowance: salaryInfo.monthlyHolidayAllowance || 0,
        extraWorkAllowance: salaryInfo.monthlyAddHolidayAllowance || 0,
        nationalPension,
        healthInsurance,
        employmentInsurance,
        longTermCare,
        incomeTax,
        localIncomeTax,
        totalPaymentAmount,
        totalDeductionAmount,
        actualPaymentAmount: totalPaymentAmount - totalDeductionAmount
      }))
    } else {
      // salaryInfo가 없으면 정산 기간만 업데이트
      setPayrollData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          settlementStartDate: startDate,
          settlementEndDate: endDate
        }
      })

      setFormData(prev => ({
        ...prev,
        settlementStartDate: startDate,
        settlementEndDate: endDate
      }))
    }
  }, [isNewMode, employeeContract, selectedEmployeeId, payrollData, formData.payrollYearMonth])

  // 지급/공제 항목 행 생성 (derived state)
  const payrollItemRows: PayrollItemRow[] = (() => {
    const paymentItems = payrollData?.paymentItems || []
    const deductionItems = payrollData?.deductionItems || []
    const bonuses = payrollData?.bonuses || []

    // bonuses를 PaymentItemDto 형태로 변환하여 지급 항목에 포함
    const bonusAsPaymentItems: PaymentItemDto[] = bonuses.map((bonus, index) => ({
      itemCode: `BONUS_${bonus.bonusType}`,  // BONUS_ 접두사로 상여금 항목 구분
      itemOrder: paymentItems.length + index + 1,
      amount: bonus.amount,
      remarks: bonus.memo  // memo에 bonusType(이름)이 저장됨
    }))

    const allPaymentItems = [...paymentItems, ...bonusAsPaymentItems]
    const sortedPayments = allPaymentItems.sort((a, b) => a.itemOrder - b.itemOrder)
    const sortedDeductions = [...deductionItems].sort((a, b) => a.itemOrder - b.itemOrder)

    const maxLength = Math.max(sortedPayments.length, sortedDeductions.length)
    const rows: PayrollItemRow[] = []

    for (let i = 0; i < maxLength; i++) {
      rows.push({
        paymentItem: sortedPayments[i] || null,
        deductionItem: sortedDeductions[i] || null,
      })
    }

    return rows
  })()

  // 직원 선택 핸들러 - React 19 Compiler가 자동 최적화
  const handleEmployeeSelect = (employeeInfoId: number | null) => {
    setSelectedEmployeeId(employeeInfoId)

    if (!employeeInfoId) {
      return
    }

    const selected = employeeList.find(emp => emp.employeeInfoId === employeeInfoId)
    if (selected) {
      setFormData(prev => ({
        ...prev,
        memberName: selected.employeeName,
        headOffice: selected.headOfficeName || '',
        franchise: selected.franchiseName || '',
        store: selected.storeName || ''
      }))
    }
    // 근로 계약 정보(salaryInfo)는 useEffect에서 자동 맵핑됨
  }

  // 이전 급여 정보 불러오기 - React 19 Compiler가 자동 최적화
  const handleLoadPreviousPayroll = async () => {
    if (!selectedEmployeeId) {
      await alert('직원을 먼저 선택해주세요.')
      return
    }

    try {
      const result = await refetchLatestPayroll()
      const response = result.data

      if (!response?.data) {
        await alert(response?.message || '이전 급여 정보가 없습니다.')
        return
      }

      const { payrollYearMonth, paymentItems, deductionItems } = response.data

      setPayrollData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          paymentItems: paymentItems.map((item, index) => ({
            ...item,
            itemOrder: index + 1
          })),
          deductionItems: deductionItems.map((item, index) => ({
            ...item,
            itemOrder: index + 1
          })),
          totalPaymentAmount: paymentItems.reduce((sum, item) => sum + item.amount, 0),
          totalDeductionAmount: deductionItems.reduce((sum, item) => sum + item.amount, 0),
          actualPaymentAmount: paymentItems.reduce((sum, item) => sum + item.amount, 0) - deductionItems.reduce((sum, item) => sum + item.amount, 0)
        }
      })

      const year = payrollYearMonth.substring(0, 4)
      const month = parseInt(payrollYearMonth.substring(4, 6))
      await alert(`${year}년 ${month}월 급여 정보를 불러왔습니다.`)
    } catch (error) {
      console.error('이전 급여 정보 조회 실패:', error)
      await alert('이전 급여 정보를 불러오는 중 오류가 발생했습니다.')
    }
  }

  // 급여 지급월 변경 핸들러 - React 19 Compiler가 자동 최적화
  const handlePayrollYearMonthChange = (newPayrollYearMonth: string) => {
    const salaryMonth = employeeContract?.employmentContractHeader?.salaryMonth || 'SLRCF_001'
    const { startDate, endDate } = calculateSettlementPeriod(newPayrollYearMonth, salaryMonth)

    setFormData(prev => ({
      ...prev,
      payrollYearMonth: newPayrollYearMonth,
      settlementStartDate: startDate,
      settlementEndDate: endDate
    }))
  }

  // 숫자 포맷팅
  const formatNumber = (num: number) => num.toLocaleString()
  const parseNumber = (value: string): number => parseInt(value.replace(/,/g, ''), 10) || 0

  // 지급 항목 금액 변경
  const handlePaymentItemChange = (itemCode: string, value: string) => {
    const amount = parseNumber(value)
    setPayrollData(prev => {
      if (!prev) return prev

      // BONUS_ 접두사가 있으면 상여금 항목 수정
      if (itemCode.startsWith('BONUS_')) {
        const bonusType = itemCode.replace('BONUS_', '')
        const updatedBonuses = (prev.bonuses || []).map(bonus =>
          bonus.bonusType === bonusType ? { ...bonus, amount } : bonus
        )
        const totalPayment = prev.paymentItems.reduce((sum, item) => sum + item.amount, 0)
        const bonusTotal = updatedBonuses.reduce((sum, b) => sum + b.amount, 0)
        const totalDeduction = prev.deductionItems.reduce((sum, item) => sum + item.amount, 0)
        return {
          ...prev,
          bonuses: updatedBonuses,
          totalPaymentAmount: totalPayment + bonusTotal,
          actualPaymentAmount: (totalPayment + bonusTotal) - totalDeduction
        }
      }

      // 일반 지급 항목 수정
      const updatedItems = prev.paymentItems.map(item =>
        item.itemCode === itemCode ? { ...item, amount } : item
      )
      const totalPayment = updatedItems.reduce((sum, item) => sum + item.amount, 0)
      const bonusTotal = (prev.bonuses || []).reduce((sum, b) => sum + b.amount, 0)
      const totalDeduction = prev.deductionItems.reduce((sum, item) => sum + item.amount, 0)
      return {
        ...prev,
        paymentItems: updatedItems,
        totalPaymentAmount: totalPayment + bonusTotal,
        actualPaymentAmount: (totalPayment + bonusTotal) - totalDeduction
      }
    })
  }

  // 공제 항목 금액 변경
  const handleDeductionItemChange = (itemCode: string, value: string) => {
    const amount = parseNumber(value)
    setPayrollData(prev => {
      if (!prev) return prev
      const updatedItems = prev.deductionItems.map(item =>
        item.itemCode === itemCode ? { ...item, amount } : item
      )
      const totalPayment = prev.paymentItems.reduce((sum, item) => sum + item.amount, 0)
      const totalDeduction = updatedItems.reduce((sum, item) => sum + item.amount, 0)
      return {
        ...prev,
        deductionItems: updatedItems,
        totalDeductionAmount: totalDeduction,
        actualPaymentAmount: totalPayment - totalDeduction
      }
    })
  }

  // 상여금 항목 추가
  const handleAddBonusItem = async (bonus: BonusCategory) => {
    if (!payrollData) return

    const exists = payrollData.bonuses?.some(item => item.bonusType === bonus.code)
    if (exists) {
      await alert('이미 추가된 항목입니다.')
      return
    }

    const newBonus = {
      bonusType: bonus.code,
      amount: bonus.amount || 0,
      memo: bonus.name
    }

    setPayrollData(prev => {
      if (!prev) return prev
      const updatedBonuses = [...(prev.bonuses || []), newBonus]
      const bonusTotal = updatedBonuses.reduce((sum, b) => sum + b.amount, 0)
      const totalPayment = prev.paymentItems.reduce((sum, item) => sum + item.amount, 0) + bonusTotal
      return {
        ...prev,
        bonuses: updatedBonuses,
        totalPaymentAmount: totalPayment,
        actualPaymentAmount: totalPayment - prev.totalDeductionAmount
      }
    })

    setShowBonusModal(false)
  }

  // 추가 공제 항목 추가
  const handleAddDeductionItem = async (code: CommonCodeNode) => {
    if (!payrollData) return

    const exists = payrollData.deductionItems.some(item => item.itemCode === code.code)
    if (exists) {
      await alert('이미 추가된 항목입니다.')
      return
    }

    const newDeductionItem: DeductionItemDto = {
      itemCode: code.code,
      itemOrder: payrollData.deductionItems.length + 1,
      amount: 0,
      remarks: code.name
    }

    setPayrollData(prev => {
      if (!prev) return prev
      const updatedItems = [...prev.deductionItems, newDeductionItem]
      const totalDeduction = updatedItems.reduce((sum, item) => sum + item.amount, 0)
      return {
        ...prev,
        deductionItems: updatedItems,
        totalDeductionAmount: totalDeduction,
        actualPaymentAmount: prev.totalPaymentAmount - totalDeduction
      }
    })

    setShowDeductionModal(false)
  }

  // 연장근무 수당 불러오기
  const handleLoadOvertimeAllowance = async () => {
    if (!formData.payrollYearMonth) {
      await alert('급여 지급월을 먼저 선택해주세요.')
      return
    }

    if (!selectedEmployeeId && !payrollData?.memberId) {
      await alert('직원을 먼저 선택해주세요.')
      return
    }

    setIsLoadingOvertime(true)
    try {
      const yearMonth = formData.payrollYearMonth

      const overtimeData = await getOvertimeAllowanceStatements({
        allowanceYearMonth: yearMonth,
        headOfficeId: selectedHeadOfficeId,
        franchiseStoreId: selectedFranchiseStoreId,
      })

      const targetMemberId = payrollData?.memberId || employeeList.find(emp => emp.employeeInfoId === selectedEmployeeId)?.memberId
      const memberOvertime = overtimeData.content.find(item => item.memberId === targetMemberId)

      if (!memberOvertime) {
        await alert(`${formData.payrollYearMonth.substring(0, 4)}년 ${parseInt(formData.payrollYearMonth.substring(4, 6))}월의 연장근무 수당명세서가 없습니다.`)
        return
      }

      const overtimeDetail = await getOvertimeAllowanceStatement(memberOvertime.id)
      const overtimeAmount = overtimeDetail.totalAmount || 0

      setPayrollData(prev => {
        if (!prev) return prev
        const updatedPaymentItems = prev.paymentItems.map(item =>
          (item.itemCode === 'DPTBS_008' || item.itemCode === 'ADD') ? { ...item, amount: overtimeAmount } : item
        )
        const totalPayment = updatedPaymentItems.reduce((sum, item) => sum + item.amount, 0)
        const totalDeduction = prev.deductionItems.reduce((sum, item) => sum + item.amount, 0)
        return {
          ...prev,
          paymentItems: updatedPaymentItems,
          totalPaymentAmount: totalPayment,
          actualPaymentAmount: totalPayment - totalDeduction
        }
      })

      setFormData(prev => ({
        ...prev,
        extraWorkAllowance: overtimeAmount
      }))

      await alert(`연장근무 수당 ${overtimeAmount.toLocaleString()}원을 불러왔습니다.`)
    } catch (error) {
      console.error('연장근무 수당 불러오기 실패:', error)
      await alert('연장근무 수당을 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingOvertime(false)
    }
  }

  // 저장 핸들러
  const handleSave = async () => {
    if (isNewMode) {
      if (!payrollData || !selectedEmployeeId) {
        await alert('직원을 선택해주세요.')
        return
      }

      if (!formData.payrollYearMonth) {
        await alert('급여 지급월을 선택해주세요.')
        return
      }

      if (!formData.paymentDate) {
        await alert('지급일을 입력해주세요.')
        return
      }

      try {
        const request: CreatePayrollStatementRequest = {
          employeeInfoId: selectedEmployeeId,
          payrollYearMonth: formData.payrollYearMonth,
          settlementStartDate: formData.settlementStartDate,
          settlementEndDate: formData.settlementEndDate,
          paymentDate: formData.paymentDate,
          paymentItems: payrollData.paymentItems.map(item => ({
            itemCode: item.itemCode,
            itemOrder: item.itemOrder,
            amount: item.amount,
            remarks: item.remarks
          })),
          deductionItems: payrollData.deductionItems.map(item => ({
            itemCode: item.itemCode,
            itemOrder: item.itemOrder,
            amount: item.amount,
            remarks: item.remarks
          })),
          bonuses: payrollData.bonuses?.map(bonus => ({
            bonusType: bonus.bonusType,
            amount: bonus.amount,
            memo: bonus.memo
          }))
        }

        const created = await createMutation.mutateAsync({
          request,
          attachmentFile: attachedFile || undefined
        })
        await alert('저장되었습니다.')
        router.push(`/employee/payroll/regular/${created.id}`)
      } catch (error: unknown) {
        console.error('저장 실패:', error)
        const errorMessage = getErrorMessage(error)
        await alert(errorMessage || '저장에 실패했습니다.')
      }
      return
    }

    // 기존 수정 모드
    if (!statementId || !payrollData) return

    try {
      const request: UpdatePayrollStatementRequest = {
        payrollYearMonth: formData.payrollYearMonth,
        settlementStartDate: formData.settlementStartDate,
        settlementEndDate: formData.settlementEndDate,
        paymentDate: formData.paymentDate,
        attachmentFileId: payrollData.attachmentFileId || undefined,
        remarks: payrollData.remarks || undefined,
        paymentItems: payrollData.paymentItems.map(item => ({
          itemCode: item.itemCode,
          itemOrder: item.itemOrder,
          amount: item.amount,
          remarks: item.remarks
        })),
        deductionItems: payrollData.deductionItems.map(item => ({
          itemCode: item.itemCode,
          itemOrder: item.itemOrder,
          amount: item.amount,
          remarks: item.remarks
        })),
        bonuses: payrollData.bonuses?.map(bonus => ({
          bonusType: bonus.bonusType,
          amount: bonus.amount,
          memo: bonus.memo
        }))
      }

      await updateMutation.mutateAsync({ id: statementId, request })
      await alert('저장되었습니다.')
    } catch (error: unknown) {
      console.error('저장 실패:', error)
      const errorMessage = getErrorMessage(error)
      await alert(errorMessage || '저장에 실패했습니다.')
    }
  }

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!statementId) return

    if (!(await confirm('정말로 이 급여명세서를 삭제하시겠습니까?'))) return

    try {
      await deleteMutation.mutateAsync(statementId)
      await alert('삭제되었습니다.')
      router.push('/employee/payroll/regular')
    } catch (error) {
      console.error('삭제 실패:', error)
      await alert('삭제에 실패했습니다.')
    }
  }

  // 다운로드 핸들러
  const handleDownload = async () => {
    if (!statementId) return

    try {
      if (payrollData?.attachmentFileId && fileDownloadUrlData) {
        const a = document.createElement('a')
        a.href = fileDownloadUrlData.downloadUrl
        a.download = fileDownloadUrlData.originalFileName
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        const blob = await downloadExcelMutation.mutateAsync(statementId)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `급여명세서_${formData.payrollYearMonth}_${formData.memberName}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('다운로드 실패:', error)
      await alert('급여명세서 다운로드에 실패했습니다.')
    }
  }

  // 이메일 전송 핸들러
  const handleSendEmail = async () => {
    if (!statementId) return

    if (!(await confirm('급여명세서를 이메일로 전송하시겠습니까?'))) return

    try {
      await sendEmailMutation.mutateAsync(statementId)
      await alert('이메일 전송이 완료되었습니다.')
    } catch (error) {
      console.error('이메일 전송 실패:', error)
      await alert('이메일 전송에 실패했습니다.')
    }
  }

  const handleGoToList = () => {
    router.push('/employee/payroll/regular')
  }

  const handlePaymentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, paymentDate: e.target.value }))
  }

  if (isDetailLoading && !isNewMode) {
    return (
      <div className="contents-wrap">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          데이터를 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="contents-wrap">
      <div className="contents-btn">
        <button className="btn-form basic" onClick={handleGoToList}>목록</button>
        {!isNewMode && (
          <>
            <button className="btn-form outline s" onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending ? '전송 중...' : '이메일 전송'}
            </button>
            <button className="btn-form outline s" onClick={handleDownload} disabled={downloadExcelMutation.isPending}>
              급여명세서 다운로드
            </button>
          </>
        )}
        {!isEditMode && !isNewMode && (
          <button className="btn-form gray" onClick={handleDelete} disabled={deleteMutation.isPending}>
            삭제
          </button>
        )}
        <button
          className="btn-form basic"
          onClick={handleSave}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </div>
      <div className="contents-body">
        <div className="content-wrap">
          <table className="default-table">
            <colgroup>
              <col width="160px" />
              <col />
              <col width="160px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>본사</th>
                <td>
                  <div className="block">
                    {isEditMode ? (
                      <SearchSelect
                        options={emptySelectOptions}
                        value={null}
                        onChange={() => {}}
                        placeholder="선택"
                      />
                    ) : (
                      <input type="text" className="input-frame" value={formData.headOffice} readOnly />
                    )}
                  </div>
                </td>
                <th>가맹점</th>
                <td>
                  <div className="block">
                    {isEditMode ? (
                      <SearchSelect
                        options={emptySelectOptions}
                        value={null}
                        onChange={() => {}}
                        placeholder="선택"
                      />
                    ) : (
                      <input type="text" className="input-frame" value={formData.franchise} readOnly />
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <th>점포</th>
                <td>
                  <div className="block">
                    {isEditMode ? (
                      <SearchSelect
                        options={emptySelectOptions}
                        value={null}
                        onChange={() => {}}
                        placeholder="선택"
                      />
                    ) : (
                      <input type="text" className="input-frame" value={formData.store} readOnly />
                    )}
                  </div>
                </td>
                <th>
                  직원명 <span className="red">*</span>
                </th>
                <td>
                  <div className="filed-flx">
                    <div className="block">
                      {isEditMode ? (
                        <SearchSelect
                          options={employeeSelectOptions}
                          value={employeeSelectOptions.find(opt => opt.value === String(selectedEmployeeId ?? '')) || null}
                          onChange={(opt) => {
                            const employeeId = opt?.value ? Number(opt.value) : null
                            handleEmployeeSelect(employeeId)
                          }}
                          placeholder="선택"
                        />
                      ) : (
                        <input type="text" className="input-frame" value={formData.memberName} readOnly />
                      )}
                    </div>
                    {isEditMode && (
                      <button className="btn-form outline s act" onClick={handleLoadPreviousPayroll}>
                        이전 급여정보 불러오기
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <th>
                  급여 지급월 {isEditMode && <span className="red">*</span>}
                </th>
                <td>
                  <div className="block">
                    {isEditMode ? (
                      <SearchSelect
                        options={payrollMonthSelectOptions}
                        value={payrollMonthSelectOptions.find(opt => opt.value === formData.payrollYearMonth) || null}
                        onChange={(opt) => handlePayrollYearMonthChange(opt?.value || '')}
                        placeholder="선택"
                      />
                    ) : (
                      <span>
                        {formData.payrollYearMonth
                          ? `${formData.payrollYearMonth.substring(0, 4)}년 ${parseInt(formData.payrollYearMonth.substring(4, 6))}월`
                          : '-'}
                      </span>
                    )}
                  </div>
                </td>
                <th>지급일</th>
                <td>
                  <div className="block">
                    <input
                      type="date"
                      className="input-frame"
                      value={formData.paymentDate}
                      onChange={handlePaymentDateChange}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <th>
                  정산 기간 <span className="red">*</span>
                </th>
                <td className="val-top">
                  <div className="date-picker-wrap">
                    <input
                      type="text"
                      className="input-frame"
                      value={formData.settlementStartDate && formData.settlementEndDate
                        ? `${formData.settlementStartDate} ~ ${formData.settlementEndDate}`
                        : isEditMode ? '급여 지급월을 선택하세요' : ''
                      }
                      readOnly
                      placeholder={isEditMode ? '급여 지급월 선택 시 자동 설정됩니다' : ''}
                    />
                  </div>
                </td>
                <th>파일로 대체</th>
                <td>
                  {isEditMode ? (
                    <div className="filed-file">
                      <input
                        type="file"
                        className="file-input"
                        id="file-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setAttachedFile(file)
                        }}
                      />
                      <label htmlFor="file-input" className="btn-form outline s">
                        파일 찾기
                      </label>
                      {attachedFile && (
                        <span style={{ marginLeft: '10px' }}>
                          {attachedFile.name}
                          <button
                            type="button"
                            className="btn-form outline s"
                            style={{ marginLeft: '5px' }}
                            onClick={() => setAttachedFile(null)}
                          >
                            삭제
                          </button>
                        </span>
                      )}
                    </div>
                  ) : payrollData?.attachmentFileId && attachmentFileInfo ? (
                    <a
                      href="#"
                      className="link-text"
                      style={{ color: '#1a73e8', textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={async (e) => {
                        e.preventDefault()
                        if (fileDownloadUrlData) {
                          const a = document.createElement('a')
                          a.href = fileDownloadUrlData.downloadUrl
                          a.download = fileDownloadUrlData.originalFileName
                          a.target = '_blank'
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }
                      }}
                    >
                      {attachmentFileInfo.originalFileName}
                    </a>
                  ) : (
                    <span className="info-text">-</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 지급/공제 항목 테이블 */}
        {!attachedFile && !payrollData?.attachmentFileId && (
          <div className="content-wrap">
            <table className="default-table">
              <colgroup>
                <col width="160px" />
                <col />
                <col width="160px" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th colSpan={2} style={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                    <span className="bold-tit">지급 항목</span>
                  </th>
                  <th colSpan={2} style={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                    <span className="bold-tit">공제 항목</span>
                  </th>
                </tr>
                {payrollItemRows.map((row, index) => (
                  <tr key={index}>
                    {row.paymentItem ? (
                      <>
                        <th>
                          {row.paymentItem.remarks || PAYMENT_ITEM_LABELS[row.paymentItem.itemCode] || row.paymentItem.itemCode}
                          {row.paymentItem.itemCode === 'DPTBS_001' && <span className="red"> *</span>}
                        </th>
                        <td>
                          <div className="filed-flx">
                            <div className="block">
                              <input
                                type="text"
                                className="input-frame al-r"
                                value={formatNumber(row.paymentItem.amount)}
                                onChange={(e) => handlePaymentItemChange(row.paymentItem!.itemCode, e.target.value)}
                              />
                            </div>
                            <span className="won">원</span>
                            {(row.paymentItem.itemCode === 'DPTBS_008' || row.paymentItem.itemCode === 'ADD') && (
                              <button
                                type="button"
                                className="btn-form outline s"
                                style={{ marginLeft: '8px', whiteSpace: 'nowrap' }}
                                onClick={handleLoadOvertimeAllowance}
                                disabled={isLoadingOvertime}
                              >
                                {isLoadingOvertime ? '불러오는 중...' : '불러오기'}
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <th></th>
                        <td></td>
                      </>
                    )}
                    {row.deductionItem ? (
                      <>
                        <th>
                          {row.deductionItem.remarks || DEDUCTION_ITEM_LABELS[row.deductionItem.itemCode] || row.deductionItem.itemCode}
                        </th>
                        <td>
                          <div className="filed-flx">
                            <div className="block">
                              <input
                                type="text"
                                className="input-frame al-r"
                                value={formatNumber(row.deductionItem.amount)}
                                onChange={(e) => handleDeductionItemChange(row.deductionItem!.itemCode, e.target.value)}
                              />
                            </div>
                            <span className="won">원</span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <th></th>
                        <td></td>
                      </>
                    )}
                  </tr>
                ))}
                {isEditMode && (
                  <tr>
                    <th colSpan={2}>
                      <button
                        type="button"
                        className="btn-form outline s"
                        onClick={() => setShowBonusModal(true)}
                        style={{ width: '100%' }}
                      >
                        + 지급 항목 추가 (상여금)
                      </button>
                    </th>
                    <th colSpan={2}>
                      <button
                        type="button"
                        className="btn-form outline s"
                        onClick={() => setShowDeductionModal(true)}
                        style={{ width: '100%' }}
                      >
                        + 공제 항목 추가
                      </button>
                    </th>
                  </tr>
                )}
                <tr>
                  <th className="filed-th" colSpan={2}>
                    <div className="filed-flx">
                      <span className="bold-tit">지급액계</span>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame blue al-r"
                          value={formatNumber(payrollData?.totalPaymentAmount || 0)}
                          readOnly
                        />
                      </div>
                      <span className="won">원</span>
                    </div>
                  </th>
                  <th className="filed-th" colSpan={2}>
                    <div className="filed-flx">
                      <span className="bold-tit">공제금액</span>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame blue al-r"
                          value={formatNumber(payrollData?.totalDeductionAmount || 0)}
                          readOnly
                        />
                      </div>
                      <span className="won">원</span>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th className="filed-th" colSpan={4}>
                    <div className="filed-flx" style={{ justifyContent: 'center' }}>
                      <span className="bold-tit">실지급액</span>
                      <div className="block">
                        <input
                          type="text"
                          className="input-frame blue al-r"
                          value={formatNumber(payrollData?.actualPaymentAmount || 0)}
                          readOnly
                        />
                      </div>
                      <span className="won">원</span>
                    </div>
                  </th>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 산출식 표시 */}
        {!attachedFile && !payrollData?.attachmentFileId && (
          <div className="content-wrap">
            <table className="default-table white">
              <colgroup>
                <col width="190px" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>산출식/산출방법 및 지급액</th>
                  <td>
                    <div className="paystub-guide">
                      <span>기본급 : 월간 기본근무 시간 (209시간) × 통상시급 (10,000원) = {formatNumber(formData.baseSalary)}</span>
                      <span>연장수당 : 연장 근무 시간(2시간) × 통상시급 × 1.5 (15,000원) = {formatNumber(formData.overtimeAllowance)}</span>
                      <span>야간수당 : 야간 근무 시간(2시간) × 통상시급 × 0.5 (5,000원) = {formatNumber(formData.nightAllowance)}</span>
                      <span>월간 휴일 근무 수당 : 월간 휴일 근무 시간(2시간) × 통상시급 × 0.5 (5,000원) = {formatNumber(formData.holidayAllowance)}</span>
                      <span>추가근무수당 : 추가 근무 시간(2시간) × 통상시급 × 1.5 (15,000원) = {formatNumber(formData.extraWorkAllowance)}</span>
                      <span>만근상여 : 근무 기간 중 지각, 조퇴, 결근이 없는 경우 지급 = {formatNumber(formData.positionBonus)}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 등록 및 수정 이력 */}
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
                              <span className="detail-data-text">{payrollData?.createdByName || '-'}</span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">{payrollData?.createdAt?.split('T')[0] || '-'}</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <th>최근수정자/최근수정일</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">{payrollData?.updatedByName || '-'}</span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">{payrollData?.updatedAt?.split('T')[0] || '-'}</span>
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

      {/* 상여금 추가 모달 */}
      {showBonusModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxHeight: '500px',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>상여금 항목 추가</h3>
            {bonusCategories.length === 0 ? (
              <p style={{ color: '#999' }}>등록된 상여금 항목이 없습니다. 급여명세서 환경설정에서 상여금을 추가해주세요.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {bonusCategories.map((bonus) => (
                  <li key={bonus.id} style={{ marginBottom: '8px' }}>
                    <button
                      type="button"
                      className="btn-form outline"
                      style={{ width: '100%', textAlign: 'left', padding: '12px' }}
                      onClick={() => handleAddBonusItem(bonus)}
                    >
                      <strong>{bonus.name}</strong>
                      <span style={{ marginLeft: '8px', color: '#666' }}>
                        (기본금액: {bonus.amount.toLocaleString()}원)
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn-form gray"
                onClick={() => setShowBonusModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 추가 공제 항목 모달 */}
      {showDeductionModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxHeight: '500px',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>추가 공제 항목</h3>
            {additionalDeductionCodes.length === 0 ? (
              <p style={{ color: '#999' }}>등록된 추가 공제 항목이 없습니다.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {additionalDeductionCodes.map((code) => (
                  <li key={code.id} style={{ marginBottom: '8px' }}>
                    <button
                      type="button"
                      className="btn-form outline"
                      style={{ width: '100%', textAlign: 'left', padding: '12px' }}
                      onClick={() => handleAddDeductionItem(code)}
                    >
                      <strong>{code.name}</strong>
                      {code.description && (
                        <span style={{ marginLeft: '8px', color: '#666' }}>
                          ({code.description})
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn-form gray"
                onClick={() => setShowDeductionModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
