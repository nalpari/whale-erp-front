'use client'
import AnimateHeight from 'react-animate-height'
import { useState, useMemo } from 'react'
import RangeDatePicker, { DateRange } from '../../ui/common/RangeDatePicker'
import { Input } from '@/components/common/ui'
import StaffInvitationPop from './StaffInvitationPop'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import type { EmployeeSearchParams } from '@/types/employee'
import { format } from 'date-fns'
import { useEmployeeInfoSettings } from '@/hooks/queries/use-employee-settings-queries'
import type { ClassificationItem } from '@/lib/api/employeeInfoSettings'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'

interface EmployeeSearchProps {
  onSearch: (params: Omit<EmployeeSearchParams, 'page' | 'size'>) => void
  onReset: () => void
  totalCount: number
}

export default function EmployeeSearch({ onSearch, onReset, totalCount }: EmployeeSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)

  // 검색 폼 상태
  // TODO: 테스트용 기본값 - 나중에 제거
  const [formData, setFormData] = useState({
    headOfficeOrganizationId: 1 as number | null,
    franchiseOrganizationId: 2 as number | null,
    storeId: 1 as number | null,
    workStatus: '',
    employeeName: '',
    employeeClassification: '',
    contractClassification: '',
    adminAuthority: '',
    memberStatus: '',
    hireDateFrom: '',
    hireDateTo: '',
    healthCheckExpiryFrom: '',
    healthCheckExpiryTo: ''
  })

  // TanStack Query로 직원 분류 조회
  const { data: settingsData, isPending: isEmployeeClassificationLoading } = useEmployeeInfoSettings(
    formData.headOfficeOrganizationId
      ? {
          headOfficeId: formData.headOfficeOrganizationId,
          franchiseId: formData.franchiseOrganizationId ?? undefined
        }
      : undefined,
    !!formData.headOfficeOrganizationId
  )

  // 직원 분류 선택 가능 여부 - 본사 미선택 시 직원분류 자동 초기화됨 (derived state)
  const isEmployeeClassificationEnabled = !!formData.headOfficeOrganizationId
  // 본사 미선택 시 직원분류 값을 빈 문자열로 처리 (렌더 시점에서 파생)
  const effectiveEmployeeClassification = isEmployeeClassificationEnabled ? formData.employeeClassification : ''

  // SearchSelect options
  const workStatusOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '전체' },
    { value: 'EMPWK_001', label: '근무' },
    { value: 'EMPWK_002', label: '휴직' },
    { value: 'EMPWK_003', label: '퇴사' }
  ], [])

  const employeeClassOptions: SelectOption[] = useMemo(() => {
    const employeeClassificationOptions: ClassificationItem[] = settingsData?.codeMemoContent?.EMPLOYEE ?? []
    return [
      { value: '', label: isEmployeeClassificationEnabled ? (isEmployeeClassificationLoading ? '로딩중...' : '전체') : '선택' },
      ...employeeClassificationOptions.map(item => ({
        value: item.code,
        label: item.name
      }))
    ]
  }, [isEmployeeClassificationEnabled, isEmployeeClassificationLoading, settingsData?.codeMemoContent?.EMPLOYEE])

  const contractClassOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '전체' },
    { value: 'CNTCFWK_001', label: '포괄연봉제' },
    { value: 'CNTCFWK_002', label: '비포괄연봉제' },
    { value: 'CNTCFWK_003', label: '파트타임' }
  ], [])

  const adminAuthorityOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '전체' },
    { value: 'admin', label: '관리자' },
    { value: 'manager', label: '매니저' },
    { value: 'staff', label: '일반' }
  ], [])

  const memberStatusOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '전체' },
    { value: 'before_request', label: '가입요청전' },
    { value: 'requested', label: '가입요청' },
    { value: 'completed', label: '가입완료' }
  ], [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    // 본사 필수 체크
    if (!formData.headOfficeOrganizationId) {
      setShowOfficeError(true)
      return
    }
    setShowOfficeError(false)

    const params: Omit<EmployeeSearchParams, 'page' | 'size'> = {}

    if (formData.headOfficeOrganizationId) params.headOfficeOrganizationId = formData.headOfficeOrganizationId
    if (formData.franchiseOrganizationId) params.franchiseOrganizationId = formData.franchiseOrganizationId
    if (formData.storeId) params.storeId = formData.storeId
    if (formData.workStatus) params.workStatus = formData.workStatus as 'EMPWK_001' | 'EMPWK_002' | 'EMPWK_003'
    if (formData.employeeName) params.employeeName = formData.employeeName
    if (effectiveEmployeeClassification) params.employeeClassification = effectiveEmployeeClassification
    if (formData.contractClassification) params.contractClassification = formData.contractClassification
    if (formData.adminAuthority) params.adminAuthority = formData.adminAuthority
    if (formData.memberStatus) params.memberStatus = formData.memberStatus
    if (formData.hireDateFrom) params.hireDateFrom = formData.hireDateFrom
    if (formData.hireDateTo) params.hireDateTo = formData.hireDateTo
    if (formData.healthCheckExpiryFrom) params.healthCheckExpiryFrom = formData.healthCheckExpiryFrom
    if (formData.healthCheckExpiryTo) params.healthCheckExpiryTo = formData.healthCheckExpiryTo

    onSearch(params)
  }

  const handleReset = () => {
    setFormData({
      headOfficeOrganizationId: null,
      franchiseOrganizationId: null,
      storeId: null,
      workStatus: '',
      employeeName: '',
      employeeClassification: '',
      contractClassification: '',
      adminAuthority: '',
      memberStatus: '',
      hireDateFrom: '',
      hireDateTo: '',
      healthCheckExpiryFrom: '',
      healthCheckExpiryTo: ''
    })
    setShowOfficeError(false)
    onReset()
  }

  const handleClose = () => {
    setSearchOpen(false)
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <div className="search-result">
          검색결과 <span>{totalCount.toLocaleString()}건</span>
        </div>
        <ul className="search-result-list">
          <li></li>
        </ul>
        <button className="search-filed-btn" onClick={() => setSearchOpen(!searchOpen)}></button>
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
                      storeId: next.store
                    }))
                  }
                />
              </tr>
              {/* 2행: 근무여부, 직원명, 직원 분류 */}
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
                      placeholder="직원명 입력"
                      value={formData.employeeName}
                      onChange={(e) => handleInputChange('employeeName', e.target.value)}
                      showClear
                      onClear={() => handleInputChange('employeeName', '')}
                    />
                  </div>
                </td>
                <th>직원 분류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={employeeClassOptions}
                      value={employeeClassOptions.find(opt => opt.value === effectiveEmployeeClassification) || null}
                      onChange={(opt) => handleInputChange('employeeClassification', opt?.value || '')}
                      placeholder="선택"
                      isDisabled={!isEmployeeClassificationEnabled}
                    />
                  </div>
                </td>
              </tr>
              {/* 3행: 계약 분류, 관리자 권한, 직원 회원 상태 */}
              <tr>
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
                <th>관리자 권한</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={adminAuthorityOptions}
                      value={adminAuthorityOptions.find(opt => opt.value === formData.adminAuthority) || null}
                      onChange={(opt) => handleInputChange('adminAuthority', opt?.value || '')}
                      placeholder="전체"
                    />
                  </div>
                </td>
                <th>직원 회원 상태</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={memberStatusOptions}
                      value={memberStatusOptions.find(opt => opt.value === formData.memberStatus) || null}
                      onChange={(opt) => handleInputChange('memberStatus', opt?.value || '')}
                      placeholder="전체"
                    />
                  </div>
                </td>
              </tr>
              {/* 4행: 입사일, 건강진단 만료일 */}
              <tr>
                <th>입사일</th>
                <td>
                  <RangeDatePicker
                    startDate={formData.hireDateFrom ? new Date(formData.hireDateFrom) : null}
                    endDate={formData.hireDateTo ? new Date(formData.hireDateTo) : null}
                    onChange={(range: DateRange) => {
                      handleInputChange('hireDateFrom', range.startDate ? format(range.startDate, 'yyyy-MM-dd') : '')
                      handleInputChange('hireDateTo', range.endDate ? format(range.endDate, 'yyyy-MM-dd') : '')
                    }}
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
                  />
                </td>
                <th>건강진단 만료일</th>
                <td colSpan={3}>
                  <RangeDatePicker
                    startDate={formData.healthCheckExpiryFrom ? new Date(formData.healthCheckExpiryFrom) : null}
                    endDate={formData.healthCheckExpiryTo ? new Date(formData.healthCheckExpiryTo) : null}
                    onChange={(range: DateRange) => {
                      handleInputChange('healthCheckExpiryFrom', range.startDate ? format(range.startDate, 'yyyy-MM-dd') : '')
                      handleInputChange('healthCheckExpiryTo', range.endDate ? format(range.endDate, 'yyyy-MM-dd') : '')
                    }}
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
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
      <StaffInvitationPop isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </div>
  )
}
