'use client'
import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import RangeDatePicker, { DateRange } from '../../ui/common/RangeDatePicker'
import { Input } from '@/components/common/ui'
import StaffInvitationPop from './StaffInvitationPop'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import type { EmployeeSearchParams } from '@/types/employee'
import { format } from 'date-fns'
import { useEmployeeInfoSettings } from '@/hooks/queries/use-employee-settings-queries'
import type { ClassificationItem } from '@/lib/api/employeeInfoSettings'

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

  const employeeClassificationOptions: ClassificationItem[] = settingsData?.codeMemoContent?.EMPLOYEE ?? []

  // 직원 분류 선택 가능 여부 - 본사 미선택 시 직원분류 자동 초기화됨 (derived state)
  const isEmployeeClassificationEnabled = !!formData.headOfficeOrganizationId
  // 본사 미선택 시 직원분류 값을 빈 문자열로 처리 (렌더 시점에서 파생)
  const effectiveEmployeeClassification = isEmployeeClassificationEnabled ? formData.employeeClassification : ''

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
      <div className="searh-result-wrap">
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
                    <select
                      name="workStatus"
                      className="select-form"
                      value={formData.workStatus}
                      onChange={(e) => handleInputChange('workStatus', e.target.value)}
                    >
                      <option value="">전체</option>
                      <option value="EMPWK_001">근무</option>
                      <option value="EMPWK_002">휴직</option>
                      <option value="EMPWK_003">퇴사</option>
                    </select>
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
                    <select
                      name="employeeClassification"
                      className="select-form"
                      value={effectiveEmployeeClassification}
                      onChange={(e) => handleInputChange('employeeClassification', e.target.value)}
                      disabled={!isEmployeeClassificationEnabled}
                    >
                      <option value="">
                        {!isEmployeeClassificationEnabled
                          ? '선택'
                          : isEmployeeClassificationLoading
                            ? '로딩중...'
                            : '전체'}
                      </option>
                      {employeeClassificationOptions.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
              {/* 3행: 계약 분류, 관리자 권한, 직원 회원 상태 */}
              <tr>
                <th>계약 분류</th>
                <td>
                  <div className="data-filed">
                    <select
                      name="contractClassification"
                      className="select-form"
                      value={formData.contractClassification}
                      onChange={(e) => handleInputChange('contractClassification', e.target.value)}
                    >
                      <option value="">전체</option>
                      <option value="CNTCFWK_001">포괄연봉제</option>
                      <option value="CNTCFWK_002">비포괄연봉제</option>
                      <option value="CNTCFWK_003">파트타임</option>
                    </select>
                  </div>
                </td>
                <th>관리자 권한</th>
                <td>
                  <div className="data-filed">
                    <select
                      name="adminAuthority"
                      className="select-form"
                      value={formData.adminAuthority}
                      onChange={(e) => handleInputChange('adminAuthority', e.target.value)}
                    >
                      <option value="">전체</option>
                      <option value="admin">관리자</option>
                      <option value="manager">매니저</option>
                      <option value="staff">일반</option>
                    </select>
                  </div>
                </td>
                <th>직원 회원 상태</th>
                <td>
                  <div className="data-filed">
                    <select
                      name="memberStatus"
                      className="select-form"
                      value={formData.memberStatus}
                      onChange={(e) => handleInputChange('memberStatus', e.target.value)}
                    >
                      <option value="">전체</option>
                      <option value="before_request">가입요청전</option>
                      <option value="requested">가입요청</option>
                      <option value="completed">가입완료</option>
                    </select>
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
