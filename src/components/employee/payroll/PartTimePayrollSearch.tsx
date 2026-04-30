'use client'
import { useState, useMemo } from 'react'
import AnimateHeight from 'react-animate-height'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import Input from '@/components/common/ui/Input'
import RangeDatePicker, { DateRange } from '@/components/ui/common/RangeDatePicker'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useBpHeadOfficeTree } from '@/hooks/queries'
import { useStoreOptions } from '@/hooks/queries/use-store-queries'
import { usePartTimePayrollSearchStore } from '@/stores/search-stores'

interface PartTimePayrollSearchProps {
  onSearch: (params: SearchParams) => void
  onReset: () => void
  totalCount: number
}

interface SearchParams {
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
  workStatus?: string
  employeeName?: string
  workDays?: string[]
  startDate?: string
  endDate?: string
}

const initialFormData = {
  headOfficeId: null as number | null,
  franchiseId: null as number | null,
  storeId: null as number | null,
  workStatus: '',
  employeeName: ''
}

type FormData = typeof initialFormData

const formatDateStr = (date: Date | null): string | undefined => {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const buildSearchParams = (data: FormData, workDays: string[], dateRange: DateRange): SearchParams => {
  const params: SearchParams = {}
  if (workDays.length > 0) params.workDays = workDays
  if (data.headOfficeId) params.headOfficeId = data.headOfficeId
  if (data.franchiseId) params.franchiseId = data.franchiseId
  if (data.storeId) params.storeId = data.storeId
  if (data.workStatus) params.workStatus = data.workStatus
  if (data.employeeName) params.employeeName = data.employeeName
  if (dateRange.startDate) params.startDate = formatDateStr(dateRange.startDate)
  if (dateRange.endDate) params.endDate = formatDateStr(dateRange.endDate)
  return params
}

const restoreFormData = (sp: Record<string, unknown>): FormData => ({
  headOfficeId: (sp.headOfficeId as number) ?? null,
  franchiseId: (sp.franchiseId as number) ?? null,
  storeId: (sp.storeId as number) ?? null,
  workStatus: (sp.workStatus as string) || '',
  employeeName: (sp.employeeName as string) || '',
})

export default function PartTimePayrollSearch({ onSearch, onReset, totalCount }: PartTimePayrollSearchProps) {
  const store = usePartTimePayrollSearchStore()
  const [searchOpen, setSearchOpen] = useState(() => !store.hasSearched)
  const [showOfficeError, setShowOfficeError] = useState(false)
  const [formData, setFormData] = useState<FormData>(() =>
    store.hasSearched ? restoreFormData(store.searchParams) : { ...initialFormData }
  )
  const [selectedWorkDays, setSelectedWorkDays] = useState<string[]>(() =>
    store.hasSearched && Array.isArray(store.searchParams.workDays) ? store.searchParams.workDays as string[] : ['WEEKDAY']
  )
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    store.hasSearched ? {
      startDate: store.searchParams.startDate ? parseLocalDate(store.searchParams.startDate as string) : null,
      endDate: store.searchParams.endDate ? parseLocalDate(store.searchParams.endDate as string) : null,
    } : { startDate: null, endDate: null }
  )
  const [appliedFormData, setAppliedFormData] = useState<FormData | null>(() =>
    store.hasSearched ? restoreFormData(store.searchParams) : null
  )
  const [appliedWorkDays, setAppliedWorkDays] = useState<string[] | null>(() =>
    store.hasSearched && Array.isArray(store.searchParams.workDays) ? store.searchParams.workDays as string[] : null
  )
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | null>(() =>
    store.hasSearched ? {
      startDate: store.searchParams.startDate ? parseLocalDate(store.searchParams.startDate as string) : null,
      endDate: store.searchParams.endDate ? parseLocalDate(store.searchParams.endDate as string) : null,
    } : null
  )

  // BP 본사 트리 조회 (본사명 표시용)
  const { data: bpTree = [] } = useBpHeadOfficeTree()

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
    appliedFormData?.headOfficeId,
    appliedFormData?.franchiseId,
    !!(appliedFormData?.headOfficeId)
  )

  const storeNameMap = useMemo(() => {
    const map = new Map<number, string>()
    storeOptions.forEach((store) => {
      map.set(store.id, store.storeName)
    })
    return map
  }, [storeOptions])

  const workStatusOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '전체' },
    { value: 'EMPWK_001', label: '근무' },
    { value: 'EMPWK_002', label: '휴직' },
    { value: 'EMPWK_003', label: '퇴사' }
  ], [])

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; label: string; category: string }[] = []
  if (appliedFormData) {
    if (appliedFormData.headOfficeId != null) {
      const name = officeNameMap.get(appliedFormData.headOfficeId)
      if (name) appliedTags.push({ key: 'headOffice', label: name, category: '본사' })
    }
    if (appliedFormData.franchiseId != null) {
      const name = franchiseNameMap.get(appliedFormData.franchiseId)
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
    if (appliedWorkDays && appliedWorkDays.length > 0) {
      const dayLabels: Record<string, string> = { WEEKDAY: '평일', SATURDAY: '토요일', SUNDAY: '일요일' }
      const label = appliedWorkDays.map(d => dayLabels[d] || d).join(', ')
      appliedTags.push({ key: 'workDays', label, category: '근무요일' })
    }
    if (appliedDateRange && (appliedDateRange.startDate || appliedDateRange.endDate)) {
      appliedTags.push({ key: 'dateRange', label: `${formatDateStr(appliedDateRange.startDate) || ''} ~ ${formatDateStr(appliedDateRange.endDate) || ''}`, category: '급여일' })
    }
  }

  const handleRemoveTag = (key: string) => {
    if (!appliedFormData) return
    const updatedForm = { ...appliedFormData }
    let updatedDays = appliedWorkDays ? [...appliedWorkDays] : ['WEEKDAY']
    let updatedDate = appliedDateRange ? { ...appliedDateRange } : { startDate: null, endDate: null }
    switch (key) {
      case 'headOffice': updatedForm.headOfficeId = null; updatedForm.franchiseId = null; updatedForm.storeId = null; break
      case 'franchise': updatedForm.franchiseId = null; updatedForm.storeId = null; break
      case 'store': updatedForm.storeId = null; break
      case 'workStatus': updatedForm.workStatus = ''; break
      case 'employeeName': updatedForm.employeeName = ''; break
      case 'workDays': updatedDays = ['WEEKDAY']; break
      case 'dateRange': updatedDate = { startDate: null, endDate: null }; break
    }
    setFormData(updatedForm)
    setSelectedWorkDays(updatedDays)
    setDateRange(updatedDate)
    setAppliedFormData(updatedForm)
    setAppliedWorkDays(updatedDays)
    setAppliedDateRange(updatedDate)
    onSearch(buildSearchParams(updatedForm, updatedDays, updatedDate))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  const toggleWorkDay = (day: string) => {
    setSelectedWorkDays(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day)
      return [...prev, day]
    })
  }

  const handleSearch = () => {
    if (!formData.headOfficeId) {
      setShowOfficeError(true)
      return
    }
    setShowOfficeError(false)
    const applied = { ...formData }
    const applDays = [...selectedWorkDays]
    const applDates = { ...dateRange }
    setAppliedFormData(applied)
    setAppliedWorkDays(applDays)
    setAppliedDateRange(applDates)
    onSearch(buildSearchParams(applied, applDays, applDates))
    setSearchOpen(false)
  }

  const handleReset = () => {
    setFormData({ ...initialFormData })
    setSelectedWorkDays(['WEEKDAY'])
    setDateRange({ startDate: null, endDate: null })
    setAppliedFormData(null)
    setAppliedWorkDays(null)
    setAppliedDateRange(null)
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
                  officeId={formData.headOfficeId}
                  franchiseId={formData.franchiseId}
                  storeId={formData.storeId}
                  onChange={(next) =>
                    setFormData(prev => ({
                      ...prev,
                      headOfficeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: next.store
                    }))
                  }
                  onAutoSelect={(next) => {
                    // HIGH #2 — formData 미동기화 fix
                    const applied: FormData = {
                      ...formData,
                      headOfficeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: next.store,
                    }
                    setFormData(applied)
                    setAppliedFormData(applied)
                    setAppliedWorkDays([...selectedWorkDays])
                    setAppliedDateRange(dateRange)
                    onSearch(buildSearchParams(applied, selectedWorkDays, dateRange))
                    setSearchOpen(false)
                  }}
                />
              </tr>
              {/* 2행: 근무여부, 직원명, 근무요일 */}
              <tr>
                <th>근무여부</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={workStatusOptions}
                      value={workStatusOptions.find(o => o.value === formData.workStatus) || null}
                      onChange={(opt) => handleInputChange('workStatus', opt?.value || '')}
                      placeholder="선택"
                    />
                  </div>
                </td>
                <th>직원명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      type="text"
                      placeholder="직원명 입력"
                      value={formData.employeeName}
                      onChange={(e) => handleInputChange('employeeName', e.target.value)}
                    />
                  </div>
                </td>
                <th>근무요일</th>
                <td>
                  <div className="data-filed">
                    <div className="btn-group" style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className={`btn-form s ${selectedWorkDays.includes('WEEKDAY') ? 'basic' : 'outline'}`}
                        onClick={() => toggleWorkDay('WEEKDAY')}
                      >
                        평일
                      </button>
                      <button
                        type="button"
                        className={`btn-form s ${selectedWorkDays.includes('SATURDAY') ? 'basic' : 'outline'}`}
                        onClick={() => toggleWorkDay('SATURDAY')}
                      >
                        토요일
                      </button>
                      <button
                        type="button"
                        className={`btn-form s ${selectedWorkDays.includes('SUNDAY') ? 'basic' : 'outline'}`}
                        onClick={() => toggleWorkDay('SUNDAY')}
                      >
                        일요일
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              {/* 3행: 급여일 */}
              <tr>
                <th>급여일</th>
                <td colSpan={5}>
                  <RangeDatePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onChange={handleDateRangeChange}
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
    </div>
  )
}
