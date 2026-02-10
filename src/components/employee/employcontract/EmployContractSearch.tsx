'use client'
import AnimateHeight from 'react-animate-height'
import { useState, useCallback, useMemo } from 'react'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import Input from '@/components/common/ui/Input'
import RangeDatePicker, { DateRange } from '@/components/ui/common/RangeDatePicker'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useEmployeeInfoSettings } from '@/hooks/queries/use-employee-settings-queries'

interface EmployContractSearchProps {
  onSearch?: (params: Record<string, unknown>) => void
  onReset?: () => void
  totalCount?: number
}

export default function EmployContractSearch({ onSearch, onReset, totalCount = 0 }: EmployContractSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showOfficeError, setShowOfficeError] = useState(false)

  // 검색 폼 상태
  const [formData, setFormData] = useState({
    headOfficeOrganizationId: null as number | null,
    franchiseOrganizationId: null as number | null,
    storeId: null as number | null,
    workStatus: '',
    employeeName: '',
    workDays: [] as string[],
    employeeClassification: '',
    contractClassification: '',
    contractStatus: '',
    electronicContract: '',
    contractDateFrom: null as Date | null,
    contractDateTo: null as Date | null
  })

  // 직원 분류 조회 - TanStack Query 사용
  const { data: settingsData, isPending: isEmployeeClassificationLoading } = useEmployeeInfoSettings(
    {
      headOfficeId: formData.headOfficeOrganizationId ?? undefined,
      franchiseId: formData.franchiseOrganizationId ?? undefined
    },
    !!formData.headOfficeOrganizationId
  )


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleWorkDayToggle = (day: string) => {
    setFormData(prev => {
      const currentDays = prev.workDays
      if (currentDays.includes(day)) {
        return { ...prev, workDays: currentDays.filter(d => d !== day) }
      } else {
        return { ...prev, workDays: [...currentDays, day] }
      }
    })
  }

  const handleSearch = useCallback(() => {
    // 본사 필수 체크
    if (!formData.headOfficeOrganizationId) {
      setShowOfficeError(true)
      return
    }
    setShowOfficeError(false)

    if (onSearch) {
      const apiParams: Record<string, unknown> = {}

      // 필수 파라미터
      apiParams.headOfficeId = formData.headOfficeOrganizationId

      // 선택 파라미터 - 값이 있을 때만 추가
      if (formData.franchiseOrganizationId) {
        apiParams.franchiseId = formData.franchiseOrganizationId
      }
      if (formData.storeId) {
        apiParams.storeId = formData.storeId
      }
      if (formData.workStatus) {
        apiParams.workStatus = formData.workStatus
      }
      if (formData.employeeName?.trim()) {
        apiParams.memberName = formData.employeeName.trim()
      }
      if (formData.workDays.length > 0) {
        const dayMapping: Record<string, string> = {
          'weekday': 'WEEKDAY',
          'saturday': 'SATURDAY',
          'sunday': 'SUNDAY'
        }
        apiParams.workDays = formData.workDays.map(d => dayMapping[d] || d)
      }
      if (formData.employeeClassification) {
        apiParams.memberClassification = formData.employeeClassification
      }
      if (formData.contractClassification) {
        apiParams.contractClassification = formData.contractClassification
      }
      if (formData.contractStatus) {
        const statusMapping: Record<string, string> = {
          'drafting': 'WRITING',
          'in_progress': 'PROGRESS',
          'completed': 'COMPLETE'
        }
        apiParams.contractStatus = statusMapping[formData.contractStatus] || formData.contractStatus
      }
      if (formData.electronicContract === 'electronic') {
        apiParams.electronicContract = ['Y']
      } else if (formData.electronicContract === 'paper') {
        apiParams.electronicContract = ['N']
      }
      if (formData.contractDateFrom) {
        const year = formData.contractDateFrom.getFullYear()
        const month = String(formData.contractDateFrom.getMonth() + 1).padStart(2, '0')
        const day = String(formData.contractDateFrom.getDate()).padStart(2, '0')
        apiParams.contractStartDt = `${year}-${month}-${day}`
      }
      if (formData.contractDateTo) {
        const year = formData.contractDateTo.getFullYear()
        const month = String(formData.contractDateTo.getMonth() + 1).padStart(2, '0')
        const day = String(formData.contractDateTo.getDate()).padStart(2, '0')
        apiParams.contractEndDt = `${year}-${month}-${day}`
      }

      // 검색 시마다 새로운 타임스탬프 추가 (캐시 무효화 보장)
      apiParams._timestamp = Date.now()

      onSearch(apiParams)
    }
  }, [formData, onSearch])

  const handleReset = () => {
    setFormData({
      headOfficeOrganizationId: null,
      franchiseOrganizationId: null,
      storeId: null,
      workStatus: '',
      employeeName: '',
      workDays: [],
      employeeClassification: '',
      contractClassification: '',
      contractStatus: '',
      electronicContract: '',
      contractDateFrom: null,
      contractDateTo: null
    })
    setShowOfficeError(false)
    if (onReset) {
      onReset()
    }
  }

  // 계약일 범위 변경 핸들러
  const handleContractDateChange = (range: DateRange) => {
    setFormData(prev => ({
      ...prev,
      contractDateFrom: range.startDate,
      contractDateTo: range.endDate
    }))
  }

  const handleClose = () => {
    setSearchOpen(false)
  }

  // 직원 분류 선택 가능 여부
  const isEmployeeClassificationEnabled = !!formData.headOfficeOrganizationId

  // 근무여부 옵션
  const workStatusOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '전체' },
    { value: 'EMPWK_001', label: '근무' },
    { value: 'EMPWK_002', label: '휴직' },
    { value: 'EMPWK_003', label: '퇴사' }
  ], [])

  // 직원 분류 옵션
  const employeeClassOptions: SelectOption[] = useMemo(() => {
    const options = settingsData?.codeMemoContent?.EMPLOYEE ?? []
    return [
      { value: '', label: isEmployeeClassificationEnabled ? (isEmployeeClassificationLoading ? '로딩중...' : '전체') : '선택' },
      ...options.map(item => ({
        value: item.code,
        label: item.name
      }))
    ]
  }, [isEmployeeClassificationEnabled, isEmployeeClassificationLoading, settingsData])

  // 계약 분류 옵션
  const contractClassOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '전체' },
    { value: 'CNTCFWK_001', label: '포괄연봉제' },
    { value: 'CNTCFWK_002', label: '비포괄연봉제' },
    { value: 'CNTCFWK_003', label: '파트타임' }
  ], [])

  // 계약 상태 옵션
  const contractStatusOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '선택' },
    { value: 'drafting', label: '작성중' },
    { value: 'in_progress', label: '진행중' },
    { value: 'completed', label: '계약완료' }
  ], [])

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <div className="search-result">
          검색결과 <span>{totalCount.toLocaleString()}건</span>
        </div>
        <ul className="search-result-list">
          <li></li>
        </ul>
        <button className="search-filed-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label={searchOpen ? '검색 필드 접기' : '검색 필드 펼치기'}></button>
      </div>
      <AnimateHeight duration={300} height={searchOpen ? 'auto' : 0}>
        <div className="search-filed">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              {/* 1행: 본사, 가맹점, 점포 */}
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={true}
                  showHeadOfficeError={showOfficeError}
                  fields={['office', 'franchise', 'store']}
                  officeId={formData.headOfficeOrganizationId}
                  franchiseId={formData.franchiseOrganizationId}
                  storeId={formData.storeId}
                  onChange={(next) =>
                    setFormData(prev => ({
                      ...prev,
                      headOfficeOrganizationId: next.head_office,
                      franchiseOrganizationId: next.franchise,
                      storeId: next.store,
                      employeeClassification: ''
                    }))
                  }
                />
              </tr>
              {/* 2행: 근무여부, 직원명, 근무요일 */}
              <tr>
                <th>근무여부</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={workStatusOptions}
                      value={workStatusOptions.find(opt => opt.value === formData.workStatus) || null}
                      onChange={(opt) => handleInputChange('workStatus', opt?.value || '')}
                      placeholder="전체"
                    />
                  </div>
                </td>
                <th>직원명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      placeholder="홍길동"
                      value={formData.employeeName}
                      onChange={(e) => handleInputChange('employeeName', e.target.value)}
                      showClear
                      onClear={() => handleInputChange('employeeName', '')}
                    />
                  </div>
                </td>
                <th>근무요일</th>
                <td>
                  <div className="filed-check-flx">
                    <button
                      type="button"
                      className={`btn-form ${formData.workDays.includes('weekday') ? 'basic' : 'outline'}`}
                      onClick={() => handleWorkDayToggle('weekday')}
                    >
                      평일
                    </button>
                    <button
                      type="button"
                      className={`btn-form ${formData.workDays.includes('saturday') ? 'basic' : 'outline'}`}
                      onClick={() => handleWorkDayToggle('saturday')}
                    >
                      토요일
                    </button>
                    <button
                      type="button"
                      className={`btn-form ${formData.workDays.includes('sunday') ? 'basic' : 'outline'}`}
                      onClick={() => handleWorkDayToggle('sunday')}
                    >
                      일요일
                    </button>
                  </div>
                </td>
              </tr>
              {/* 3행: 직원분류, 계약분류, 계약상태 */}
              <tr>
                <th>직원 분류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={employeeClassOptions}
                      value={employeeClassOptions.find(opt => opt.value === formData.employeeClassification) || null}
                      onChange={(opt) => handleInputChange('employeeClassification', opt?.value || '')}
                      placeholder="선택"
                      isDisabled={!isEmployeeClassificationEnabled}
                    />
                  </div>
                </td>
                <th>계약 분류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={contractClassOptions}
                      value={contractClassOptions.find(opt => opt.value === formData.contractClassification) || null}
                      onChange={(opt) => handleInputChange('contractClassification', opt?.value || '')}
                      placeholder="전체"
                    />
                  </div>
                </td>
                <th>계약 상태</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={contractStatusOptions}
                      value={contractStatusOptions.find(opt => opt.value === formData.contractStatus) || null}
                      onChange={(opt) => handleInputChange('contractStatus', opt?.value || '')}
                      placeholder="선택"
                    />
                  </div>
                </td>
              </tr>
              {/* 4행: 전자계약 여부, 계약일 */}
              <tr>
                <th>전자계약 여부</th>
                <td>
                  <div className="filed-check-flx">
                    <button
                      type="button"
                      className={`btn-form ${formData.electronicContract === '' ? 'basic' : 'outline'}`}
                      onClick={() => handleInputChange('electronicContract', '')}
                    >
                      전체
                    </button>
                    <button
                      type="button"
                      className={`btn-form ${formData.electronicContract === 'electronic' ? 'basic' : 'outline'}`}
                      onClick={() => handleInputChange('electronicContract', 'electronic')}
                    >
                      전자계약
                    </button>
                    <button
                      type="button"
                      className={`btn-form ${formData.electronicContract === 'paper' ? 'basic' : 'outline'}`}
                      onClick={() => handleInputChange('electronicContract', 'paper')}
                    >
                      서류계약
                    </button>
                  </div>
                </td>
                <th>계약일</th>
                <td colSpan={3}>
                  <RangeDatePicker
                    startDate={formData.contractDateFrom}
                    endDate={formData.contractDateTo}
                    onChange={handleContractDateChange}
                    startDatePlaceholder="연도. 월. 일."
                    endDatePlaceholder="연도. 월. 일."
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray" onClick={handleClose}>닫기</button>
            <button className="btn-form gray" onClick={handleReset}>초기화</button>
            <button className="btn-form basic" onClick={handleSearch}>검색</button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
