'use client'
import { useState } from 'react'
import { Input } from '@/components/common/ui'
import DatePicker from '@/components/ui/common/DatePicker'
import RangeDatePicker, { DateRange } from '@/components/ui/common/RangeDatePicker'
import { useCreateEmployee } from '@/hooks/queries/use-employee-queries'
import type {
  PostEmployeeInfoRequest,
  WorkplaceType,
  ContractClassificationType,
  SalaryCycle,
  SalaryMonth,
  DayType,
  EmploymentContractWorkHourDto,
} from '@/types/employee'

interface StaffInvitationPopProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// 초기 근무시간 데이터 생성
const createInitialWorkHours = (): EmploymentContractWorkHourDto[] => {
  const weekdays: DayType[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

  const weekdayHours = weekdays.map((day) => ({
    dayType: day,
    isWork: true,
    isBreak: true,
    workStartTime: '09:00:00',
    workEndTime: '18:00:00',
    breakStartTime: '12:00:00',
    breakEndTime: '13:00:00',
  }))

  // 토요일 근무 (기본: 근무 안함)
  const saturdayHour: EmploymentContractWorkHourDto = {
    dayType: 'SATURDAY',
    isWork: false,
    isBreak: false,
    everySaturdayWork: false,
    firstSaturdayWorkDay: null,
    workStartTime: '09:00:00',
    workEndTime: '13:00:00',
  }

  // 일요일 근무 (기본: 근무 안함)
  const sundayHour: EmploymentContractWorkHourDto = {
    dayType: 'SUNDAY',
    isWork: false,
    isBreak: false,
    everySundayWork: false,
    firstSundayWorkDay: null,
    workStartTime: '09:00:00',
    workEndTime: '13:00:00',
  }

  return [...weekdayHours, saturdayHour, sundayHour]
}

// 에러 상태 타입
interface FormErrors {
  employeeName?: string
  mobilePhone?: string
  franchiseOrganizationId?: string
  contractStartDate?: string
  contractEndDate?: string
  jobDescription?: string
  saturdayBiweeklyStartDate?: string
  sundayBiweeklyStartDate?: string
}

export default function StaffInvitationPop({ isOpen, onClose, onSuccess }: StaffInvitationPopProps) {
  const [isValidationAttempted, setIsValidationAttempted] = useState(false)

  // TanStack Query mutation
  const createEmployeeMutation = useCreateEmployee()
  const isSubmitting = createEmployeeMutation.isPending

  // Form 상태
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>('FRANCHISE')
  const [headOfficeOrganizationId, setHeadOfficeOrganizationId] = useState<number>(1) // 본사 ID: 1
  const [franchiseOrganizationId, setFranchiseOrganizationId] = useState<number | null>(2) // 가맹점 ID: 2
  const [storeId, setStoreId] = useState<number | null>(1) // 점포 ID: 1
  const [employeeName, setEmployeeName] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [contractClassification, setContractClassification] = useState<ContractClassificationType>('CNTCFWK_001')
  const [nationalPensionEnrolled, setNationalPensionEnrolled] = useState(false)
  const [healthInsuranceEnrolled, setHealthInsuranceEnrolled] = useState(false)
  const [employmentInsuranceEnrolled, setEmploymentInsuranceEnrolled] = useState(false)
  const [workersCompensationEnrolled, setWorkersCompensationEnrolled] = useState(false)
  const [salaryCycle, setSalaryCycle] = useState<SalaryCycle>('SLRCC_001')
  const [salaryMonth, setSalaryMonth] = useState<SalaryMonth>('SLRCF_001')
  const [salaryDay, setSalaryDay] = useState(5)
  const [contractStartDate, setContractStartDate] = useState('')
  const [contractEndDate, setContractEndDate] = useState('')
  const [noEndDate, setNoEndDate] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [workHours, setWorkHours] = useState<EmploymentContractWorkHourDto[]>(createInitialWorkHours())

  // 토요일/일요일 근무 타입: 'none' | 'every' | 'biweekly'
  const [saturdayWorkType, setSaturdayWorkType] = useState<'none' | 'every' | 'biweekly'>('none')
  const [sundayWorkType, setSundayWorkType] = useState<'none' | 'every' | 'biweekly'>('none')
  const [saturdayBiweeklyStartDate, setSaturdayBiweeklyStartDate] = useState('')
  const [sundayBiweeklyStartDate, setSundayBiweeklyStartDate] = useState('')

  // 토요일/일요일 근무 시간 상태
  const [saturdayStartHour, setSaturdayStartHour] = useState('09')
  const [saturdayStartMinute, setSaturdayStartMinute] = useState('00')
  const [saturdayEndHour, setSaturdayEndHour] = useState('13')
  const [saturdayEndMinute, setSaturdayEndMinute] = useState('00')
  const [sundayStartHour, setSundayStartHour] = useState('09')
  const [sundayStartMinute, setSundayStartMinute] = useState('00')
  const [sundayEndHour, setSundayEndHour] = useState('13')
  const [sundayEndMinute, setSundayEndMinute] = useState('00')

  // 평일 근무 시간 상태
  const [weekdayStartHour, setWeekdayStartHour] = useState('09')
  const [weekdayStartMinute, setWeekdayStartMinute] = useState('00')
  const [weekdayEndHour, setWeekdayEndHour] = useState('18')
  const [weekdayEndMinute, setWeekdayEndMinute] = useState('00')
  const [weekdayBreakStartHour, setWeekdayBreakStartHour] = useState('12')
  const [weekdayBreakStartMinute, setWeekdayBreakStartMinute] = useState('00')
  const [weekdayBreakEndHour, setWeekdayBreakEndHour] = useState('13')
  const [weekdayBreakEndMinute, setWeekdayBreakEndMinute] = useState('00')

  // 근무 시간 업데이트 함수
  const updateWorkHour = (dayType: DayType, field: keyof EmploymentContractWorkHourDto, value: unknown) => {
    setWorkHours((prev) => prev.map((wh) => (wh.dayType === dayType ? { ...wh, [field]: value } : wh)))
  }

  // 시간 문자열 생성 (시, 분 → HH:mm:ss)
  const formatTime = (hour: string, minute: string): string => {
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`
  }

  // 에러 계산 (React 19: 렌더링 시점에서 계산)
  const getFormErrors = (): FormErrors => {
    if (!isValidationAttempted) return {}
    const errors: FormErrors = {}

    if (!employeeName.trim()) {
      errors.employeeName = '직원명을 입력해주세요.'
    }
    if (!mobilePhone.trim()) {
      errors.mobilePhone = '휴대폰 번호를 입력해주세요.'
    } else if (mobilePhone.trim().length < 10) {
      errors.mobilePhone = '휴대폰 번호를 정확히 입력해주세요.'
    }
    if (workplaceType === 'FRANCHISE' && !franchiseOrganizationId) {
      errors.franchiseOrganizationId = '가맹점을 선택해주세요.'
    }
    if (!contractStartDate) {
      errors.contractStartDate = '계약 시작일을 선택해주세요.'
    }
    if (!noEndDate && !contractEndDate) {
      errors.contractEndDate = '계약 종료일을 선택해주세요.'
    }
    if (!jobDescription.trim()) {
      errors.jobDescription = '업무 내용을 입력해주세요.'
    }
    if (saturdayWorkType === 'biweekly' && !saturdayBiweeklyStartDate) {
      errors.saturdayBiweeklyStartDate = '토요일 격주 시작일을 선택해주세요.'
    }
    if (sundayWorkType === 'biweekly' && !sundayBiweeklyStartDate) {
      errors.sundayBiweeklyStartDate = '일요일 격주 시작일을 선택해주세요.'
    }

    return errors
  }

  const formErrors = getFormErrors()

  const handleSubmit = async () => {
    setIsValidationAttempted(true)

    // 에러가 있으면 저장하지 않음
    const errors = getFormErrors()
    if (Object.keys(errors).length > 0) {
      return
    }

    try {

      // 평일/토요일/일요일 근무 정보 반영
      const weekdays: DayType[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
      const weekdayWorkStartTime = formatTime(weekdayStartHour, weekdayStartMinute)
      const weekdayWorkEndTime = formatTime(weekdayEndHour, weekdayEndMinute)
      const weekdayBreakStart = formatTime(weekdayBreakStartHour, weekdayBreakStartMinute)
      const weekdayBreakEnd = formatTime(weekdayBreakEndHour, weekdayBreakEndMinute)

      const updatedWorkHours = workHours.map((wh) => {
        // 평일 근무 시간 반영
        if (weekdays.includes(wh.dayType as DayType)) {
          return {
            ...wh,
            workStartTime: weekdayWorkStartTime,
            workEndTime: weekdayWorkEndTime,
            breakStartTime: weekdayBreakStart,
            breakEndTime: weekdayBreakEnd,
          }
        }
        if (wh.dayType === 'SATURDAY') {
          const satStartTime = formatTime(saturdayStartHour, saturdayStartMinute)
          const satEndTime = formatTime(saturdayEndHour, saturdayEndMinute)
          return {
            ...wh,
            isWork: saturdayWorkType !== 'none',
            everySaturdayWork: saturdayWorkType === 'every',
            firstSaturdayWorkDay: saturdayWorkType === 'biweekly' ? saturdayBiweeklyStartDate : null,
            workStartTime: saturdayWorkType !== 'none' ? satStartTime : null,
            workEndTime: saturdayWorkType !== 'none' ? satEndTime : null,
          }
        }
        if (wh.dayType === 'SUNDAY') {
          const sunStartTime = formatTime(sundayStartHour, sundayStartMinute)
          const sunEndTime = formatTime(sundayEndHour, sundayEndMinute)
          return {
            ...wh,
            isWork: sundayWorkType !== 'none',
            everySundayWork: sundayWorkType === 'every',
            firstSundayWorkDay: sundayWorkType === 'biweekly' ? sundayBiweeklyStartDate : null,
            workStartTime: sundayWorkType !== 'none' ? sunStartTime : null,
            workEndTime: sundayWorkType !== 'none' ? sunEndTime : null,
          }
        }
        return wh
      })

      const requestData: PostEmployeeInfoRequest = {
        workplaceType,
        headOfficeOrganizationId,
        franchiseOrganizationId: workplaceType === 'FRANCHISE' ? franchiseOrganizationId : null,
        storeId: workplaceType === 'FRANCHISE' ? storeId : null,
        employeeName: employeeName.trim(),
        mobilePhone: mobilePhone.trim() || null,
        hireDate: contractStartDate, // 입사일을 계약 시작일로 설정
        contractClassification,
        nationalPensionEnrolled,
        healthInsuranceEnrolled,
        employmentInsuranceEnrolled,
        workersCompensationEnrolled,
        salaryCycle,
        salaryMonth,
        salaryDay,
        contractStartDate,
        contractEndDate: noEndDate ? '2999-12-31' : contractEndDate,
        jobDescription: jobDescription.trim() || null,
        workHours: updatedWorkHours,
      }

      await createEmployeeMutation.mutateAsync(requestData)

      // 성공 시 폼 초기화 및 콜백
      resetForm()
      onSuccess?.()
      onClose()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'API 요청 중 오류가 발생했습니다.')
    }
  }

  const resetForm = () => {
    setWorkplaceType('FRANCHISE')
    setHeadOfficeOrganizationId(1) // 본사 ID: 1
    setFranchiseOrganizationId(2) // 가맹점 ID: 2
    setStoreId(1) // 점포 ID: 1
    setEmployeeName('')
    setMobilePhone('')
    setContractClassification('CNTCFWK_001')
    setNationalPensionEnrolled(false)
    setHealthInsuranceEnrolled(false)
    setEmploymentInsuranceEnrolled(false)
    setWorkersCompensationEnrolled(false)
    setSalaryCycle('SLRCC_001')
    setSalaryMonth('SLRCF_001')
    setSalaryDay(5)
    setContractStartDate('')
    setContractEndDate('')
    setNoEndDate(false)
    setJobDescription('')
    setWorkHours(createInitialWorkHours())
    setSaturdayWorkType('none')
    setSundayWorkType('none')
    setSaturdayBiweeklyStartDate('')
    setSundayBiweeklyStartDate('')
    setSaturdayStartHour('09')
    setSaturdayStartMinute('00')
    setSaturdayEndHour('13')
    setSaturdayEndMinute('00')
    setSundayStartHour('09')
    setSundayStartMinute('00')
    setSundayEndHour('13')
    setSundayEndMinute('00')
    setWeekdayStartHour('09')
    setWeekdayStartMinute('00')
    setWeekdayEndHour('18')
    setWeekdayEndMinute('00')
    setWeekdayBreakStartHour('12')
    setWeekdayBreakStartMinute('00')
    setWeekdayBreakEndHour('13')
    setWeekdayBreakEndMinute('00')
    setIsValidationAttempted(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-popup">
      <div className="modal-dialog large">
        <div className="modal-content">
          <div className="modal-header">
            <h2>직원 초대하기</h2>
            <button className="modal-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <div className="pop-frame">
              <table className="pop-table">
                <colgroup>
                  <col width="170px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>
                      직원 소속 <span className="red">*</span>
                    </th>
                    <td>
                      <div className="filed-check-flx">
                        <div className="radio-form-box">
                          <input
                            type="radio"
                            name="workplaceType"
                            id="workplaceType-headoffice"
                            checked={workplaceType === 'HEAD_OFFICE'}
                            onChange={() => setWorkplaceType('HEAD_OFFICE')}
                          />
                          <label htmlFor="workplaceType-headoffice">본사</label>
                        </div>
                        <div className="radio-form-box">
                          <input
                            type="radio"
                            name="workplaceType"
                            id="workplaceType-franchise"
                            checked={workplaceType === 'FRANCHISE'}
                            onChange={() => setWorkplaceType('FRANCHISE')}
                          />
                          <label htmlFor="workplaceType-franchise">가맹점</label>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      본사/가맹점 선택 <span className="red">*</span>
                    </th>
                    <td>
                      <div className="filed-flx">
                        <div className="block">
                          <select
                            className="select-form"
                            value={headOfficeOrganizationId}
                            onChange={(e) => setHeadOfficeOrganizationId(Number(e.target.value))}
                          >
                            <option value={1}>본사</option>
                          </select>
                        </div>
                        {workplaceType === 'FRANCHISE' && (
                          <div className="block">
                            <select
                              className="select-form"
                              value={franchiseOrganizationId || ''}
                              onChange={(e) => setFranchiseOrganizationId(e.target.value ? Number(e.target.value) : null)}
                            >
                              <option value="">가맹점 선택</option>
                              <option value={2}>가맹점 (ID: 2)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {workplaceType === 'FRANCHISE' && (
                    <tr>
                      <th>점포 선택</th>
                      <td>
                        <div className="block">
                          <select
                            className="select-form"
                            value={storeId || ''}
                            onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : null)}
                          >
                            <option value="">선택</option>
                            <option value={1}>점포 (ID: 1)</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th>
                      직원명 <span className="red">*</span>
                    </th>
                    <td>
                      <Input
                        placeholder="직원명 입력"
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        maxLength={100}
                        error={!!formErrors.employeeName}
                        helpText={formErrors.employeeName}
                        showClear
                        onClear={() => setEmployeeName('')}
                        fullWidth
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      휴대폰 번호 <span className="red">*</span>
                    </th>
                    <td>
                      <Input
                        placeholder="'-' 없이 입력"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={11}
                        error={!!formErrors.mobilePhone}
                        helpText={formErrors.mobilePhone}
                        showClear
                        onClear={() => setMobilePhone('')}
                        fullWidth
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>4대 보험 가입 유무</th>
                    <td>
                      <div className="filed-flx">
                        <button
                          type="button"
                          className={`btn-form outline s ${nationalPensionEnrolled && healthInsuranceEnrolled ? 'act' : ''}`}
                          onClick={() => {
                            const newValue = !(nationalPensionEnrolled && healthInsuranceEnrolled)
                            setNationalPensionEnrolled(newValue)
                            setHealthInsuranceEnrolled(newValue)
                          }}
                        >
                          건강보험, 국민연금
                        </button>
                        <button
                          type="button"
                          className={`btn-form outline s ${employmentInsuranceEnrolled && workersCompensationEnrolled ? 'act' : ''}`}
                          onClick={() => {
                            const newValue = !(employmentInsuranceEnrolled && workersCompensationEnrolled)
                            setEmploymentInsuranceEnrolled(newValue)
                            setWorkersCompensationEnrolled(newValue)
                          }}
                        >
                          고용보험, 산재보험
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      급여계산 주기/급여일 <span className="red">*</span>
                    </th>
                    <td>
                      <div className="filed-flx">
                        <div className="block">
                          <select
                            className="select-form"
                            value={salaryCycle}
                            onChange={(e) => setSalaryCycle(e.target.value as SalaryCycle)}
                          >
                            <option value="SLRCC_001">월급</option>
                            <option value="SLRCC_002">주급</option>
                          </select>
                        </div>
                        <div className="block">
                          <select
                            className="select-form"
                            value={salaryMonth}
                            onChange={(e) => setSalaryMonth(e.target.value as SalaryMonth)}
                          >
                            <option value="SLRCF_001">당월</option>
                            <option value="SLRCF_002">익월</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            className="input-frame xs"
                            value={salaryDay}
                            onChange={(e) => setSalaryDay(Math.min(31, Math.max(1, Number(e.target.value))))}
                            min={1}
                            max={31}
                          />
                          <span style={{ marginLeft: '4px' }}>일</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      계약 기간 <span className="red">*</span>
                    </th>
                    <td>
                      <div className="filed-flx">
                        <RangeDatePicker
                          startDate={contractStartDate ? new Date(contractStartDate) : null}
                          endDate={contractEndDate ? new Date(contractEndDate) : null}
                          onChange={(range: DateRange) => {
                            if (range.startDate) {
                              const y = range.startDate.getFullYear()
                              const m = String(range.startDate.getMonth() + 1).padStart(2, '0')
                              const d = String(range.startDate.getDate()).padStart(2, '0')
                              setContractStartDate(`${y}-${m}-${d}`)
                            } else {
                              setContractStartDate('')
                            }
                            if (range.endDate && !noEndDate) {
                              const y = range.endDate.getFullYear()
                              const m = String(range.endDate.getMonth() + 1).padStart(2, '0')
                              const d = String(range.endDate.getDate()).padStart(2, '0')
                              setContractEndDate(`${y}-${m}-${d}`)
                            } else if (!range.endDate) {
                              setContractEndDate('')
                            }
                          }}
                          startDatePlaceholder="시작일"
                          endDatePlaceholder="종료일"
                          disabled={false}
                        />
                        <div className="toggle-wrap">
                          <span className="toggle-txt">종료일 없음</span>
                          <div className="toggle-btn">
                            <input
                              type="checkbox"
                              id="toggle-end-date"
                              checked={noEndDate}
                              onChange={(e) => setNoEndDate(e.target.checked)}
                            />
                            <label className="slider" htmlFor="toggle-end-date"></label>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      업무 내용 <span className="red">*</span>
                    </th>
                    <td>
                      <Input
                        placeholder="담당 업무 내용 입력"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        error={!!formErrors.jobDescription}
                        helpText={formErrors.jobDescription}
                        showClear
                        onClear={() => setJobDescription('')}
                        fullWidth
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>평일근무</th>
                    <td>
                      <div className="work-time-wrap">
                        <div className="work-time-item">
                          <div className="work-time-th">
                            <div className="explain">근무시간</div>
                          </div>
                          <div className="work-time-td">
                            <div className="filed-flx g8">
                              <div>
                                <input type="text" className="input-frame xs" value={weekdayStartHour} onChange={(e) => setWeekdayStartHour(e.target.value)} />
                              </div>
                              <span className="explain">시</span>
                              <div>
                                <input type="text" className="input-frame xs" value={weekdayStartMinute} onChange={(e) => setWeekdayStartMinute(e.target.value)} />
                              </div>
                              <span className="explain">분</span>
                              <span className="explain">~</span>
                              <div>
                                <input type="text" className="input-frame xs" value={weekdayEndHour} onChange={(e) => setWeekdayEndHour(e.target.value)} />
                              </div>
                              <span className="explain">시</span>
                              <div>
                                <input type="text" className="input-frame xs" value={weekdayEndMinute} onChange={(e) => setWeekdayEndMinute(e.target.value)} />
                              </div>
                              <span className="explain">분</span>
                            </div>
                          </div>
                        </div>
                        <div className="work-time-item">
                          <div className="work-time-th">
                            <div className="explain">휴게시간</div>
                          </div>
                          <div className="work-time-td">
                            <div className="filed-flx g8">
                              <div>
                                <input type="text" className="input-frame xs" value={weekdayBreakStartHour} onChange={(e) => setWeekdayBreakStartHour(e.target.value)} />
                              </div>
                              <span className="explain">시</span>
                              <div>
                                <input type="text" className="input-frame xs" value={weekdayBreakStartMinute} onChange={(e) => setWeekdayBreakStartMinute(e.target.value)} />
                              </div>
                              <span className="explain">분</span>
                              <span className="explain">~</span>
                              <div>
                                <input type="text" className="input-frame xs" value={weekdayBreakEndHour} onChange={(e) => setWeekdayBreakEndHour(e.target.value)} />
                              </div>
                              <span className="explain">시</span>
                              <div>
                                <input type="text" className="input-frame xs" value={weekdayBreakEndMinute} onChange={(e) => setWeekdayBreakEndMinute(e.target.value)} />
                              </div>
                              <span className="explain">분</span>
                            </div>
                          </div>
                        </div>
                        <div className="work-time-item">
                          <div className="work-time-th">
                            <div className="explain">근무요일</div>
                          </div>
                          <div className="work-time-td">
                            <div className="filed-flx g8">
                              {(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as DayType[]).map((day, index) => {
                                const dayNames = ['월', '화', '수', '목', '금']
                                const workHour = workHours.find((wh) => wh.dayType === day)
                                const isActive = workHour?.isWork ?? true
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    className={`day-btn ${isActive ? 'act' : ''}`}
                                    onClick={() => updateWorkHour(day, 'isWork', !isActive)}
                                  >
                                    {dayNames[index]}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>토요일 근무</th>
                    <td>
                      <div className="work-time-wrap">
                        <div className="work-time-item">
                          <div className="work-time-th">
                            <div className="explain">근무 여부</div>
                          </div>
                          <div className="work-time-td">
                            <div className="biweek-wrap">
                              <div className="filed-check-flx mb10">
                                <div className="radio-form-box">
                                  <input
                                    type="radio"
                                    name="satType"
                                    id="satType-none"
                                    checked={saturdayWorkType === 'none'}
                                    onChange={() => setSaturdayWorkType('none')}
                                  />
                                  <label htmlFor="satType-none">근무 안함</label>
                                </div>
                                <div className="radio-form-box">
                                  <input
                                    type="radio"
                                    name="satType"
                                    id="satType-every"
                                    checked={saturdayWorkType === 'every'}
                                    onChange={() => setSaturdayWorkType('every')}
                                  />
                                  <label htmlFor="satType-every">매주 토요일</label>
                                </div>
                                <div className="radio-form-box">
                                  <input
                                    type="radio"
                                    name="satType"
                                    id="satType-bi"
                                    checked={saturdayWorkType === 'biweekly'}
                                    onChange={() => setSaturdayWorkType('biweekly')}
                                  />
                                  <label htmlFor="satType-bi">토요일 격주</label>
                                </div>
                              </div>
                              {saturdayWorkType === 'biweekly' && (
                                <div className="filed-flx g8" style={{ marginTop: '8px' }}>
                                  <span className="explain">격주 시작일:</span>
                                  <DatePicker
                                    value={saturdayBiweeklyStartDate ? new Date(saturdayBiweeklyStartDate) : null}
                                    onChange={(date) => {
                                      if (date) {
                                        const y = date.getFullYear()
                                        const m = String(date.getMonth() + 1).padStart(2, '0')
                                        const d = String(date.getDate()).padStart(2, '0')
                                        setSaturdayBiweeklyStartDate(`${y}-${m}-${d}`)
                                      } else {
                                        setSaturdayBiweeklyStartDate('')
                                      }
                                    }}
                                    placeholder="시작일 선택"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {saturdayWorkType !== 'none' && (
                          <div className="work-time-item">
                            <div className="work-time-th">
                              <div className="explain">근무시간</div>
                            </div>
                            <div className="work-time-td">
                              <div className="filed-flx g8">
                                <div>
                                  <input
                                    type="text"
                                    className="input-frame xs"
                                    value={saturdayStartHour}
                                    onChange={(e) => setSaturdayStartHour(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                    maxLength={2}
                                  />
                                </div>
                                <span className="explain">시</span>
                                <div>
                                  <input
                                    type="text"
                                    className="input-frame xs"
                                    value={saturdayStartMinute}
                                    onChange={(e) => setSaturdayStartMinute(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                    maxLength={2}
                                  />
                                </div>
                                <span className="explain">분</span>
                                <span className="explain">~</span>
                                <div>
                                  <input
                                    type="text"
                                    className="input-frame xs"
                                    value={saturdayEndHour}
                                    onChange={(e) => setSaturdayEndHour(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                    maxLength={2}
                                  />
                                </div>
                                <span className="explain">시</span>
                                <div>
                                  <input
                                    type="text"
                                    className="input-frame xs"
                                    value={saturdayEndMinute}
                                    onChange={(e) => setSaturdayEndMinute(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                    maxLength={2}
                                  />
                                </div>
                                <span className="explain">분</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>일요일 근무</th>
                    <td>
                      <div className="work-time-wrap">
                        <div className="work-time-item">
                          <div className="work-time-th">
                            <div className="explain">근무 여부</div>
                          </div>
                          <div className="work-time-td">
                            <div className="biweek-wrap">
                              <div className="filed-check-flx mb10">
                                <div className="radio-form-box">
                                  <input
                                    type="radio"
                                    name="sunType"
                                    id="sunType-none"
                                    checked={sundayWorkType === 'none'}
                                    onChange={() => setSundayWorkType('none')}
                                  />
                                  <label htmlFor="sunType-none">근무 안함</label>
                                </div>
                                <div className="radio-form-box">
                                  <input
                                    type="radio"
                                    name="sunType"
                                    id="sunType-every"
                                    checked={sundayWorkType === 'every'}
                                    onChange={() => setSundayWorkType('every')}
                                  />
                                  <label htmlFor="sunType-every">매주 일요일</label>
                                </div>
                                <div className="radio-form-box">
                                  <input
                                    type="radio"
                                    name="sunType"
                                    id="sunType-bi"
                                    checked={sundayWorkType === 'biweekly'}
                                    onChange={() => setSundayWorkType('biweekly')}
                                  />
                                  <label htmlFor="sunType-bi">일요일 격주</label>
                                </div>
                              </div>
                              {sundayWorkType === 'biweekly' && (
                                <div className="filed-flx g8" style={{ marginTop: '8px' }}>
                                  <span className="explain">격주 시작일:</span>
                                  <DatePicker
                                    value={sundayBiweeklyStartDate ? new Date(sundayBiweeklyStartDate) : null}
                                    onChange={(date) => {
                                      if (date) {
                                        const y = date.getFullYear()
                                        const m = String(date.getMonth() + 1).padStart(2, '0')
                                        const d = String(date.getDate()).padStart(2, '0')
                                        setSundayBiweeklyStartDate(`${y}-${m}-${d}`)
                                      } else {
                                        setSundayBiweeklyStartDate('')
                                      }
                                    }}
                                    placeholder="시작일 선택"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {sundayWorkType !== 'none' && (
                          <div className="work-time-item">
                            <div className="work-time-th">
                              <div className="explain">근무시간</div>
                            </div>
                            <div className="work-time-td">
                              <div className="filed-flx g8">
                                <div>
                                  <input
                                    type="text"
                                    className="input-frame xs"
                                    value={sundayStartHour}
                                    onChange={(e) => setSundayStartHour(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                    maxLength={2}
                                  />
                                </div>
                                <span className="explain">시</span>
                                <div>
                                  <input
                                    type="text"
                                    className="input-frame xs"
                                    value={sundayStartMinute}
                                    onChange={(e) => setSundayStartMinute(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                    maxLength={2}
                                  />
                                </div>
                                <span className="explain">분</span>
                                <span className="explain">~</span>
                                <div>
                                  <input
                                    type="text"
                                    className="input-frame xs"
                                    value={sundayEndHour}
                                    onChange={(e) => setSundayEndHour(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                    maxLength={2}
                                  />
                                </div>
                                <span className="explain">시</span>
                                <div>
                                  <input
                                    type="text"
                                    className="input-frame xs"
                                    value={sundayEndMinute}
                                    onChange={(e) => setSundayEndMinute(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                    maxLength={2}
                                  />
                                </div>
                                <span className="explain">분</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pop-btn-content">
              <button type="button" className="btn-form gray" onClick={handleClose} disabled={isSubmitting}>
                취소
              </button>
              <button type="button" className="btn-form basic" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '처리중...' : '초대하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
