'use client'
import AnimateHeight from 'react-animate-height'
import { useState, useEffect, useCallback } from 'react'
import DatePicker from '../../ui/common/DatePicker'
import StaffInvitationPop from './StaffInvitationPop'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import type { EmployeeSearchParams } from '@/types/employee'
import { format, parseISO } from 'date-fns'
import { getEmployeeInfoCommonCode, type ClassificationItem } from '@/lib/api/employeeInfoSettings'

interface EmployeeSearchProps {
  onSearch: (params: Omit<EmployeeSearchParams, 'page' | 'size'>) => void
  onReset: () => void
  totalCount: number
}

export default function EmployeeSearch({ onSearch, onReset, totalCount }: EmployeeSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)

  // 직원 분류 옵션
  const [employeeClassificationOptions, setEmployeeClassificationOptions] = useState<ClassificationItem[]>([])
  const [isEmployeeClassificationLoading, setIsEmployeeClassificationLoading] = useState(false)

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

  // 본사/가맹점 변경 시 직원 분류 API 호출
  const fetchEmployeeClassifications = useCallback(async (headOfficeId: number, franchiseId?: number | null) => {
    setIsEmployeeClassificationLoading(true)
    try {
      const response = await getEmployeeInfoCommonCode({
        headOfficeId,
        franchiseId: franchiseId ?? undefined
      })
      if (response?.codeMemoContent?.EMPLOYEE) {
        setEmployeeClassificationOptions(response.codeMemoContent.EMPLOYEE)
      } else {
        setEmployeeClassificationOptions([])
      }
    } catch (error) {
      console.error('직원 분류 조회 실패:', error)
      setEmployeeClassificationOptions([])
    } finally {
      setIsEmployeeClassificationLoading(false)
    }
  }, [])

  // 본사/가맹점 변경 시 직원 분류 로드
  useEffect(() => {
    if (formData.headOfficeOrganizationId) {
      fetchEmployeeClassifications(formData.headOfficeOrganizationId, formData.franchiseOrganizationId)
    } else {
      setEmployeeClassificationOptions([])
      // 본사 선택 해제 시 직원 분류도 초기화
      setFormData(prev => ({ ...prev, employeeClassification: '' }))
    }
  }, [formData.headOfficeOrganizationId, formData.franchiseOrganizationId, fetchEmployeeClassifications])

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
    if (formData.employeeClassification) params.employeeClassification = formData.employeeClassification
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
    setEmployeeClassificationOptions([])
    setShowOfficeError(false)
    onReset()
  }

  const handleClose = () => {
    setSearchOpen(false)
  }

  // 직원 분류 선택 가능 여부
  const isEmployeeClassificationEnabled = !!formData.headOfficeOrganizationId

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
                    <input
                      type="text"
                      className="input-frame"
                      placeholder="직원명 입력"
                      value={formData.employeeName}
                      onChange={(e) => handleInputChange('employeeName', e.target.value)}
                    />
                  </div>
                </td>
                <th>직원 분류</th>
                <td>
                  <div className="data-filed">
                    <select
                      name="employeeClassification"
                      className="select-form"
                      value={formData.employeeClassification}
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
                  <div className="date-picker-wrap">
                    <DatePicker
                      value={formData.hireDateFrom ? parseISO(formData.hireDateFrom) : null}
                      onChange={(date) => handleInputChange('hireDateFrom', date ? format(date, 'yyyy-MM-dd') : '')}
                      placeholder="시작일"
                    />
                    <span>~</span>
                    <DatePicker
                      value={formData.hireDateTo ? parseISO(formData.hireDateTo) : null}
                      onChange={(date) => handleInputChange('hireDateTo', date ? format(date, 'yyyy-MM-dd') : '')}
                      placeholder="종료일"
                    />
                  </div>
                </td>
                <th>건강진단 만료일</th>
                <td colSpan={3}>
                  <div className="date-picker-wrap">
                    <DatePicker
                      value={formData.healthCheckExpiryFrom ? parseISO(formData.healthCheckExpiryFrom) : null}
                      onChange={(date) => handleInputChange('healthCheckExpiryFrom', date ? format(date, 'yyyy-MM-dd') : '')}
                      placeholder="시작일"
                    />
                    <span>~</span>
                    <DatePicker
                      value={formData.healthCheckExpiryTo ? parseISO(formData.healthCheckExpiryTo) : null}
                      onChange={(date) => handleInputChange('healthCheckExpiryTo', date ? format(date, 'yyyy-MM-dd') : '')}
                      placeholder="종료일"
                    />
                  </div>
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
