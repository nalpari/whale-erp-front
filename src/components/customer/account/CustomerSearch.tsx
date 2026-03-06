'use client'
import AnimateHeight from 'react-animate-height'
import { useState, useMemo } from 'react'
import RangeDatePicker, { DateRange } from '../../ui/common/RangeDatePicker'
import { Input } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import type { CustomerSearchParams } from '@/types/customer'
import { format } from 'date-fns'

interface CustomerSearchProps {
  onSearch: (params: Omit<CustomerSearchParams, 'page' | 'size'>) => void
  onReset: () => void
  totalCount: number
}

export default function CustomerSearch({ onSearch, onReset, totalCount }: CustomerSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true)

  // 검색 폼 상태
  const [formData, setFormData] = useState({
    isOperate: null as number | null,
    name: '',
    loginId: '',
    mobilePhone: '',
    socialAuthType: '',
    joinDateFrom: '',
    joinDateTo: '',
  })

  // 간편인증 옵션
  const socialAuthOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '전체' },
    { value: 'NAVER', label: '네이버' },
    { value: 'KAKAO', label: '카카오' },
    { value: 'GOOGLE', label: '구글' },
  ], [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    const params: Omit<CustomerSearchParams, 'page' | 'size'> = {}

    if (formData.isOperate !== null) params.isOperate = formData.isOperate
    if (formData.name) params.name = formData.name
    if (formData.loginId) params.loginId = formData.loginId
    if (formData.mobilePhone) params.mobilePhone = formData.mobilePhone
    if (formData.socialAuthType) params.socialAuthType = formData.socialAuthType
    if (formData.joinDateFrom) params.joinDateFrom = formData.joinDateFrom
    if (formData.joinDateTo) params.joinDateTo = formData.joinDateTo

    onSearch(params)
  }

  const handleReset = () => {
    setFormData({
      isOperate: null,
      name: '',
      loginId: '',
      mobilePhone: '',
      socialAuthType: '',
      joinDateFrom: '',
      joinDateTo: '',
    })
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
              {/* 1행: 운영여부, 회원명, 회원 ID */}
              <tr>
                <th>운영여부</th>
                <td>
                  <div className="data-filed">
                    <div className="btn-group" style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className={`btn-form ${formData.isOperate === null ? 'basic' : 'gray'}`}
                        onClick={() => setFormData(prev => ({ ...prev, isOperate: null }))}
                      >
                        전체
                      </button>
                      <button
                        type="button"
                        className={`btn-form ${formData.isOperate === 1 ? 'basic' : 'gray'}`}
                        onClick={() => setFormData(prev => ({ ...prev, isOperate: 1 }))}
                      >
                        운영
                      </button>
                      <button
                        type="button"
                        className={`btn-form ${formData.isOperate === 0 ? 'basic' : 'gray'}`}
                        onClick={() => setFormData(prev => ({ ...prev, isOperate: 0 }))}
                      >
                        탈퇴
                      </button>
                    </div>
                  </div>
                </td>
                <th>회원명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      placeholder="회원명 입력"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
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
                      showClear
                      onClear={() => handleInputChange('loginId', '')}
                    />
                  </div>
                </td>
              </tr>
              {/* 2행: 휴대폰 번호, 간편인증, 가입일 */}
              <tr>
                <th>휴대폰 번호</th>
                <td>
                  <div className="data-filed">
                    <Input
                      type="cellphone"
                      placeholder="휴대폰 번호 입력"
                      value={formData.mobilePhone}
                      onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                      showClear
                      onClear={() => handleInputChange('mobilePhone', '')}
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
            <button className="btn-form gray" onClick={handleClose}>닫기</button>
            <button className="btn-form gray" onClick={handleReset}>초기화</button>
            <button className="btn-form basic" onClick={handleSearch}>검색</button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
