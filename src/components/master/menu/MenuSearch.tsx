'use client'

import AnimateHeight from 'react-animate-height'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { Input, RadioButtonGroup } from '@/components/common/ui'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'
import { useBpHeadOfficeTree, useMasterCategoryList, useStoreList, useCommonCodeHierarchy } from '@/hooks/queries'
import type { CategoryResponse } from '@/types/menu'
import { useMenuSearchStore, type MenuSearchFormData } from '@/stores/menu-search-store'

export type { MenuSearchFormData }

interface MenuSearchProps {
  onSearch: (params: MenuSearchFormData) => void
  onReset: () => void
  totalCount: number
  searchOpen: boolean
  onSearchOpenChange: (open: boolean) => void
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

export default function MenuSearch({ onSearch, onReset, totalCount, searchOpen, onSearchOpenChange }: MenuSearchProps) {
  const formData = useMenuSearchStore((s) => s.formData)
  const filters = useMenuSearchStore((s) => s.filters)
  const setFormData = useMenuSearchStore((s) => s.setFormData)
  const setFilters = useMenuSearchStore((s) => s.setFilters)
  const reset = useMenuSearchStore((s) => s.reset)
  const [headOfficeError, setHeadOfficeError] = useState(false)

  // 본사 목록 조회
  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const headOfficeOptions = useMemo<SelectOption[]>(() =>
    bpTree.map((o) => ({ label: o.name, value: String(o.id) })),
    [bpTree])
  const selectedOfficeOption = useMemo(() =>
    headOfficeOptions.find((opt) => opt.value === String(formData.headOfficeOrganizationId)) ?? null,
    [headOfficeOptions, formData.headOfficeOrganizationId])

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

  const handleInputChange = (field: 'menuName' | 'operationStatus' | 'menuType' | 'menuClassificationCode' | 'categoryId' | 'franchiseAvailableId', value: string) => {
    setFormData({ [field]: value })
  }

  const handleSearch = async () => {
    if (!formData.headOfficeOrganizationId) {
      setHeadOfficeError(true)
      return
    }
    setHeadOfficeError(false)

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
    onSearchOpenChange(false)
  }

  const handleReset = () => {
    setHeadOfficeError(false)
    reset()
    onReset()
    onSearchOpenChange(true)
  }

  // 적용된 검색 조건 태그
  const appliedTags: { key: string; value: string; category: string }[] = []
  if (filters.headOfficeOrganizationId) {
    const name = headOfficeOptions.find((o) => o.value === String(filters.headOfficeOrganizationId))?.label
    if (name) appliedTags.push({ key: 'headOffice', value: name, category: '본사' })
  }
  if (filters.menuName) {
    appliedTags.push({ key: 'menuName', value: filters.menuName, category: '메뉴명' })
  }
  if (filters.operationStatus) {
    const name = operationStatusOptions.find((o) => o.value === filters.operationStatus)?.label
    if (name) appliedTags.push({ key: 'operationStatus', value: name, category: '운영여부' })
  }
  if (filters.menuType) {
    const name = menuTypeOptions.find((o) => o.value === filters.menuType)?.label
    if (name) appliedTags.push({ key: 'menuType', value: name, category: '메뉴타입' })
  }
  if (filters.menuClassificationCode) {
    const name = menuClassificationOptions.find((o) => o.value === filters.menuClassificationCode)?.label
    if (name) appliedTags.push({ key: 'menuClassificationCode', value: name, category: '메뉴분류' })
  }
  if (filters.categoryId) {
    const name = categoryOptions.find((o) => o.value === filters.categoryId)?.label
    if (name) appliedTags.push({ key: 'categoryId', value: name, category: '카테고리' })
  }
  if (filters.franchiseAvailableId) {
    const name = franchiseAvailableOptions.find((o) => o.value === filters.franchiseAvailableId)?.label
    if (name) appliedTags.push({ key: 'franchiseAvailableId', value: name, category: '사용가능 가맹점' })
  }
  if (filters.registeredDateFrom || filters.registeredDateTo) {
    const from = filters.registeredDateFrom || ''
    const to = filters.registeredDateTo || ''
    appliedTags.push({ key: 'registeredDate', value: `${from} ~ ${to}`, category: '등록일' })
  }

  const handleRemoveTag = (key: string) => {
    const resetMap: Record<string, Partial<MenuSearchFormData>> = {
      headOffice: { headOfficeOrganizationId: null },
      menuName: { menuName: '' },
      operationStatus: { operationStatus: '' },
      menuType: { menuType: '' },
      menuClassificationCode: { menuClassificationCode: '' },
      categoryId: { categoryId: '' },
      franchiseAvailableId: { franchiseAvailableId: '' },
      registeredDate: { registeredDateFrom: '', registeredDateTo: '' },
    }
    if (key === 'headOffice') {
      handleReset()
      return
    }
    const resetValue = resetMap[key]
    if (resetValue) {
      const nextFilters = { ...filters, ...resetValue }
      setFilters(nextFilters)
      setFormData(resetValue)
      onSearch(nextFilters)
    }
  }

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
        <ul className="search-result-list">
          {appliedTags.map((tag) => (
            <li key={tag.key} className="search-result-item">
              <div className="search-result-item-txt">
                <span>{tag.value}</span> ({tag.category})
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
          onClick={() => onSearchOpenChange(!searchOpen)}
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
              {/* 1행: 본사, 가맹점(disabled), 메뉴명 */}
              <tr>
                <th>본사 <span className="red">*</span></th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      options={headOfficeOptions}
                      value={selectedOfficeOption}
                      onChange={(opt) => {
                        setFormData({
                          headOfficeOrganizationId: opt ? Number(opt.value) : null,
                          categoryId: '',
                          franchiseAvailableId: '',
                        })
                        if (opt) setHeadOfficeError(false)
                      }}
                      placeholder="본사 선택"
                      isClearable
                    />
                    {headOfficeError && !formData.headOfficeOrganizationId && (
                      <span className="warning-txt">※ 필수 선택 조건입니다</span>
                    )}
                  </div>
                </td>
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
                      setFormData({
                        registeredDateFrom: range.startDate ? format(range.startDate, 'yyyy-MM-dd') : '',
                        registeredDateTo: range.endDate ? format(range.endDate, 'yyyy-MM-dd') : '',
                      })
                    }}
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray" onClick={() => onSearchOpenChange(false)}>닫기</button>
            <button className="btn-form gray" onClick={handleReset}>초기화</button>
            <button className="btn-form basic" onClick={handleSearch}>검색</button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
