'use client'

import AnimateHeight from 'react-animate-height'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { Input, RadioButtonGroup, useAlert } from '@/components/common/ui'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import { useMasterCategoryList, useStoreList, useCommonCodeHierarchy } from '@/hooks/queries'
import type { CategoryResponse } from '@/types/menu'

export interface MenuSearchFormData {
  headOfficeOrganizationId?: number | null
  menuName?: string
  operationStatus?: string
  menuType?: string
  menuClassificationCode?: string
  categoryId?: string
  franchiseAvailableId?: string
  registeredDateFrom?: string
  registeredDateTo?: string
}

interface MenuSearchProps {
  onSearch: (params: MenuSearchFormData) => void
  onReset: () => void
  totalCount: number
}

const operationStatusOptions = [
  { value: '', label: '전체' },
  { value: 'STOPR_001', label: '운영' },
  { value: 'STOPR_002', label: '미운영' },
]

const menuTypeOptions = [
  { value: '', label: '전체' },
  { value: 'MNTYP_001', label: '메뉴' },
  { value: 'MNTYP_002', label: '옵션' },
]

const INITIAL_FORM_DATA = {
  headOfficeOrganizationId: null as number | null,
  franchiseOrganizationId: null as number | null,
  menuName: '',
  operationStatus: '',
  menuType: '',
  menuClassificationCode: '',
  categoryId: '',
  franchiseAvailableId: '',
  registeredDateFrom: '',
  registeredDateTo: '',
}

export default function MenuSearch({ onSearch, onReset, totalCount }: MenuSearchProps) {
  const { alert } = useAlert()
  const [searchOpen, setSearchOpen] = useState(true)
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA })

  // 카테고리 API 조회 (본사 선택 시)
  const { data: categories } = useMasterCategoryList(formData.headOfficeOrganizationId)

  const categoryOptions: SelectOption[] = useMemo(() => {
    if (!categories) return []
    const options: SelectOption[] = []
    const flattenTree = (items: CategoryResponse[], depth: number) => {
      for (const item of items) {
        const prefix = depth > 1 ? `${'-'.repeat(depth - 1)} ` : ''
        options.push({ value: String(item.id), label: `${prefix}${item.categoryName}` })
        if (item.children?.length) {
          flattenTree(item.children, depth + 1)
        }
      }
    }
    flattenTree(categories, 1)
    return options
  }, [categories])

  // 사용가능 가맹점(점포) API 조회 (본사 선택 시)
  const { data: storeResponse } = useStoreList(
    { office: formData.headOfficeOrganizationId ?? undefined, status: 'STOPR_001', sort: 'id,asc' },
    !!formData.headOfficeOrganizationId
  )

  const franchiseAvailableOptions: SelectOption[] = useMemo(() => {
    if (!storeResponse?.content) return []
    return storeResponse.content.map(store => ({
      value: String(store.id),
      label: store.storeName,
    }))
  }, [storeResponse])

  // 메뉴분류 공통코드 조회
  const { data: menuClassificationCodes } = useCommonCodeHierarchy('MNCF')

  const menuClassificationOptions: SelectOption[] = useMemo(() => {
    if (!menuClassificationCodes) return []
    return menuClassificationCodes.map(code => ({
      value: code.code,
      label: code.name,
    }))
  }, [menuClassificationCodes])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSearch = async () => {
    if (!formData.headOfficeOrganizationId) {
      await alert('본사를 선택해주세요.')
      return
    }

    const params: MenuSearchFormData = {}

    if (formData.headOfficeOrganizationId) params.headOfficeOrganizationId = formData.headOfficeOrganizationId
    if (formData.menuName) params.menuName = formData.menuName
    if (formData.operationStatus) params.operationStatus = formData.operationStatus
    if (formData.menuType) params.menuType = formData.menuType
    if (formData.menuClassificationCode) params.menuClassificationCode = formData.menuClassificationCode
    if (formData.categoryId) params.categoryId = formData.categoryId
    if (formData.franchiseAvailableId) params.franchiseAvailableId = formData.franchiseAvailableId
    if (formData.registeredDateFrom) params.registeredDateFrom = formData.registeredDateFrom
    if (formData.registeredDateTo) params.registeredDateTo = formData.registeredDateTo

    onSearch(params)
  }

  const handleReset = () => {
    setFormData({ ...INITIAL_FORM_DATA })
    onReset()
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
              {/* 1행: 본사, 가맹점(disabled), 메뉴명 */}
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  fields={['office']}
                  officeId={formData.headOfficeOrganizationId}
                  franchiseId={null}
                  storeId={null}
                  onChange={(next) =>
                    setFormData(prev => ({
                      ...prev,
                      headOfficeOrganizationId: next.head_office,
                      categoryId: '',
                      franchiseAvailableId: '',
                    }))
                  }
                />
                <th>가맹점</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={[]}
                      value={null}
                      placeholder="전체"
                      isDisabled={true}
                    />
                  </div>
                </td>
                <th>메뉴명</th>
                <td>
                  <div className="data-filed">
                    <Input
                      placeholder="메뉴명 입력"
                      value={formData.menuName}
                      onChange={(e) => handleInputChange('menuName', e.target.value)}
                      showClear
                      onClear={() => handleInputChange('menuName', '')}
                    />
                  </div>
                </td>
              </tr>
              {/* 2행: 운영여부, 메뉴타입, 메뉴분류 */}
              <tr>
                <th>운영여부</th>
                <td>
                  <div className="data-filed">
                    <RadioButtonGroup
                      options={operationStatusOptions}
                      value={formData.operationStatus}
                      onChange={(value) => handleInputChange('operationStatus', value)}
                      name="operationStatus"
                    />
                  </div>
                </td>
                <th>메뉴타입</th>
                <td>
                  <div className="data-filed">
                    <RadioButtonGroup
                      options={menuTypeOptions}
                      value={formData.menuType}
                      onChange={(value) => handleInputChange('menuType', value)}
                      name="menuType"
                    />
                  </div>
                </td>
                <th>메뉴분류</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={menuClassificationOptions}
                      value={menuClassificationOptions.find(opt => opt.value === formData.menuClassificationCode) || null}
                      onChange={(opt) => handleInputChange('menuClassificationCode', opt?.value || '')}
                      placeholder="전체"
                    />
                  </div>
                </td>
              </tr>
              {/* 3행: 카테고리, 사용가능 가맹점, 등록일 */}
              <tr>
                <th>카테고리</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={categoryOptions}
                      value={categoryOptions.find(opt => opt.value === formData.categoryId) || null}
                      onChange={(opt) => handleInputChange('categoryId', opt?.value || '')}
                      placeholder="전체"
                    />
                  </div>
                </td>
                <th>사용가능 가맹점</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={franchiseAvailableOptions}
                      value={franchiseAvailableOptions.find(opt => opt.value === formData.franchiseAvailableId) || null}
                      onChange={(opt) => handleInputChange('franchiseAvailableId', opt?.value || '')}
                      placeholder="전체"
                    />
                  </div>
                </td>
                <th>등록일</th>
                <td>
                  <RangeDatePicker
                    startDate={formData.registeredDateFrom ? new Date(formData.registeredDateFrom) : null}
                    endDate={formData.registeredDateTo ? new Date(formData.registeredDateTo) : null}
                    onChange={(range: DateRange) => {
                      handleInputChange('registeredDateFrom', range.startDate ? format(range.startDate, 'yyyy-MM-dd') : '')
                      handleInputChange('registeredDateTo', range.endDate ? format(range.endDate, 'yyyy-MM-dd') : '')
                    }}
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray" onClick={() => setSearchOpen(false)}>닫기</button>
            <button className="btn-form gray" onClick={handleReset}>초기화</button>
            <button className="btn-form basic" onClick={handleSearch}>검색</button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
