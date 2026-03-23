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
import { useBpHeadOfficeTree } from '@/hooks/queries'

interface EmployeeSearchProps {
  onSearch: (params: Omit<EmployeeSearchParams, 'page' | 'size'>) => void
  onReset: () => void
  totalCount: number
}

const initialFormData = {
  headOfficeOrganizationId: null as number | null,
  franchiseOrganizationId: null as number | null,
  storeId: null as number | null,
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
}

type FormData = typeof initialFormData

const buildSearchParams = (data: FormData, isEmployeeClassificationEnabled: boolean): Omit<EmployeeSearchParams, 'page' | 'size'> => {
  const params: Omit<EmployeeSearchParams, 'page' | 'size'> = {}
  if (data.headOfficeOrganizationId) params.headOfficeOrganizationId = data.headOfficeOrganizationId
  if (data.franchiseOrganizationId) params.franchiseOrganizationId = data.franchiseOrganizationId
  if (data.storeId) params.storeId = data.storeId
  if (data.workStatus) params.workStatus = data.workStatus as 'EMPWK_001' | 'EMPWK_002' | 'EMPWK_003'
  if (data.employeeName) params.employeeName = data.employeeName
  const effectiveClassification = isEmployeeClassificationEnabled ? data.employeeClassification : ''
  if (effectiveClassification) params.employeeClassification = effectiveClassification
  if (data.contractClassification) params.contractClassification = data.contractClassification
  if (data.adminAuthority) params.adminAuthority = data.adminAuthority
  if (data.memberStatus) params.memberStatus = data.memberStatus
  if (data.hireDateFrom) params.hireDateFrom = data.hireDateFrom
  if (data.hireDateTo) params.hireDateTo = data.hireDateTo
  if (data.healthCheckExpiryFrom) params.healthCheckExpiryFrom = data.healthCheckExpiryFrom
  if (data.healthCheckExpiryTo) params.healthCheckExpiryTo = data.healthCheckExpiryTo
  return params
}

export default function EmployeeSearch({ onSearch, onReset, totalCount }: EmployeeSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [showOfficeError, setShowOfficeError] = useState(false)
  const [formData, setFormData] = useState<FormData>({ ...initialFormData })
  const [appliedFormData, setAppliedFormData] = useState<FormData | null>(null)

  // BP 본사 트리 조회 (본사명 표시용)
  const { data: bpTree = [] } = useBpHeadOfficeTree()

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

  const isEmployeeClassificationEnabled = !!formData.headOfficeOrganizationId
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

  // 본사 ID → 이름 맵
  const officeNameMap = useMemo(() => {
    const map = new Map<number, string>()
    bpTree.forEach((office) => {
      if (office.name) map.set(office.id, office.name)
    })
    return map
  }, [bpTree])

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; label: string; category: string }[] = []
  if (appliedFormData) {
    if (appliedFormData.headOfficeOrganizationId != null) {
      const name = officeNameMap.get(appliedFormData.headOfficeOrganizationId)
      if (name) appliedTags.push({ key: 'headOffice', label: name, category: '본사' })
    }
    if (appliedFormData.workStatus) {
      const opt = workStatusOptions.find(o => o.value === appliedFormData.workStatus)
      appliedTags.push({ key: 'workStatus', label: opt?.label || appliedFormData.workStatus, category: '근무여부' })
    }
    if (appliedFormData.employeeName) {
      appliedTags.push({ key: 'employeeName', label: appliedFormData.employeeName, category: '직원명' })
    }
    if (appliedFormData.employeeClassification) {
      const opt = employeeClassOptions.find(o => o.value === appliedFormData.employeeClassification)
      appliedTags.push({ key: 'employeeClassification', label: opt?.label || appliedFormData.employeeClassification, category: '직원 분류' })
    }
    if (appliedFormData.contractClassification) {
      const opt = contractClassOptions.find(o => o.value === appliedFormData.contractClassification)
      appliedTags.push({ key: 'contractClassification', label: opt?.label || appliedFormData.contractClassification, category: '계약 분류' })
    }
    if (appliedFormData.adminAuthority) {
      const opt = adminAuthorityOptions.find(o => o.value === appliedFormData.adminAuthority)
      appliedTags.push({ key: 'adminAuthority', label: opt?.label || appliedFormData.adminAuthority, category: '관리자 권한' })
    }
    if (appliedFormData.memberStatus) {
      const opt = memberStatusOptions.find(o => o.value === appliedFormData.memberStatus)
      appliedTags.push({ key: 'memberStatus', label: opt?.label || appliedFormData.memberStatus, category: '직원 회원 상태' })
    }
    if (appliedFormData.hireDateFrom || appliedFormData.hireDateTo) {
      appliedTags.push({ key: 'hireDate', label: `${appliedFormData.hireDateFrom || ''} ~ ${appliedFormData.hireDateTo || ''}`, category: '입사일' })
    }
    if (appliedFormData.healthCheckExpiryFrom || appliedFormData.healthCheckExpiryTo) {
      appliedTags.push({ key: 'healthCheckExpiry', label: `${appliedFormData.healthCheckExpiryFrom || ''} ~ ${appliedFormData.healthCheckExpiryTo || ''}`, category: '건강진단 만료일' })
    }
  }

  const handleRemoveTag = (key: string) => {
    if (!appliedFormData) return
    const updated = { ...appliedFormData }
    switch (key) {
      case 'headOffice': updated.headOfficeOrganizationId = null; updated.franchiseOrganizationId = null; updated.storeId = null; updated.employeeClassification = ''; break
      case 'workStatus': updated.workStatus = ''; break
      case 'employeeName': updated.employeeName = ''; break
      case 'employeeClassification': updated.employeeClassification = ''; break
      case 'contractClassification': updated.contractClassification = ''; break
      case 'adminAuthority': updated.adminAuthority = ''; break
      case 'memberStatus': updated.memberStatus = ''; break
      case 'hireDate': updated.hireDateFrom = ''; updated.hireDateTo = ''; break
      case 'healthCheckExpiry': updated.healthCheckExpiryFrom = ''; updated.healthCheckExpiryTo = ''; break
    }
    setFormData(updated)
    setAppliedFormData(updated)
    onSearch(buildSearchParams(updated, !!updated.headOfficeOrganizationId))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    if (!formData.headOfficeOrganizationId) {
      setShowOfficeError(true)
      return
    }
    setShowOfficeError(false)
    const applied = { ...formData }
    setAppliedFormData(applied)
    onSearch(buildSearchParams(applied, isEmployeeClassificationEnabled))
    setSearchOpen(false)
  }

  const handleReset = () => {
    setFormData({ ...initialFormData })
    setAppliedFormData(null)
    setShowOfficeError(false)
    onReset()
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <ul className="search-result-list">
          {appliedTags.map((tag) => (
            <li key={tag.key} className="search-result-item">
              <div className="search-result-item-txt">
                <span>{tag.label}</span> ({tag.category})
              </div>
              <button
                type="button"
                className="search-result-item-btn"
                onClick={() => handleRemoveTag(tag.key)}
                aria-label={`${tag.category} 필터 제거`}
              ></button>
            </li>
          ))}
          <li className="search-result-item">
            <div className="search-result-item-txt">
              <span>{totalCount.toLocaleString()}건</span>
            </div>
          </li>
        </ul>
        <button
          type="button"
          className="search-filed-btn"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="검색 영역 열기/닫기"
        ></button>
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
            <button className="btn-form gray" onClick={() => setSearchOpen(false)} type="button">닫기</button>
            <button className="btn-form gray" onClick={handleReset} type="button">초기화</button>
            <button className="btn-form basic" onClick={handleSearch} type="button">검색</button>
          </div>
        </div>
      </AnimateHeight>
      <StaffInvitationPop isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </div>
  )
}
