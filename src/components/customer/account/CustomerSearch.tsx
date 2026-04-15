'use client'
import AnimateHeight from 'react-animate-height'
import { useState, useMemo } from 'react'
import RangeDatePicker, { DateRange } from '../../ui/common/RangeDatePicker'
import { Input, RadioButtonGroup } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import type { CustomerSearchParams } from '@/types/customer'
import { format } from 'date-fns'
import { useCustomerSearchStore } from '@/stores/search-stores'

interface CustomerSearchProps {
  onSearch: (params: Omit<CustomerSearchParams, 'page' | 'size'>) => void
  onReset: () => void
  totalCount: number
}

const initialFormData = {
  isOperate: null as number | null,
  name: '',
  loginId: '',
  mobilePhoneLast4: '',
  socialAuthType: '',
  joinDateFrom: '',
  joinDateTo: '',
}

type FormData = typeof initialFormData

const buildSearchParams = (data: FormData): Omit<CustomerSearchParams, 'page' | 'size'> => {
  const params: Omit<CustomerSearchParams, 'page' | 'size'> = {}
  if (data.isOperate !== null) params.isOperate = data.isOperate
  if (data.name) params.name = data.name
  if (data.loginId) params.loginId = data.loginId
  if (data.mobilePhoneLast4) params.mobilePhoneLast4 = data.mobilePhoneLast4
  if (data.socialAuthType) params.socialAuthType = data.socialAuthType
  if (data.joinDateFrom) params.joinDateFrom = data.joinDateFrom
  if (data.joinDateTo) params.joinDateTo = data.joinDateTo
  return params
}

const restoreFormData = (sp: Record<string, unknown>): FormData => ({
  isOperate: (sp.isOperate as number) ?? null,
  name: (sp.name as string) || '',
  loginId: (sp.loginId as string) || '',
  mobilePhoneLast4: (sp.mobilePhoneLast4 as string) || '',
  socialAuthType: (sp.socialAuthType as string) || '',
  joinDateFrom: (sp.joinDateFrom as string) || '',
  joinDateTo: (sp.joinDateTo as string) || '',
})

export default function CustomerSearch({ onSearch, onReset, totalCount }: CustomerSearchProps) {
  const store = useCustomerSearchStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(() =>
    store.hasSearched ? restoreFormData(store.searchParams) : { ...initialFormData }
  )
  const [appliedFormData, setAppliedFormData] = useState<FormData | null>(() =>
    store.hasSearched ? restoreFormData(store.searchParams) : null
  )

  // 운영여부 옵션
  const operateOptions = [
    { value: '', label: '전체' },
    { value: '1', label: '운영' },
    { value: '0', label: '탈퇴' },
  ]

  // 간편인증 옵션
  const socialAuthOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '전체' },
    { value: 'NAVER', label: '네이버' },
    { value: 'KAKAO', label: '카카오' },
    { value: 'GOOGLE', label: '구글' },
  ], [])

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; label: string; category: string }[] = []
  if (appliedFormData) {
    if (appliedFormData.isOperate !== null) {
      appliedTags.push({ key: 'isOperate', label: appliedFormData.isOperate === 1 ? '운영' : '탈퇴', category: '운영여부' })
    }
    if (appliedFormData.name) {
      appliedTags.push({ key: 'name', label: appliedFormData.name, category: '회원명' })
    }
    if (appliedFormData.loginId) {
      appliedTags.push({ key: 'loginId', label: appliedFormData.loginId, category: '회원 ID' })
    }
    if (appliedFormData.mobilePhoneLast4) {
      appliedTags.push({ key: 'mobilePhoneLast4', label: appliedFormData.mobilePhoneLast4, category: '휴대폰 뒷 4자리' })
    }
    if (appliedFormData.socialAuthType) {
      const opt = socialAuthOptions.find(o => o.value === appliedFormData.socialAuthType)
      appliedTags.push({ key: 'socialAuthType', label: opt?.label || appliedFormData.socialAuthType, category: '간편인증' })
    }
    if (appliedFormData.joinDateFrom || appliedFormData.joinDateTo) {
      appliedTags.push({ key: 'joinDate', label: `${appliedFormData.joinDateFrom || ''} ~ ${appliedFormData.joinDateTo || ''}`, category: '가입일' })
    }
  }

  const handleRemoveTag = (key: string) => {
    if (!appliedFormData) return
    const updated = { ...appliedFormData }
    switch (key) {
      case 'isOperate': updated.isOperate = null; break
      case 'name': updated.name = ''; break
      case 'loginId': updated.loginId = ''; break
      case 'mobilePhoneLast4': updated.mobilePhoneLast4 = ''; break
      case 'socialAuthType': updated.socialAuthType = ''; break
      case 'joinDate': updated.joinDateFrom = ''; updated.joinDateTo = ''; break
    }
    setFormData(updated)
    setAppliedFormData(updated)
    onSearch(buildSearchParams(updated))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    const applied = { ...formData }
    setAppliedFormData(applied)
    onSearch(buildSearchParams(applied))
    setSearchOpen(false)
  }

  const handleReset = () => {
    setFormData({ ...initialFormData })
    setAppliedFormData(null)
    onReset()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
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
              {/* 1행: 운영여부, 회원명, 회원 ID */}
              <tr>
                <th>운영여부</th>
                <td>
                  <div className="data-filed">
                    <RadioButtonGroup
                      options={operateOptions}
                      value={formData.isOperate === null ? '' : String(formData.isOperate)}
                      onChange={(value) => setFormData(prev => ({ ...prev, isOperate: value === '' ? null : Number(value) }))}
                      name="isOperate"
                    />
                  </div>
                </td>
                <th>회원명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      placeholder="회원명 입력"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onKeyDown={handleKeyDown}
                      showClear
                      onClear={() => handleInputChange('name', '')}
                    />
                  </div>
                </td>
                <th>회원 ID</th>
                <td>
                  <div className="data-filed">
                    <Input
                      placeholder="회원 ID 입력"
                      value={formData.loginId}
                      onChange={(e) => handleInputChange('loginId', e.target.value)}
                      onKeyDown={handleKeyDown}
                      showClear
                      onClear={() => handleInputChange('loginId', '')}
                    />
                  </div>
                </td>
              </tr>
              {/* 2행: 휴대폰 번호, 간편인증, 가입일 */}
              <tr>
                <th>휴대폰 뒷 4자리</th>
                <td>
                  <div className="data-filed">
                    <Input
                      type="number"
                      placeholder="뒷 4자리 입력 (예: 5678)"
                      value={formData.mobilePhoneLast4}
                      onChange={(e) => handleInputChange('mobilePhoneLast4', e.target.value.slice(0, 4))}
                      onKeyDown={handleKeyDown}
                      showClear
                      onClear={() => handleInputChange('mobilePhoneLast4', '')}
                    />
                  </div>
                </td>
                <th>간편인증</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={socialAuthOptions}
                      value={socialAuthOptions.find(opt => opt.value === formData.socialAuthType) || null}
                      onChange={(opt) => handleInputChange('socialAuthType', opt?.value || '')}
                      placeholder="전체"
                    />
                  </div>
                </td>
                <th>가입일</th>
                <td>
                  <RangeDatePicker
                    startDate={formData.joinDateFrom ? new Date(formData.joinDateFrom) : null}
                    endDate={formData.joinDateTo ? new Date(formData.joinDateTo) : null}
                    onChange={(range: DateRange) => {
                      handleInputChange('joinDateFrom', range.startDate ? format(range.startDate, 'yyyy-MM-dd') : '')
                      handleInputChange('joinDateTo', range.endDate ? format(range.endDate, 'yyyy-MM-dd') : '')
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
    </div>
  )
}
