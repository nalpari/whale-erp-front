'use client'
import AnimateHeight from 'react-animate-height'
import { useState, useCallback, useMemo } from 'react'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import Input from '@/components/common/ui/Input'
import RangeDatePicker, { DateRange } from '@/components/ui/common/RangeDatePicker'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useEmployeeInfoSettings } from '@/hooks/queries/use-employee-settings-queries'
import { useBpHeadOfficeTree } from '@/hooks/queries'
import { useStoreOptions } from '@/hooks/queries/use-store-queries'
import { useEmployContractSearchStore } from '@/stores/search-stores'

interface EmployContractSearchProps {
  onSearch?: (params: Record<string, unknown>) => void
  onReset?: () => void
  totalCount?: number
}

const initialFormData = {
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
}

type FormData = typeof initialFormData

const restoreFormData = (sp: Record<string, unknown>): FormData => ({
  headOfficeOrganizationId: (sp.headOfficeId as number) ?? null,
  franchiseOrganizationId: (sp.franchiseId as number) ?? null,
  storeId: (sp.storeId as number) ?? null,
  workStatus: (sp.workStatus as string) || '',
  employeeName: (sp.memberName as string) || '',
  workDays: Array.isArray(sp.workDays) ? (sp.workDays as string[]).map(d => {
    const mapping: Record<string, string> = { WEEKDAY: 'weekday', SATURDAY: 'saturday', SUNDAY: 'sunday' }
    return mapping[d] || d
  }) : [],
  employeeClassification: (sp.memberClassification as string) || '',
  contractClassification: (sp.contractClassification as string) || '',
  contractStatus: (() => {
    const statusMapping: Record<string, string> = { WRITING: 'drafting', PROGRESS: 'in_progress', COMPLETE: 'completed' }
    return statusMapping[(sp.contractStatus as string) || ''] || ''
  })(),
  electronicContract: (() => {
    const ec = sp.electronicContract
    if (Array.isArray(ec) && ec[0] === 'Y') return 'electronic'
    if (Array.isArray(ec) && ec[0] === 'N') return 'paper'
    return ''
  })(),
  contractDateFrom: sp.contractStartDt ? new Date(sp.contractStartDt as string) : null,
  contractDateTo: sp.contractEndDt ? new Date(sp.contractEndDt as string) : null,
})

export default function EmployContractSearch({ onSearch, onReset, totalCount = 0 }: EmployContractSearchProps) {
  const store = useEmployContractSearchStore()
  const [searchOpen, setSearchOpen] = useState(() => !store.hasSearched)
  const [showOfficeError, setShowOfficeError] = useState(false)
  const [formData, setFormData] = useState<FormData>(() =>
    store.hasSearched ? restoreFormData(store.searchParams) : { ...initialFormData, workDays: [] }
  )
  const [appliedFormData, setAppliedFormData] = useState<FormData | null>(() =>
    store.hasSearched ? restoreFormData(store.searchParams) : null
  )

  // BP 본사 트리 조회 (본사명 표시용)
  const { data: bpTree = [] } = useBpHeadOfficeTree()

  // 직원 분류 조회 - TanStack Query 사용
  const { data: settingsData, isPending: isEmployeeClassificationLoading } = useEmployeeInfoSettings(
    {
      headOfficeId: formData.headOfficeOrganizationId ?? undefined,
      franchiseId: formData.franchiseOrganizationId ?? undefined
    },
    !!formData.headOfficeOrganizationId
  )

  const isEmployeeClassificationEnabled = !!formData.headOfficeOrganizationId

  // 본사 ID → 이름 맵
  const officeNameMap = useMemo(() => {
    const map = new Map<number, string>()
    bpTree.forEach((office) => {
      if (office.name) map.set(office.id, office.name)
    })
    return map
  }, [bpTree])

  // 가맹점 ID → 이름 맵
  const franchiseNameMap = useMemo(() => {
    const map = new Map<number, string>()
    bpTree.forEach((office) => {
      office.franchises?.forEach((franchise) => {
        if (franchise.name) map.set(franchise.id, franchise.name)
      })
    })
    return map
  }, [bpTree])

  // 점포 목록 (점포명 표시용)
  const { data: storeOptions = [] } = useStoreOptions(
    appliedFormData?.headOfficeOrganizationId,
    appliedFormData?.franchiseOrganizationId,
    !!(appliedFormData?.headOfficeOrganizationId)
  )

  const storeNameMap = useMemo(() => {
    const map = new Map<number, string>()
    storeOptions.forEach((store) => {
      map.set(store.id, store.storeName)
    })
    return map
  }, [storeOptions])

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

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; label: string; category: string }[] = []
  if (appliedFormData) {
    if (appliedFormData.headOfficeOrganizationId != null) {
      const name = officeNameMap.get(appliedFormData.headOfficeOrganizationId)
      if (name) appliedTags.push({ key: 'headOffice', label: name, category: '본사' })
    }
    if (appliedFormData.franchiseOrganizationId != null) {
      const name = franchiseNameMap.get(appliedFormData.franchiseOrganizationId)
      if (name) appliedTags.push({ key: 'franchise', label: name, category: '가맹점' })
    }
    if (appliedFormData.storeId != null) {
      const name = storeNameMap.get(appliedFormData.storeId)
      if (name) appliedTags.push({ key: 'store', label: name, category: '점포' })
    }
    if (appliedFormData.workStatus) {
      const opt = workStatusOptions.find(o => o.value === appliedFormData.workStatus)
      appliedTags.push({ key: 'workStatus', label: opt?.label || appliedFormData.workStatus, category: '근무여부' })
    }
    if (appliedFormData.employeeName) {
      appliedTags.push({ key: 'employeeName', label: appliedFormData.employeeName, category: '직원명' })
    }
    if (appliedFormData.workDays.length > 0) {
      const dayLabels: Record<string, string> = { weekday: '평일', saturday: '토요일', sunday: '일요일' }
      const label = appliedFormData.workDays.map(d => dayLabels[d] || d).join(', ')
      appliedTags.push({ key: 'workDays', label, category: '근무요일' })
    }
    if (appliedFormData.employeeClassification) {
      const opt = employeeClassOptions.find(o => o.value === appliedFormData.employeeClassification)
      appliedTags.push({ key: 'employeeClassification', label: opt?.label || appliedFormData.employeeClassification, category: '직원 분류' })
    }
    if (appliedFormData.contractClassification) {
      const opt = contractClassOptions.find(o => o.value === appliedFormData.contractClassification)
      appliedTags.push({ key: 'contractClassification', label: opt?.label || appliedFormData.contractClassification, category: '계약 분류' })
    }
    if (appliedFormData.contractStatus) {
      const opt = contractStatusOptions.find(o => o.value === appliedFormData.contractStatus)
      appliedTags.push({ key: 'contractStatus', label: opt?.label || appliedFormData.contractStatus, category: '계약 상태' })
    }
    if (appliedFormData.electronicContract) {
      const label = appliedFormData.electronicContract === 'electronic' ? '전자계약' : '서류계약'
      appliedTags.push({ key: 'electronicContract', label, category: '전자계약 여부' })
    }
    if (appliedFormData.contractDateFrom || appliedFormData.contractDateTo) {
      const formatDate = (d: Date | null) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''
      appliedTags.push({ key: 'contractDate', label: `${formatDate(appliedFormData.contractDateFrom)} ~ ${formatDate(appliedFormData.contractDateTo)}`, category: '계약일' })
    }
  }

  const buildApiParams = (data: FormData): Record<string, unknown> => {
    const apiParams: Record<string, unknown> = {}
    apiParams.headOfficeId = data.headOfficeOrganizationId
    if (data.franchiseOrganizationId) apiParams.franchiseId = data.franchiseOrganizationId
    if (data.storeId) apiParams.storeId = data.storeId
    if (data.workStatus) apiParams.workStatus = data.workStatus
    if (data.employeeName?.trim()) apiParams.memberName = data.employeeName.trim()
    if (data.workDays.length > 0) {
      const dayMapping: Record<string, string> = { weekday: 'WEEKDAY', saturday: 'SATURDAY', sunday: 'SUNDAY' }
      apiParams.workDays = data.workDays.map(d => dayMapping[d] || d)
    }
    if (data.employeeClassification) apiParams.memberClassification = data.employeeClassification
    if (data.contractClassification) apiParams.contractClassification = data.contractClassification
    if (data.contractStatus) {
      const statusMapping: Record<string, string> = { drafting: 'WRITING', in_progress: 'PROGRESS', completed: 'COMPLETE' }
      apiParams.contractStatus = statusMapping[data.contractStatus] || data.contractStatus
    }
    if (data.electronicContract === 'electronic') apiParams.electronicContract = ['Y']
    else if (data.electronicContract === 'paper') apiParams.electronicContract = ['N']
    if (data.contractDateFrom) {
      const year = data.contractDateFrom.getFullYear()
      const month = String(data.contractDateFrom.getMonth() + 1).padStart(2, '0')
      const day = String(data.contractDateFrom.getDate()).padStart(2, '0')
      apiParams.contractStartDt = `${year}-${month}-${day}`
    }
    if (data.contractDateTo) {
      const year = data.contractDateTo.getFullYear()
      const month = String(data.contractDateTo.getMonth() + 1).padStart(2, '0')
      const day = String(data.contractDateTo.getDate()).padStart(2, '0')
      apiParams.contractEndDt = `${year}-${month}-${day}`
    }
    return apiParams
  }

  const handleRemoveTag = (key: string) => {
    if (!appliedFormData) return
    const updated = { ...appliedFormData, workDays: [...appliedFormData.workDays] }
    switch (key) {
      case 'headOffice': updated.headOfficeOrganizationId = null; updated.franchiseOrganizationId = null; updated.storeId = null; updated.employeeClassification = ''; break
      case 'franchise': updated.franchiseOrganizationId = null; updated.storeId = null; updated.employeeClassification = ''; break
      case 'store': updated.storeId = null; break
      case 'workStatus': updated.workStatus = ''; break
      case 'employeeName': updated.employeeName = ''; break
      case 'workDays': updated.workDays = []; break
      case 'employeeClassification': updated.employeeClassification = ''; break
      case 'contractClassification': updated.contractClassification = ''; break
      case 'contractStatus': updated.contractStatus = ''; break
      case 'electronicContract': updated.electronicContract = ''; break
      case 'contractDate': updated.contractDateFrom = null; updated.contractDateTo = null; break
    }
    setFormData(updated)
    setAppliedFormData(updated)
    if (onSearch) onSearch(buildApiParams(updated))
  }

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
    if (!formData.headOfficeOrganizationId) {
      setShowOfficeError(true)
      return
    }
    setShowOfficeError(false)
    const applied = { ...formData, workDays: [...formData.workDays] }
    setAppliedFormData(applied)
    if (onSearch) onSearch(buildApiParams(applied))
    setSearchOpen(false)
  }, [formData, onSearch])

  const handleReset = () => {
    setFormData({ ...initialFormData, workDays: [] })
    setAppliedFormData(null)
    setShowOfficeError(false)
    if (onReset) onReset()
  }

  const handleContractDateChange = (range: DateRange) => {
    setFormData(prev => ({
      ...prev,
      contractDateFrom: range.startDate,
      contractDateTo: range.endDate
    }))
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
                      placeholder="직원명 입력"
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
            <button className="btn-form gray" onClick={() => setSearchOpen(false)} type="button">닫기</button>
            <button className="btn-form gray" onClick={handleReset} type="button">초기화</button>
            <button className="btn-form basic" onClick={handleSearch} type="button">검색</button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
