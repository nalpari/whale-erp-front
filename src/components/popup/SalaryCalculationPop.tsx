'use client'
import { useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { useMinimumWageList } from '@/hooks/queries/use-employee-queries'
import type { MinimumWageInfo as _MinimumWageInfo } from '@/lib/api/employee'

// 계약 분류 타입
export type ContractClassificationType = 'CNTCFWK_001' | 'CNTCFWK_002' | 'CNTCFWK_003'

export interface SalaryCalculationData {
  annualSalary: number
  monthlySalary: number
  hourlyWage: number
  weeklyWorkHours: number
  monthlyBasicHours: number
  monthlyBasicAmount: number
  monthlyOvertimeHours: number
  monthlyOvertimeAmount: number
  monthlyNightHours: number
  monthlyNightAmount: number
  monthlyHolidayHours: number
  monthlyHolidayAmount: number
  monthlyExtraHolidayHours: number
  monthlyExtraHolidayAmount: number
  mealAllowance: number
  mealAllowanceIncluded: boolean
  carAllowance: number
  carAllowanceIncluded: boolean
  childcareAllowance: number
  childcareAllowanceIncluded: boolean
  // 비포괄연봉제 추가 필드
  weekdayHourlyWage?: number
  overtimeHourlyWage?: number
  nightHourlyWage?: number
  holidayHourlyWage?: number
}

// 초기 데이터 타입 (기존 급여 정보)
export interface SalaryCalculationInitialData {
  hourlyWage?: number
  weeklyWorkHours?: number
  monthlyOvertimeHours?: number
  monthlyExtraHolidayHours?: number
  monthlyNightHours?: number
  monthlyHolidayHours?: number
  mealAllowance?: number
  mealAllowanceIncluded?: boolean
  carAllowance?: number
  carAllowanceIncluded?: boolean
  childcareAllowance?: number
  childcareAllowanceIncluded?: boolean
  // 비포괄연봉제 추가 필드
  weekdayHourlyWage?: number
  overtimeHourlyWage?: number
  nightHourlyWage?: number
  holidayHourlyWage?: number
}

interface SalaryCalculationPopProps {
  isOpen: boolean
  onClose: () => void
  onApply?: (data: SalaryCalculationData) => void
  initialData?: SalaryCalculationInitialData
  contractClassification?: ContractClassificationType
}

const EMPTY_WAGE_LIST: never[] = []

// 숫자를 3자리마다 쉼표가 있는 문자열로 변환
const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value
  if (isNaN(num)) return ''
  return num.toLocaleString('ko-KR')
}

// 쉼표가 있는 문자열을 숫자로 변환
const parseNumber = (value: string): number => {
  return parseInt(value.replace(/,/g, ''), 10) || 0
}

export default function SalaryCalculationPop({ isOpen, onClose, onApply, initialData, contractClassification = 'CNTCFWK_001' }: SalaryCalculationPopProps) {
  const currentYear = new Date().getFullYear()

  // TanStack Query로 최저시급 목록 조회
  const { data: minimumWageListData = EMPTY_WAGE_LIST } = useMinimumWageList(isOpen)

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [minimumWage, setMinimumWage] = useState<number>(0)

  // 계약 분류 상태 (부모 컴포넌트에서 전달받은 값으로 초기화 — key prop으로 리마운트 보장)
  const [selectedContractType, setSelectedContractType] = useState<ContractClassificationType>(contractClassification)

  // 통상시급 — initialData에서 초기값 설정 (key prop으로 리마운트 보장)
  const [hourlyWage, setHourlyWage] = useState<string>(() =>
    initialData?.hourlyWage ? formatNumber(initialData.hourlyWage) : '0'
  )

  // 비포괄연봉제 추가근무시급 상태 — initialData에서 초기값 계산
  const [weekdayHourlyWage, setWeekdayHourlyWage] = useState<string>(() => {
    if (initialData?.weekdayHourlyWage && initialData.weekdayHourlyWage > 0) return formatNumber(initialData.weekdayHourlyWage)
    const base = initialData?.hourlyWage || 0
    if (base > 0) return formatNumber(base)
    return '0'
  })
  const [overtimeHourlyWage, setOvertimeHourlyWage] = useState<string>(() => {
    if (initialData?.overtimeHourlyWage && initialData.overtimeHourlyWage > 0) return formatNumber(initialData.overtimeHourlyWage)
    const base = initialData?.hourlyWage || 0
    if (base > 0) return formatNumber(Math.round(base * 1.5))
    return '0'
  })
  const [nightHourlyWage, setNightHourlyWage] = useState<string>(() => {
    if (initialData?.nightHourlyWage && initialData.nightHourlyWage > 0) return formatNumber(initialData.nightHourlyWage)
    const base = initialData?.hourlyWage || 0
    if (base > 0) return formatNumber(Math.round(base * 1.5))
    return '0'
  })
  const [holidayHourlyWage, setHolidayHourlyWage] = useState<string>(() => {
    if (initialData?.holidayHourlyWage && initialData.holidayHourlyWage > 0) return formatNumber(initialData.holidayHourlyWage)
    const base = initialData?.hourlyWage || 0
    if (base > 0) return formatNumber(Math.round(base * 1.5))
    return '0'
  })

  // 근무시간 상태 — initialData에서 초기값 설정
  const [weeklyWorkHours, setWeeklyWorkHours] = useState<number>(initialData?.weeklyWorkHours ?? 40)
  const [monthlyOvertimeHours, setMonthlyOvertimeHours] = useState<number>(initialData?.monthlyOvertimeHours ?? 0)
  const [monthlyExtraHolidayHours, setMonthlyExtraHolidayHours] = useState<number>(initialData?.monthlyExtraHolidayHours ?? 0)
  const [monthlyNightHours, setMonthlyNightHours] = useState<number>(initialData?.monthlyNightHours ?? 0)
  const [monthlyHolidayHours, setMonthlyHolidayHours] = useState<number>(initialData?.monthlyHolidayHours ?? 0)

  // 수당 상태 — initialData에서 초기값 설정
  const [foodAllowanceIncluded, setFoodAllowanceIncluded] = useState<boolean>(
    initialData?.mealAllowance !== undefined
      ? (initialData.mealAllowanceIncluded ?? true)
      : true
  )
  const [foodAllowance, setFoodAllowance] = useState<string>(
    initialData?.mealAllowance !== undefined
      ? formatNumber(initialData.mealAllowance)
      : '200,000'
  )
  const [drivingAllowanceIncluded, setDrivingAllowanceIncluded] = useState<boolean>(
    initialData?.carAllowance !== undefined
      ? (initialData.carAllowanceIncluded ?? true)
      : true
  )
  const [drivingAllowance, setDrivingAllowance] = useState<string>(
    initialData?.carAllowance !== undefined
      ? formatNumber(initialData.carAllowance)
      : '200,000'
  )
  const [childAllowanceIncluded, setChildAllowanceIncluded] = useState<boolean>(
    initialData?.childcareAllowance !== undefined
      ? (initialData.childcareAllowanceIncluded ?? true)
      : true
  )
  const [childAllowance, setChildAllowance] = useState<string>(
    initialData?.childcareAllowance !== undefined
      ? formatNumber(initialData.childcareAllowance)
      : '100,000'
  )

  // 월간 기본근무 시간 계산: (주당근무시간 + (주당근무시간/5)) * 4.345, 소수점 첫째자리에서 반올림
  const monthlyBasicHours = Math.round((weeklyWorkHours + (weeklyWorkHours / 5)) * 4.345)

  // 통상시급 숫자값
  const hourlyWageNum = parseNumber(hourlyWage)

  // 주당 근무시간 금액 계산 (주당근무시간 * 통상시급)
  const weeklyWorkSalary = weeklyWorkHours * hourlyWageNum

  // 월간 기본근무 금액 계산 (월간 기본근무 시간 * 통상시급)
  const monthlyBasicSalary = monthlyBasicHours * hourlyWageNum

  // 월간 연장근무 금액 계산 (연장시간 * 통상시급 * 1.5)
  const monthlyOvertimeSalary = Math.round(monthlyOvertimeHours * hourlyWageNum * 1.5)

  // 월간 추가 휴일근무 금액 계산 (추가휴일시간 * 통상시급 * 1.5)
  const monthlyExtraHolidaySalary = Math.round(monthlyExtraHolidayHours * hourlyWageNum * 1.5)

  // 월간 야간근무 금액 계산 (야간시간 * 통상시급 * 0.5)
  const monthlyNightSalary = Math.round(monthlyNightHours * hourlyWageNum * 0.5)

  // 월간 휴일근무 금액 계산 (휴일시간 * 통상시급 * 0.5)
  const monthlyHolidaySalary = Math.round(monthlyHolidayHours * hourlyWageNum * 0.5)

  // 월간 총 근무시간 계산 (주당 근무시간, 야간근무, 휴일근무 제외)
  const totalMonthlyWorkHours = monthlyBasicHours + monthlyOvertimeHours + monthlyExtraHolidayHours

  // 주 52시간 초과 여부 확인 (주휴시간 제외한 실제 근무시간 기준)
  const weeklyTotalWorkHours = weeklyWorkHours + (monthlyOvertimeHours + monthlyExtraHolidayHours) / 4.345
  const isOver52Hours = weeklyTotalWorkHours > 52

  // 월 급여 총액 계산 (주당 근무시간 금액 제외 + 급여에 포함된 수당 추가)
  const monthlyTotalSalary =
    monthlyBasicSalary +
    monthlyOvertimeSalary +
    monthlyExtraHolidaySalary +
    monthlyNightSalary +
    monthlyHolidaySalary +
    (foodAllowanceIncluded ? parseNumber(foodAllowance) : 0) +
    (drivingAllowanceIncluded ? parseNumber(drivingAllowance) : 0) +
    (childAllowanceIncluded ? parseNumber(childAllowance) : 0)

  // 연봉 총액 계산 (월급여 총액 * 12)
  const annualTotalSalary = monthlyTotalSalary * 12

  // 최저시급 목록 데이터 반영 (렌더 중 상태 갱신 — React Compiler 호환)
  const [prevMinimumWageListData, setPrevMinimumWageListData] = useState(minimumWageListData)
  if (minimumWageListData !== prevMinimumWageListData) {
    setPrevMinimumWageListData(minimumWageListData)
    if (minimumWageListData.length > 0) {
      const currentYearData = minimumWageListData.find(item => item.year === currentYear)
      const wageData = currentYearData || minimumWageListData[0]
      setSelectedYear(wageData.year)
      setMinimumWage(wageData.minimumWage)

      if (!initialData?.hourlyWage || initialData.hourlyWage === 0) {
        setHourlyWage(formatNumber(wageData.minimumWage))

        if (contractClassification !== 'CNTCFWK_001') {
          if (!initialData?.weekdayHourlyWage || initialData.weekdayHourlyWage === 0) {
            setWeekdayHourlyWage(formatNumber(wageData.minimumWage))
          }
          if (!initialData?.overtimeHourlyWage || initialData.overtimeHourlyWage === 0) {
            setOvertimeHourlyWage(formatNumber(Math.round(wageData.minimumWage * 1.5)))
          }
          if (!initialData?.nightHourlyWage || initialData.nightHourlyWage === 0) {
            setNightHourlyWage(formatNumber(Math.round(wageData.minimumWage * 1.5)))
          }
          if (!initialData?.holidayHourlyWage || initialData.holidayHourlyWage === 0) {
            setHolidayHourlyWage(formatNumber(Math.round(wageData.minimumWage * 1.5)))
          }
        }
      }
    }
  }

  // 연도 선택 시 해당 년도의 최저시급으로 통상시급 자동 입력
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value, 10)
    setSelectedYear(year)

    const yearData = minimumWageListData.find(item => item.year === year)
    if (yearData) {
      setMinimumWage(yearData.minimumWage)
      setHourlyWage(formatNumber(yearData.minimumWage))

      // 비포괄연봉제/파트타임인 경우 추가근무시급 자동 계산
      if (selectedContractType !== 'CNTCFWK_001') {
        setWeekdayHourlyWage(formatNumber(yearData.minimumWage))
        setOvertimeHourlyWage(formatNumber(Math.round(yearData.minimumWage * 1.5)))
        setNightHourlyWage(formatNumber(Math.round(yearData.minimumWage * 1.5)))
        setHolidayHourlyWage(formatNumber(Math.round(yearData.minimumWage * 1.5)))
      }
    }
  }

  // 통상시급 입력 핸들러
  const handleHourlyWageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '') // 숫자만 허용
    const newHourlyWage = formatNumber(value)
    setHourlyWage(newHourlyWage)

    // 비포괄연봉제/파트타임인 경우 추가근무시급 자동 계산
    if (selectedContractType !== 'CNTCFWK_001') {
      const numValue = parseInt(value, 10) || 0
      if (numValue > 0) {
        setWeekdayHourlyWage(formatNumber(numValue))
        setOvertimeHourlyWage(formatNumber(Math.round(numValue * 1.5)))
        setNightHourlyWage(formatNumber(Math.round(numValue * 1.5)))
        setHolidayHourlyWage(formatNumber(Math.round(numValue * 1.5)))
      }
    }
  }

  // 근무시간 입력 핸들러
  const handleNumberInputChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0
    setter(value)
  }

  // 최저시급 미달 여부 확인
  const isUnderMinimumWage = parseNumber(hourlyWage) < minimumWage && parseNumber(hourlyWage) > 0

  // 초기화 핸들러
  const handleReset = () => {
    // 주당 근무시간 40으로 고정
    setWeeklyWorkHours(40)
    // 연장/야간/휴일 근무시간 초기화
    setMonthlyOvertimeHours(0)
    setMonthlyExtraHolidayHours(0)
    setMonthlyNightHours(0)
    setMonthlyHolidayHours(0)
    // 선택된 연도의 최저시급으로 시급 설정
    setHourlyWage(formatNumber(minimumWage))
    // 비포괄연봉제/파트타임 추가근무시급 초기화 (평일시급은 최저시급, 나머지는 1.5배)
    setWeekdayHourlyWage(formatNumber(minimumWage))
    setOvertimeHourlyWage(formatNumber(Math.round(minimumWage * 1.5)))
    setNightHourlyWage(formatNumber(Math.round(minimumWage * 1.5)))
    setHolidayHourlyWage(formatNumber(Math.round(minimumWage * 1.5)))
    // 비과세 항목 기본값: 식대 20만, 자가운전보조금 20만, 육아수당 10만
    setFoodAllowance('200,000')
    setFoodAllowanceIncluded(true)
    setDrivingAllowance('200,000')
    setDrivingAllowanceIncluded(true)
    setChildAllowance('100,000')
    setChildAllowanceIncluded(true)
  }

  if (!isOpen) return null

  const handleApply = () => {
    if (onApply) {
      onApply({
        annualSalary: annualTotalSalary,
        monthlySalary: monthlyTotalSalary,
        hourlyWage: hourlyWageNum,
        weeklyWorkHours: weeklyWorkHours,
        monthlyBasicHours: monthlyBasicHours,
        monthlyBasicAmount: monthlyBasicSalary,
        monthlyOvertimeHours: monthlyOvertimeHours,
        monthlyOvertimeAmount: monthlyOvertimeSalary,
        monthlyNightHours: monthlyNightHours,
        monthlyNightAmount: monthlyNightSalary,
        monthlyHolidayHours: monthlyHolidayHours,
        monthlyHolidayAmount: monthlyHolidaySalary,
        monthlyExtraHolidayHours: monthlyExtraHolidayHours,
        monthlyExtraHolidayAmount: monthlyExtraHolidaySalary,
        mealAllowance: parseNumber(foodAllowance),
        mealAllowanceIncluded: foodAllowanceIncluded,
        carAllowance: parseNumber(drivingAllowance),
        carAllowanceIncluded: drivingAllowanceIncluded,
        childcareAllowance: parseNumber(childAllowance),
        childcareAllowanceIncluded: childAllowanceIncluded,
        // 비포괄연봉제 추가근무시급
        weekdayHourlyWage: parseNumber(weekdayHourlyWage),
        overtimeHourlyWage: parseNumber(overtimeHourlyWage),
        nightHourlyWage: parseNumber(nightHourlyWage),
        holidayHourlyWage: parseNumber(holidayHourlyWage)
      })
    }
    onClose()
  }

  return (
    <div className="modal-popup" style={{ display: 'block' }}>
      <div className="modal-dialog xl">
        <div className="modal-content">
          <div className="modal-header">
            <h2>연봉 및 통상시급 계산기</h2>
            <button className="modal-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="pop-frame">
              <table className="calculation-hd-table">
                <colgroup>
                  <col width="100px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>
                      계약분류 <span className="red">*</span>
                    </th>
                    <td>
                      <div className="filed-flx">
                        <div className="mx-160">
                          <select
                            className="select-form"
                            value={selectedContractType}
                            onChange={(e) => setSelectedContractType(e.target.value as ContractClassificationType)}
                            disabled
                          >
                            <option value="CNTCFWK_001">포괄연봉제</option>
                            <option value="CNTCFWK_002">비포괄연봉제</option>
                            <option value="CNTCFWK_003">파트타임</option>
                          </select>
                        </div>
                        <div className="mx-160">
                          <select className="select-form" value={selectedYear} onChange={handleYearChange}>
                            {minimumWageListData.map(item => (
                              <option key={item.year} value={item.year}>
                                {item.year}년 (최저시급: {formatNumber(item.minimumWage)}원)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>통상시급</th>
                    <td>
                      <div className="filed-flx">
                        <div className="filed-flx g16">
                          <div className="filed-flx">
                            <div className="mx-160">
                              <input
                                type="text"
                                className="input-frame black al-r"
                                value={hourlyWage}
                                onChange={handleHourlyWageChange}
                              />
                            </div>
                            <span className="explain">원</span>
                          </div>
                          {isUnderMinimumWage && (
                            <div className="filed-warning">
                              <span className="warning-icon"></span>
                              <span className="warning-txt">최저 시급 미달({formatNumber(minimumWage)})</span>
                            </div>
                          )}
                        </div>
                        <div className="filed-flx g8 auto-right">
                          <button className="btn-form outline s" onClick={handleReset}>초기화</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* 포괄연봉제 (CNTCFWK_001) 테이블 */}
              {selectedContractType === 'CNTCFWK_001' && (
                <table className="calculation-table">
                  <colgroup>
                    <col width="240px" />
                    <col width="90px" />
                    <col width="180px" />
                    <col width="160px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>
                            주당 근무시간 <span className="red">*</span>
                          </span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-work-time"></span>
                              <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor-work-time" opacity={1}>
                                <div>한주에 직원이 근무해야 하는 시간을 입력합니다.</div>
                                <div>일반적으로 9 to 6 인 경우 하루 8시간 근무이며, 주단위로는 40시간입니다.</div>
                                <div>주당 15시간 이상 근무일 경우 주휴수당(근무시간/5)을 함께 계산합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={weeklyWorkHours} onChange={handleNumberInputChange(setWeeklyWorkHours)} />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(weeklyWorkSalary)} readOnly />
                        </div>
                      </td>
                      <th>
                        <div className="filed-flx">
                          <span>식대</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-food-allowance"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-food-allowance"
                                opacity={1}
                              >
                                <div>식대는 비과세항목입니다.</div>
                                <div>식대를 입력하고, 급여에 포함할 경우 과세범위에서 제외됩니다.</div>
                                <div>식대를 입력하고, 급여에 포함하지 않을 경우 급여와는 별도로 지급해야 합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="toggle-wrap">
                            <span className="toggle-txt">급여에 포함</span>
                            <div className="toggle-btn">
                              <input type="checkbox" id="toggle-btn-food" checked={foodAllowanceIncluded} onChange={(e) => setFoodAllowanceIncluded(e.target.checked)} />
                              <label className="slider" htmlFor="toggle-btn-food"></label>
                            </div>
                          </div>
                          <div className="block">
                            <input type="text" className="input-frame al-r" value={foodAllowance} onChange={(e) => setFoodAllowance(formatNumber(e.target.value.replace(/[^0-9]/g, '')))} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>월간 기본근무</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-basic-work-time"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-basic-work-time"
                                opacity={1}
                              >
                                <div>한달에 직원이 근무해야 하는 시간을 표시합니다.</div>
                                <div>
                                  일반적으로 주단위로는 40시간을 근무할 경우 월간 174시간이지만, 주휴시간(근무시간/5)을
                                  함께 계산하면 209시간이 됩니다
                                </div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={monthlyBasicHours} readOnly />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyBasicSalary)} readOnly />
                        </div>
                      </td>
                      <th>
                        <div className="filed-flx">
                          <span>자가운전보조금</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-driving-allowance"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-driving-allowance"
                                opacity={1}
                              >
                                <div>
                                  자가운전보조금은 비과세항목입니다. 차량을 소유한 직원에게만 해당합니다.(차량 소유가
                                  필수는 아님)
                                </div>
                                <div>자가운전보조금을 입력하고, 급여에 포함할 경우 과세범위에서 제외됩니다.</div>
                                <div>
                                  자가운전보조금을 입력하고, 급여에 포함하지 않을 경우 급여와는 별도로 지급해야 합니다
                                </div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="toggle-wrap">
                            <span className="toggle-txt">급여에 포함</span>
                            <div className="toggle-btn">
                              <input type="checkbox" id="toggle-btn-driving" checked={drivingAllowanceIncluded} onChange={(e) => setDrivingAllowanceIncluded(e.target.checked)} />
                              <label className="slider" htmlFor="toggle-btn-driving"></label>
                            </div>
                          </div>
                          <div className="block">
                            <input type="text" className="input-frame al-r" value={drivingAllowance} onChange={(e) => setDrivingAllowance(formatNumber(e.target.value.replace(/[^0-9]/g, '')))} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>월간 연장근무</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-overtime-work-time"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-overtime-work-time"
                                opacity={1}
                              >
                                <div>근로자가 법정 근로시간(1일 8시간, 주 40시간)을 초과하여 근무하는 시간입니다.</div>
                                <div>통상임금에 50%를 가산하여 지급해야 하는 추가 수당입니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={monthlyOvertimeHours} onChange={handleNumberInputChange(setMonthlyOvertimeHours)} />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyOvertimeSalary)} readOnly />
                        </div>
                      </td>
                      <th>
                        <div className="filed-flx">
                          <span>육아수당</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-child-allowance"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-child-allowance"
                                opacity={1}
                              >
                                <div>육아수당은 비과세항목입니다.</div>
                                <div>미취학 아동이 있는 직원에게만 해당합니다.</div>
                                <div>육아수당을 입력하고, 급여에 포함할 경우 과세범위에서 제외됩니다.</div>
                                <div>육아수당을 입력하고, 급여에 포함하지 않을 경우 급여와는 별도로 지급해야 합니다</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="toggle-wrap">
                            <span className="toggle-txt">급여에 포함</span>
                            <div className="toggle-btn">
                              <input type="checkbox" id="toggle-btn-child" checked={childAllowanceIncluded} onChange={(e) => setChildAllowanceIncluded(e.target.checked)} />
                              <label className="slider" htmlFor="toggle-btn-child"></label>
                            </div>
                          </div>
                          <div className="block">
                            <input type="text" className="input-frame al-r" value={childAllowance} onChange={(e) => setChildAllowance(formatNumber(e.target.value.replace(/[^0-9]/g, '')))} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>월간 추가 휴일근무</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-extra-holiday-work-time"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-extra-holiday-work-time"
                                opacity={1}
                              >
                                <div>
                                  근로자가 법정 근로시간(1일 8시간, 주 40시간)을 초과하여 휴일에 근무하는 시간입니다.
                                </div>
                                <div>통상임금에 50%를 가산하여 지급해야 하는 추가 수당입니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={monthlyExtraHolidayHours} onChange={handleNumberInputChange(setMonthlyExtraHolidayHours)} />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyExtraHolidaySalary)} readOnly />
                        </div>
                      </td>
                      <th></th>
                      <td></td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>
                            월간 야간근무
                            <br /> (기본근무 중 야간근무 시간)
                          </span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-night-work-time"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-night-work-time"
                                opacity={1}
                              >
                                <div>근로자가 법정 근로시간(1일 8시간, 주 40시간) 내에 야간에 근무하는 시간입니다.</div>
                                <div>통상임금에 50%를 가산하여 지급해야 하는 추가 수당입니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={monthlyNightHours} onChange={handleNumberInputChange(setMonthlyNightHours)} />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyNightSalary)} readOnly />
                        </div>
                      </td>
                      <th></th>
                      <td></td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>
                            월간 휴일근무
                            <br /> (기본근무 중 휴일근무 시간)
                          </span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-holiday-work-time-basic"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-holiday-work-time-basic"
                                opacity={1}
                              >
                                <div>근로자가 법정 근로시간(1일 8시간, 주 40시간) 내에 휴일에 근무하는 시간입니다.</div>
                                <div>통상임금에 50%를 가산하여 지급해야 하는 추가 수당입니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={monthlyHolidayHours} onChange={handleNumberInputChange(setMonthlyHolidayHours)} />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyHolidaySalary)} readOnly />
                        </div>
                      </td>
                      <th>월급여 총액</th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyTotalSalary)} readOnly />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>월간 총 근무 시간</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-total-work-time"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-total-work-time"
                                opacity={1}
                              >
                                <div>근로자가 월간 근무하는 총 근로시간을 표시합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={totalMonthlyWorkHours} readOnly />
                        </div>
                      </td>
                      <td>
                        {isOver52Hours && (
                          <div className="filed-warning">
                            <span className="warning-icon"></span>
                            <span className="warning-txt">주 52시간 초과</span>
                          </div>
                        )}
                      </td>
                      <th>연봉 총액</th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(annualTotalSalary)} readOnly />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* 비포괄연봉제 (CNTCFWK_002) 테이블 */}
              {selectedContractType === 'CNTCFWK_002' && (
                <table className="calculation-table">
                  <colgroup>
                    <col width="240px" />
                    <col width="90px" />
                    <col width="180px" />
                    <col width="160px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>
                            주당 근무시간 <span className="red">*</span>
                          </span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-work-time-np"></span>
                              <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor-work-time-np" opacity={1}>
                                <div>한주에 직원이 근무해야 하는 시간을 입력합니다.</div>
                                <div>일반적으로 9 to 6 인 경우 하루 8시간 근무이며, 주단위로는 40시간입니다.</div>
                                <div>주당 15시간 이상 근무일 경우 주휴수당(근무시간/5)을 함께 계산합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={weeklyWorkHours} onChange={handleNumberInputChange(setWeeklyWorkHours)} />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(weeklyWorkSalary)} readOnly />
                        </div>
                      </td>
                      <th>
                        <div className="filed-flx">
                          <span>식대</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-food-allowance-np"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-food-allowance-np"
                                opacity={1}
                              >
                                <div>식대는 비과세항목입니다.</div>
                                <div>식대를 입력하고, 급여에 포함할 경우 과세범위에서 제외됩니다.</div>
                                <div>식대를 입력하고, 급여에 포함하지 않을 경우 급여와는 별도로 지급해야 합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="toggle-wrap">
                            <span className="toggle-txt">급여에 포함</span>
                            <div className="toggle-btn">
                              <input type="checkbox" id="toggle-btn-food-np" checked={foodAllowanceIncluded} onChange={(e) => setFoodAllowanceIncluded(e.target.checked)} />
                              <label className="slider" htmlFor="toggle-btn-food-np"></label>
                            </div>
                          </div>
                          <div className="block">
                            <input type="text" className="input-frame al-r" value={foodAllowance} onChange={(e) => setFoodAllowance(formatNumber(e.target.value.replace(/[^0-9]/g, '')))} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>월간 기본근무</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-basic-work-time-np"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-basic-work-time-np"
                                opacity={1}
                              >
                                <div>한달에 직원이 근무해야 하는 시간을 표시합니다.</div>
                                <div>
                                  일반적으로 주단위로는 40시간을 근무할 경우 월간 174시간이지만, 주휴시간(근무시간/5)을
                                  함께 계산하면 209시간이 됩니다
                                </div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={monthlyBasicHours} readOnly />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyBasicSalary)} readOnly />
                        </div>
                      </td>
                      <th>
                        <div className="filed-flx">
                          <span>자가운전보조금</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-driving-allowance-np"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-driving-allowance-np"
                                opacity={1}
                              >
                                <div>
                                  자가운전보조금은 비과세항목입니다. 차량을 소유한 직원에게만 해당합니다.(차량 소유가
                                  필수는 아님)
                                </div>
                                <div>자가운전보조금을 입력하고, 급여에 포함할 경우 과세범위에서 제외됩니다.</div>
                                <div>
                                  자가운전보조금을 입력하고, 급여에 포함하지 않을 경우 급여와는 별도로 지급해야 합니다
                                </div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="toggle-wrap">
                            <span className="toggle-txt">급여에 포함</span>
                            <div className="toggle-btn">
                              <input type="checkbox" id="toggle-btn-driving-np" checked={drivingAllowanceIncluded} onChange={(e) => setDrivingAllowanceIncluded(e.target.checked)} />
                              <label className="slider" htmlFor="toggle-btn-driving-np"></label>
                            </div>
                          </div>
                          <div className="block">
                            <input type="text" className="input-frame al-r" value={drivingAllowance} onChange={(e) => setDrivingAllowance(formatNumber(e.target.value.replace(/[^0-9]/g, '')))} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>연장근무 시급</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-overtime-wage-np"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-overtime-wage-np"
                                opacity={1}
                              >
                                <div>연장근무 시 지급할 시급입니다.</div>
                                <div>비포괄연봉제의 경우 실제 연장근무 시간에 따라 별도 정산합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td colSpan={2}>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame al-r"
                            value={overtimeHourlyWage}
                            onChange={(e) => setOvertimeHourlyWage(formatNumber(e.target.value.replace(/[^0-9]/g, '')))}
                          />
                        </div>
                      </td>
                      <th>
                        <div className="filed-flx">
                          <span>육아수당</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-child-allowance-np"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-child-allowance-np"
                                opacity={1}
                              >
                                <div>육아수당은 비과세항목입니다.</div>
                                <div>미취학 아동이 있는 직원에게만 해당합니다.</div>
                                <div>육아수당을 입력하고, 급여에 포함할 경우 과세범위에서 제외됩니다.</div>
                                <div>육아수당을 입력하고, 급여에 포함하지 않을 경우 급여와는 별도로 지급해야 합니다</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="toggle-wrap">
                            <span className="toggle-txt">급여에 포함</span>
                            <div className="toggle-btn">
                              <input type="checkbox" id="toggle-btn-child-np" checked={childAllowanceIncluded} onChange={(e) => setChildAllowanceIncluded(e.target.checked)} />
                              <label className="slider" htmlFor="toggle-btn-child-np"></label>
                            </div>
                          </div>
                          <div className="block">
                            <input type="text" className="input-frame al-r" value={childAllowance} onChange={(e) => setChildAllowance(formatNumber(e.target.value.replace(/[^0-9]/g, '')))} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>야간근무 시급</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-night-wage-np"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-night-wage-np"
                                opacity={1}
                              >
                                <div>야간근무 시 지급할 시급입니다.</div>
                                <div>비포괄연봉제의 경우 실제 야간근무 시간에 따라 별도 정산합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td colSpan={2}>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame al-r"
                            value={nightHourlyWage}
                            onChange={(e) => setNightHourlyWage(formatNumber(e.target.value.replace(/[^0-9]/g, '')))}
                          />
                        </div>
                      </td>
                      <th>월급여 총액</th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyTotalSalary)} readOnly />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>휴일근무 시급</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-holiday-wage-np"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-holiday-wage-np"
                                opacity={1}
                              >
                                <div>휴일근무 시 지급할 시급입니다.</div>
                                <div>비포괄연봉제의 경우 실제 휴일근무 시간에 따라 별도 정산합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td colSpan={2}>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame al-r"
                            value={holidayHourlyWage}
                            onChange={(e) => setHolidayHourlyWage(formatNumber(e.target.value.replace(/[^0-9]/g, '')))}
                          />
                        </div>
                      </td>
                      <th>연봉 총액</th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(annualTotalSalary)} readOnly />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* 파트타임 (CNTCFWK_003) 테이블 - 비포괄연봉제와 동일 */}
              {selectedContractType === 'CNTCFWK_003' && (
                <table className="calculation-table">
                  <colgroup>
                    <col width="240px" />
                    <col width="90px" />
                    <col width="180px" />
                    <col width="160px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>
                            주당 근무시간 <span className="red">*</span>
                          </span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-work-time-pt"></span>
                              <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor-work-time-pt" opacity={1}>
                                <div>한주에 직원이 근무해야 하는 시간을 입력합니다.</div>
                                <div>일반적으로 9 to 6 인 경우 하루 8시간 근무이며, 주단위로는 40시간입니다.</div>
                                <div>주당 15시간 이상 근무일 경우 주휴수당(근무시간/5)을 함께 계산합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={weeklyWorkHours} onChange={handleNumberInputChange(setWeeklyWorkHours)} />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(weeklyWorkSalary)} readOnly />
                        </div>
                      </td>
                      <th>
                        <div className="filed-flx">
                          <span>식대</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-food-allowance-pt"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-food-allowance-pt"
                                opacity={1}
                              >
                                <div>식대는 비과세항목입니다.</div>
                                <div>식대를 입력하고, 급여에 포함할 경우 과세범위에서 제외됩니다.</div>
                                <div>식대를 입력하고, 급여에 포함하지 않을 경우 급여와는 별도로 지급해야 합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="toggle-wrap">
                            <span className="toggle-txt">급여에 포함</span>
                            <div className="toggle-btn">
                              <input type="checkbox" id="toggle-btn-food-pt" checked={foodAllowanceIncluded} onChange={(e) => setFoodAllowanceIncluded(e.target.checked)} />
                              <label className="slider" htmlFor="toggle-btn-food-pt"></label>
                            </div>
                          </div>
                          <div className="block">
                            <input type="text" className="input-frame al-r" value={foodAllowance} onChange={(e) => setFoodAllowance(formatNumber(e.target.value.replace(/[^0-9]/g, '')))} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>월간 기본근무</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-basic-work-time-pt"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-basic-work-time-pt"
                                opacity={1}
                              >
                                <div>한달에 직원이 근무해야 하는 시간을 표시합니다.</div>
                                <div>
                                  일반적으로 주단위로는 40시간을 근무할 경우 월간 174시간이지만, 주휴시간(근무시간/5)을
                                  함께 계산하면 209시간이 됩니다
                                </div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={monthlyBasicHours} readOnly />
                        </div>
                      </td>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyBasicSalary)} readOnly />
                        </div>
                      </td>
                      <th>
                        <div className="filed-flx">
                          <span>자가운전보조금</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-driving-allowance-pt"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-driving-allowance-pt"
                                opacity={1}
                              >
                                <div>
                                  자가운전보조금은 비과세항목입니다. 차량을 소유한 직원에게만 해당합니다.(차량 소유가
                                  필수는 아님)
                                </div>
                                <div>자가운전보조금을 입력하고, 급여에 포함할 경우 과세범위에서 제외됩니다.</div>
                                <div>
                                  자가운전보조금을 입력하고, 급여에 포함하지 않을 경우 급여와는 별도로 지급해야 합니다
                                </div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="toggle-wrap">
                            <span className="toggle-txt">급여에 포함</span>
                            <div className="toggle-btn">
                              <input type="checkbox" id="toggle-btn-driving-pt" checked={drivingAllowanceIncluded} onChange={(e) => setDrivingAllowanceIncluded(e.target.checked)} />
                              <label className="slider" htmlFor="toggle-btn-driving-pt"></label>
                            </div>
                          </div>
                          <div className="block">
                            <input type="text" className="input-frame al-r" value={drivingAllowance} onChange={(e) => setDrivingAllowance(formatNumber(e.target.value.replace(/[^0-9]/g, '')))} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>연장근무 시급</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-overtime-wage-pt"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-overtime-wage-pt"
                                opacity={1}
                              >
                                <div>연장근무 시 지급할 시급입니다.</div>
                                <div>파트타임의 경우 실제 연장근무 시간에 따라 별도 정산합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td colSpan={2}>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame al-r"
                            value={overtimeHourlyWage}
                            onChange={(e) => setOvertimeHourlyWage(formatNumber(e.target.value.replace(/[^0-9]/g, '')))}
                          />
                        </div>
                      </td>
                      <th>
                        <div className="filed-flx">
                          <span>육아수당</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-child-allowance-pt"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-child-allowance-pt"
                                opacity={1}
                              >
                                <div>육아수당은 비과세항목입니다.</div>
                                <div>미취학 아동이 있는 직원에게만 해당합니다.</div>
                                <div>육아수당을 입력하고, 급여에 포함할 경우 과세범위에서 제외됩니다.</div>
                                <div>육아수당을 입력하고, 급여에 포함하지 않을 경우 급여와는 별도로 지급해야 합니다</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <div className="toggle-wrap">
                            <span className="toggle-txt">급여에 포함</span>
                            <div className="toggle-btn">
                              <input type="checkbox" id="toggle-btn-child-pt" checked={childAllowanceIncluded} onChange={(e) => setChildAllowanceIncluded(e.target.checked)} />
                              <label className="slider" htmlFor="toggle-btn-child-pt"></label>
                            </div>
                          </div>
                          <div className="block">
                            <input type="text" className="input-frame al-r" value={childAllowance} onChange={(e) => setChildAllowance(formatNumber(e.target.value.replace(/[^0-9]/g, '')))} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>야간근무 시급</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-night-wage-pt"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-night-wage-pt"
                                opacity={1}
                              >
                                <div>야간근무 시 지급할 시급입니다.</div>
                                <div>파트타임의 경우 실제 야간근무 시간에 따라 별도 정산합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td colSpan={2}>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame al-r"
                            value={nightHourlyWage}
                            onChange={(e) => setNightHourlyWage(formatNumber(e.target.value.replace(/[^0-9]/g, '')))}
                          />
                        </div>
                      </td>
                      <th>월급여 총액</th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(monthlyTotalSalary)} readOnly />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <div className="filed-flx">
                          <span>휴일근무 시급</span>
                          <div className="auto-right">
                            <button className="tooltip-btn">
                              <span className="tooltip-icon" id="tooltip-btn-anchor-holiday-wage-pt"></span>
                              <Tooltip
                                className="tooltip-txt"
                                anchorSelect="#tooltip-btn-anchor-holiday-wage-pt"
                                opacity={1}
                              >
                                <div>휴일근무 시 지급할 시급입니다.</div>
                                <div>파트타임의 경우 실제 휴일근무 시간에 따라 별도 정산합니다.</div>
                              </Tooltip>
                            </button>
                          </div>
                        </div>
                      </th>
                      <td colSpan={2}>
                        <div className="block">
                          <input
                            type="text"
                            className="input-frame al-r"
                            value={holidayHourlyWage}
                            onChange={(e) => setHolidayHourlyWage(formatNumber(e.target.value.replace(/[^0-9]/g, '')))}
                          />
                        </div>
                      </td>
                      <th>연봉 총액</th>
                      <td>
                        <div className="block">
                          <input type="text" className="input-frame al-r" value={formatNumber(annualTotalSalary)} readOnly />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
            <div className="pop-btn-content">
              <button className="btn-form gray" onClick={onClose}>취소</button>
              <button className="btn-form basic" onClick={handleApply}>적용</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
