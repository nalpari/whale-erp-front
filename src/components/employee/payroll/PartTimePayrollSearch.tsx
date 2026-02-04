'use client'
import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import Input from '@/components/common/ui/Input'
import RangeDatePicker, { DateRange } from '@/components/ui/common/RangeDatePicker'

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

export default function PartTimePayrollSearch({ onSearch, onReset, totalCount }: PartTimePayrollSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)
  const [showOfficeError, setShowOfficeError] = useState(false)

  const [formData, setFormData] = useState({
    headOfficeId: null as number | null,
    franchiseId: null as number | null,
    storeId: null as number | null,
    workStatus: '',
    employeeName: ''
  })
  const [selectedWorkDays, setSelectedWorkDays] = useState<string[]>(['WEEKDAY'])
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  })

  // React 19: 함수형 setState로 종속성이 없으므로 useCallback 불필요
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  const toggleWorkDay = (day: string) => {
    setSelectedWorkDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
      }
      return [...prev, day]
    })
  }

  const handleSearch = () => {
    // 본사 필수 체크
    if (!formData.headOfficeId) {
      setShowOfficeError(true)
      return
    }
    setShowOfficeError(false)

    const formatDate = (date: Date | null): string | undefined => {
      if (!date) return undefined
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const params: SearchParams = { workDays: selectedWorkDays }
    if (formData.headOfficeId) params.headOfficeId = formData.headOfficeId
    if (formData.franchiseId) params.franchiseId = formData.franchiseId
    if (formData.storeId) params.storeId = formData.storeId
    if (formData.workStatus) params.workStatus = formData.workStatus
    if (formData.employeeName) params.employeeName = formData.employeeName
    if (dateRange.startDate) params.startDate = formatDate(dateRange.startDate)
    if (dateRange.endDate) params.endDate = formatDate(dateRange.endDate)
    onSearch(params)
  }

  const handleReset = () => {
    setFormData({
      headOfficeId: null,
      franchiseId: null,
      storeId: null,
      workStatus: '',
      employeeName: ''
    })
    setSelectedWorkDays(['WEEKDAY'])
    setDateRange({ startDate: null, endDate: null })
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
                />
              </tr>
              {/* 2행: 근무여부, 직원명, 근무요일 */}
              <tr>
                <th>근무여부</th>
                <td>
                  <div className="data-filed">
                    <select
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
            <button className="btn-form gray" onClick={handleClose}>닫기</button>
            <button className="btn-form gray" onClick={handleReset}>초기화</button>
            <button className="btn-form basic" onClick={handleSearch}>검색</button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
