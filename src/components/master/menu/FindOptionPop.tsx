'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import AnimateHeight from 'react-animate-height'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { Input, RadioButtonGroup } from '@/components/common/ui'
import CubeLoader from '@/components/common/ui/CubeLoader'
import Pagination from '@/components/ui/Pagination'
import AgGrid from '@/components/ui/AgGrid'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { useMasterMenuList } from '@/hooks/queries/use-master-menu-queries'
import { useCommonCodeHierarchy } from '@/hooks/queries/use-common-code-queries'
import type { MasterMenuListParams } from '@/hooks/queries/query-keys'
import type { MenuResponse } from '@/lib/schemas/menu'

interface FindOptionPopProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (menu: MenuResponse) => void
  bpId: number
}

interface SearchFilters {
  headOfficeOrganizationId?: number | null
  franchiseOrganizationId?: number | null
  menuGroup?: string
  menuClassificationCode?: string
  menuType?: string
  setStatus?: string
  menuName?: string
}

type MenuGridRow = {
  id: number
  menuName: string
  menuGroupLabel: string
  menuClassLabel: string
  menuTypeLabel: string
  setStatusLabel: string
  isSelected: boolean
}

const menuTypeOptions = [
  { value: '', label: '전체' },
  { value: 'MNTYP_001', label: '메뉴' },
  { value: 'MNTYP_002', label: '옵션' },
]

export default function FindOptionPop({ isOpen, onClose, onSelect, bpId }: FindOptionPopProps) {
  // 검색 폼
  const [formData, setFormData] = useState({
    headOfficeOrganizationId: bpId as number | null,
    franchiseOrganizationId: null as number | null,
    menuGroup: 'MNGRP_001',
    menuClassificationCode: '',
    menuType: '',
    setStatus: '',
    menuName: '',
  })

  // 실행된 검색 필터
  const [filters, setFilters] = useState<SearchFilters>({})

  // 페이징
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // UI
  const [searchOpen, setSearchOpen] = useState(true)
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null)

  // 팝업 열림/닫힘 시 상태 초기화
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setFormData({
        headOfficeOrganizationId: bpId,
        franchiseOrganizationId: null,
        menuGroup: 'MNGRP_001',
        menuClassificationCode: '',
        menuType: '',
        setStatus: '',
        menuName: '',
      })
      setFilters({})
      setPage(0)
      setPageSize(20)
      setSearchOpen(true)
      setSelectedMenuId(null)
    }
  }

  // bpId prop 변경 시 동기화
  const [prevBpId, setPrevBpId] = useState(bpId)
  if (prevBpId !== bpId) {
    setPrevBpId(bpId)
    setFormData((prev) => ({ ...prev, headOfficeOrganizationId: bpId }))
  }

  // 공통코드 조회
  const { data: menuGroupCodes = [] } = useCommonCodeHierarchy('MNGRP')
  const { data: menuClassCodes = [] } = useCommonCodeHierarchy('MNCF')
  const { data: setStatusCodes = [] } = useCommonCodeHierarchy('STST')

  const menuGroupOptions = useMemo(
    () => [{ value: '', label: '전체' }, ...menuGroupCodes.map((c) => ({ value: c.code, label: c.name }))],
    [menuGroupCodes],
  )

  const menuClassOptions: SelectOption[] = useMemo(
    () => menuClassCodes.map((c) => ({ value: c.code, label: c.name })),
    [menuClassCodes],
  )

  const setStatusOptions = useMemo(
    () => [{ value: '', label: '전체' }, ...setStatusCodes.map((c) => ({ value: c.code, label: c.name }))],
    [setStatusCodes],
  )

  // 코드맵 (목록 테이블에서 코드 → 이름 변환용)
  const menuGroupCodeMap = useMemo(() => new Map(menuGroupCodes.map((c) => [c.code, c.name])), [menuGroupCodes])
  const menuClassCodeMap = useMemo(() => new Map(menuClassCodes.map((c) => [c.code, c.name])), [menuClassCodes])
  const menuTypeCodeMap = useMemo(
    () => new Map(menuTypeOptions.filter((o) => o.value).map((o) => [o.value, o.label])),
    [],
  )
  const setStatusCodeMap = useMemo(() => new Map(setStatusCodes.map((c) => [c.code, c.name])), [setStatusCodes])

  // 데이터 조회 (필터가 설정된 경우에만)
  const hasSearched = filters.headOfficeOrganizationId != null
  const listParams: MasterMenuListParams = {
    bpId: filters.headOfficeOrganizationId,
    menuName: filters.menuName || undefined,
    menuType: filters.menuType || undefined,
    menuClassificationCode: filters.menuClassificationCode || undefined,
    menuGroup: filters.menuGroup || undefined,
    setStatus: filters.setStatus || undefined,
    page,
    size: pageSize,
  }
  const { data, isLoading } = useMasterMenuList(listParams, isOpen && hasSearched)

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalCount = data?.totalElements ?? 0

  // 선택된 메뉴 객체
  const selectedMenu = selectedMenuId != null ? rows.find((r) => r.id === selectedMenuId) ?? null : null

  // AG Grid 행 데이터
  const gridRowData: MenuGridRow[] = rows.map((menu) => ({
    id: menu.id,
    menuName: menu.menuName,
    menuGroupLabel: menuGroupCodeMap.get(menu.menuProperty) ?? '-',
    menuClassLabel: menu.menuClassificationCode ? menuClassCodeMap.get(menu.menuClassificationCode) ?? '-' : '-',
    menuTypeLabel: menuTypeCodeMap.get(menu.menuType) ?? '-',
    setStatusLabel: setStatusCodeMap.get(menu.setStatus) ?? '-',
    isSelected: selectedMenuId === menu.id,
  }))

  // AG Grid 컬럼 정의
  const columnDefs: ColDef<MenuGridRow>[] = [
    {
      headerName: '선택',
      width: 70,
      cellRenderer: (params: ICellRendererParams<MenuGridRow>) => (
        <div className="check-form-box no-txt">
          <input
            type="checkbox"
            id={`find-option-${params.data?.id}`}
            checked={params.data?.isSelected ?? false}
            onChange={() => {
              const id = params.data?.id ?? null
              setSelectedMenuId((prev) => (prev === id ? null : id))
            }}
          />
          <label htmlFor={`find-option-${params.data?.id}`}></label>
        </div>
      ),
    },
    { field: 'menuName', headerName: '메뉴명', flex: 1 },
    { field: 'menuGroupLabel', headerName: '메뉴그룹', width: 120 },
    { field: 'menuClassLabel', headerName: '메뉴분류', width: 120 },
    { field: 'menuTypeLabel', headerName: '메뉴타입', width: 100 },
    { field: 'setStatusLabel', headerName: '세트여부', width: 100 },
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    setFilters({
      headOfficeOrganizationId: formData.headOfficeOrganizationId,
      franchiseOrganizationId: formData.franchiseOrganizationId,
      menuGroup: formData.menuGroup || undefined,
      menuClassificationCode: formData.menuClassificationCode || undefined,
      menuType: formData.menuType || undefined,
      setStatus: formData.setStatus || undefined,
      menuName: formData.menuName || undefined,
    })
    setPage(0)
    setSelectedMenuId(null)
  }

  const handleReset = () => {
    setFormData({
      headOfficeOrganizationId: bpId,
      franchiseOrganizationId: null,
      menuGroup: 'MNGRP_001',
      menuClassificationCode: '',
      menuType: '',
      setStatus: '',
      menuName: '',
    })
    setFilters({})
    setPage(0)
    setSelectedMenuId(null)
  }

  const handleAdd = () => {
    if (selectedMenu) {
      onSelect(selectedMenu)
      onClose()
    }
  }

  const handleClose = () => {
    onClose()
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
    setSelectedMenuId(null)
  }

  // 페이지 변경 시 선택 해제
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setSelectedMenuId(null)
  }

  if (!isOpen) return null

  return createPortal(
    <div className="modal-popup show">
      <div className="modal-dialog mypage">
        <div className="modal-content">
          <div className="mypage-header">
            <h2>메뉴 검색</h2>
            <button type="button" className="modal-close" onClick={handleClose}>
              <i className="close-icon"></i>
            </button>
          </div>
          <div className="mypage-body">
            <div className="common-pop-table-wrap">
              {/* 검색 영역 */}
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
                      </colgroup>
                      <tbody>
                        {/* 1행: 본사 / 가맹점 */}
                        <tr>
                          <HeadOfficeFranchiseStoreSelect
                            fields={['office', 'franchise']}
                            officeId={formData.headOfficeOrganizationId}
                            franchiseId={formData.franchiseOrganizationId}
                            storeId={null}
                            isDisabled={true}
                            onChange={(next) =>
                              setFormData((prev) => ({
                                ...prev,
                                headOfficeOrganizationId: next.head_office,
                                franchiseOrganizationId: next.franchise,
                              }))
                            }
                          />
                        </tr>
                        {/* 2행: 메뉴그룹 / 메뉴분류 */}
                        <tr>
                          <th>메뉴그룹</th>
                          <td>
                            <div className="data-filed">
                              <RadioButtonGroup
                                options={menuGroupOptions}
                                value={formData.menuGroup}
                                onChange={(value) => handleInputChange('menuGroup', value)}
                                name="popMenuGroup"
                                disabled
                              />
                            </div>
                          </td>
                          <th>메뉴분류</th>
                          <td>
                            <div className="data-filed">
                              <SearchSelect
                                options={menuClassOptions}
                                value={menuClassOptions.find((opt) => opt.value === formData.menuClassificationCode) || null}
                                onChange={(opt) => handleInputChange('menuClassificationCode', opt?.value || '')}
                                placeholder="전체"
                              />
                            </div>
                          </td>
                        </tr>
                        {/* 3행: 메뉴타입 / 세트여부 */}
                        <tr>
                          <th>메뉴타입</th>
                          <td>
                            <div className="data-filed">
                              <RadioButtonGroup
                                options={menuTypeOptions}
                                value={formData.menuType}
                                onChange={(value) => handleInputChange('menuType', value)}
                                name="popMenuType"
                              />
                            </div>
                          </td>
                          <th>세트여부</th>
                          <td>
                            <div className="data-filed">
                              <RadioButtonGroup
                                options={setStatusOptions}
                                value={formData.setStatus}
                                onChange={(value) => handleInputChange('setStatus', value)}
                                name="popSetStatus"
                              />
                            </div>
                          </td>
                        </tr>
                        {/* 4행: 메뉴명 (colSpan=3) */}
                        <tr>
                          <th>메뉴명</th>
                          <td colSpan={3}>
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
                      </tbody>
                    </table>
                    <div className="btn-filed">
                      <button className="btn-form gray" onClick={() => setSearchOpen(false)}>
                        닫기
                      </button>
                      <button className="btn-form gray" onClick={handleReset}>
                        초기화
                      </button>
                      <button className="btn-form basic" onClick={handleSearch}>
                        검색
                      </button>
                    </div>
                  </div>
                </AnimateHeight>
              </div>

              {/* 목록 영역 */}
              <div className="data-list-wrap">
                <div className="data-list-header">
                  <div className="data-header-left">
                  </div>
                  <div className="data-header-right">
                    <button
                      type="button"
                      className="btn-form basic"
                      disabled={selectedMenuId == null}
                      onClick={handleAdd}
                    >
                      추가
                    </button>
                    <div className="data-count-select">
                      <select
                        className="select-form"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="data-list-bx">
                  {isLoading ? (
                    <div className="cube-loader-overlay">
                      <CubeLoader />
                    </div>
                  ) : !hasSearched ? (
                    <div className="empty-wrap">
                      <div className="empty-data">검색 조건을 입력 후 검색 버튼을 클릭하세요.</div>
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="empty-wrap">
                      <div className="empty-data">조회된 메뉴가 없습니다.</div>
                    </div>
                  ) : (
                    <>
                      <AgGrid
                        rowData={gridRowData}
                        columnDefs={columnDefs}
                        onRowClicked={(event) => setSelectedMenuId(event.data?.id ?? null)}
                      />
                      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
