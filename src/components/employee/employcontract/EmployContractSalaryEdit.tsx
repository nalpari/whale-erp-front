'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import SalaryCalculationPop, { SalaryCalculationData, SalaryCalculationInitialData, ContractClassificationType } from '@/components/popup/SalaryCalculationPop'
import { useBonusTypes } from '@/hooks/queries/use-common-code-queries'
import {
  useContractDetail,
  useCreateContractSalary,
  useUpdateContractSalary
} from '@/hooks/queries/use-contract-queries'
import type { CreateEmploymentContractSalaryInfoRequest, UpdateEmploymentContractSalaryInfoRequest } from '@/lib/api/employmentContract'
import { useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'

interface EmployContractSalaryEditProps {
  contractId?: number
}

interface BonusItem {
  id: number
  type: string
  amount: number
  memo: string
}

// 숫자를 3자리마다 쉼표가 있는 문자열로 변환
const formatNumber = (value: number): string => {
  if (value === 0) return '0'
  return value.toLocaleString('ko-KR')
}

export default function EmployContractSalaryEdit({ contractId }: EmployContractSalaryEditProps) {
  const router = useRouter()
  const { alert } = useAlert()
  const [salaryInfoOpen, _setSalaryInfoOpen] = useState(true)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

  // TanStack Query - 계약 상세 조회
  const { data: contractDetail, isPending: _isLoading, refetch: refetchContract } = useContractDetail(
    contractId ?? 0,
    !!contractId
  )

  // TanStack Query - 상여금 종류 조회 (계약 상세의 본사/가맹점 ID 사용)
  const { data: bonusTypes = [] } = useBonusTypes(
    {
      headOfficeId: contractDetail?.headOfficeOrganizationId ?? undefined,
      franchiseId: contractDetail?.franchiseOrganizationId ?? undefined,
    },
    !!contractDetail?.headOfficeOrganizationId
  )

  // TanStack Query - Mutations
  const createSalaryMutation = useCreateContractSalary()
  const updateSalaryMutation = useUpdateContractSalary()

  const isSaving = createSalaryMutation.isPending || updateSalaryMutation.isPending

  // 계약 분류 (CNTCFWK_001: 포괄연봉제, CNTCFWK_002: 비포괄연봉제, CNTCFWK_003: 파트타임)
  const contractClassification = (contractDetail?.employmentContractHeader?.contractClassification || 'CNTCFWK_001') as ContractClassificationType
  const salaryInfo = contractDetail?.salaryInfo
  const salaryInfoId = salaryInfo?.id ?? null

  // 폼 데이터 초기화 (React 19: derived state)
  const initialFormData = salaryInfo ? {
    annualSalary: salaryInfo.annualSalary || 0,
    monthlySalary: salaryInfo.monthlyTotalSalary || 0,
    hourlyWage: salaryInfo.timelySalary || 0,
    monthlyBasicHours: salaryInfo.monthlyTime || 0,
    monthlyBasicAmount: salaryInfo.monthlyBaseSalary || 0,
    monthlyOvertimeHours: salaryInfo.monthlyOvertimeAllowanceTime || 0,
    monthlyOvertimeAmount: salaryInfo.monthlyOvertimeAllowance || 0,
    monthlyNightHours: salaryInfo.monthlyNightAllowanceTime || 0,
    monthlyNightAmount: salaryInfo.monthlyNightAllowance || 0,
    monthlyHolidayHours: salaryInfo.monthlyHolidayAllowanceTime || 0,
    monthlyHolidayAmount: salaryInfo.monthlyHolidayAllowance || 0,
    monthlyExtraHolidayHours: salaryInfo.monthlyAddHolidayAllowanceTime || 0,
    monthlyExtraHolidayAmount: salaryInfo.monthlyAddHolidayAllowance || 0,
    mealAllowance: salaryInfo.mealAllowance || 0,
    mealAllowanceIncluded: (salaryInfo.mealAllowance || 0) > 0,
    carAllowance: salaryInfo.vehicleAllowance || 0,
    carAllowanceIncluded: (salaryInfo.vehicleAllowance || 0) > 0,
    childcareAllowance: salaryInfo.childcareAllowance || 0,
    childcareAllowanceIncluded: (salaryInfo.childcareAllowance || 0) > 0,
    weekDayAllowance: salaryInfo.weekDayAllowance || 0,
    overtimeDayAllowance: salaryInfo.overtimeDayAllowance || 0,
    nightDayAllowance: salaryInfo.nightDayAllowance || 0,
    holidayDayAllowance: salaryInfo.holidayAllowanceTime || 0,
    weeklyWorkHours: salaryInfo.monthlyTime
      ? Math.round(salaryInfo.monthlyTime / (1.2 * 4.345))
      : 40
  } : {
    annualSalary: 0,
    monthlySalary: 0,
    hourlyWage: 0,
    monthlyBasicHours: 0,
    monthlyBasicAmount: 0,
    monthlyOvertimeHours: 0,
    monthlyOvertimeAmount: 0,
    monthlyNightHours: 0,
    monthlyNightAmount: 0,
    monthlyHolidayHours: 0,
    monthlyHolidayAmount: 0,
    monthlyExtraHolidayHours: 0,
    monthlyExtraHolidayAmount: 0,
    mealAllowance: 0,
    mealAllowanceIncluded: false,
    carAllowance: 0,
    carAllowanceIncluded: false,
    childcareAllowance: 0,
    childcareAllowanceIncluded: false,
    weekDayAllowance: 0,
    overtimeDayAllowance: 0,
    nightDayAllowance: 0,
    holidayDayAllowance: 0,
    weeklyWorkHours: 40
  }

  // 로컬 수정 상태
  const [localFormData, setLocalFormData] = useState<typeof initialFormData | null>(null)
  const [dataVersion, setDataVersion] = useState<number | null>(null)

  // 현재 표시할 데이터 결정
  const currentVersion = salaryInfo?.id ?? 0
  const formData = (localFormData && dataVersion === currentVersion) ? localFormData : initialFormData

  // 상여금 초기화 (bonusCode 우선 사용, fallback으로 bonusType)
  const initialBonuses: BonusItem[] = salaryInfo?.bonuses && salaryInfo.bonuses.length > 0
    ? salaryInfo.bonuses.map(bonus => ({
        id: bonus.id,
        type: bonus.bonusCode || bonus.bonusType,
        amount: bonus.amount,
        memo: bonus.memo || ''
      }))
    : []

  const [localBonuses, setLocalBonuses] = useState<BonusItem[] | null>(null)
  const [bonusVersion, setBonusVersion] = useState<number | null>(null)
  const bonuses = (localBonuses && bonusVersion === currentVersion) ? localBonuses : initialBonuses

  // 상여금 타입 옵션
  const bonusTypeOptions: SelectOption[] = useMemo(() =>
    bonusTypes.map(type => ({
      value: type.code,
      label: type.name
    }))
  , [bonusTypes])

  const updateFormData = (updater: (prev: typeof formData) => typeof formData) => {
    setLocalFormData(updater(formData))
    setDataVersion(currentVersion)
  }

  const updateBonuses = (updater: (prev: BonusItem[]) => BonusItem[]) => {
    setLocalBonuses(updater(bonuses))
    setBonusVersion(currentVersion)
  }

  const handleInputChange = (field: string, value: string | number) => {
    updateFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBonusChange = (id: number, field: keyof BonusItem, value: string | number) => {
    updateBonuses(prev => prev.map(bonus => {
      if (bonus.id !== id) return bonus

      // type 변경 시 해당 상여금 종류의 기본 금액과 메모도 함께 적용
      if (field === 'type') {
        const selectedType = bonusTypes.find(t => t.code === value)
        const defaultAmount = selectedType?.amount ?? 0
        const defaultMemo = selectedType?.remark ?? ''
        return { ...bonus, type: value as string, amount: defaultAmount, memo: defaultMemo }
      }

      return { ...bonus, [field]: value }
    }))
  }

  const handleAddBonus = () => {
    const newId = Math.max(...bonuses.map(b => b.id), 0) + 1
    // 첫 번째 상여금 타입의 기본 금액과 메모 설정
    const defaultType = bonusTypes.length > 0 ? bonusTypes[0] : null
    updateBonuses(prev => [...prev, {
      id: newId,
      type: defaultType?.code ?? '',
      amount: defaultType?.amount ?? 0,
      memo: defaultType?.remark ?? ''
    }])
  }

  const handleRemoveBonus = (id: number) => {
    updateBonuses(prev => prev.filter(bonus => bonus.id !== id))
  }

  const handleSave = async () => {
    if (!contractId) {
      await alert('계약 정보를 찾을 수 없습니다.')
      return
    }

    // 상여금 유효성 검사: 0원인 상여금이 있으면 저장 불가
    const invalidBonus = bonuses.find(b => b.amount === 0 || b.amount <= 0)
    if (invalidBonus) {
      await alert('상여금 금액은 0원보다 커야 합니다. 상여금을 삭제하거나 금액을 입력해주세요.')
      return
    }

    try {
      // salaryInfoId가 있으면 UPDATE, 없으면 INSERT
      if (salaryInfoId) {
        const requestData: UpdateEmploymentContractSalaryInfoRequest = {
          id: salaryInfoId,
          annualAmount: formData.annualSalary,
          monthlyTotalAmount: formData.monthlySalary,
          timelyAmount: formData.hourlyWage,
          monthlyTime: formData.monthlyBasicHours,
          monthlyBaseAmount: formData.monthlyBasicAmount,
          monthlyOvertimeAllowanceTime: formData.monthlyOvertimeHours || undefined,
          monthlyOvertimeAllowanceAmount: formData.monthlyOvertimeAmount || undefined,
          monthlyNightAllowanceTime: formData.monthlyNightHours || undefined,
          monthlyNightAllowanceAmount: formData.monthlyNightAmount || undefined,
          monthlyHolidayAllowanceTime: formData.monthlyHolidayHours || undefined,
          monthlyHolidayAllowanceAmount: formData.monthlyHolidayAmount || undefined,
          monthlyAddHolidayAllowanceTime: formData.monthlyExtraHolidayHours || undefined,
          monthlyAddHolidayAllowanceAmount: formData.monthlyExtraHolidayAmount || undefined,
          // 비과세 항목: 급여에 포함이 ON인 경우에만 값 저장, OFF면 0
          mealAllowanceAmount: formData.mealAllowanceIncluded ? formData.mealAllowance : 0,
          vehicleAllowanceAmount: formData.carAllowanceIncluded ? formData.carAllowance : 0,
          childcareAllowanceAmount: formData.childcareAllowanceIncluded ? formData.childcareAllowance : 0,
          // 비포괄연봉제 추가근무시급
          weekDayAllowanceAmount: formData.weekDayAllowance || undefined,
          overtimeDayAllowanceAmount: formData.overtimeDayAllowance || undefined,
          nightDayAllowanceAmount: formData.nightDayAllowance || undefined,
          holidayAllowanceTimeAmount: formData.holidayDayAllowance || undefined,
          bonuses: bonuses
            .filter(b => b.type && b.amount > 0)
            .map(b => {
              // b.type이 code일 수도 있고, 기존 데이터에서 name일 수도 있음
              // bonusTypes에서 code 또는 name으로 찾아서 bonusCode와 bonusType 분리
              const matchedType = bonusTypes.find(t => t.code === b.type || t.name === b.type)
              return {
                id: b.id > 1000 ? undefined : b.id,
                bonusCode: matchedType?.code || b.type,  // 코드
                bonusType: matchedType?.name || b.type,  // 명칭
                amount: b.amount,
                memo: b.memo || undefined
              }
            })
        }

        await updateSalaryMutation.mutateAsync({ salaryInfoId, data: requestData })
      } else {
        // 급여 정보 신규 생성
        const requestData: CreateEmploymentContractSalaryInfoRequest = {
          contractId: contractId,
          annualAmount: formData.annualSalary,
          monthlyTotalAmount: formData.monthlySalary,
          timelyAmount: formData.hourlyWage,
          monthlyTime: formData.monthlyBasicHours,
          monthlyBaseAmount: formData.monthlyBasicAmount,
          monthlyOvertimeAllowanceTime: formData.monthlyOvertimeHours || undefined,
          monthlyOvertimeAllowanceAmount: formData.monthlyOvertimeAmount || undefined,
          monthlyNightAllowanceTime: formData.monthlyNightHours || undefined,
          monthlyNightAllowanceAmount: formData.monthlyNightAmount || undefined,
          monthlyHolidayAllowanceTime: formData.monthlyHolidayHours || undefined,
          monthlyHolidayAllowanceAmount: formData.monthlyHolidayAmount || undefined,
          monthlyAddHolidayAllowanceTime: formData.monthlyExtraHolidayHours || undefined,
          monthlyAddHolidayAllowanceAmount: formData.monthlyExtraHolidayAmount || undefined,
          // 비과세 항목: 급여에 포함이 ON인 경우에만 값 저장, OFF면 0
          mealAllowanceAmount: formData.mealAllowanceIncluded ? formData.mealAllowance : 0,
          vehicleAllowanceAmount: formData.carAllowanceIncluded ? formData.carAllowance : 0,
          childcareAllowanceAmount: formData.childcareAllowanceIncluded ? formData.childcareAllowance : 0,
          // 비포괄연봉제 추가근무시급
          weekDayAllowanceAmount: formData.weekDayAllowance || undefined,
          overtimeDayAllowanceAmount: formData.overtimeDayAllowance || undefined,
          nightDayAllowanceAmount: formData.nightDayAllowance || undefined,
          holidayAllowanceTimeAmount: formData.holidayDayAllowance || undefined,
          bonuses: bonuses
            .filter(b => b.type && b.amount > 0)
            .map(b => {
              // b.type이 code일 수도 있고, 기존 데이터에서 name일 수도 있음
              // bonusTypes에서 code 또는 name으로 찾아서 bonusCode와 bonusType 분리
              const matchedType = bonusTypes.find(t => t.code === b.type || t.name === b.type)
              return {
                bonusCode: matchedType?.code || b.type,  // 코드
                bonusType: matchedType?.name || b.type,  // 명칭
                amount: b.amount,
                memo: b.memo || undefined
              }
            })
        }

        await createSalaryMutation.mutateAsync(requestData)
      }

      await alert('저장되었습니다.')

      // 저장 후 데이터 새로고침 (로컬 상태 초기화)
      setLocalFormData(null)
      setLocalBonuses(null)
      setDataVersion(null)
      setBonusVersion(null)
      await refetchContract()
    } catch (error) {
      console.error('저장 실패:', error)
      await alert('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleBack = () => {
    router.push(`/employee/contract/${contractId}`)
  }

  const handleCalculator = () => {
    setIsCalculatorOpen(true)
  }

  const handleCalculatorApply = (data: SalaryCalculationData) => {
    updateFormData(prev => ({
      ...prev,
      annualSalary: data.annualSalary,
      monthlySalary: data.monthlySalary,
      hourlyWage: data.hourlyWage,
      weeklyWorkHours: data.weeklyWorkHours,
      monthlyBasicHours: data.monthlyBasicHours,
      monthlyBasicAmount: data.monthlyBasicAmount,
      monthlyOvertimeHours: data.monthlyOvertimeHours,
      monthlyOvertimeAmount: data.monthlyOvertimeAmount,
      monthlyNightHours: data.monthlyNightHours,
      monthlyNightAmount: data.monthlyNightAmount,
      monthlyHolidayHours: data.monthlyHolidayHours,
      monthlyHolidayAmount: data.monthlyHolidayAmount,
      monthlyExtraHolidayHours: data.monthlyExtraHolidayHours,
      monthlyExtraHolidayAmount: data.monthlyExtraHolidayAmount,
      // 비과세 항목: 급여에 포함이 ON인 경우에만 값 반영, OFF면 0
      mealAllowance: data.mealAllowanceIncluded ? data.mealAllowance : 0,
      mealAllowanceIncluded: data.mealAllowanceIncluded,
      carAllowance: data.carAllowanceIncluded ? data.carAllowance : 0,
      carAllowanceIncluded: data.carAllowanceIncluded,
      childcareAllowance: data.childcareAllowanceIncluded ? data.childcareAllowance : 0,
      childcareAllowanceIncluded: data.childcareAllowanceIncluded,
      // 비포괄연봉제 추가근무시급
      weekDayAllowance: data.weekdayHourlyWage || 0,
      overtimeDayAllowance: data.overtimeHourlyWage || 0,
      nightDayAllowance: data.nightHourlyWage || 0,
      holidayDayAllowance: data.holidayHourlyWage || 0
    }))
  }

  return (
    <div className="master-detail-data">
      {/* 급여 정보 */}
      <div className={`slidebox-wrap ${salaryInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-form outline" onClick={handleBack} style={{ padding: '4px 8px' }} aria-label="상세 페이지로 돌아가기">
              <span style={{ fontSize: '16px' }}>&lt;</span>
            </button>
            <h2>급여 정보</h2>
          </div>
          <div className="slidebox-btn-wrap">
            {/* 파트타임이 아닌 경우에만 계산기 버튼 표시 */}
            {contractClassification !== 'CNTCFWK_003' && (
              <button className="btn-form outline" onClick={handleCalculator}>연봉 및 통상시급 계산기</button>
            )}
            <button className="btn-form basic" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={salaryInfoOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <div className="detail-data-wrap">
              {/* 포괄연봉제 (CNTCFWK_001) 급여정보 테이블 */}
              {contractClassification === 'CNTCFWK_001' && (
                <table className="default-table">
                  <colgroup>
                    <col width="180px" />
                    <col />
                  </colgroup>
                  <tbody>
                    {/* 연봉 총액 */}
                    <tr>
                      <th>연봉 총액 <span className="red">*</span></th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '150px', textAlign: 'right' }}
                              value={formatNumber(formData.annualSalary)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <span style={{ color: '#333', fontWeight: 500 }}>월급여 총액</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '150px', textAlign: 'right' }}
                              value={formatNumber(formData.monthlySalary)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <span style={{ color: '#333', fontWeight: 500 }}>통상시급</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.hourlyWage)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* 월간 기본급 */}
                    <tr>
                      <th>월간 기본급 <span className="red">*</span></th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '80px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyBasicHours)}
                            readOnly
                          />
                          <span>시간</span>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '150px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyBasicAmount)}
                            readOnly
                          />
                          <span>원</span>
                          <span style={{ color: '#666', fontSize: '12px', marginLeft: '16px' }}>
                            ※ 1주간 40시간 근무를 기준으로 월간 근무시간은 209시간입니다. 209시간 = (1주 40시간 + 주휴 8시간) x (365일 ÷ 12개월 ÷ 7일)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* 월간 연장수당 */}
                    <tr>
                      <th>월간 연장수당</th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '80px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyOvertimeHours)}
                            readOnly
                          />
                          <span>시간</span>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '150px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyOvertimeAmount)}
                            readOnly
                          />
                          <span>원</span>
                          <span style={{ color: '#666', fontSize: '12px', marginLeft: '16px' }}>
                            ※ 기본근무 이외의 연장 근무에 대한 추가 수당입니다.
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* 월간 야간수당 */}
                    <tr>
                      <th>월간 야간수당</th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '80px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyNightHours)}
                            readOnly
                          />
                          <span>시간</span>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '150px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyNightAmount)}
                            readOnly
                          />
                          <span>원</span>
                          <span style={{ color: '#666', fontSize: '12px', marginLeft: '16px' }}>
                            ※ 기본 근무시간 중 야간근무에 대한 수당입니다.
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* 월간 휴일근무수당 */}
                    <tr>
                      <th>월간 휴일근무수당</th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '80px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyHolidayHours)}
                            readOnly
                          />
                          <span>시간</span>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '150px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyHolidayAmount)}
                            readOnly
                          />
                          <span>원</span>
                          <span style={{ color: '#666', fontSize: '12px', marginLeft: '16px' }}>
                            ※ 기본 근무시간 중 휴일근무에 대한 수당입니다.
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* 월간 추가 휴일근무 수당 */}
                    <tr>
                      <th>월간 추가 휴일근무 수당</th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '80px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyExtraHolidayHours)}
                            readOnly
                          />
                          <span>시간</span>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '150px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyExtraHolidayAmount)}
                            readOnly
                          />
                          <span>원</span>
                          <span style={{ color: '#666', fontSize: '12px', marginLeft: '16px' }}>
                            ※ 기본 근무시간 이외의 휴일근무에 대한 수당입니다.
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* 비과세항목 */}
                    <tr>
                      <th>비과세항목</th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>식대</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.mealAllowance)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>자가운전보조금</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.carAllowance)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>육아수당</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.childcareAllowance)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* 비포괄연봉제 (CNTCFWK_002) 급여정보 테이블 */}
              {contractClassification === 'CNTCFWK_002' && (
                <table className="default-table">
                  <colgroup>
                    <col width="180px" />
                    <col />
                  </colgroup>
                  <tbody>
                    {/* 연봉 총액 */}
                    <tr>
                      <th>연봉 총액 <span className="red">*</span></th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '150px', textAlign: 'right' }}
                              value={formatNumber(formData.annualSalary)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <span style={{ color: '#333', fontWeight: 500 }}>월급여 총액</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '150px', textAlign: 'right' }}
                              value={formatNumber(formData.monthlySalary)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <span style={{ color: '#333', fontWeight: 500 }}>통상시급</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.hourlyWage)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* 월간 기본급 */}
                    <tr>
                      <th>월간 기본급 <span className="red">*</span></th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '80px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyBasicHours)}
                            readOnly
                          />
                          <span>시간</span>
                          <input
                            type="text"
                            className="input-frame"
                            style={{ width: '150px', textAlign: 'right' }}
                            value={formatNumber(formData.monthlyBasicAmount)}
                            readOnly
                          />
                          <span>원</span>
                          <span style={{ color: '#666', fontSize: '12px', marginLeft: '16px' }}>
                            ※ 1주간 40시간 근무를 기준으로 월간 근무시간은 209시간입니다. 209시간 = (1주 40시간 + 주휴 8시간) x (365일 ÷ 12개월 ÷ 7일)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* 비과세항목 */}
                    <tr>
                      <th>비과세항목</th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>식대</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.mealAllowance)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>자가운전보조금</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.carAllowance)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>육아수당</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.childcareAllowance)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* 추가근무시급 */}
                    <tr>
                      <th>추가근무시급</th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>평일 시급</span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#333',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>W</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.weekDayAllowance || formData.hourlyWage)}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>연장근무 시급</span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#333',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>W</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.overtimeDayAllowance || Math.round(formData.hourlyWage * 1.5))}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>야간근무 시급</span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#333',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>W</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.nightDayAllowance || Math.round(formData.hourlyWage * 1.5))}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>휴일근무 시급</span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#333',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>W</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.holidayDayAllowance || Math.round(formData.hourlyWage * 1.5))}
                              readOnly
                            />
                            <span>원</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* 파트타임 (CNTCFWK_003) 급여정보 테이블 */}
              {contractClassification === 'CNTCFWK_003' && (
                <table className="default-table">
                  <colgroup>
                    <col width="180px" />
                    <col />
                  </colgroup>
                  <tbody>
                    {/* 급여항목/금액 - 시급 */}
                    <tr>
                      <th>급여항목/금액 <span className="red">*</span></th>
                      <td>
                        <div className="data-filed" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ color: '#333', fontWeight: 500 }}>시급 <span className="red">*</span></span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>평일 시급</span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#333',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>W</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.weekDayAllowance)}
                              onChange={(e) => handleInputChange('weekDayAllowance', parseInt(e.target.value.replace(/,/g, '')) || 0)}
                            />
                            <span>원</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>연장근무 시급</span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#333',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>W</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.overtimeDayAllowance)}
                              onChange={(e) => handleInputChange('overtimeDayAllowance', parseInt(e.target.value.replace(/,/g, '')) || 0)}
                            />
                            <span>원</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>휴일근무 시급</span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#333',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>W</span>
                            <input
                              type="text"
                              className="input-frame"
                              style={{ width: '120px', textAlign: 'right' }}
                              value={formatNumber(formData.holidayDayAllowance)}
                              onChange={(e) => handleInputChange('holidayDayAllowance', parseInt(e.target.value.replace(/,/g, '')) || 0)}
                            />
                            <span>원</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* 상여금 종류/상여금 - 파트타임이 아닌 경우에만 표시 */}
              {contractClassification !== 'CNTCFWK_003' && (
              <table className="default-table">
                <colgroup>
                  <col width="180px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>상여금 종류/상여금</th>
                    <td>
                      <div className="data-filed">
                        {bonuses.length === 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#666' }}>상여금 정보가 없습니다.</span>
                            <button
                              className="btn-form outline"
                              style={{ padding: '4px 12px' }}
                              onClick={handleAddBonus}
                            >
                              상여금 추가
                            </button>
                          </div>
                        ) : (
                          bonuses.map((bonus) => (
                            <div key={bonus.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <SearchSelect
                                options={bonusTypeOptions}
                                value={bonusTypeOptions.find(opt => opt.value === bonus.type) || null}
                                onChange={(opt) => handleBonusChange(bonus.id, 'type', opt?.value || '')}
                                placeholder="선택"
                              />
                              <button
                                className="btn-form outline"
                                style={{ padding: '4px 8px', minWidth: 'auto' }}
                                title="정보"
                                aria-label="상여금 정보"
                              >
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  backgroundColor: '#007bff',
                                  color: '#fff',
                                  fontSize: '11px'
                                }}>i</span>
                              </button>
                              <button
                                className="btn-form outline"
                                style={{ padding: '4px 8px', minWidth: 'auto', backgroundColor: '#333', color: '#fff' }}
                                title="원화"
                                aria-label="원화 표시"
                              >
                                W
                              </button>
                              <input
                                type="text"
                                className="input-frame"
                                style={{ width: '120px', textAlign: 'right' }}
                                value={formatNumber(bonus.amount)}
                                onChange={(e) => handleBonusChange(bonus.id, 'amount', parseInt(e.target.value.replace(/,/g, '')) || 0)}
                              />
                              <span>원</span>
                              <input
                                type="text"
                                className="input-frame"
                                style={{ width: '150px' }}
                                placeholder="Memo"
                                value={bonus.memo}
                                onChange={(e) => handleBonusChange(bonus.id, 'memo', e.target.value)}
                              />
                              <div style={{ position: 'relative' }}>
                                <button
                                  className="btn-form outline"
                                  style={{ padding: '4px 8px', minWidth: 'auto' }}
                                  onClick={() => {
                                    const menu = document.getElementById(`bonus-menu-${bonus.id}`)
                                    if (menu) {
                                      menu.style.display = menu.style.display === 'none' ? 'block' : 'none'
                                    }
                                  }}
                                  aria-label="상여금 메뉴 열기"
                                >
                                  <span style={{ fontSize: '16px' }}>&#8942;</span>
                                </button>
                                <div
                                  id={`bonus-menu-${bonus.id}`}
                                  style={{
                                    display: 'none',
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    backgroundColor: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    zIndex: 10,
                                    minWidth: '100px'
                                  }}
                                >
                                  <button
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      padding: '8px 16px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onClick={handleAddBonus}
                                  >
                                    분류 추가
                                  </button>
                                  <button
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      padding: '8px 16px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      color: '#dc3545'
                                    }}
                                    onClick={() => handleRemoveBonus(bonus.id)}
                                  >
                                    분류 삭제
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              )}
            </div>
          </div>
        </AnimateHeight>
      </div>

      {/* 하단 버튼 */}
      <div className="detail-btn-wrap" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
        <button className="btn-form gray" onClick={handleBack} disabled={isSaving}>취소</button>
        <button className="btn-form basic" onClick={handleSave} disabled={isSaving}>
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 연봉 및 통상시급 계산기 팝업 */}
      <SalaryCalculationPop
        key={isCalculatorOpen ? `salary-${contractClassification}` : 'closed'}
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onApply={handleCalculatorApply}
        contractClassification={contractClassification}
        initialData={{
          hourlyWage: formData.hourlyWage,
          weeklyWorkHours: formData.weeklyWorkHours,
          monthlyOvertimeHours: formData.monthlyOvertimeHours,
          monthlyExtraHolidayHours: formData.monthlyExtraHolidayHours,
          monthlyNightHours: formData.monthlyNightHours,
          monthlyHolidayHours: formData.monthlyHolidayHours,
          mealAllowance: formData.mealAllowance,
          mealAllowanceIncluded: formData.mealAllowanceIncluded,
          carAllowance: formData.carAllowance,
          carAllowanceIncluded: formData.carAllowanceIncluded,
          childcareAllowance: formData.childcareAllowance,
          childcareAllowanceIncluded: formData.childcareAllowanceIncluded,
          // 비포괄연봉제 추가근무시급
          weekdayHourlyWage: formData.weekDayAllowance,
          overtimeHourlyWage: formData.overtimeDayAllowance,
          nightHourlyWage: formData.nightDayAllowance,
          holidayHourlyWage: formData.holidayDayAllowance
        } as SalaryCalculationInitialData}
      />
    </div>
  )
}
