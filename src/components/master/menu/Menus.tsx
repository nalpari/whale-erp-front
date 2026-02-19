'use client'

import { useState, useMemo } from 'react'
import Location from '@/components/ui/Location'
import MenuSearch from '@/components/master/menu/MenuSearch'
import MenuList from '@/components/master/menu/MenuList'
import type { MenuSearchFormData } from '@/components/master/menu/MenuSearch'
import { useMasterMenuList, type MasterMenuListParams } from '@/hooks/queries'

const BREADCRUMBS = ['홈', 'Master data 관리', '메뉴 정보 관리', '마스터용 메뉴 Master']

const defaultFilters: MenuSearchFormData = {}

export default function Menus() {
  const [filters, setFilters] = useState<MenuSearchFormData>(defaultFilters)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(50)

  const listParams: MasterMenuListParams = useMemo(() => {
    const params: MasterMenuListParams = {
      bpId: filters.headOfficeOrganizationId,
      page,
      size: pageSize,
    }

    if (filters.menuName) params.menuName = filters.menuName
    if (filters.operationStatus) params.operationStatus = filters.operationStatus
    if (filters.menuType) params.menuType = filters.menuType
    if (filters.menuClassificationCode) params.menuClassificationCode = filters.menuClassificationCode
    if (filters.categoryId) params.categoryId = filters.categoryId
    if (filters.franchiseAvailableId) params.storeId = filters.franchiseAvailableId
    if (filters.registeredDateFrom) params.createdAtFrom = `${filters.registeredDateFrom}T00:00:00`
    if (filters.registeredDateTo) params.createdAtTo = `${filters.registeredDateTo}T23:59:59`

    return params
  }, [filters, page, pageSize])

  const { data: response, isPending: loading } = useMasterMenuList(listParams)

  const totalCount = response?.totalElements ?? 0

  const handleSearch = (params: MenuSearchFormData) => {
    setFilters(params)
    setPage(0)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    setPage(0)
  }

  return (
    <div className="data-wrap">
      <Location title="마스터용 메뉴 관리" list={BREADCRUMBS} />
      <MenuSearch
        onSearch={handleSearch}
        onReset={handleReset}
        totalCount={totalCount}
      />
      <MenuList />
    </div>
  )
}
